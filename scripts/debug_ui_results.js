#!/usr/bin/env node

// Debug what the UI component would see
import { 
  calculateBorrowingPower
} from '../src/utils/financialCalculations.js';

console.log('🔍 DEBUGGING UI RESULTS OBJECT');
console.log('=' * 50);

// Simulate exactly what the UI does
const primaryIncome = 80000;
const secondaryIncome = 50000;
const hasHECS = true;

// This is what calculateResults does
const result = calculateBorrowingPower({
  primaryIncome,
  secondaryIncome,
  dependents: 0,
  hasHECS,
  hecsBalance: 20000,
  scenario: 'couple',
  existingDebts: 0,
  livingExpenses: 3000,
  interestRate: 0.055,
  monthlyLiabilities: 0
});

// Then enhancedResult spreads the result
const enhancedResult = {
  ...result,
  totalAnnualIncome: primaryIncome + secondaryIncome,
  hecsImpact: result.hecsImpact,
  // other fields...
};

console.log('\n📊 ENHANCED RESULT CONTAINS:');
console.log('Has primaryTaxInfo?', !!enhancedResult.primaryTaxInfo);
console.log('Has secondaryTaxInfo?', !!enhancedResult.secondaryTaxInfo);
console.log('Has hecsImpact?', !!enhancedResult.hecsImpact, '=', enhancedResult.hecsImpact);

if (enhancedResult.primaryTaxInfo) {
  console.log('\nPrimary Tax Info:');
  console.log('  Income Tax:', enhancedResult.primaryTaxInfo.incomeTax);
  console.log('  Medicare:', enhancedResult.primaryTaxInfo.medicareLevy);
}

if (enhancedResult.secondaryTaxInfo) {
  console.log('\nSecondary Tax Info:');
  console.log('  Income Tax:', enhancedResult.secondaryTaxInfo.incomeTax);
  console.log('  Medicare:', enhancedResult.secondaryTaxInfo.medicareLevy);
}

console.log('\n🎯 WHAT UI SHOULD DISPLAY:');
console.log('Primary Card:');
console.log('  Gross: $80,000');
console.log('  - Tax: $14,788');
console.log('  - Medicare: $1,600');
console.log('  - HECS (proportional): $' + Math.round(enhancedResult.hecsImpact * (80000 / 130000)));
console.log('  Net: $63,612');

console.log('\nSecondary Card:');
console.log('  Gross: $50,000');
console.log('  - Tax: $5,538');
console.log('  - Medicare: $1,000');
console.log('  - HECS (proportional): $' + Math.round(enhancedResult.hecsImpact * (50000 / 130000)));
console.log('  Net: $43,462');