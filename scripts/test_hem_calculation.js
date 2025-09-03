#!/usr/bin/env node

// Test exactly what HEM calculation returns for the Test A scenario
import { 
  calculateHEMExpenses,
  calculateAustralianNetIncome
} from '../src/utils/financialCalculations.js';

console.log('🔍 EXACT HEM CALCULATION TEST');
console.log('=' * 40);

// Test A scenario parameters
const grossIncome = 80000;
const scenario = 'single';
const dependents = 0;

console.log(`Input: $${grossIncome} gross income, ${scenario}, ${dependents} dependents`);

// Calculate net income first
const taxCalc = calculateAustralianNetIncome(grossIncome);
console.log(`Net Income: $${taxCalc.netIncome.toLocaleString()}`);

// Calculate HEM with net income
const hemResult = calculateHEMExpenses(scenario, taxCalc.netIncome, dependents);
console.log(`HEM Result: $${hemResult.toLocaleString()}/month`);

// Test what the UI checkbox calculation would produce
console.log('\n🖥️ UI CHECKBOX CALCULATION SIMULATION:');
const primaryNet = grossIncome > 0 ? calculateAustralianNetIncome(grossIncome).netIncome : 0;
const secondaryNet = 0;
const totalNetIncome = primaryNet + secondaryNet;

console.log(`Primary Net: $${primaryNet.toLocaleString()}`);
console.log(`Secondary Net: $${secondaryNet.toLocaleString()}`);
console.log(`Total Net Income: $${totalNetIncome.toLocaleString()}`);

const hemBenchmark = calculateHEMExpenses(scenario, totalNetIncome, dependents);
console.log(`HEM Benchmark from UI logic: $${hemBenchmark.toLocaleString()}/month`);

console.log('\n✅ EXPECTED RESULT: $2,050/month');
console.log(`✅ ACTUAL RESULT: $${hemBenchmark.toLocaleString()}/month`);
console.log(`✅ MATCH: ${hemBenchmark === 2050 ? 'PERFECT' : 'MISMATCH'}`);

if (hemBenchmark !== 2050) {
  console.log('🚨 PROBLEM: HEM calculation not returning expected $2,050');
  console.log('This suggests the issue is in the calculation function, not the UI');
} else {
  console.log('✅ HEM calculation is correct');
  console.log('The issue is likely that the checkbox is not being ticked or there\'s a state issue');
}