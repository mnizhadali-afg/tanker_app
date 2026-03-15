import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// ── Calculation helper ────────────────────────────────────────────────────────
function computeTanker(t: {
  calcType: string
  pw: number; bw: number; basis: string; exch: number
  costProduct?: number; costPublicBenefits?: number; costFmn60?: number
  costFmn20?: number; costQualityControl?: number
  costEscort_c?: number; costEscort_p?: number
  costBascule_c?: number; costBascule_p?: number
  costDozbalagh_c?: number; costDozbalagh_p?: number
  costOvernight_c?: number; costOvernight_p?: number
  costBankCommission_c?: number; costBankCommission_p?: number
  costRentAfn_c?: number; costRentAfn_p?: number
  costMiscAfn_c?: number; costMiscAfn_p?: number
  costBrokerCommission_c?: number; costBrokerCommission_p?: number
  costExchangerCommission_c?: number; costExchangerCommission_p?: number
  costLicenseComm_c?: number; costLicenseComm_p?: number
  costRentUsd_c?: number; costRentUsd_p?: number
  costMiscUsd_c?: number; costMiscUsd_p?: number
  transportCost?: number; commodityPercent?: number
  rateAfn?: number; rateUsd?: number
}) {
  const n = (v?: number) => v ?? 0
  const shared = n(t.costProduct) + n(t.costPublicBenefits) + n(t.costFmn60) + n(t.costFmn20) + n(t.costQualityControl)

  const custAfnBase = shared
    + n(t.costDozbalagh_c) + n(t.costEscort_c) + n(t.costBascule_c)
    + n(t.costOvernight_c) + n(t.costBankCommission_c) + n(t.costRentAfn_c)
    + n(t.costMiscAfn_c) + n(t.costBrokerCommission_c) + n(t.costExchangerCommission_c)
    + n(t.transportCost)
  const custUsdBase = n(t.costLicenseComm_c) + n(t.costRentUsd_c) + n(t.costMiscUsd_c)

  const prodAfn = shared
    + n(t.costDozbalagh_p) + n(t.costEscort_p) + n(t.costBascule_p)
    + n(t.costOvernight_p) + n(t.costBankCommission_p) + n(t.costRentAfn_p)
    + n(t.costMiscAfn_p) + n(t.costBrokerCommission_p) + n(t.costExchangerCommission_p)
  const prodUsd = n(t.costLicenseComm_p) + n(t.costRentUsd_p) + n(t.costMiscUsd_p)

  const effTon = t.basis === 'bill_weight' ? t.bw : t.pw

  let custAfn = 0, custUsd = 0
  if (t.calcType === 'cost_based') {
    custAfn = custAfnBase; custUsd = custUsdBase
  } else if (t.calcType === 'cost_based_usd') {
    custUsd = custAfnBase / t.exch + custUsdBase; custAfn = 0
  } else {
    custAfn = effTon * n(t.rateAfn); custUsd = effTon * n(t.rateUsd)
  }

  return {
    customerDebtAfn: Math.round(custAfn * 100) / 100,
    customerDebtUsd: Math.round(custUsd * 100) / 100,
    customerDebtCommodity: n(t.commodityPercent),
    producerReceivableAfn: prodAfn,
    producerReceivableUsd: prodUsd,
  }
}

async function main() {
  // ── 0. Clear existing data (safe to re-run) ──────────────────────────────────
  await prisma.commodityTransaction.deleteMany({})
  await prisma.monetaryTransaction.deleteMany({})
  await prisma.tanker.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.contract.deleteMany({})
  await prisma.license.deleteMany({})
  await prisma.port.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.account.deleteMany({})

  // ── 1. Users ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 12)
  const passHash  = await bcrypt.hash('pass123', 12)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: adminHash, role: 'admin', isActive: true },
  })
  const accountant = await prisma.user.upsert({
    where: { username: 'accountant1' },
    update: {},
    create: { username: 'accountant1', passwordHash: passHash, role: 'accountant', isActive: true },
  })
  await prisma.user.upsert({
    where: { username: 'data_entry1' },
    update: {},
    create: { username: 'data_entry1', passwordHash: passHash, role: 'data_entry', isActive: true },
  })
  await prisma.user.upsert({
    where: { username: 'viewer1' },
    update: {},
    create: { username: 'viewer1', passwordHash: passHash, role: 'viewer', isActive: true },
  })

  // ── 2. Accounts (20 total) ──────────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.account.create({ data: { name: 'شرکت ترانسپورت احمدی',      type: 'customer', phone: '0799-101-001', address: 'کابل، چهاراهی قمبر',     isActive: true } }),
    prisma.account.create({ data: { name: 'موسسه تجارتی کریمی',         type: 'customer', phone: '0799-101-002', address: 'کابل، ناحیه ۵',           isActive: true } }),
    prisma.account.create({ data: { name: 'شرکت توزیع سوخت ملی',        type: 'customer', phone: '0799-101-003', address: 'مزار شریف، ناحیه ۲',      isActive: true } }),
    prisma.account.create({ data: { name: 'تعاونی حمل و نقل خیبر',      type: 'customer', phone: '0799-101-004', address: 'جلال آباد، ناحیه ۱',      isActive: true } }),
    prisma.account.create({ data: { name: 'شرکت لوژستیک افغان',          type: 'customer', phone: '0799-101-005', address: 'کابل، ناحیه ۱۰',          isActive: true } }),
    prisma.account.create({ data: { name: 'موسسه تجارتی پامیر',          type: 'customer', phone: '0799-101-006', address: 'بدخشان، فیض‌آباد',         isActive: true } }),
    prisma.account.create({ data: { name: 'شرکت سوخت رسانی هرات',        type: 'customer', phone: '0799-101-007', address: 'هرات، ناحیه ۳',            isActive: true } }),
    prisma.account.create({ data: { name: 'تعاونی ترانسپورت قندهار',     type: 'customer', phone: '0799-101-008', address: 'قندهار، ناحیه ۱',          isActive: true } }),
  ])

  const producers = await Promise.all([
    prisma.account.create({ data: { name: 'شرکت نفت حیرتان',            type: 'producer', phone: '0799-202-001', address: 'بلخ، حیرتان',              isActive: true } }),
    prisma.account.create({ data: { name: 'پالایشگاه شبرغان',            type: 'producer', phone: '0799-202-002', address: 'جوزجان، شبرغان',           isActive: true } }),
    prisma.account.create({ data: { name: 'شرکت نفت تورغندی',            type: 'producer', phone: '0799-202-003', address: 'هرات، تورغندی',             isActive: true } }),
    prisma.account.create({ data: { name: 'پالایشگاه مزار شریف',         type: 'producer', phone: '0799-202-004', address: 'بلخ، مزار شریف',           isActive: true } }),
    prisma.account.create({ data: { name: 'شرکت نفت اقینه',              type: 'producer', phone: '0799-202-005', address: 'فاریاب، اقینه',             isActive: true } }),
    prisma.account.create({ data: { name: 'پالایشگاه اسلام قلعه',        type: 'producer', phone: '0799-202-006', address: 'هرات، اسلام قلعه',          isActive: true } }),
  ])

  const monetaries = await Promise.all([
    prisma.account.create({ data: { name: 'صرافی ملت (افغانی)',           type: 'monetary', phone: '0799-303-001', address: 'کابل، صرافی بازار',        isActive: true } }),
    prisma.account.create({ data: { name: 'صرافی آریا (دالر)',            type: 'monetary', phone: '0799-303-002', address: 'کابل، شهر نو',              isActive: true } }),
    prisma.account.create({ data: { name: 'بانک ملی افغانستان',           type: 'monetary', phone: '0799-303-003', address: 'کابل، پشتونستان وات',       isActive: true } }),
    prisma.account.create({ data: { name: 'صرافی پامیر (دالر)',           type: 'monetary', phone: '0799-303-004', address: 'مزار شریف، صرافی بازار',    isActive: true } }),
  ])

  await Promise.all([
    prisma.account.create({ data: { name: 'هزینه‌های متفرقه',             type: 'other',    notes: 'حساب هزینه‌های عمومی',  isActive: true } }),
    prisma.account.create({ data: { name: 'حساب داخلی تنخواه',            type: 'other',    notes: 'تنخواه‌گردان داخلی',     isActive: true } }),
  ])

  console.log('✓ Accounts: 20')

  // ── 3. Products (20) ────────────────────────────────────────────────────────
  const productDefs = [
    { name: 'دیزل',                unit: 'تن'         },
    { name: 'پطرول',               unit: 'تن'         },
    { name: 'نفت سفید',            unit: 'تن'         },
    { name: 'گاز مایع LPG',        unit: 'تن'         },
    { name: 'موبایل اویل',         unit: 'لیتر'       },
    { name: 'جت فیول',             unit: 'تن'         },
    { name: 'فرنس اویل',           unit: 'تن'         },
    { name: 'بنزین سوپر',          unit: 'تن'         },
    { name: 'روغن هیدرولیک',       unit: 'لیتر'       },
    { name: 'روغن دنده',           unit: 'لیتر'       },
    { name: 'گریس صنعتی',          unit: 'کیلوگرام'   },
    { name: 'دیزل صنعتی',          unit: 'تن'         },
    { name: 'نفت خام',             unit: 'تن'         },
    { name: 'ضد یخ',               unit: 'لیتر'       },
    { name: 'مازوت',               unit: 'تن'         },
    { name: 'روغن ترانسفارمر',     unit: 'لیتر'       },
    { name: 'قیر',                 unit: 'تن'         },
    { name: 'تینر',                unit: 'لیتر'       },
    { name: 'حلال صنعتی',          unit: 'لیتر'       },
    { name: 'گاز طبیعی فشرده CNG', unit: 'تن'         },
  ]

  const products: any[] = []
  for (const p of productDefs) {
    products.push(await prisma.product.upsert({
      where: { name: p.name },
      update: {},
      create: { name: p.name, unit: p.unit, isActive: true },
    }))
  }
  console.log('✓ Products: 20')

  // ── 4. Ports (20) ───────────────────────────────────────────────────────────
  const portDefs = [
    { name: 'بندر حیرتان ۱',                producerIdx: 0 },
    { name: 'بندر حیرتان ۲',                producerIdx: 0 },
    { name: 'پایانه مرزی حیرتان شمال',      producerIdx: 0 },
    { name: 'انبار حیرتان مرکزی',           producerIdx: 0 },
    { name: 'بندر شبرغان اصلی',             producerIdx: 1 },
    { name: 'پایانه پالایشگاه شبرغان',      producerIdx: 1 },
    { name: 'انبار جوزجان',                 producerIdx: 1 },
    { name: 'بندر تورغندی ۱',               producerIdx: 2 },
    { name: 'بندر تورغندی ۲',               producerIdx: 2 },
    { name: 'پایانه مرزی اسلام قلعه',       producerIdx: 2 },
    { name: 'انبار هرات مرکزی',             producerIdx: 2 },
    { name: 'پایانه مزار اصلی',             producerIdx: 3 },
    { name: 'انبار مزار جنوبی',             producerIdx: 3 },
    { name: 'بندر بلخ',                     producerIdx: 3 },
    { name: 'بندر اقینه اصلی',              producerIdx: 4 },
    { name: 'پایانه فاریاب',                producerIdx: 4 },
    { name: 'انبار اقینه',                  producerIdx: 4 },
    { name: 'گذرگاه اسلام قلعه',            producerIdx: 5 },
    { name: 'پایانه دوغارون',               producerIdx: 5 },
    { name: 'گذرگاه میلک',                  producerIdx: 5 },
  ]

  const ports: any[] = []
  for (const p of portDefs) {
    ports.push(await prisma.port.create({
      data: { name: p.name, producerId: producers[p.producerIdx].id, isActive: true },
    }))
  }
  console.log('✓ Ports: 20')

  // ── 5. Licenses (20) ────────────────────────────────────────────────────────
  const licenseDefs = [
    { num: 'LIC-2025-001', prodIdx: 0,  producerIdx: 0, from: '2025-01-01', to: '2025-12-31' },
    { num: 'LIC-2025-002', prodIdx: 0,  producerIdx: 0, from: '2025-06-01', to: '2025-12-31' },
    { num: 'LIC-2025-003', prodIdx: 1,  producerIdx: 1, from: '2025-01-01', to: '2025-12-31' },
    { num: 'LIC-2025-004', prodIdx: 1,  producerIdx: 1, from: '2025-03-01', to: '2025-11-30' },
    { num: 'LIC-2025-005', prodIdx: 2,  producerIdx: 2, from: '2025-01-01', to: '2025-12-31' },
    { num: 'LIC-2025-006', prodIdx: 0,  producerIdx: 2, from: '2025-01-01', to: '2025-12-31' },
    { num: 'LIC-2025-007', prodIdx: 3,  producerIdx: 3, from: '2025-02-01', to: '2025-12-31' },
    { num: 'LIC-2025-008', prodIdx: 0,  producerIdx: 3, from: '2025-01-01', to: '2025-12-31' },
    { num: 'LIC-2025-009', prodIdx: 4,  producerIdx: 4, from: '2025-03-01', to: '2025-12-31' },
    { num: 'LIC-2025-010', prodIdx: 0,  producerIdx: 4, from: '2025-01-01', to: '2025-11-30' },
    { num: 'LIC-2025-011', prodIdx: 1,  producerIdx: 5, from: '2025-01-01', to: '2025-12-31' },
    { num: 'LIC-2025-012', prodIdx: 2,  producerIdx: 5, from: '2025-01-01', to: '2025-12-31' },
    { num: 'LIC-2026-001', prodIdx: 0,  producerIdx: 0, from: '2026-01-01', to: '2026-12-31' },
    { num: 'LIC-2026-002', prodIdx: 1,  producerIdx: 1, from: '2026-01-01', to: '2026-12-31' },
    { num: 'LIC-2026-003', prodIdx: 0,  producerIdx: 2, from: '2026-01-01', to: '2026-12-31' },
    { num: 'LIC-2026-004', prodIdx: 2,  producerIdx: 3, from: '2026-01-01', to: '2026-12-31' },
    { num: 'LIC-2026-005', prodIdx: 3,  producerIdx: 0, from: '2026-01-01', to: '2026-12-31' },
    { num: 'LIC-2026-006', prodIdx: 0,  producerIdx: 1, from: '2026-01-01', to: '2026-12-31' },
    { num: 'LIC-2026-007', prodIdx: 1,  producerIdx: 4, from: '2026-01-01', to: '2026-12-31' },
    { num: 'LIC-2026-008', prodIdx: 0,  producerIdx: 5, from: '2026-01-01', to: '2026-12-31' },
  ]

  const licenses: any[] = []
  for (const l of licenseDefs) {
    licenses.push(await prisma.license.create({
      data: {
        licenseNumber: l.num,
        productId:     products[l.prodIdx].id,
        producerId:    producers[l.producerIdx].id,
        validFrom:     new Date(l.from),
        validTo:       new Date(l.to),
        isActive:      true,
      },
    }))
  }
  console.log('✓ Licenses: 20')

  // ── 6. Contracts (20) ───────────────────────────────────────────────────────
  // calcType: 'cost_based'(8) | 'cost_based_usd'(6) | 'per_ton'(6)
  const contractDefs = [
    { code: 'CNT-2025-001', custIdx: 0, prodIdx: 0, ct: 'cost_based',     exch: 87.5 },
    { code: 'CNT-2025-002', custIdx: 1, prodIdx: 0, ct: 'cost_based',     exch: 88   },
    { code: 'CNT-2025-003', custIdx: 2, prodIdx: 1, ct: 'cost_based',     exch: 89   },
    { code: 'CNT-2025-004', custIdx: 3, prodIdx: 2, ct: 'cost_based',     exch: 88.5 },
    { code: 'CNT-2025-005', custIdx: 4, prodIdx: 0, ct: 'cost_based',     exch: 87   },
    { code: 'CNT-2025-006', custIdx: 5, prodIdx: 1, ct: 'cost_based',     exch: 88   },
    { code: 'CNT-2025-007', custIdx: 6, prodIdx: 3, ct: 'cost_based',     exch: 89   },
    { code: 'CNT-2025-008', custIdx: 7, prodIdx: 0, ct: 'cost_based',     exch: 88   },
    { code: 'CNT-2025-009', custIdx: 0, prodIdx: 0, ct: 'cost_based_usd', exch: 87.5 },
    { code: 'CNT-2025-010', custIdx: 1, prodIdx: 2, ct: 'cost_based_usd', exch: 88   },
    { code: 'CNT-2025-011', custIdx: 2, prodIdx: 0, ct: 'cost_based_usd', exch: 88.5 },
    { code: 'CNT-2025-012', custIdx: 3, prodIdx: 1, ct: 'cost_based_usd', exch: 89   },
    { code: 'CNT-2025-013', custIdx: 4, prodIdx: 3, ct: 'cost_based_usd', exch: 87   },
    { code: 'CNT-2025-014', custIdx: 5, prodIdx: 0, ct: 'cost_based_usd', exch: 88   },
    { code: 'CNT-2025-015', custIdx: 6, prodIdx: 0, ct: 'per_ton',        rateAfn: 2800 },
    { code: 'CNT-2025-016', custIdx: 7, prodIdx: 1, ct: 'per_ton',        rateAfn: 3000 },
    { code: 'CNT-2025-017', custIdx: 0, prodIdx: 2, ct: 'per_ton',        rateUsd: 32   },
    { code: 'CNT-2025-018', custIdx: 1, prodIdx: 0, ct: 'per_ton',        rateAfn: 2500 },
    { code: 'CNT-2025-019', custIdx: 2, prodIdx: 3, ct: 'per_ton',        rateUsd: 28   },
    { code: 'CNT-2025-020', custIdx: 3, prodIdx: 1, ct: 'per_ton',        rateAfn: 2700 },
  ]

  const contracts: any[] = []
  for (const c of contractDefs) {
    contracts.push(await prisma.contract.create({
      data: {
        code:                 c.code,
        customerId:           customers[c.custIdx].id,
        productId:            products[c.prodIdx].id,
        calculationType:      c.ct as any,
        defaultExchangeRate:  (c as any).exch    ?? null,
        defaultRatePerTonAfn: (c as any).rateAfn ?? null,
        defaultRatePerTonUsd: (c as any).rateUsd ?? null,
        otherDefaultCosts:    {},
        isActive:             true,
      },
    }))
  }
  console.log('✓ Contracts: 20')

  // ── 7. Invoices (20: 10 draft | 7 final | 3 canceled) ──────────────────────
  try { await prisma.$executeRawUnsafe(`SELECT setval('invoice_number_seq', 1, false)`) } catch {}

  const invoiceDefs = [
    { num: 'GAS-MO-0001', ci: 0,  cust: 0, status: 'draft',    date: '2026-01-05' },
    { num: 'GAS-MO-0002', ci: 1,  cust: 1, status: 'draft',    date: '2026-01-08' },
    { num: 'GAS-MO-0003', ci: 2,  cust: 2, status: 'draft',    date: '2026-01-10' },
    { num: 'GAS-MO-0004', ci: 3,  cust: 3, status: 'draft',    date: '2026-01-12' },
    { num: 'GAS-MO-0005', ci: 4,  cust: 4, status: 'draft',    date: '2026-01-15' },
    { num: 'GAS-MO-0006', ci: 8,  cust: 0, status: 'draft',    date: '2026-01-18' },
    { num: 'GAS-MO-0007', ci: 9,  cust: 1, status: 'draft',    date: '2026-01-20' },
    { num: 'GAS-MO-0008', ci: 14, cust: 6, status: 'draft',    date: '2026-01-22' },
    { num: 'GAS-MO-0009', ci: 15, cust: 7, status: 'draft',    date: '2026-01-25' },
    { num: 'GAS-MO-0010', ci: 17, cust: 1, status: 'draft',    date: '2026-01-28' },
    { num: 'GAS-MO-0011', ci: 5,  cust: 5, status: 'final',    date: '2025-11-01', finDate: '2025-11-10' },
    { num: 'GAS-MO-0012', ci: 6,  cust: 6, status: 'final',    date: '2025-11-05', finDate: '2025-11-15' },
    { num: 'GAS-MO-0013', ci: 7,  cust: 7, status: 'final',    date: '2025-11-10', finDate: '2025-11-20' },
    { num: 'GAS-MO-0014', ci: 10, cust: 2, status: 'final',    date: '2025-12-01', finDate: '2025-12-10' },
    { num: 'GAS-MO-0015', ci: 11, cust: 3, status: 'final',    date: '2025-12-05', finDate: '2025-12-15' },
    { num: 'GAS-MO-0016', ci: 16, cust: 6, status: 'final',    date: '2025-12-10', finDate: '2025-12-20' },
    { num: 'GAS-MO-0017', ci: 18, cust: 2, status: 'final',    date: '2025-12-15', finDate: '2025-12-28' },
    { num: 'GAS-MO-0018', ci: 12, cust: 4, status: 'canceled', date: '2025-10-01', canDate: '2025-10-15' },
    { num: 'GAS-MO-0019', ci: 13, cust: 5, status: 'canceled', date: '2025-10-10', canDate: '2025-10-20' },
    { num: 'GAS-MO-0020', ci: 19, cust: 3, status: 'canceled', date: '2025-10-15', canDate: '2025-10-25' },
  ]

  const invoices: any[] = []
  for (const inv of invoiceDefs) {
    invoices.push(await prisma.invoice.create({
      data: {
        invoiceNumber: inv.num,
        contractId:    contracts[inv.ci].id,
        customerId:    customers[inv.cust].id,
        status:        inv.status as any,
        issueDate:     new Date(inv.date),
        createdById:   admin.id,
        finalizedAt:   (inv as any).finDate ? new Date((inv as any).finDate) : null,
        finalizedById: (inv as any).finDate ? accountant.id : null,
        canceledAt:    (inv as any).canDate ? new Date((inv as any).canDate) : null,
        canceledById:  (inv as any).canDate ? admin.id : null,
      },
    }))
  }
  try { await prisma.$executeRawUnsafe(`SELECT setval('invoice_number_seq', 20)`) } catch {}
  console.log('✓ Invoices: 20 (10 draft, 7 final, 3 canceled)')

  // ── 8. Tankers (25) ─────────────────────────────────────────────────────────
  // Each entry: invoiceIdx, contractIdx, portIdx, producerIdx, licenseIdx, tankerNumber, entryDate, ...costs
  // calcType is derived from contractDefs[contractIdx].ct
  const tankerDefs = [
    // ── Invoice 0 (GAS-MO-0001, cost_based, cust0) ─ 2 tankers
    { ii: 0, ci: 0, pi: 0, prod: 0, li: 12, num: 'TK-2026-001', date: '2026-01-05',
      pw: 21.5, bw: 21.0, basis: 'product_weight', exch: 87.5,
      costProduct: 18000, costPublicBenefits: 2500, costFmn60: 600, costFmn20: 400, costQualityControl: 1000,
      costEscort_c: 1200, costEscort_p: 900, costBascule_c: 500, costBascule_p: 400, transportCost: 5500 },
    { ii: 0, ci: 0, pi: 1, prod: 0, li: 12, num: 'TK-2026-002', date: '2026-01-06',
      pw: 22.0, bw: 21.5, basis: 'product_weight', exch: 87.5,
      costProduct: 18500, costPublicBenefits: 2500, costFmn60: 600, costFmn20: 400, costQualityControl: 1000,
      costEscort_c: 1200, costEscort_p: 900, costBascule_c: 500, costBascule_p: 400, transportCost: 5500 },

    // ── Invoice 1 (GAS-MO-0002, cost_based, cust1) ─ 2 tankers
    { ii: 1, ci: 1, pi: 4, prod: 1, li: 2, num: 'TK-2026-003', date: '2026-01-08',
      pw: 20.0, bw: 19.5, basis: 'product_weight', exch: 88,
      costProduct: 17000, costPublicBenefits: 2300, costFmn60: 550, costFmn20: 350, costQualityControl: 900,
      costEscort_c: 1100, costEscort_p: 850, costBascule_c: 450, costBascule_p: 380, transportCost: 5200 },
    { ii: 1, ci: 1, pi: 5, prod: 1, li: 13, num: 'TK-2026-004', date: '2026-01-09',
      pw: 21.0, bw: 20.5, basis: 'product_weight', exch: 88,
      costProduct: 17500, costPublicBenefits: 2400, costFmn60: 580, costFmn20: 380, costQualityControl: 950,
      costEscort_c: 1150, costEscort_p: 880, costBascule_c: 480, costBascule_p: 390, transportCost: 5300 },

    // ── Invoice 2 (GAS-MO-0003, cost_based, cust2) ─ 1 tanker
    { ii: 2, ci: 2, pi: 7, prod: 2, li: 4, num: 'TK-2026-005', date: '2026-01-10',
      pw: 19.0, bw: 18.5, basis: 'bill_weight', exch: 89,
      costProduct: 16000, costPublicBenefits: 2200, costFmn60: 500, costFmn20: 300, costQualityControl: 800,
      costEscort_c: 1000, costEscort_p: 800, costBascule_c: 400, costBascule_p: 350, transportCost: 4800 },

    // ── Invoice 3 (GAS-MO-0004, cost_based, cust3) ─ 1 tanker
    { ii: 3, ci: 3, pi: 11, prod: 3, li: 7, num: 'TK-2026-006', date: '2026-01-12',
      pw: 23.5, bw: 23.0, basis: 'product_weight', exch: 88.5,
      costProduct: 20000, costPublicBenefits: 2800, costFmn60: 700, costFmn20: 450, costQualityControl: 1100,
      costEscort_c: 1400, costEscort_p: 1000, costBascule_c: 550, costBascule_p: 450, transportCost: 6200 },

    // ── Invoice 4 (GAS-MO-0005, cost_based, cust4) ─ 1 tanker
    { ii: 4, ci: 4, pi: 14, prod: 4, li: 9, num: 'TK-2026-007', date: '2026-01-15',
      pw: 18.5, bw: 18.0, basis: 'product_weight', exch: 87,
      costProduct: 15500, costPublicBenefits: 2100, costFmn60: 480, costFmn20: 320, costQualityControl: 780,
      costEscort_c: 980, costEscort_p: 780, costBascule_c: 380, costBascule_p: 320, transportCost: 4600 },

    // ── Invoice 5 (GAS-MO-0006, cost_based_usd, cust0) ─ 1 tanker
    { ii: 5, ci: 8, pi: 0, prod: 0, li: 12, num: 'TK-2026-008', date: '2026-01-18',
      pw: 20.5, bw: 20.0, basis: 'product_weight', exch: 87.5,
      costProduct: 17500, costPublicBenefits: 2400, costFmn60: 580, costFmn20: 380, costQualityControl: 950,
      costEscort_c: 1150, costEscort_p: 880, costBascule_c: 480, costBascule_p: 390, transportCost: 5300,
      costLicenseComm_c: 15, costLicenseComm_p: 10 },

    // ── Invoice 6 (GAS-MO-0007, cost_based_usd, cust1) ─ 1 tanker
    { ii: 6, ci: 9, pi: 8, prod: 2, li: 4, num: 'TK-2026-009', date: '2026-01-20',
      pw: 21.0, bw: 20.5, basis: 'product_weight', exch: 88,
      costProduct: 17800, costPublicBenefits: 2450, costFmn60: 590, costFmn20: 390, costQualityControl: 970,
      costEscort_c: 1180, costEscort_p: 900, costBascule_c: 490, costBascule_p: 400, transportCost: 5350,
      costLicenseComm_c: 18, costLicenseComm_p: 12 },

    // ── Invoice 7 (GAS-MO-0008, per_ton, cust6) ─ 2 tankers
    { ii: 7, ci: 14, pi: 17, prod: 0, li: 16, num: 'TK-2026-010', date: '2026-01-22',
      pw: 24.0, bw: 23.5, basis: 'product_weight', exch: 89,
      rateAfn: 2800, rateUsd: 0 },
    { ii: 7, ci: 14, pi: 17, prod: 0, li: 16, num: 'TK-2026-011', date: '2026-01-23',
      pw: 22.5, bw: 22.0, basis: 'product_weight', exch: 89,
      rateAfn: 2800, rateUsd: 0 },

    // ── Invoice 8 (GAS-MO-0009, per_ton, cust7) ─ 1 tanker
    { ii: 8, ci: 15, pi: 4, prod: 1, li: 13, num: 'TK-2026-012', date: '2026-01-25',
      pw: 20.0, bw: 19.8, basis: 'product_weight', exch: 88,
      rateAfn: 3000, rateUsd: 0 },

    // ── Invoice 9 (GAS-MO-0010, per_ton, cust1) ─ 1 tanker
    { ii: 9, ci: 17, pi: 5, prod: 0, li: 13, num: 'TK-2026-013', date: '2026-01-28',
      pw: 19.5, bw: 19.2, basis: 'product_weight', exch: 88,
      rateAfn: 2500, rateUsd: 0 },

    // ── Invoice 10 (GAS-MO-0011, FINAL, cost_based, cust5) ─ 1 tanker
    { ii: 10, ci: 5, pi: 7, prod: 1, li: 5, num: 'TK-2025-001', date: '2025-11-01',
      pw: 20.5, bw: 20.0, basis: 'product_weight', exch: 88,
      costProduct: 17200, costPublicBenefits: 2350, costFmn60: 570, costFmn20: 370, costQualityControl: 920,
      costEscort_c: 1120, costEscort_p: 860, costBascule_c: 460, costBascule_p: 380, transportCost: 5250 },

    // ── Invoice 11 (GAS-MO-0012, FINAL, cost_based, cust6) ─ 1 tanker
    { ii: 11, ci: 6, pi: 11, prod: 3, li: 7, num: 'TK-2025-002', date: '2025-11-05',
      pw: 22.0, bw: 21.5, basis: 'product_weight', exch: 89,
      costProduct: 18800, costPublicBenefits: 2600, costFmn60: 650, costFmn20: 420, costQualityControl: 1050,
      costEscort_c: 1320, costEscort_p: 980, costBascule_c: 530, costBascule_p: 430, transportCost: 6000 },

    // ── Invoice 12 (GAS-MO-0013, FINAL, cost_based, cust7) ─ 2 tankers
    { ii: 12, ci: 7, pi: 3, prod: 0, li: 1, num: 'TK-2025-003', date: '2025-11-10',
      pw: 21.5, bw: 21.0, basis: 'product_weight', exch: 88,
      costProduct: 18000, costPublicBenefits: 2500, costFmn60: 600, costFmn20: 400, costQualityControl: 1000,
      costEscort_c: 1200, costEscort_p: 900, costBascule_c: 500, costBascule_p: 400, transportCost: 5500 },
    { ii: 12, ci: 7, pi: 3, prod: 0, li: 1, num: 'TK-2025-004', date: '2025-11-12',
      pw: 20.0, bw: 19.5, basis: 'product_weight', exch: 88,
      costProduct: 17000, costPublicBenefits: 2300, costFmn60: 550, costFmn20: 350, costQualityControl: 900,
      costEscort_c: 1100, costEscort_p: 850, costBascule_c: 450, costBascule_p: 380, transportCost: 5200 },

    // ── Invoice 13 (GAS-MO-0014, FINAL, cost_based_usd, cust2) ─ 1 tanker
    { ii: 13, ci: 10, pi: 8, prod: 0, li: 14, num: 'TK-2025-005', date: '2025-12-01',
      pw: 20.0, bw: 19.5, basis: 'product_weight', exch: 88.5,
      costProduct: 17000, costPublicBenefits: 2350, costFmn60: 560, costFmn20: 360, costQualityControl: 910,
      costEscort_c: 1130, costEscort_p: 870, costBascule_c: 470, costBascule_p: 390, transportCost: 5200,
      costLicenseComm_c: 16, costLicenseComm_p: 11 },

    // ── Invoice 14 (GAS-MO-0015, FINAL, cost_based_usd, cust3) ─ 1 tanker
    { ii: 14, ci: 11, pi: 5, prod: 1, li: 3, num: 'TK-2025-006', date: '2025-12-05',
      pw: 22.5, bw: 22.0, basis: 'product_weight', exch: 89,
      costProduct: 19500, costPublicBenefits: 2700, costFmn60: 680, costFmn20: 440, costQualityControl: 1080,
      costEscort_c: 1360, costEscort_p: 1020, costBascule_c: 545, costBascule_p: 445, transportCost: 6100,
      costLicenseComm_c: 20, costLicenseComm_p: 14 },

    // ── Invoice 15 (GAS-MO-0016, FINAL, per_ton, cust6) ─ 1 tanker
    { ii: 15, ci: 16, pi: 17, prod: 2, li: 18, num: 'TK-2025-007', date: '2025-12-10',
      pw: 25.0, bw: 24.5, basis: 'product_weight', exch: 89,
      rateAfn: 0, rateUsd: 32 },

    // ── Invoice 16 (GAS-MO-0017, FINAL, per_ton, cust2) ─ 2 tankers
    { ii: 16, ci: 18, pi: 8, prod: 3, li: 14, num: 'TK-2025-008', date: '2025-12-15',
      pw: 18.0, bw: 17.5, basis: 'product_weight', exch: 88,
      rateAfn: 0, rateUsd: 28 },
    { ii: 16, ci: 18, pi: 9, prod: 2, li: 14, num: 'TK-2025-009', date: '2025-12-17',
      pw: 19.0, bw: 18.5, basis: 'product_weight', exch: 88,
      rateAfn: 0, rateUsd: 28 },

    // ── Invoice 17 (GAS-MO-0018, CANCELED, cost_based_usd) ─ 1 tanker
    { ii: 17, ci: 12, pi: 14, prod: 3, li: 9, num: 'TK-2025-C01', date: '2025-10-01',
      pw: 20.0, bw: 19.5, basis: 'product_weight', exch: 87,
      costProduct: 17000, costPublicBenefits: 2300, costFmn60: 550, costFmn20: 350, costQualityControl: 900,
      costEscort_c: 1100, costEscort_p: 850, costBascule_c: 450, costBascule_p: 380, transportCost: 5200,
      costLicenseComm_c: 15, costLicenseComm_p: 10 },

    // ── Invoice 18 (GAS-MO-0019, CANCELED, cost_based_usd) ─ 1 tanker
    { ii: 18, ci: 13, pi: 7, prod: 0, li: 5, num: 'TK-2025-C02', date: '2025-10-10',
      pw: 21.0, bw: 20.5, basis: 'product_weight', exch: 88,
      costProduct: 17800, costPublicBenefits: 2450, costFmn60: 590, costFmn20: 390, costQualityControl: 970,
      costEscort_c: 1180, costEscort_p: 900, costBascule_c: 490, costBascule_p: 400, transportCost: 5350,
      costLicenseComm_c: 18, costLicenseComm_p: 12 },

    // ── Invoice 19 (GAS-MO-0020, CANCELED, per_ton) ─ 1 tanker
    { ii: 19, ci: 19, pi: 5, prod: 1, li: 3, num: 'TK-2025-C03', date: '2025-10-15',
      pw: 20.0, bw: 19.5, basis: 'product_weight', exch: 88,
      rateAfn: 2700, rateUsd: 0 },
  ]

  for (const t of tankerDefs) {
    const calcType = contractDefs[t.ci].ct
    const computed = computeTanker({ calcType, ...t } as any)
    await prisma.tanker.create({
      data: {
        invoiceId:    invoices[t.ii].id,
        contractId:   contracts[t.ci].id,
        portId:       ports[t.pi].id,
        producerId:   producers[t.prod].id,
        licenseId:    licenses[t.li].id,
        tankerNumber: t.num,
        entryDate:    new Date(t.date),
        productWeight: t.pw,
        billWeight:    t.bw,
        tonnageBasis:  t.basis as any,
        exchangeRate:  t.exch,
        costProduct:              (t as any).costProduct              ?? 0,
        costPublicBenefits:       (t as any).costPublicBenefits       ?? 0,
        costFmn60:                (t as any).costFmn60                ?? 0,
        costFmn20:                (t as any).costFmn20                ?? 0,
        costQualityControl:       (t as any).costQualityControl       ?? 0,
        costEscort_customer:      (t as any).costEscort_c             ?? 0,
        costEscort_producer:      (t as any).costEscort_p             ?? 0,
        costBascule_customer:     (t as any).costBascule_c            ?? 0,
        costBascule_producer:     (t as any).costBascule_p            ?? 0,
        transportCost:            (t as any).transportCost            ?? 0,
        costLicenseCommission_customer: (t as any).costLicenseComm_c ?? 0,
        costLicenseCommission_producer: (t as any).costLicenseComm_p ?? 0,
        ratePerTonAfn: (t as any).rateAfn ?? 0,
        ratePerTonUsd: (t as any).rateUsd ?? 0,
        customerDebtAfn:       computed.customerDebtAfn,
        customerDebtUsd:       computed.customerDebtUsd,
        customerDebtCommodity: computed.customerDebtCommodity,
        producerReceivableAfn: computed.producerReceivableAfn,
        producerReceivableUsd: computed.producerReceivableUsd,
      },
    })
  }
  console.log(`✓ Tankers: ${tankerDefs.length}`)

  // ── 9. Monetary Transactions (20) ───────────────────────────────────────────
  const monetaryTxDefs = [
    { type: 'payment_in',  payer: customers[0].id,  payee: null,             mon: monetaries[0].id, level: 'customer', custId: customers[0].id, amtAfn: 50000, amtUsd: 0,    date: '2026-01-10' },
    { type: 'payment_in',  payer: customers[1].id,  payee: null,             mon: monetaries[0].id, level: 'customer', custId: customers[1].id, amtAfn: 30000, amtUsd: 0,    date: '2026-01-15' },
    { type: 'payment_in',  payer: customers[2].id,  payee: null,             mon: monetaries[1].id, level: 'customer', custId: customers[2].id, amtAfn: 0,     amtUsd: 400,  date: '2026-01-12' },
    { type: 'payment_in',  payer: customers[3].id,  payee: null,             mon: monetaries[1].id, level: 'customer', custId: customers[3].id, amtAfn: 0,     amtUsd: 350,  date: '2026-01-18' },
    { type: 'payment_in',  payer: customers[4].id,  payee: null,             mon: monetaries[0].id, level: 'contract', custId: customers[4].id, contractId: contracts[4].id, amtAfn: 25000, amtUsd: 0, date: '2026-01-20' },
    { type: 'payment_in',  payer: customers[5].id,  payee: null,             mon: monetaries[1].id, level: 'contract', custId: customers[5].id, contractId: contracts[5].id, amtAfn: 0, amtUsd: 300, date: '2025-11-15' },
    { type: 'payment_in',  payer: customers[6].id,  payee: null,             mon: monetaries[0].id, level: 'invoice',  custId: customers[6].id, invoiceId: invoices[11].id,  amtAfn: 31370, amtUsd: 0, date: '2025-11-20' },
    { type: 'payment_in',  payer: customers[7].id,  payee: null,             mon: monetaries[1].id, level: 'invoice',  custId: customers[7].id, invoiceId: invoices[12].id,  amtAfn: 0, amtUsd: 332, date: '2025-12-15' },
    { type: 'payment_out', payer: null,             payee: producers[0].id, mon: monetaries[0].id, level: 'customer', custId: customers[0].id, amtAfn: 23800, amtUsd: 0,   date: '2026-01-12' },
    { type: 'payment_out', payer: null,             payee: producers[1].id, mon: monetaries[0].id, level: 'customer', custId: customers[1].id, amtAfn: 22330, amtUsd: 0,   date: '2026-01-16' },
    { type: 'payment_out', payer: null,             payee: producers[2].id, mon: monetaries[1].id, level: 'customer', custId: customers[2].id, amtAfn: 0,     amtUsd: 500,  date: '2026-01-14' },
    { type: 'payment_out', payer: null,             payee: producers[3].id, mon: monetaries[1].id, level: 'customer', custId: customers[3].id, amtAfn: 0,     amtUsd: 384,  date: '2025-12-20' },
    { type: 'exchange',    payer: customers[0].id,  payee: null,             mon: monetaries[1].id, level: 'customer', custId: customers[0].id, amtAfn: 87500, amtUsd: 1000, exchRate: 87.5, date: '2026-01-25' },
    { type: 'exchange',    payer: customers[1].id,  payee: null,             mon: monetaries[0].id, level: 'customer', custId: customers[1].id, amtAfn: 88000, amtUsd: 1000, exchRate: 88,   date: '2026-01-27' },
    { type: 'payment_in',  payer: customers[4].id,  payee: null,             mon: monetaries[0].id, level: 'invoice',  custId: customers[4].id, invoiceId: invoices[4].id,   amtAfn: 25140, amtUsd: 0,   date: '2026-02-01' },
    { type: 'payment_in',  payer: customers[5].id,  payee: null,             mon: monetaries[1].id, level: 'invoice',  custId: customers[5].id, invoiceId: invoices[10].id,  amtAfn: 0,     amtUsd: 343, date: '2026-02-03' },
    { type: 'payment_in',  payer: customers[6].id,  payee: null,             mon: monetaries[2].id, level: 'customer', custId: customers[6].id, amtAfn: 67200, amtUsd: 0,   date: '2026-02-05' },
    { type: 'payment_in',  payer: customers[7].id,  payee: null,             mon: monetaries[2].id, level: 'customer', custId: customers[7].id, amtAfn: 60000, amtUsd: 0,   date: '2026-02-08' },
    { type: 'payment_in',  payer: customers[2].id,  payee: null,             mon: monetaries[1].id, level: 'invoice',  custId: customers[2].id, invoiceId: invoices[13].id,  amtAfn: 0, amtUsd: 332, date: '2026-02-10' },
    { type: 'payment_out', payer: null,             payee: producers[4].id, mon: monetaries[0].id, level: 'customer', custId: customers[4].id, amtAfn: 20280, amtUsd: 0,   date: '2026-02-12' },
  ]

  for (const tx of monetaryTxDefs) {
    await prisma.monetaryTransaction.create({
      data: {
        type:             tx.type as any,
        payerAccountId:   tx.payer ?? null,
        payeeAccountId:   tx.payee ?? null,
        monetaryAccountId: tx.mon,
        linkedLevel:      tx.level as any,
        customerId:       tx.custId ?? null,
        contractId:       (tx as any).contractId ?? null,
        invoiceId:        (tx as any).invoiceId  ?? null,
        amountAfn:        tx.amtAfn,
        amountUsd:        tx.amtUsd,
        exchangeRate:     (tx as any).exchRate ?? null,
        transactionDate:  new Date(tx.date),
        createdById:      admin.id,
      },
    })
  }
  console.log('✓ Monetary transactions: 20')

  // ── 10. Commodity Transactions (20) ─────────────────────────────────────────
  const commodityTxDefs = [
    { custIdx: 0, prodIdx: 0, qty: 5.0,  date: '2026-01-15', contractIdx: 0  },
    { custIdx: 1, prodIdx: 0, qty: 3.5,  date: '2026-01-18', contractIdx: 1  },
    { custIdx: 2, prodIdx: 1, qty: 4.0,  date: '2026-01-20', contractIdx: 2  },
    { custIdx: 3, prodIdx: 2, qty: 2.5,  date: '2026-01-22', contractIdx: 3  },
    { custIdx: 4, prodIdx: 0, qty: 6.0,  date: '2026-01-25', contractIdx: 4  },
    { custIdx: 5, prodIdx: 1, qty: 3.0,  date: '2025-11-15', contractIdx: 5  },
    { custIdx: 6, prodIdx: 3, qty: 4.5,  date: '2025-11-20', contractIdx: 6  },
    { custIdx: 7, prodIdx: 0, qty: 5.5,  date: '2025-11-25', contractIdx: 7  },
    { custIdx: 0, prodIdx: 0, qty: 2.0,  date: '2026-02-01', invoiceIdx: 0   },
    { custIdx: 1, prodIdx: 0, qty: 1.5,  date: '2026-02-03', invoiceIdx: 1   },
    { custIdx: 2, prodIdx: 2, qty: 3.0,  date: '2025-12-10'                  },
    { custIdx: 3, prodIdx: 1, qty: 2.0,  date: '2025-12-15'                  },
    { custIdx: 4, prodIdx: 0, qty: 4.0,  date: '2025-12-20'                  },
    { custIdx: 5, prodIdx: 3, qty: 1.5,  date: '2026-01-05'                  },
    { custIdx: 6, prodIdx: 0, qty: 8.0,  date: '2026-01-10', contractIdx: 14 },
    { custIdx: 7, prodIdx: 1, qty: 3.5,  date: '2026-01-12', contractIdx: 15 },
    { custIdx: 0, prodIdx: 2, qty: 2.5,  date: '2026-01-30', contractIdx: 0  },
    { custIdx: 1, prodIdx: 0, qty: 5.0,  date: '2026-02-05', contractIdx: 1  },
    { custIdx: 2, prodIdx: 1, qty: 3.0,  date: '2026-02-08'                  },
    { custIdx: 3, prodIdx: 0, qty: 4.5,  date: '2026-02-10', contractIdx: 3  },
  ]

  for (const ct of commodityTxDefs) {
    await prisma.commodityTransaction.create({
      data: {
        customerId:      customers[ct.custIdx].id,
        contractId:      ct.contractIdx !== undefined ? contracts[ct.contractIdx].id : null,
        invoiceId:       ct.invoiceIdx  !== undefined ? invoices[ct.invoiceIdx].id  : null,
        productId:       products[ct.prodIdx].id,
        quantity:        ct.qty,
        unit:            products[ct.prodIdx].unit,
        transactionDate: new Date(ct.date),
        createdById:     admin.id,
      },
    })
  }
  console.log('✓ Commodity transactions: 20')
  console.log('\n✅ Seed complete. Login: admin / admin123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
