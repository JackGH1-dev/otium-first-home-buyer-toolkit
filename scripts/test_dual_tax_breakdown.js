#!/usr/bin/env node

// Test dual applicant tax breakdown
import { 
  calculateBorrowingPower,
  calculateAustralianNetIncome
} from '../src/utils/financialCalculations.js';

console.log('🔍 TESTING DUAL APPLICANT TAX BREAKDOWN');
console.log('=' * 50);

// Test scenario: Couple with $80k primary and $50k secondary
const result = calculateBorrowingPower({
  primaryIncome: 80000,
  secondaryIncome: 50000,
  dependents: 0,
  hasHECS: true,
  hecsBalance: 20000,
  scenario: 'couple',
  existingDebts: 0,
  livingExpenses: 3000,
  interestRate: 0.055,
  monthlyLiabilities: 0
});

console.log('\n📊 RETURNED VALUES:');
console.log('Primary Tax Info:', result.primaryTaxInfo);
console.log('Secondary Tax Info:', result.secondaryTaxInfo);
console.log('Total Income Tax:', result.incomeTax);
console.log('Total Medicare Levy:', result.medicareLevy);
console.log('HECS Impact:', result.hecsImpact);
console.log('Primary Net Income:', result.primaryNetIncome);
console.log('Secondary Net Income:', result.secondaryNetIncome);

console.log('\n✅ MANUAL VERIFICATION:');
const primary = calculateAustralianNetIncome(80000);
const secondary = calculateAustralianNetIncome(50000);

console.log('Primary Manual:');
console.log('  Income Tax:', primary.incomeTax);
console.log('  Medicare Levy:', primary.medicareLevy);
console.log('  Net Income:', primary.netIncome);

console.log('Secondary Manual:');
console.log('  Income Tax:', secondary.incomeTax);
console.log('  Medicare Levy:', secondary.medicareLevy);
console.log('  Net Income:', secondary.netIncome);

console.log('\n🚨 ISSUES:');
if (!result.primaryTaxInfo) {
  console.log('❌ primaryTaxInfo is missing from result!');
}
if (!result.secondaryTaxInfo) {
  console.log('❌ secondaryTaxInfo is missing from result!');
}
if (result.hecsImpact === 0 && result.hasHECS) {
  console.log('❌ HECS not calculating despite hasHECS = true');
}