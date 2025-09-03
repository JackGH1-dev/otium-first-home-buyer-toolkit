#!/usr/bin/env node

// Debug what values the UI is actually receiving
import { 
  calculateBorrowingPower,
  calculateAustralianNetIncome
} from '../src/utils/financialCalculations.js';

console.log('🔍 DEBUGGING UI VALUES MISMATCH');
console.log('=' * 50);

const primary = 80000;
const secondary = 50000;

// Test the actual calculation that UI calls
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
  monthlyLiabilities: 0
});

console.log('📊 WHAT UI RECEIVES:');
console.log('\nPrimary Tax Info:');
console.log('  grossIncome:', result.primaryTaxInfo?.grossIncome);
console.log('  incomeTax:', result.primaryTaxInfo?.incomeTax);
console.log('  medicareLevy:', result.primaryTaxInfo?.medicareLevy);
console.log('  netIncome (tax only):', result.primaryTaxInfo?.netIncome);
console.log('  HECS:', result.primaryHECS);
console.log('  Final Net Income:', result.primaryNetIncome);

console.log('\nSecondary Tax Info:');
console.log('  grossIncome:', result.secondaryTaxInfo?.grossIncome);
console.log('  incomeTax:', result.secondaryTaxInfo?.incomeTax);
console.log('  medicareLevy:', result.secondaryTaxInfo?.medicareLevy);
console.log('  netIncome (tax only):', result.secondaryTaxInfo?.netIncome);
console.log('  HECS:', result.secondaryHECS);
console.log('  Final Net Income:', result.secondaryNetIncome);

console.log('\n🎯 UI SHOULD DISPLAY:');
console.log('Primary: $80,000 - $' + result.primaryTaxInfo.incomeTax + ' - $' + result.primaryTaxInfo.medicareLevy + ' - $' + result.primaryHECS + ' = $' + result.primaryNetIncome);
console.log('Secondary: $50,000 - $' + result.secondaryTaxInfo.incomeTax + ' - $' + result.secondaryTaxInfo.medicareLevy + ' - $' + result.secondaryHECS + ' = $' + result.secondaryNetIncome);

console.log('\n🔍 MANUAL CALCULATION CHECK:');
const expectedPrimary = 80000 - result.primaryTaxInfo.incomeTax - result.primaryTaxInfo.medicareLevy - result.primaryHECS;
const expectedSecondary = 50000 - result.secondaryTaxInfo.incomeTax - result.secondaryTaxInfo.medicareLevy - result.secondaryHECS;
console.log('Expected Primary:', expectedPrimary);
console.log('Returned Primary:', result.primaryNetIncome);
console.log('Match?', expectedPrimary === result.primaryNetIncome ? '✅' : '❌');

console.log('Expected Secondary:', expectedSecondary);
console.log('Returned Secondary:', result.secondaryNetIncome);
console.log('Match?', expectedSecondary === result.secondaryNetIncome ? '✅' : '❌');

console.log('\n📊 TOTALS:');
console.log('Expected Combined:', expectedPrimary + expectedSecondary);
console.log('Returned Combined:', result.netIncome);
console.log('UI shows:', '$97,612 (WRONG)');
console.log('Should be:', '$' + (expectedPrimary + expectedSecondary).toLocaleString());