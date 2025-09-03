#!/usr/bin/env node

// Debug HEM calculation discrepancy: $2,850 vs expected $2,050
import { 
  calculateBorrowingPower, 
  calculateHEMExpenses,
  calculateAustralianNetIncome
} from '../src/utils/financialCalculations.js';

console.log('🔍 DEBUG: HEM Calculation Discrepancy');
console.log('=' * 50);
console.log('Issue: UI shows $2,850 HEM, script calculates $2,050');
console.log('Test Case: $80,000 single, no dependents, no HECS');

const testIncome = 80000;
const scenario = 'single';
const dependents = 0;

console.log('\n📊 STEP-BY-STEP HEM DEBUG:');

// Step 1: Calculate net income (this affects HEM calculation)
console.log('\n1️⃣ Net Income Calculation');
console.log('-'.repeat(30));
const taxCalc = calculateAustralianNetIncome(testIncome);
console.log(`Gross Income: $${testIncome.toLocaleString()}`);
console.log(`Net Income: $${taxCalc.netIncome.toLocaleString()}`);

// Step 2: Test HEM with different income inputs
console.log('\n2️⃣ HEM Calculation Tests');
console.log('-'.repeat(30));

console.log('Testing HEM with different income values:');

// Test with gross income
const hemWithGross = calculateHEMExpenses(scenario, testIncome, dependents);
console.log(`HEM with GROSS income ($${testIncome.toLocaleString()}): $${hemWithGross.toLocaleString()}/month`);

// Test with net income
const hemWithNet = calculateHEMExpenses(scenario, taxCalc.netIncome, dependents);
console.log(`HEM with NET income ($${taxCalc.netIncome.toLocaleString()}): $${hemWithNet.toLocaleString()}/month`);

// Step 3: Check HEM base data and calculation logic
console.log('\n3️⃣ HEM Calculation Logic');
console.log('-'.repeat(30));

// Manual HEM calculation
const HEM_BASE_SINGLE = 24600; // Annual base for single
const HEM_INCOME_ADJUSTMENT = 0.12; // 12% adjustment for higher income
const HEM_THRESHOLD = 70000; // Income threshold for adjustment

console.log(`HEM Base (single): $${HEM_BASE_SINGLE.toLocaleString()}/year = $${Math.round(HEM_BASE_SINGLE/12).toLocaleString()}/month`);
console.log(`Income threshold for adjustment: $${HEM_THRESHOLD.toLocaleString()}`);
console.log(`Adjustment rate: ${(HEM_INCOME_ADJUSTMENT * 100).toFixed(1)}%`);

// Test with both gross and net income
function calculateHEMManually(income, scenario, dependents) {
  const baseData = { single: { base: 24600, income_adjustment: 0.12 } };
  let annualExpenses = baseData[scenario].base;
  
  if (income > 70000) {
    const excessIncome = income - 70000;
    const adjustment = excessIncome * baseData[scenario].income_adjustment;
    annualExpenses += adjustment;
    console.log(`  Income above $70k: $${excessIncome.toLocaleString()}`);
    console.log(`  Adjustment: $${Math.round(adjustment).toLocaleString()}/year`);
  }
  
  return Math.round(annualExpenses / 12);
}

console.log('\nManual HEM with GROSS income:');
const manualHEMGross = calculateHEMManually(testIncome, scenario, dependents);
console.log(`  Result: $${manualHEMGross.toLocaleString()}/month`);

console.log('\nManual HEM with NET income:');
const manualHEMNet = calculateHEMManually(taxCalc.netIncome, scenario, dependents);
console.log(`  Result: $${manualHEMNet.toLocaleString()}/month`);

// Step 4: Test the full borrowing power calculation
console.log('\n4️⃣ Full Borrowing Power Test');
console.log('-'.repeat(30));

const fullCalc = calculateBorrowingPower({
  primaryIncome: testIncome,
  secondaryIncome: 0,
  dependents: 0,
  hasHECS: false,
  hecsBalance: 0,
  scenario: 'single',
  existingDebts: 0,
  livingExpenses: 2200, // This will be compared with HEM
  interestRate: 0.055,
  monthlyLiabilities: 0
});

console.log(`Borrowing Power Result: $${fullCalc.maxLoan.toLocaleString()}`);
console.log(`HEM Benchmark used: $${fullCalc.hemBenchmark.toLocaleString()}/month`);
console.log(`Assessed Expenses: $${fullCalc.assessedExpenses.toLocaleString()}/month`);
console.log(`Net Income: $${fullCalc.netIncome.toLocaleString()}/year`);
console.log(`Surplus: $${fullCalc.surplus.toLocaleString()}/month`);

// Step 5: Check if there's a different HEM calculation in the UI component
console.log('\n5️⃣ Potential Issues');
console.log('-'.repeat(30));

console.log('Possible causes for $2,850 vs $2,050 discrepancy:');
console.log('1. UI using gross income instead of net income for HEM');
console.log('2. Different HEM base values in UI vs calculation function');
console.log('3. UI applying different income adjustment logic');
console.log('4. Caching issue in UI not reflecting updated calculations');

console.log('\n✅ Expected HEM for $80k single:');
console.log(`- With NET income ($${taxCalc.netIncome.toLocaleString()}): $${hemWithNet.toLocaleString()}/month`);
console.log(`- With GROSS income ($${testIncome.toLocaleString()}): $${hemWithGross.toLocaleString()}/month`);

if (Math.abs(hemWithGross - 2850) < 50) {
  console.log('🎯 LIKELY ISSUE: UI is using GROSS income for HEM calculation!');
  console.log('   This would explain the $2,850 vs $2,050 discrepancy.');
} else {
  console.log('🤔 Need to investigate further - neither gross nor net gives $2,850');
}

// Test with specific income that might give $2,850
console.log('\n6️⃣ Reverse Engineering');
console.log('-'.repeat(30));
console.log('What income would give exactly $2,850/month HEM?');

// Base: $2,050/month = $24,600/year
// If HEM = $2,850/month = $34,200/year
// Extra: $34,200 - $24,600 = $9,600/year
// At 12% adjustment: $9,600 / 0.12 = $80,000 above $70k threshold
// So total income needed: $70,000 + $80,000 = $150,000

const targetHEM = 2850;
const targetAnnualHEM = targetHEM * 12; // $34,200
const baseAnnual = 24600;
const extraNeeded = targetAnnualHEM - baseAnnual; // $9,600
const incomeAboveThreshold = extraNeeded / 0.12; // $80,000
const totalIncomeNeeded = 70000 + incomeAboveThreshold; // $150,000

console.log(`To get $${targetHEM}/month HEM:`);
console.log(`- Base: $${baseAnnual.toLocaleString()}/year`);
console.log(`- Extra needed: $${extraNeeded.toLocaleString()}/year`);
console.log(`- Income above $70k: $${incomeAboveThreshold.toLocaleString()}`);
console.log(`- Total income needed: $${totalIncomeNeeded.toLocaleString()}`);

const testHEMAt150k = calculateHEMExpenses('single', 150000, 0);
console.log(`Actual HEM at $150k: $${testHEMAt150k.toLocaleString()}/month`);

console.log('\n🎯 CONCLUSION:');
if (Math.abs(testHEMAt150k - 2850) < 10) {
  console.log('✅ UI might be using $150k income (or similar) for HEM calculation');
} else {
  console.log('🤔 The $2,850 HEM value needs further investigation');
}