import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import React from 'react';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatNumber } from '../../utils/formatting';
import api from '../../lib/axios';

interface AccountDetail {
  id: string;
  name: string;
  type: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

interface CustomerBalance {
  totalDebtAfn: number;
  totalDebtUsd: number;
  paidAfn: number;
  paidUsd: number;
  balanceAfn: number;
  balanceUsd: number;
  balanceCommodity: number;
}

interface Props {
  accountId: string | null;
  onClose: () => void;
  onEdit?: (id: string) => void;
}

export default function AccountDrawer({ accountId, onClose, onEdit }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language;
  const isRtl = i18n.language === 'fa';

  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!accountId) { setAccount(null); setBalance(null); return; }
    setAccount(null);
    setBalance(null);
    setLoadingAccount(true);
    api.get(`/accounts/${accountId}`)
      .then((r) => {
        setAccount(r.data);
        if (r.data.type === 'customer') {
          setLoadingBalance(true);
          api.get(`/reports/customer-balance/${accountId}`)
            .then((rb) => setBalance(rb.data))
            .finally(() => setLoadingBalance(false));
        }
      })
      .finally(() => setLoadingAccount(false));
  }, [accountId]);

  if (!accountId) return null;

  const isCustomer = account?.type === 'customer';
  const isProducer = account?.type === 'producer';

  const contactFields: { label: string; value: React.ReactNode; wide?: boolean }[] = [];
  if (account?.phone) contactFields.push({ label: t('accounts.phone'), value: account.phone });
  if (account?.address) contactFields.push({ label: t('accounts.address'), value: account.address, wide: true });
  if (account?.notes) contactFields.push({ label: t('app.notes'), value: account.notes, wide: true });

  const balanceFields: { label: string; value: React.ReactNode; isDebt?: boolean }[] = balance ? [
    { label: t('reports.totalDebt') + ' (' + t('currency.afn') + ')', value: formatNumber(balance.totalDebtAfn, locale) },
    { label: t('reports.totalPaid') + ' (' + t('currency.afn') + ')', value: formatNumber(balance.paidAfn, locale) },
    { label: t('reports.balanceAfn'), value: formatNumber(balance.balanceAfn, locale), isDebt: Number(balance.balanceAfn) > 0 },
    { label: t('reports.totalDebt') + ' (' + t('currency.usd') + ')', value: formatNumber(balance.totalDebtUsd, locale) },
    { label: t('reports.totalPaid') + ' (' + t('currency.usd') + ')', value: formatNumber(balance.paidUsd, locale) },
    { label: t('reports.balanceUsd'), value: formatNumber(balance.balanceUsd, locale), isDebt: Number(balance.balanceUsd) > 0 },
    ...(Number(balance.balanceCommodity) !== 0
      ? [{ label: t('reports.balanceCommodity'), value: formatNumber(balance.balanceCommodity, locale) }]
      : []),
  ] : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 shrink-0">
            <div className="flex-1 min-w-0 space-y-1.5">
              {loadingAccount ? (
                <div className="h-5 w-40 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              ) : (
                <>
                  <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 truncate">
                    {account?.name ?? '—'}
                  </h2>
                  <div className="flex items-center gap-2">
                    {account && (
                      <span className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {t(`accounts.types.${account.type}`)}
                      </span>
                    )}
                    {account && (
                      <StatusBadge
                        status={account.isActive ? 'active' : 'inactive'}
                        label={t(account.isActive ? 'app.active' : 'app.inactive')}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 min-h-0">
            {loadingAccount ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : account ? (
              <>
                {/* Contact info tiles */}
                {contactFields.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {contactFields.map((f, i) => (
                      <div
                        key={i}
                        className={`bg-gray-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5 ${f.wide ? 'col-span-2' : ''}`}
                      >
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                          {f.label}
                        </p>
                        <div className="text-sm font-medium text-gray-800 dark:text-slate-200 leading-snug">
                          {f.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Balance section — customers only */}
                {isCustomer && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                      {t('reports.customerBalance')}
                    </p>
                    {loadingBalance ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : balance ? (
                      <div className="grid grid-cols-2 gap-2">
                        {balanceFields.map((f, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                              {f.label}
                            </p>
                            <div className={`text-sm font-semibold leading-snug ${
                              f.isDebt === true ? 'text-red-600 dark:text-red-400'
                              : f.isDebt === false ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-800 dark:text-slate-200'
                            }`}>
                              {f.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-slate-500 px-1">—</p>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* ── Footer ── */}
          {account && (
            <>
              {/* Lifecycle strip — "add payment" for customers */}
              {isCustomer && (
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-3 py-1.5">
                    <div className="flex-1 text-xs text-gray-500 dark:text-slate-400">
                      {t('reports.customerBalance')}
                    </div>
                    <button
                      onClick={() => { onClose(); navigate(`/payments/new?customerId=${account.id}`); }}
                      className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-2.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      {t('payments.new')}
                    </button>
                  </div>
                </div>
              )}

              {/* Lifecycle strip — producer (no balance, no payment) */}
              {isProducer && !onEdit && (
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                    <p className="text-xs text-gray-400 dark:text-slate-500">{t('accounts.types.producer')}</p>
                  </div>
                </div>
              )}

              {/* Primary CTA — Edit */}
              {onEdit ? (
                <div className="px-3 pb-3">
                  <button
                    onClick={() => { onClose(); onEdit(account.id); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer shadow-sm"
                  >
                    {t('app.edit')}
                    {isRtl ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                /* No edit action — close CTA */
                <div className="px-3 pb-3">
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    {t('app.cancel')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
}
