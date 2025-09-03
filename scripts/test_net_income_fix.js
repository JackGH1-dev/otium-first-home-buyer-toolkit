#!/usr/bin/env node

// Test the fixed net income calculations
import { 
  calculateBorrowingPower,
  calculateAustralianNetIncome,
  calculateHECSRepayment
} from '../src/utils/financialCalculations.js';

console.log('🔍 TESTING FIXED NET INCOME CALCULATIONS');
console.log('=' * 50);

const primary = 80000;
const secondary = 50000;

// Test individual calculations
const primaryTax = calculateAustralianNetIncome(primary);
const secondaryTax = calculateAustralianNetIncome(secondary);
const primaryHECS = calculateHECSRepayment(primary);
const secondaryHECS = calculateHECSRepayment(secondary);

console.log('📊 INDIVIDUAL BREAKDOWNS:');
console.log('\nPrimary ($80k):');
console.log('  Gross: $' + primary.toLocaleString());
console.log('  Tax: -$' + primaryTax.incomeTax.toLocaleString());
console.log('  Medicare: -$' + primaryTax.medicareLevy.toLocaleString());
console.log('  HECS: -$' + primaryHECS.toLocaleString());
console.log('  Net after tax: $' + primaryTax.netIncome.toLocaleString());
console.log('  Net after HECS: $' + (primaryTax.netIncome - primaryHECS).toLocaleString());

console.log('\nSecondary ($50k):');
console.log('  Gross: $' + secondary.toLocaleString());
console.log('  Tax: -$' + secondaryTax.incomeTax.toLocaleString());
console.log('  Medicare: -$' + secondaryTax.medicareLevy.toLocaleString());
console.log('  HECS: -$' + secondaryHECS.toLocaleString());
console.log('  Net after tax: $' + secondaryTax.netIncome.toLocaleString());
console.log('  Net after HECS: $' + (secondaryTax.netIncome - secondaryHECS).toLocaleString());

// Expected combined net income
const expectedCombinedNet = (primaryTax.netIncome - primaryHECS) + (secondaryTax.netIncome - secondaryHECS);
console.log('\n🎯 EXPECTED COMBINED NET: $' + expectedCombinedNet.toLocaleString());

// Test borrowing power calculation
const result = calculateBorrowingPower({
  primaryIncome: primary,
  secondaryIncome: secondary,
  dependents: 0,
  hasHECS: true,
  hecsBalance: 20000,
  scenario: 'couple',
  existingDebts: 0,
  livingExpenses: 3463,
  interestRate: 0.055,
  monthlyLiabilities: 0 // No additional liabilities
});

console.log('\n✅ BORROWING POWER RESULT:');
console.log('primaryNetIncome: $' + result.primaryNetIncome.toLocaleString());
console.log('secondaryNetIncome: $' + result.secondaryNetIncome.toLocaleString());
console.log('totalNetIncome: $' + result.netIncome.toLocaleString());

// Verify calculation
console.log('\n🔍 VERIFICATION:');
console.log('Individual sum: $' + (result.primaryNetIncome + result.secondaryNetIncome).toLocaleString());
console.log('Total reported: $' + result.netIncome.toLocaleString());
console.log('Match?', (result.primaryNetIncome + result.secondaryNetIncome) === result.netIncome ? '✅' : '❌');

console.log('\n📊 MONTHLY VALUES:');
console.log('Monthly net income: $' + Math.round(result.netIncome / 12).toLocaleString());
console.log('Expected UI display: $' + Math.round(expectedCombinedNet / 12).toLocaleString());