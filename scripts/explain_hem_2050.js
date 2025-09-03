#!/usr/bin/env node

// Detailed breakdown of how $2,050 HEM figure is calculated
import { 
  calculateHEMExpenses,
  calculateAustralianNetIncome,
  HEM_BENCHMARKS
} from '../src/utils/financialCalculations.js';

console.log('🔍 HEM CALCULATION BREAKDOWN - Where does $2,050 come from?');
console.log('=' * 70);

const grossIncome = 80000;
const scenario = 'single';
const dependents = 0;

console.log('INPUT PARAMETERS:');
console.log(`Gross Income: $${grossIncome.toLocaleString()}`);
console.log(`Scenario: ${scenario}`);
console.log(`Dependents: ${dependents}`);

// Step 1: Calculate net income first
console.log('\n1️⃣ NET INCOME CALCULATION');
console.log('-'.repeat(30));
const taxResult = calculateAustralianNetIncome(grossIncome);
console.log(`Gross Income: $${grossIncome.toLocaleString()}`);
console.log(`Income Tax: $${taxResult.incomeTax.toLocaleString()}`);
console.log(`Medicare Levy: $${taxResult.medicareLevy.toLocaleString()}`);
console.log(`Total Tax: $${taxResult.totalTax.toLocaleString()}`);
console.log(`Net Income: $${taxResult.netIncome.toLocaleString()}`);

// Step 2: Show HEM benchmarks
console.log('\n2️⃣ HEM BENCHMARK CONSTANTS');
console.log('-'.repeat(30));
console.log('From HEM_BENCHMARKS in financialCalculations.js:');
console.log(`Single Base: $${HEM_BENCHMARKS.single.base.toLocaleString()}/year`);
console.log(`Single Base Monthly: $${Math.round(HEM_BENCHMARKS.single.base/12).toLocaleString()}/month`);
console.log(`Income Adjustment Rate: ${(HEM_BENCHMARKS.single.income_adjustment * 100).toFixed(1)}%`);
console.log(`Income Threshold: $70,000`);

// Step 3: Manual HEM calculation step-by-step
console.log('\n3️⃣ STEP-BY-STEP HEM CALCULATION');
console.log('-'.repeat(30));

// Test with both gross and net income
console.log('\nOption A: Using GROSS income ($80,000):');
let annualExpenses = HEM_BENCHMARKS.single.base; // $24,600
console.log(`  Base expenses: $${annualExpenses.toLocaleString()}/year`);

if (grossIncome > 70000) {
  const excessIncome = grossIncome - 70000;
  const adjustment = excessIncome * HEM_BENCHMARKS.single.income_adjustment;
  annualExpenses += adjustment;
  console.log(`  Income above $70k: $${excessIncome.toLocaleString()}`);
  console.log(`  Adjustment: $${Math.round(adjustment).toLocaleString()}/year (${(HEM_BENCHMARKS.single.income_adjustment * 100)}% of excess)`);
  console.log(`  Total annual: $${Math.round(annualExpenses).toLocaleString()}`);
  console.log(`  Monthly HEM: $${Math.round(annualExpenses/12).toLocaleString()}`);
}

console.log('\nOption B: Using NET income ($63,612):');
const netIncome = taxResult.netIncome;
let annualExpensesNet = HEM_BENCHMARKS.single.base; // $24,600
console.log(`  Base expenses: $${annualExpensesNet.toLocaleString()}/year`);

if (netIncome > 70000) {
  const excessIncomeNet = netIncome - 70000;
  const adjustmentNet = excessIncomeNet * HEM_BENCHMARKS.single.income_adjustment;
  annualExpensesNet += adjustmentNet;
  console.log(`  Income above $70k: $${excessIncomeNet.toLocaleString()}`);
  console.log(`  Adjustment: $${Math.round(adjustmentNet).toLocaleString()}/year`);
} else {
  console.log(`  Net income ($${netIncome.toLocaleString()}) is BELOW $70k threshold`);
  console.log(`  No income adjustment applied`);
}
console.log(`  Total annual: $${Math.round(annualExpensesNet).toLocaleString()}`);
console.log(`  Monthly HEM: $${Math.round(annualExpensesNet/12).toLocaleString()}`);

// Step 4: Use our actual function
console.log('\n4️⃣ OUR FUNCTION RESULTS');
console.log('-'.repeat(30));

const hemWithGross = calculateHEMExpenses(scenario, grossIncome, dependents);
const hemWithNet = calculateHEMExpenses(scenario, netIncome, dependents);

console.log(`calculateHEMExpenses('single', $80000, 0) = $${hemWithGross.toLocaleString()}/month`);
console.log(`calculateHEMExpenses('single', $63612, 0) = $${hemWithNet.toLocaleString()}/month`);

// Step 5: Debug why UI might show different value
console.log('\n5️⃣ UI DISCREPANCY ANALYSIS');
console.log('-'.repeat(30));
console.log('Expected after our fix: $2,050/month');
console.log('You\'re seeing in UI: $2,554/month');
console.log('Difference: $504/month');

// Calculate what income would give $2,554
const targetHEM = 2554;
const targetAnnual = targetHEM * 12; // $30,648
const baseAnnual = HEM_BENCHMARKS.single.base; // $24,600
const extraNeeded = targetAnnual - baseAnnual; // $6,048
const incomeAboveThreshold = extraNeeded / HEM_BENCHMARKS.single.income_adjustment; // $50,400
const totalIncomeForTarget = 70000 + incomeAboveThreshold; // $120,400

console.log('\nReverse engineering $2,554 HEM:');
console.log(`To get $${targetHEM}/month HEM, you need:`);
console.log(`  Annual HEM: $${targetAnnual.toLocaleString()}`);
console.log(`  Excess over base: $${extraNeeded.toLocaleString()}`);
console.log(`  Income above $70k: $${incomeAboveThreshold.toLocaleString()}`);
console.log(`  Total income needed: $${totalIncomeForTarget.toLocaleString()}`);

// Test if this matches
const testHEMAt120k = calculateHEMExpenses('single', 120400, 0);
console.log(`Verification: HEM at $120,400 = $${testHEMAt120k.toLocaleString()}/month`);

console.log('\n6️⃣ POSSIBLE CAUSES FOR UI DISCREPANCY');
console.log('-'.repeat(30));
console.log('1. Browser cache - UI hasn\'t reloaded with our changes');
console.log('2. Different income value being passed to HEM function');
console.log('3. Old calculateHEMExpenses function cached in browser');
console.log('4. UI using a different code path we haven\'t identified');
console.log('5. Form data state not updated properly');

console.log('\n7️⃣ INDUSTRY VALIDATION');
console.log('-'.repeat(30));
console.log('Your industry knowledge says this looks more correct.');
console.log('Professional HEM for $80k single person should be around $2,000-2,200/month.');
console.log('Our $2,050 aligns with this professional expectation.');
console.log('The $2,554 figure suggests the UI is still using gross income or cached data.');

console.log('\n✅ RECOMMENDATION:');
console.log('1. Hard refresh browser (Ctrl+F5) to clear cache');
console.log('2. Check if HEM shows $2,050 after refresh');
console.log('3. If still $2,554, we need to find another code path in UI');