#!/usr/bin/env node

// Test what results object would contain in UI
import { 
  calculateBorrowingPower
} from '../src/utils/financialCalculations.js';

console.log('🔍 TESTING UI RESULTS STATE');
console.log('=' * 50);

// Simulate calculateResults function
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

// Simulate enhancedResult creation
const enhancedResult = {
  ...result,
  totalAnnualIncome: 130000,
  hecsImpact: result.hecsImpact
};

console.log('\n📊 ENHANCED RESULT HAS:');
console.log('primaryTaxInfo?', !!enhancedResult.primaryTaxInfo);
console.log('secondaryTaxInfo?', !!enhancedResult.secondaryTaxInfo);
console.log('incomeTax?', !!enhancedResult.incomeTax, '=', enhancedResult.incomeTax);
console.log('medicareLevy?', !!enhancedResult.medicareLevy, '=', enhancedResult.medicareLevy);

if (!enhancedResult.primaryTaxInfo) {
  console.log('\n❌ PROBLEM: primaryTaxInfo is undefined!');
  console.log('This means UI cannot display individual tax breakdowns');
} else {
  console.log('\n✅ primaryTaxInfo exists:');
  console.log('  incomeTax:', enhancedResult.primaryTaxInfo.incomeTax);
  console.log('  medicareLevy:', enhancedResult.primaryTaxInfo.medicareLevy);
}

if (!enhancedResult.secondaryTaxInfo) {
  console.log('\n❌ PROBLEM: secondaryTaxInfo is undefined!');
} else {
  console.log('\n✅ secondaryTaxInfo exists:');
  console.log('  incomeTax:', enhancedResult.secondaryTaxInfo.incomeTax);
  console.log('  medicareLevy:', enhancedResult.secondaryTaxInfo.medicareLevy);
}

console.log('\n🎯 UI SHOULD ACCESS:');
console.log('Primary: results.primaryTaxInfo.incomeTax');
console.log('Secondary: results.secondaryTaxInfo.incomeTax');