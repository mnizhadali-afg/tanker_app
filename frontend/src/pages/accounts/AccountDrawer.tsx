import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
}

export default function AccountDrawer({ accountId, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language;

  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Fetch account detail + balance when accountId changes
  useEffect(() => {
    if (!accountId) {
      setAccount(null);
      setBalance(null);
      return;
    }
    setAccount(null);
    setBalance(null);
    setLoadingAccount(true);
    api
      .get(`/accounts/${accountId}`)
      .then((r) => {
        setAccount(r.data);
        if (r.data.type === 'customer') {
          setLoadingBalance(true);
          api
            .get(`/reports/customer-balance/${accountId}`)
            .then((rb) => setBalance(rb.data))
            .finally(() => setLoadingBalance(false));
        }
      })
      .finally(() => setLoadingAccount(false));
  }, [accountId]);

  const isOpen = Boolean(accountId);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40"
      />

      {/* Modal — centered */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col pointer-events-auto">
        {/* Header */}
        <div className='flex items-start justify-between px-5 py-4 border-b border-gray-200 rounded-t-2xl'>
          <div className='flex-1 min-w-0'>
            {loadingAccount ? (
              <div className='h-6 w-40 bg-gray-200 rounded animate-pulse' />
            ) : (
              <>
                <h2 className='text-base font-bold text-gray-900 truncate'>
                  {account?.name ?? '—'}
                </h2>
                <div className='mt-1 flex items-center gap-2'>
                  {account && (
                    <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full'>
                      {t(`accounts.types.${account.type}`)}
                    </span>
                  )}
                  {account && (
                    <StatusBadge
                      status={account.isActive ? 'active' : 'inactive'}
                      label={t(
                        account.isActive ? 'app.active' : 'app.inactive',
                      )}
                    />
                  )}
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className='ms-3 text-gray-400 hover:text-gray-600 text-xl leading-none'
            aria-label='close'
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto px-5 py-4 space-y-5'>
          {loadingAccount ? (
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='h-4 bg-gray-100 rounded animate-pulse'
                  style={{ width: `${60 + i * 10}%` }}
                />
              ))}
            </div>
          ) : account ? (
            <>
              {/* Contact info */}
              <section className='space-y-3'>
                {account.phone && (
                  <Row label={t('accounts.phone')} value={account.phone} />
                )}
                {account.address && (
                  <Row label={t('accounts.address')} value={account.address} />
                )}
                {account.notes && (
                  <Row label={t('app.notes')} value={account.notes} multiline />
                )}
                {!account.phone && !account.address && !account.notes && (
                  <p className='text-sm text-gray-400'>—</p>
                )}
              </section>

              {/* Balance section — customers only */}
              {account.type === 'customer' && (
                <section>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-100'>
                    {t('reports.customerBalance')}
                  </h3>
                  {loadingBalance ? (
                    <div className='space-y-2'>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className='h-4 bg-gray-100 rounded animate-pulse'
                        />
                      ))}
                    </div>
                  ) : balance ? (
                    <div className='space-y-2'>
                      <BalanceRow
                        label={t('reports.balanceAfn')}
                        value={formatNumber(balance.balanceAfn, locale)}
                        isDebt={Number(balance.balanceAfn) > 0}
                        currency={t('currency.afn')}
                      />
                      <BalanceRow
                        label={t('reports.balanceUsd')}
                        value={formatNumber(balance.balanceUsd, locale)}
                        isDebt={Number(balance.balanceUsd) > 0}
                        currency={t('currency.usd')}
                      />
                      {Number(balance.balanceCommodity) !== 0 && (
                        <BalanceRow
                          label={t('reports.balanceCommodity')}
                          value={formatNumber(balance.balanceCommodity, locale)}
                          isDebt={Number(balance.balanceCommodity) > 0}
                        />
                      )}
                    </div>
                  ) : (
                    <p className='text-sm text-gray-400'>—</p>
                  )}
                </section>
              )}
            </>
          ) : null}
        </div>

        {/* Footer actions */}
        {account && (
          <div className='px-5 py-4 border-t border-gray-200 flex gap-3 rounded-b-2xl'>
            <button
              onClick={() => {
                onClose();
                navigate(`/accounts/${account.id}/edit`);
              }}
              className='flex-1 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium'
            >
              {t('app.edit')}
            </button>
            {account.type === 'customer' && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/payments/new?customerId=${account.id}`);
                }}
                className='flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium'
              >
                {t('payments.new')}
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className='text-xs text-gray-500 mb-0.5'>{label}</p>
      {multiline ? (
        <p className='text-sm text-gray-800 whitespace-pre-wrap'>{value}</p>
      ) : (
        <p className='text-sm text-gray-800'>{value}</p>
      )}
    </div>
  );
}

function BalanceRow({
  label,
  value,
  isDebt,
  currency,
}: {
  label: string;
  value: string;
  isDebt: boolean;
  currency?: string;
}) {
  return (
    <div className='flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50'>
      <span className='text-sm text-gray-600'>{label}</span>
      <span
        className={`text-sm font-semibold ${isDebt ? 'text-red-600' : 'text-green-600'}`}
      >
        {value}{' '}
        {currency && (
          <span className='font-normal text-xs text-gray-500'>{currency}</span>
        )}
      </span>
    </div>
  );
}
