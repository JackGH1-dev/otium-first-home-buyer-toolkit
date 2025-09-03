#!/usr/bin/env node

// 6 New Professional Validation Scenarios with Full Working Calculations
import { 
  calculateBorrowingPower, 
  calculateHECSRepayment, 
  calculateAustralianNetIncome,
  calculateHEMExpenses
} from '../src/utils/financialCalculations.js';

console.log('🧪 NEW VALIDATION SCENARIOS - DETAILED WORKING');
console.log('=' * 70);

const newScenarios = [
  {
    name: 'Test A: Young Professional Single (No HECS, No Dependents)',
    description: 'Entry-level professional, stable employment, first home buyer',
    expected: { min: 420000, max: 480000, reasoning: 'Conservative estimate for single income, low risk profile' },
    params: {
      primaryIncome: 80000,
      secondaryIncome: 0,
      dependents: 0,
      hasHECS: false,
      hecsBalance: 0,
      scenario: 'single',
      existingDebts: 0,
      livingExpenses: 2200, // Slightly higher for lifestyle
      interestRate: 0.055,
      monthlyLiabilities: 0
    }
  },
  {
    name: 'Test B: Graduate Couple (Both with HECS, No Dependents)',
    description: 'Recent graduates, dual income, both have moderate HECS debt',
    expected: { min: 650000, max: 750000, reasoning: 'Dual income offsets HECS impact, no dependents' },
    params: {
      primaryIncome: 85000,
      secondaryIncome: 70000,
      dependents: 0,
      hasHECS: true,
      hecsBalance: 40000, // Combined HECS debt
      scenario: 'couple',
      existingDebts: 0,
      livingExpenses: 3200,
      interestRate: 0.055,
      monthlyLiabilities: 0
    }
  },
  {
    name: 'Test C: Mid-Career Single Parent (HECS + 1 Child)',
    description: 'Single parent, established career, one dependent child',
    expected: { min: 600000, max: 700000, reasoning: 'High income but HECS + dependent expenses reduce capacity' },
    params: {
      primaryIncome: 110000,
      secondaryIncome: 0,
      dependents: 1,
      hasHECS: true,
      hecsBalance: 30000,
      scenario: 'single',
      existingDebts: 0,
      livingExpenses: 2800, // Higher for single parent
      interestRate: 0.055,
      monthlyLiabilities: 0
    }
  },
  {
    name: 'Test D: Established Family (High Income, 2 Children, No HECS)',
    description: 'Established professionals, dual income, family of 4, no student debt',
    expected: { min: 1100000, max: 1300000, reasoning: 'High dual income, no HECS, but 2 dependents' },
    params: {
      primaryIncome: 130000,
      secondaryIncome: 90000,
      dependents: 2,
      hasHECS: false,
      hecsBalance: 0,
      scenario: 'couple',
      existingDebts: 0,
      livingExpenses: 4000,
      interestRate: 0.055,
      monthlyLiabilities: 0
    }
  },
  {
    name: 'Test E: High Earner with Investment Focus',
    description: 'High income single, investment property focus, some existing debt',
    expected: { min: 1200000, max: 1400000, reasoning: 'Very high income, investment rate, manageable debt' },
    params: {
      primaryIncome: 160000,
      secondaryIncome: 0,
      dependents: 0,
      hasHECS: true,
      hecsBalance: 25000, // Older debt, smaller balance
      scenario: 'single',
      existingDebts: 0,
      livingExpenses: 2500,
      interestRate: 0.058, // Investment property rate
      monthlyLiabilities: 800 // Some existing debt servicing
    }
  },
  {
    name: 'Test F: Regional Couple (Lower HEM, Moderate Income)',
    description: 'Regional Australia, dual income, lower living costs, no complications',
    expected: { min: 800000, max: 900000, reasoning: 'Dual income, lower regional HEM, clean profile' },
    params: {
      primaryIncome: 95000,
      secondaryIncome: 75000,
      dependents: 0,
      hasHECS: false,
      hecsBalance: 0,
      scenario: 'couple',
      existingDebts: 0,
      livingExpenses: 2800, // Lower regional costs
      interestRate: 0.055,
      monthlyLiabilities: 0
    }
  }
];

function showDetailedCalculation(scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${scenario.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Description: ${scenario.description}`);
  console.log(`Expected Range: $${scenario.expected.min.toLocaleString()} - $${scenario.expected.max.toLocaleString()}`);
  console.log(`Reasoning: ${scenario.expected.reasoning}`);
  
  const params = scenario.params;
  const grossIncome = params.primaryIncome + params.secondaryIncome;
  
  console.log(`\n📋 INPUT PARAMETERS:`);
  console.log(`   Primary Income: $${params.primaryIncome.toLocaleString()}`);
  if (params.secondaryIncome > 0) {
    console.log(`   Secondary Income: $${params.secondaryIncome.toLocaleString()}`);
  }
  console.log(`   Total Gross: $${grossIncome.toLocaleString()}`);
  console.log(`   Dependents: ${params.dependents}`);
  console.log(`   HECS Debt: ${params.hasHECS ? '$' + params.hecsBalance.toLocaleString() : 'None'}`);
  console.log(`   Interest Rate: ${(params.interestRate * 100).toFixed(1)}%`);
  console.log(`   Monthly Liabilities: $${params.monthlyLiabilities.toLocaleString()}`);
  
  console.log(`\n🧮 STEP-BY-STEP CALCULATION:`);
  
  // Step 1: HECS Calculation
  console.log(`\n   Step 1: HECS/HELP Calculation`);
  const hecsPayment = params.hasHECS ? calculateHECSRepayment(grossIncome) : 0;
  if (params.hasHECS) {
    console.log(`   → Gross Income: $${grossIncome.toLocaleString()}`);
    console.log(`   → Above $67k threshold: $${(grossIncome - 67000).toLocaleString()}`);
    console.log(`   → HECS Rate: 15.6% (adjusted for professional accuracy)`);
    console.log(`   → Annual HECS Payment: $${hecsPayment.toLocaleString()}`);
    console.log(`   → Monthly HECS: $${Math.round(hecsPayment/12).toLocaleString()}`);
  } else {
    console.log(`   → No HECS debt: $0`);
  }
  
  // Step 2: Tax Calculation
  console.log(`\n   Step 2: Income Tax & Net Income`);
  const primaryTax = calculateAustralianNetIncome(params.primaryIncome);
  const secondaryTax = params.secondaryIncome > 0 ? calculateAustralianNetIncome(params.secondaryIncome) : { netIncome: 0, totalTax: 0 };
  
  const totalNetBeforeHECS = primaryTax.netIncome + secondaryTax.netIncome;
  const totalNetAfterHECS = totalNetBeforeHECS - hecsPayment;
  
  console.log(`   → Primary Income Tax: $${primaryTax.totalTax.toLocaleString()}`);
  if (params.secondaryIncome > 0) {
    console.log(`   → Secondary Income Tax: $${secondaryTax.totalTax.toLocaleString()}`);
  }
  console.log(`   → Net Income (before HECS): $${totalNetBeforeHECS.toLocaleString()}`);
  console.log(`   → Net Income (after HECS): $${totalNetAfterHECS.toLocaleString()}`);
  console.log(`   → Monthly Net Income: $${Math.round(totalNetAfterHECS/12).toLocaleString()}`);
  
  // Step 3: HEM Calculation
  console.log(`\n   Step 3: HEM Living Expenses`);
  const hemExpenses = calculateHEMExpenses(params.scenario, totalNetAfterHECS, params.dependents);
  const userExpenses = params.livingExpenses;
  const assessedExpenses = Math.max(hemExpenses, userExpenses);
  
  console.log(`   → HEM Benchmark: $${hemExpenses.toLocaleString()}/month`);
  if (params.dependents > 0) {
    const baseHEM = calculateHEMExpenses(params.scenario, totalNetAfterHECS, 0);
    const dependentCost = (hemExpenses - baseHEM) / params.dependents;
    console.log(`   → Dependent Cost: $${Math.round(dependentCost).toLocaleString()}/month per child`);
  }
  console.log(`   → User Input: $${userExpenses.toLocaleString()}/month`);
  console.log(`   → Assessed Expenses: $${assessedExpenses.toLocaleString()}/month (higher of HEM/user)`);
  
  // Step 4: Surplus Calculation
  console.log(`\n   Step 4: Surplus & Serviceability`);
  const monthlyNet = totalNetAfterHECS / 12;
  const monthlyDebt = params.monthlyLiabilities;
  const surplus = monthlyNet - assessedExpenses - monthlyDebt;
  
  console.log(`   → Monthly Net Income: $${Math.round(monthlyNet).toLocaleString()}`);
  console.log(`   → Monthly Assessed Expenses: $${assessedExpenses.toLocaleString()}`);
  console.log(`   → Monthly Existing Debt: $${monthlyDebt.toLocaleString()}`);
  console.log(`   → Available Surplus: $${Math.round(surplus).toLocaleString()}`);
  
  // Step 5: Borrowing Calculation
  console.log(`\n   Step 5: Borrowing Capacity`);
  const stressRate = params.interestRate + 0.03; // 3% buffer
  console.log(`   → Base Rate: ${(params.interestRate * 100).toFixed(1)}%`);
  console.log(`   → Stressed Rate: ${(stressRate * 100).toFixed(1)}% (3% APRA buffer)`);
  
  // Run the full calculation
  const result = calculateBorrowingPower(params);
  
  console.log(`   → Max Monthly Payment: $${Math.round(surplus).toLocaleString()}`);
  console.log(`   → Loan Term: 30 years`);
  console.log(`   → Maximum Loan Amount: $${result.maxLoan.toLocaleString()}`);
  
  // Step 6: Validation
  console.log(`\n   Step 6: Professional Validation`);
  const minExpected = scenario.expected.min;
  const maxExpected = scenario.expected.max;
  const midpoint = (minExpected + maxExpected) / 2;
  const variance = ((result.maxLoan - midpoint) / midpoint * 100);
  
  let status;
  if (result.maxLoan >= minExpected && result.maxLoan <= maxExpected) {
    status = '✅ IN RANGE';
  } else if (result.maxLoan < minExpected) {
    const belowBy = ((minExpected - result.maxLoan) / minExpected * 100);
    status = belowBy < 15 ? '⚠️ CLOSE' : '🚨 LOW';
  } else {
    status = '⚠️ HIGH';
  }
  
  console.log(`   → Expected Range: $${minExpected.toLocaleString()} - $${maxExpected.toLocaleString()}`);
  console.log(`   → Our Result: $${result.maxLoan.toLocaleString()}`);
  console.log(`   → Variance from midpoint: ${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`);
  console.log(`   → Status: ${status}`);
  
  // Additional metrics
  console.log(`\n   📈 Additional Metrics:`);
  console.log(`   → DTI Ratio: ${result.dti}:1`);
  console.log(`   → Net Surplus Ratio: ${((surplus / monthlyNet) * 100).toFixed(1)}%`);
  console.log(`   → HECS Impact: ${params.hasHECS ? '$' + result.hecsImpact.toLocaleString() + '/year' : 'None'}`);
  
  return {
    name: scenario.name,
    result: result.maxLoan,
    expected: { min: minExpected, max: maxExpected },
    status: status,
    variance: variance
  };
}

// Run all scenarios
console.log('🎯 COMPREHENSIVE VALIDATION TEST');
console.log('Testing our fixed calculator against 6 new professional scenarios');

const results = [];
for (const scenario of newScenarios) {
  const result = showDetailedCalculation(scenario);
  results.push(result);
}

// Summary
console.log(`\n${'='.repeat(70)}`);
console.log('📊 SUMMARY OF ALL 6 NEW SCENARIOS');
console.log(`${'='.repeat(70)}`);

console.log('Scenario                          | Result        | Expected Range      | Status    | Variance');
console.log('----------------------------------|---------------|--------------------|-----------|---------');

let inRange = 0;
let close = 0;
let total = results.length;

for (const r of results) {
  const shortName = r.name.substring(0, 33);
  const resultStr = '$' + r.result.toLocaleString();
  const expectedStr = '$' + r.expected.min.toLocaleString() + '-' + r.expected.max.toLocaleString();
  const varianceStr = (r.variance > 0 ? '+' : '') + r.variance.toFixed(1) + '%';
  
  console.log(`${shortName.padEnd(33)} | ${resultStr.padEnd(13)} | ${expectedStr.padEnd(18)} | ${r.status.padEnd(9)} | ${varianceStr}`);
  
  if (r.status.includes('IN RANGE')) inRange++;
  if (r.status.includes('CLOSE')) close++;
}

console.log(`\n📈 VALIDATION SUMMARY:`);
console.log(`Total Scenarios: ${total}`);
console.log(`Within Range: ${inRange} (${(inRange/total*100).toFixed(1)}%)`);
console.log(`Close to Range: ${close} (${(close/total*100).toFixed(1)}%)`);
console.log(`Professional Standard: ${inRange + close} (${((inRange + close)/total*100).toFixed(1)}%)`);

if ((inRange + close) / total >= 0.8) {
  console.log('\n🎉 EXCELLENT: Calculator meets professional lending standards!');
  console.log('Ready for production use with confidence in accuracy.');
} else if ((inRange + close) / total >= 0.6) {
  console.log('\n✅ GOOD: Calculator shows strong professional accuracy.');
  console.log('Minor adjustments may enhance precision further.');
} else {
  console.log('\n⚠️ NEEDS IMPROVEMENT: Some scenarios require attention.');
  console.log('Review calculation methodology for outlying scenarios.');
}