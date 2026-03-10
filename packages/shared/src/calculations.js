"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEffectiveTonnage = calculateEffectiveTonnage;
exports.calculateCustomerDebt = calculateCustomerDebt;
exports.calculateProducerReceivable = calculateProducerReceivable;
exports.calculateTanker = calculateTanker;
const decimal_js_1 = __importDefault(require("decimal.js"));
function d(value) {
    if (value === undefined || value === null || value === '')
        return new decimal_js_1.default(0);
    return new decimal_js_1.default(value);
}
function calculateEffectiveTonnage(costs) {
    return costs.tonnageBasis === 'bill_weight'
        ? d(costs.billWeight)
        : d(costs.productWeight);
}
function sharedCostsTotal(costs) {
    return d(costs.costProduct)
        .plus(d(costs.costPublicBenefits))
        .plus(d(costs.costFmn60))
        .plus(d(costs.costFmn20))
        .plus(d(costs.costQualityControl));
}
function customerAfnVariableCosts(costs) {
    return d(costs.costDozbalagh_customer)
        .plus(d(costs.costEscort_customer))
        .plus(d(costs.costBascule_customer))
        .plus(d(costs.costOvernight_customer))
        .plus(d(costs.costBankCommission_customer))
        .plus(d(costs.costRentAfn_customer))
        .plus(d(costs.costMiscAfn_customer))
        .plus(d(costs.costBrokerCommission_customer))
        .plus(d(costs.costExchangerCommission_customer))
        .plus(d(costs.transportCost));
}
function customerUsdVariableCosts(costs) {
    return d(costs.costLicenseCommission_customer)
        .plus(d(costs.costRentUsd_customer))
        .plus(d(costs.costMiscUsd_customer));
}
function producerAfnVariableCosts(costs) {
    return d(costs.costDozbalagh_producer)
        .plus(d(costs.costEscort_producer))
        .plus(d(costs.costBascule_producer))
        .plus(d(costs.costOvernight_producer))
        .plus(d(costs.costBankCommission_producer))
        .plus(d(costs.costRentAfn_producer))
        .plus(d(costs.costMiscAfn_producer))
        .plus(d(costs.costBrokerCommission_producer))
        .plus(d(costs.costExchangerCommission_producer));
}
function producerUsdVariableCosts(costs) {
    return d(costs.costLicenseCommission_producer)
        .plus(d(costs.costRentUsd_producer))
        .plus(d(costs.costMiscUsd_producer));
}
function calculateCustomerDebt(costs, type) {
    if (type === 'per_ton') {
        const tonnage = calculateEffectiveTonnage(costs);
        return {
            afn: tonnage.mul(d(costs.ratePerTonAfn)),
            usd: tonnage.mul(d(costs.ratePerTonUsd)),
            commodity: d(costs.commodityPercentDebt),
        };
    }
    const afnTotal = sharedCostsTotal(costs).plus(customerAfnVariableCosts(costs));
    const usdVariable = customerUsdVariableCosts(costs);
    if (type === 'cost_based') {
        return {
            afn: afnTotal,
            usd: usdVariable,
            commodity: d(costs.commodityPercentDebt),
        };
    }
    const exchangeRate = d(costs.exchangeRate);
    const convertedUsd = exchangeRate.gt(0) ? afnTotal.div(exchangeRate) : new decimal_js_1.default(0);
    return {
        afn: new decimal_js_1.default(0),
        usd: convertedUsd.plus(usdVariable),
        commodity: d(costs.commodityPercentDebt),
    };
}
function calculateProducerReceivable(costs) {
    return {
        afn: sharedCostsTotal(costs).plus(producerAfnVariableCosts(costs)),
        usd: producerUsdVariableCosts(costs),
    };
}
function calculateTanker(costs, contractType) {
    const effectiveTonnage = calculateEffectiveTonnage(costs);
    const customerDebt = calculateCustomerDebt(costs, contractType);
    const producerReceivable = calculateProducerReceivable(costs);
    return {
        effectiveTonnage,
        customerDebtAfn: customerDebt.afn,
        customerDebtUsd: customerDebt.usd,
        customerDebtCommodity: customerDebt.commodity,
        producerReceivableAfn: producerReceivable.afn,
        producerReceivableUsd: producerReceivable.usd,
    };
}
//# sourceMappingURL=calculations.js.map