"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const decimal_js_1 = __importDefault(require("decimal.js"));
const calculations_1 = require("./calculations");
const BASE = {
    productWeight: 10,
    billWeight: 9.5,
    tonnageBasis: 'product_weight',
    exchangeRate: 90,
    costProduct: 100,
    costPublicBenefits: 50,
    costFmn60: 30,
    costFmn20: 20,
    costQualityControl: 10,
    costDozbalagh_customer: 200,
    costEscort_customer: 150,
    costBascule_customer: 80,
    costOvernight_customer: 0,
    costBankCommission_customer: 50,
    costRentAfn_customer: 500,
    costMiscAfn_customer: 100,
    costBrokerCommission_customer: 75,
    costExchangerCommission_customer: 25,
    costDozbalagh_producer: 200,
    costEscort_producer: 150,
    costBascule_producer: 80,
    costOvernight_producer: 0,
    costBankCommission_producer: 50,
    costRentAfn_producer: 500,
    costMiscAfn_producer: 100,
    costBrokerCommission_producer: 75,
    costExchangerCommission_producer: 25,
    costLicenseCommission_customer: 5,
    costRentUsd_customer: 10,
    costMiscUsd_customer: 2,
    costLicenseCommission_producer: 5,
    costRentUsd_producer: 10,
    costMiscUsd_producer: 2,
    transportCost: 300,
    commodityPercentDebt: 3,
    ratePerTonAfn: 1000,
    ratePerTonUsd: 12,
};
(0, vitest_1.describe)('calculateEffectiveTonnage', () => {
    (0, vitest_1.it)('returns productWeight when tonnageBasis is product_weight', () => {
        const result = (0, calculations_1.calculateEffectiveTonnage)({ ...BASE, tonnageBasis: 'product_weight' });
        (0, vitest_1.expect)(result.toNumber()).toBe(10);
    });
    (0, vitest_1.it)('returns billWeight when tonnageBasis is bill_weight', () => {
        const result = (0, calculations_1.calculateEffectiveTonnage)({ ...BASE, tonnageBasis: 'bill_weight' });
        (0, vitest_1.expect)(result.toNumber()).toBe(9.5);
    });
});
(0, vitest_1.describe)('calculateCustomerDebt — cost_based', () => {
    (0, vitest_1.it)('sums shared + customer AFN costs correctly', () => {
        const result = (0, calculations_1.calculateCustomerDebt)(BASE, 'cost_based');
        (0, vitest_1.expect)(result.afn.toNumber()).toBe(1690);
    });
    (0, vitest_1.it)('sums customer USD costs correctly', () => {
        const result = (0, calculations_1.calculateCustomerDebt)(BASE, 'cost_based');
        (0, vitest_1.expect)(result.usd.toNumber()).toBe(17);
    });
    (0, vitest_1.it)('captures commodity debt', () => {
        const result = (0, calculations_1.calculateCustomerDebt)(BASE, 'cost_based');
        (0, vitest_1.expect)(result.commodity.toNumber()).toBe(3);
    });
    (0, vitest_1.it)('returns zero AFN fields for missing costs', () => {
        const zeroCosts = { ...BASE,
            costProduct: 0, costPublicBenefits: 0, costFmn60: 0, costFmn20: 0, costQualityControl: 0,
            costDozbalagh_customer: 0, costEscort_customer: 0, costBascule_customer: 0, costOvernight_customer: 0,
            costBankCommission_customer: 0, costRentAfn_customer: 0, costMiscAfn_customer: 0,
            costBrokerCommission_customer: 0, costExchangerCommission_customer: 0, transportCost: 0,
        };
        const result = (0, calculations_1.calculateCustomerDebt)(zeroCosts, 'cost_based');
        (0, vitest_1.expect)(result.afn.toNumber()).toBe(0);
    });
});
(0, vitest_1.describe)('calculateCustomerDebt — cost_based_usd', () => {
    (0, vitest_1.it)('converts AFN total to USD using exchange rate', () => {
        const result = (0, calculations_1.calculateCustomerDebt)(BASE, 'cost_based_usd');
        const expectedUsd = new decimal_js_1.default(1690).div(90).plus(17);
        (0, vitest_1.expect)(result.usd.toFixed(4)).toBe(expectedUsd.toFixed(4));
    });
    (0, vitest_1.it)('sets AFN to zero', () => {
        const result = (0, calculations_1.calculateCustomerDebt)(BASE, 'cost_based_usd');
        (0, vitest_1.expect)(result.afn.toNumber()).toBe(0);
    });
    (0, vitest_1.it)('handles zero exchange rate without dividing by zero', () => {
        const result = (0, calculations_1.calculateCustomerDebt)({ ...BASE, exchangeRate: 0 }, 'cost_based_usd');
        (0, vitest_1.expect)(result.usd.isFinite()).toBe(true);
        (0, vitest_1.expect)(result.usd.toNumber()).toBe(17);
    });
    (0, vitest_1.it)('uses bill_weight as tonnage basis when applicable', () => {
        const costs = { ...BASE, tonnageBasis: 'bill_weight' };
        const result = (0, calculations_1.calculateCustomerDebt)(costs, 'cost_based_usd');
        (0, vitest_1.expect)(result.afn.toNumber()).toBe(0);
    });
});
(0, vitest_1.describe)('calculateCustomerDebt — per_ton', () => {
    (0, vitest_1.it)('calculates AFN as tonnage × ratePerTonAfn (product_weight basis)', () => {
        const result = (0, calculations_1.calculateCustomerDebt)(BASE, 'per_ton');
        (0, vitest_1.expect)(result.afn.toNumber()).toBe(10000);
    });
    (0, vitest_1.it)('calculates USD as tonnage × ratePerTonUsd', () => {
        const result = (0, calculations_1.calculateCustomerDebt)(BASE, 'per_ton');
        (0, vitest_1.expect)(result.usd.toNumber()).toBe(120);
    });
    (0, vitest_1.it)('uses bill_weight when tonnageBasis is bill_weight', () => {
        const result = (0, calculations_1.calculateCustomerDebt)({ ...BASE, tonnageBasis: 'bill_weight' }, 'per_ton');
        (0, vitest_1.expect)(result.afn.toNumber()).toBe(9500);
        (0, vitest_1.expect)(result.usd.toNumber()).toBe(114);
    });
    (0, vitest_1.it)('returns zero when rates are zero', () => {
        const result = (0, calculations_1.calculateCustomerDebt)({ ...BASE, ratePerTonAfn: 0, ratePerTonUsd: 0 }, 'per_ton');
        (0, vitest_1.expect)(result.afn.toNumber()).toBe(0);
        (0, vitest_1.expect)(result.usd.toNumber()).toBe(0);
    });
});
(0, vitest_1.describe)('calculateProducerReceivable', () => {
    (0, vitest_1.it)('is always cost-based regardless of contract type — sums shared + producer costs', () => {
        const result = (0, calculations_1.calculateProducerReceivable)(BASE);
        (0, vitest_1.expect)(result.afn.toNumber()).toBe(1390);
    });
    (0, vitest_1.it)('sums producer USD costs', () => {
        const result = (0, calculations_1.calculateProducerReceivable)(BASE);
        (0, vitest_1.expect)(result.usd.toNumber()).toBe(17);
    });
    (0, vitest_1.it)('does NOT include transportCost in producer receivable', () => {
        const withTransport = { ...BASE, transportCost: 99999 };
        const withoutTransport = { ...BASE, transportCost: 0 };
        const r1 = (0, calculations_1.calculateProducerReceivable)(withTransport);
        const r2 = (0, calculations_1.calculateProducerReceivable)(withoutTransport);
        (0, vitest_1.expect)(r1.afn.toNumber()).toBe(r2.afn.toNumber());
    });
    (0, vitest_1.it)('does NOT include commodityPercentDebt in producer receivable', () => {
        const result = (0, calculations_1.calculateProducerReceivable)({ ...BASE, commodityPercentDebt: 999 });
        (0, vitest_1.expect)(result.afn.toNumber()).toBe(1390);
    });
});
(0, vitest_1.describe)('calculateTanker', () => {
    (0, vitest_1.it)('returns all fields in a single result object', () => {
        const result = (0, calculations_1.calculateTanker)(BASE, 'cost_based');
        (0, vitest_1.expect)(result).toHaveProperty('effectiveTonnage');
        (0, vitest_1.expect)(result).toHaveProperty('customerDebtAfn');
        (0, vitest_1.expect)(result).toHaveProperty('customerDebtUsd');
        (0, vitest_1.expect)(result).toHaveProperty('customerDebtCommodity');
        (0, vitest_1.expect)(result).toHaveProperty('producerReceivableAfn');
        (0, vitest_1.expect)(result).toHaveProperty('producerReceivableUsd');
    });
    (0, vitest_1.it)('effectiveTonnage respects tonnageBasis', () => {
        const r1 = (0, calculations_1.calculateTanker)(BASE, 'cost_based');
        const r2 = (0, calculations_1.calculateTanker)({ ...BASE, tonnageBasis: 'bill_weight' }, 'cost_based');
        (0, vitest_1.expect)(r1.effectiveTonnage.toNumber()).toBe(10);
        (0, vitest_1.expect)(r2.effectiveTonnage.toNumber()).toBe(9.5);
    });
    (0, vitest_1.it)('per_ton contract — producer receivable is still cost-based', () => {
        const result = (0, calculations_1.calculateTanker)(BASE, 'per_ton');
        (0, vitest_1.expect)(result.producerReceivableAfn.toNumber()).toBe(1390);
    });
    (0, vitest_1.it)('cost_based_usd contract — producer receivable is still cost-based in AFN', () => {
        const result = (0, calculations_1.calculateTanker)(BASE, 'cost_based_usd');
        (0, vitest_1.expect)(result.customerDebtAfn.toNumber()).toBe(0);
        (0, vitest_1.expect)(result.producerReceivableAfn.toNumber()).toBe(1390);
    });
    (0, vitest_1.it)('handles string number inputs (from Prisma Decimal)', () => {
        const stringCosts = {
            ...BASE,
            productWeight: '10',
            billWeight: '9.5',
            exchangeRate: '90',
            costProduct: '100',
            ratePerTonAfn: '1000',
            ratePerTonUsd: '12',
        };
        const result = (0, calculations_1.calculateTanker)(stringCosts, 'per_ton');
        (0, vitest_1.expect)(result.customerDebtAfn.toNumber()).toBe(10000);
    });
});
//# sourceMappingURL=calculations.test.js.map