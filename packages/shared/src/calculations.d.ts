import Decimal from 'decimal.js';
export type CalculationType = 'cost_based' | 'cost_based_usd' | 'per_ton';
export type TonnageBasis = 'product_weight' | 'bill_weight';
export interface TankerCosts {
    productWeight: number | string;
    billWeight: number | string;
    tonnageBasis: TonnageBasis;
    exchangeRate: number | string;
    costProduct: number | string;
    costPublicBenefits: number | string;
    costFmn60: number | string;
    costFmn20: number | string;
    costQualityControl: number | string;
    costDozbalagh_customer: number | string;
    costEscort_customer: number | string;
    costBascule_customer: number | string;
    costOvernight_customer: number | string;
    costBankCommission_customer: number | string;
    costRentAfn_customer: number | string;
    costMiscAfn_customer: number | string;
    costBrokerCommission_customer: number | string;
    costExchangerCommission_customer: number | string;
    costDozbalagh_producer: number | string;
    costEscort_producer: number | string;
    costBascule_producer: number | string;
    costOvernight_producer: number | string;
    costBankCommission_producer: number | string;
    costRentAfn_producer: number | string;
    costMiscAfn_producer: number | string;
    costBrokerCommission_producer: number | string;
    costExchangerCommission_producer: number | string;
    costLicenseCommission_customer: number | string;
    costRentUsd_customer: number | string;
    costMiscUsd_customer: number | string;
    costLicenseCommission_producer: number | string;
    costRentUsd_producer: number | string;
    costMiscUsd_producer: number | string;
    transportCost: number | string;
    commodityPercentDebt: number | string;
    ratePerTonAfn: number | string;
    ratePerTonUsd: number | string;
}
export interface CustomerDebt {
    afn: Decimal;
    usd: Decimal;
    commodity: Decimal;
}
export interface ProducerReceivable {
    afn: Decimal;
    usd: Decimal;
}
export interface CalculationResult {
    effectiveTonnage: Decimal;
    customerDebtAfn: Decimal;
    customerDebtUsd: Decimal;
    customerDebtCommodity: Decimal;
    producerReceivableAfn: Decimal;
    producerReceivableUsd: Decimal;
}
export declare function calculateEffectiveTonnage(costs: Pick<TankerCosts, 'productWeight' | 'billWeight' | 'tonnageBasis'>): Decimal;
export declare function calculateCustomerDebt(costs: TankerCosts, type: CalculationType): CustomerDebt;
export declare function calculateProducerReceivable(costs: TankerCosts): ProducerReceivable;
export declare function calculateTanker(costs: TankerCosts, contractType: CalculationType): CalculationResult;
