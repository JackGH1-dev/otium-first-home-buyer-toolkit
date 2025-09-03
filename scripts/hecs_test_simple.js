#!/usr/bin/env node

// Simple HECS test to validate calculation
import { 
  calculateBorrowingPower, 
  calculateHECSRepayment, 
  calculateAustralianNetIncome 
} from '../src/utils/financialCalculations.js';

console.log('🧪 Simple HECS Test - $150k Single Income');
console.log('=' * 50);

// Your expected calculation:
// $150k gross → $36,838 tax, $12,950 HECS, $3,000 medicare = $97,212 net

const testIncome = 150000;

console.log('Step 1: HECS calculation');
const hecs = calculateHECSRepayment(testIncome);
console.log(`HECS repayment: $${hecs.toLocaleString()}`);
console.log(`Expected: $12,950`);
console.log(`Match: ${Math.abs(hecs - 12950) < 10 ? '✅ CLOSE' : '❌ OFF'}`);

console.log('\nStep 2: Tax calculation (without HECS)');
const taxCalc = calculateAustralianNetIncome(testIncome);
console.log(`Gross Income: $${taxCalc.grossIncome.toLocaleString()}`);
console.log(`Income Tax: $${taxCalc.incomeTax.toLocaleString()} (expected: $36,838)`);
console.log(`Medicare Levy: $${taxCalc.medicareLevy.toLocaleString()} (expected: $3,000)`);
console.log(`Total Tax: $${taxCalc.totalTax.toLocaleString()} (expected: $39,838)`);
console.log(`Net before HECS: $${taxCalc.netIncome.toLocaleString()}`);

console.log('\nStep 3: Net after HECS');
const netAfterHECS = taxCalc.netIncome - hecs;
console.log(`Net after HECS: $${netAfterHECS.toLocaleString()} (expected: $97,212)`);
console.log(`Match: ${Math.abs(netAfterHECS - 97212) < 100 ? '✅ PERFECT' : '❌ OFF'}`);

console.log('\nStep 4: Borrowing power test');
const borrowingTest = calculateBorrowingPower({
  primaryIncome: testIncome,
  secondaryIncome: 0,
  dependents: 0,
  hasHECS: true,
  hecsBalance: 50000,
  scenario: 'single',
  existingDebts: 0,
  livingExpenses: 2000,
  interestRate: 0.055
});

console.log(`Borrowing calculation net income: $${borrowingTest.netIncome.toLocaleString()}`);
console.log(`Expected net income: $97,212`);
console.log(`HECS impact shown: $${borrowingTest.hecsImpact.toLocaleString()}`);
console.log(`Net income match: ${Math.abs(borrowingTest.netIncome - 97212) < 100 ? '✅ PERFECT' : '❌ OFF'}`);