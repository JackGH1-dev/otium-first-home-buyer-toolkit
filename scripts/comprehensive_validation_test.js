#!/usr/bin/env node

// Comprehensive validation test - Manual vs App calculations
import { 
  calculateBorrowingPower,
  calculateAustralianNetIncome,
  calculateHECSRepayment,
  calculateHEMExpenses
} from '../src/utils/financialCalculations.js';

console.log('🧪 COMPREHENSIVE VALIDATION TEST');
console.log('Manual vs App Calculation Alignment');
console.log('=' * 60);

// Test Case: Standard couple scenario
const testCase = {
  primaryIncome: 80000,
  secondaryIncome: 50000,
  dependents: 0,
  hasHECS: true,
  hecsBalance: 20000,
  scenario: 'couple',
  existingDebts: 0,
  livingExpenses: 3463, // HEM benchmark
  interestRate: 0.055,
  monthlyLiabilities: 0,
  termYears: 30
};

console.log('📋 TEST SCENARIO:');
console.log('Primary Income: $' + testCase.primaryIncome.toLocaleString());
console.log('Secondary Income: $' + testCase.secondaryIncome.toLocaleString());
console.log('HECS Debt: $' + testCase.hecsBalance.toLocaleString());
console.log('Living Expenses: $' + testCase.livingExpenses.toLocaleString() + ' (HEM)');
console.log('Interest Rate: ' + (testCase.interestRate * 100).toFixed(1) + '%');

console.log('\n🧮 MANUAL CALCULATIONS:');

// 1. Individual tax calculations
const primaryTax = calculateAustralianNetIncome(testCase.primaryIncome);
const secondaryTax = calculateAustralianNetIncome(testCase.secondaryIncome);

console.log('\n1️⃣ TAX CALCULATIONS:');
console.log('Primary ($80k):');
console.log('  Income Tax: $' + primaryTax.incomeTax.toLocaleString());
console.log('  Medicare: $' + primaryTax.medicareLevy.toLocaleString());
console.log('  Net after tax: $' + primaryTax.netIncome.toLocaleString());

console.log('Secondary ($50k):');
console.log('  Income Tax: $' + secondaryTax.incomeTax.toLocaleString());
console.log('  Medicare: $' + secondaryTax.medicareLevy.toLocaleString());
console.log('  Net after tax: $' + secondaryTax.netIncome.toLocaleString());

// 2. HECS calculations
const primaryHECS = calculateHECSRepayment(testCase.primaryIncome);
const secondaryHECS = calculateHECSRepayment(testCase.secondaryIncome);
const totalHECS = primaryHECS + secondaryHECS;

console.log('\n2️⃣ HECS CALCULATIONS:');
console.log('Primary HECS ($80k): $' + primaryHECS.toLocaleString());
console.log('Secondary HECS ($50k): $' + secondaryHECS.toLocaleString());
console.log('Total HECS: $' + totalHECS.toLocaleString());

// 3. Net income after HECS
const primaryNetFinal = primaryTax.netIncome - primaryHECS;
const secondaryNetFinal = secondaryTax.netIncome - secondaryHECS;
const combinedNetFinal = primaryNetFinal + secondaryNetFinal;

console.log('\n3️⃣ FINAL NET INCOMES:');
console.log('Primary final net: $' + primaryNetFinal.toLocaleString());
console.log('Secondary final net: $' + secondaryNetFinal.toLocaleString());
console.log('Combined final net: $' + combinedNetFinal.toLocaleString());

// 4. Monthly calculations
const monthlyNet = combinedNetFinal / 12;
const monthlySurplus = monthlyNet - testCase.livingExpenses;

console.log('\n4️⃣ MONTHLY CALCULATIONS:');
console.log('Monthly net income: $' + Math.round(monthlyNet).toLocaleString());
console.log('Monthly living expenses: $' + testCase.livingExpenses.toLocaleString());
console.log('Monthly surplus: $' + Math.round(monthlySurplus).toLocaleString());

// 5. Borrowing capacity calculation
const assessmentRate = testCase.interestRate + 0.03; // 3% buffer
const monthlyRate = assessmentRate / 12;
const totalPayments = testCase.termYears * 12;
const manualBorrowingCapacity = monthlySurplus * ((1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate);

console.log('\n5️⃣ BORROWING CAPACITY:');
console.log('Assessment rate: ' + (assessmentRate * 100).toFixed(1) + '% (' + (testCase.interestRate * 100).toFixed(1) + '% + 3%)');
console.log('P&I factor: ' + ((1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate).toFixed(2));
console.log('Manual borrowing capacity: $' + Math.round(manualBorrowingCapacity).toLocaleString());

console.log('\n🤖 APP CALCULATIONS:');
const appResult = calculateBorrowingPower(testCase);

console.log('App primaryNetIncome: $' + appResult.primaryNetIncome.toLocaleString());
console.log('App secondaryNetIncome: $' + appResult.secondaryNetIncome.toLocaleString());
console.log('App netIncome (combined): $' + appResult.netIncome.toLocaleString());
console.log('App surplus: $' + Math.round(appResult.surplus).toLocaleString());
console.log('App maxLoan: $' + appResult.maxLoan.toLocaleString());

console.log('\n✅ VALIDATION RESULTS:');

const validations = [
  {
    name: 'Primary Net Income',
    manual: primaryNetFinal,
    app: appResult.primaryNetIncome,
    tolerance: 1
  },
  {
    name: 'Secondary Net Income', 
    manual: secondaryNetFinal,
    app: appResult.secondaryNetIncome,
    tolerance: 1
  },
  {
    name: 'Combined Net Income',
    manual: combinedNetFinal,
    app: appResult.netIncome,
    tolerance: 1
  },
  {
    name: 'Monthly Surplus',
    manual: Math.round(monthlySurplus),
    app: Math.round(appResult.surplus),
    tolerance: 5
  },
  {
    name: 'Borrowing Capacity',
    manual: Math.round(manualBorrowingCapacity),
    app: appResult.maxLoan,
    tolerance: 100
  }
];

let allValid = true;
validations.forEach(test => {
  const difference = Math.abs(test.manual - test.app);
  const isValid = difference <= test.tolerance;
  if (!isValid) allValid = false;
  
  console.log(`${isValid ? '✅' : '❌'} ${test.name}:`);
  console.log(`   Manual: $${test.manual.toLocaleString()}`);
  console.log(`   App: $${test.app.toLocaleString()}`);
  console.log(`   Difference: $${difference.toLocaleString()} (tolerance: ±$${test.tolerance})`);
});

console.log('\n🎯 FINAL ASSESSMENT:');
console.log(allValid ? '✅ ALL VALIDATIONS PASSED' : '❌ SOME VALIDATIONS FAILED');
console.log(allValid ? 'Manual and app calculations are perfectly aligned!' : 'There are discrepancies that need investigation.');

console.log('\n📊 SUMMARY COMPARISON:');
console.log('                     MANUAL      APP         DIFF');
console.log('Primary Net:      $' + primaryNetFinal.toLocaleString().padEnd(9) + ' $' + appResult.primaryNetIncome.toLocaleString().padEnd(9) + ' $' + Math.abs(primaryNetFinal - appResult.primaryNetIncome).toLocaleString());
console.log('Secondary Net:    $' + secondaryNetFinal.toLocaleString().padEnd(9) + ' $' + appResult.secondaryNetIncome.toLocaleString().padEnd(9) + ' $' + Math.abs(secondaryNetFinal - appResult.secondaryNetIncome).toLocaleString());
console.log('Combined Net:     $' + combinedNetFinal.toLocaleString().padEnd(9) + ' $' + appResult.netIncome.toLocaleString().padEnd(9) + ' $' + Math.abs(combinedNetFinal - appResult.netIncome).toLocaleString());
console.log('Monthly Surplus:  $' + Math.round(monthlySurplus).toLocaleString().padEnd(9) + ' $' + Math.round(appResult.surplus).toLocaleString().padEnd(9) + ' $' + Math.abs(Math.round(monthlySurplus) - Math.round(appResult.surplus)).toLocaleString());
console.log('Borrowing Cap:    $' + Math.round(manualBorrowingCapacity).toLocaleString().padEnd(9) + ' $' + appResult.maxLoan.toLocaleString().padEnd(9) + ' $' + Math.abs(Math.round(manualBorrowingCapacity) - appResult.maxLoan).toLocaleString());