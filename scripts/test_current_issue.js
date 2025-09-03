#!/usr/bin/env node

// Test what's happening with the current issue
import { 
  calculateBorrowingPower
} from '../src/utils/financialCalculations.js';

console.log('🔍 TESTING CURRENT ISSUE - Tax all on Primary');
console.log('=' * 50);

const result = calculateBorrowingPower({
  primaryIncome: 80000,
  secondaryIncome: 50000,
  dependents: 0,
  hasHECS: true,
  hecsBalance: 20000,
  scenario: 'couple',
  existingDebts: 0,
  livingExpenses: 3463,
  interestRate: 0.055,
  monthlyLiabilities: 169
});

console.log('\n📊 WHAT FUNCTION RETURNS:');
console.log('Primary Income:', 80000);
console.log('Secondary Income:', 50000);

console.log('\nPrimary Tax Info:');
if (result.primaryTaxInfo) {
  console.log('  Income Tax:', result.primaryTaxInfo.incomeTax);
  console.log('  Medicare:', result.primaryTaxInfo.medicareLevy);
  console.log('  Total:', result.primaryTaxInfo.incomeTax + result.primaryTaxInfo.medicareLevy);
}

console.log('\nSecondary Tax Info:');
if (result.secondaryTaxInfo) {
  console.log('  Income Tax:', result.secondaryTaxInfo.incomeTax);
  console.log('  Medicare:', result.secondaryTaxInfo.medicareLevy);
  console.log('  Total:', result.secondaryTaxInfo.incomeTax + result.secondaryTaxInfo.medicareLevy);
}

console.log('\n🚨 UI IS SHOWING:');
console.log('Primary Tax: $29,788 (WRONG - should be ~$14,788)');
console.log('Primary Medicare: $2,600 (WRONG - should be ~$1,600)');
console.log('Primary Net: $87,784 (WRONG - should be ~$63,612)');
console.log('Secondary shows nothing (WRONG - should show tax breakdown)');

console.log('\n💡 THE BUG:');
console.log('UI is displaying result.incomeTax (total) instead of result.primaryTaxInfo.incomeTax');
console.log('result.incomeTax =', result.incomeTax, '(total of both)');
console.log('result.medicareLevy =', result.medicareLevy, '(total of both)');