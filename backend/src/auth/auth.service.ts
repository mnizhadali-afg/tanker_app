import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto, res: any) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } })

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const payload = { sub: user.id, username: user.username, role: user.role }

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRY') ?? '1h',
    })

    const refreshToken = crypto.randomBytes(64).toString('hex')
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt,
      },
    })

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    })

    return {
      accessToken,
      user: { id: user.id, username: user.username, role: user.role },
    }
  }

  async refresh(refreshToken: string | undefined, res: any) {
    if (!refreshToken) {
      throw new ForbiddenException('No refresh token')
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
      include: { user: true },
    })

    if (!stored || !stored.user.isActive) {
      throw new ForbiddenException('Invalid or expired refresh token')
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    })

    const newRefreshToken = crypto.randomBytes(64).toString('hex')
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await this.prisma.refreshToken.create({
      data: { userId: stored.userId, tokenHash: newHash, expiresAt },
    })

    const payload = {
      sub: stored.user.id,
      username: stored.user.username,
      role: stored.user.role,
    }
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRY') ?? '1h',
    })

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    })

    return {
      accessToken,
      user: { id: stored.user.id, username: stored.user.username, role: stored.user.role },
    }
  }

  async logout(refreshToken: string | undefined, res: any) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      })
    }
    res.clearCookie('refresh_token', { path: '/api/auth' })
    return { message: 'Logged out' }
  }
}
