#!/usr/bin/env node

// Debug script to simulate exactly what the UI is doing
import { 
  calculateBorrowingPower,
  calculateHEMExpenses,
  calculateAustralianNetIncome
} from '../src/utils/financialCalculations.js';

console.log('🔍 DEBUGGING UI STATE SIMULATION');
console.log('=' * 50);

// Simulate the exact UI flow
const formData = {
  primaryIncome: 80000,
  secondaryIncome: 0,
  dependents: 0,
  monthlyLivingExpenses: 2554, // What you're seeing in UI
  scenario: 'single',
  hasHECS: false,
  hecsBalance: 0,
  interestRate: 5.5,
  termYears: 30,
  monthlyLiabilities: 0,
  propertyType: 'owner-occupied',
  postPurchaseLiving: 'own-property'
};

console.log('CURRENT UI STATE (what you\'re seeing):');
console.log(`Primary Income: $${formData.primaryIncome.toLocaleString()}`);
console.log(`Monthly Living Expenses: $${formData.monthlyLivingExpenses.toLocaleString()}`);
console.log(`Scenario: ${formData.scenario}`);
console.log(`Dependents: ${formData.dependents}`);

// Test what HEM should be
console.log('\nWhat HEM SHOULD be:');
const primaryNet = calculateAustralianNetIncome(formData.primaryIncome).netIncome;
const correctHEM = calculateHEMExpenses(formData.scenario, primaryNet, formData.dependents);
console.log(`Net Income: $${primaryNet.toLocaleString()}`);
console.log(`Correct HEM: $${correctHEM.toLocaleString()}/month`);

// Test borrowing power with current (wrong) value
console.log('\nBORROWING POWER WITH CURRENT UI VALUES:');
const currentResult = calculateBorrowingPower({
  primaryIncome: formData.primaryIncome,
  secondaryIncome: formData.secondaryIncome,
  dependents: formData.dependents,
  hasHECS: formData.hasHECS,
  hecsBalance: formData.hecsBalance,
  scenario: formData.scenario,
  existingDebts: 0,
  livingExpenses: formData.monthlyLivingExpenses, // Using the wrong $2,554
  interestRate: formData.interestRate / 100,
  monthlyLiabilities: formData.monthlyLiabilities
});

console.log(`Result with $${formData.monthlyLivingExpenses} expenses: $${currentResult.maxLoan.toLocaleString()}`);
console.log(`Surplus: $${currentResult.surplus.toLocaleString()}/month`);
console.log(`HEM Benchmark used: $${currentResult.hemBenchmark.toLocaleString()}/month`);
console.log(`Assessed Expenses: $${currentResult.assessedExpenses.toLocaleString()}/month`);

// Test borrowing power with CORRECT HEM value
console.log('\nBORROWING POWER WITH CORRECT HEM:');
const correctedResult = calculateBorrowingPower({
  primaryIncome: formData.primaryIncome,
  secondaryIncome: formData.secondaryIncome,
  dependents: formData.dependents,
  hasHECS: formData.hasHECS,
  hecsBalance: formData.hecsBalance,
  scenario: formData.scenario,
  existingDebts: 0,
  livingExpenses: correctHEM, // Using the correct $2,050
  interestRate: formData.interestRate / 100,
  monthlyLiabilities: formData.monthlyLiabilities
});

console.log(`Result with $${correctHEM} expenses: $${correctedResult.maxLoan.toLocaleString()}`);
console.log(`Surplus: $${correctedResult.surplus.toLocaleString()}/month`);
console.log(`HEM Benchmark used: $${correctedResult.hemBenchmark.toLocaleString()}/month`);
console.log(`Assessed Expenses: $${correctedResult.assessedExpenses.toLocaleString()}/month`);

// Show the difference
const difference = correctedResult.maxLoan - currentResult.maxLoan;
console.log('\n💰 IMPACT OF FIXING HEM:');
console.log(`Borrowing Power Increase: $${difference.toLocaleString()}`);
console.log(`Percentage Increase: ${(difference / currentResult.maxLoan * 100).toFixed(1)}%`);

console.log('\n🎯 ROOT CAUSE ANALYSIS:');
console.log('The UI is showing $2,554 because:');
console.log('1. You previously entered a manual value');
console.log('2. The HEM checkbox is not properly overriding it');
console.log('3. There\'s a state update race condition');
console.log('4. The form state is not updating correctly');

console.log('\n🔧 DEBUGGING STEPS:');
console.log('1. Clear the living expenses field completely');
console.log('2. Check the "Use HEM Benchmark" checkbox');
console.log('3. It should auto-populate with $2,050');
console.log('4. The borrowing power should update to ~$403k');