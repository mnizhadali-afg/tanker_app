import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useTranslation } from 'react-i18next'
import './invoice-print.css'
import PerTonTemplate from './PerTonTemplate'
import CostBasedTemplate from './CostBasedTemplate'
import CostBasedUsdTemplate from './CostBasedUsdTemplate'

interface Invoice {
  invoiceNumber: string
  customer: { name: string }
  contract: { code: string; calculationType: string }
  issueDate: string
  status: string
  tankers: Record<string, unknown>[]
}

interface Props {
  invoice: Invoice
}

export default function InvoicePrintWrapper({ invoice }: Props) {
  const { t } = useTranslation()
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice.invoiceNumber,
  })

  const calcType = invoice.contract.calculationType

  return (
    <>
      <button
        onClick={() => handlePrint()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {t('app.print')}
      </button>

      {/* Hidden print area */}
      <div className="hidden">
        <div ref={printRef}>
          {calcType === 'per_ton' && (
            <PerTonTemplate invoice={invoice as Parameters<typeof PerTonTemplate>[0]['invoice']} />
          )}
          {calcType === 'cost_based' && (
            <CostBasedTemplate invoice={invoice as Parameters<typeof CostBasedTemplate>[0]['invoice']} />
          )}
          {calcType === 'cost_based_usd' && (
            <CostBasedUsdTemplate invoice={invoice as Parameters<typeof CostBasedUsdTemplate>[0]['invoice']} />
          )}
        </div>
      </div>
    </>
  )
}
