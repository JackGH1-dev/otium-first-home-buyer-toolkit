#!/usr/bin/env node

// Test our HECS and HEM fixes against the problematic scenarios
import { 
  calculateBorrowingPower, 
  calculateHECSRepayment, 
  calculateHEMExpenses 
} from '../src/utils/financialCalculations.js';

console.log('🧪 Testing HECS and HEM Fixes');
console.log('=' * 60);

// Test HECS calculation improvements
console.log('\n📊 HECS Calculation Test');
console.log('-' * 30);

const testIncomes = [65000, 95000, 120000, 140000, 180000];
console.log('Income    | Old System* | New System | Reduction');
console.log('----------|-------------|------------|----------');

for (const income of testIncomes) {
  const newHECS = calculateHECSRepayment(income);
  
  // Estimate what old system would have calculated (for comparison)
  let oldHECS = 0;
  if (income > 51549) oldHECS = income * 0.04; // Rough estimate of old rates
  
  const reduction = oldHECS - newHECS;
  console.log(`$${income.toLocaleString().padEnd(8)} | $${oldHECS.toLocaleString().padEnd(10)} | $${newHECS.toLocaleString().padEnd(9)} | -$${reduction.toLocaleString()}`);
}
console.log('*Old system estimate for comparison');

// Test HEM dependent calculation improvements
console.log('\n🏠 HEM Dependent Calculation Test');
console.log('-' * 35);

console.log('Dependents | Old Monthly* | New Monthly | Reduction');
console.log('-----------|--------------|-------------|----------');

for (let deps = 0; deps <= 3; deps++) {
  const oldMonthlyPerChild = 1250; // $15,000/year = $1,250/month
  const newHEMExpenses = calculateHEMExpenses('couple', 100000, deps);
  const baseHEM = calculateHEMExpenses('couple', 100000, 0);
  const newMonthlyPerChild = deps > 0 ? (newHEMExpenses - baseHEM) / deps : 0;
  
  const oldTotal = deps * oldMonthlyPerChild;
  const newTotal = deps * newMonthlyPerChild;
  const reduction = oldTotal - newTotal;
  
  console.log(`${deps.toString().padEnd(10)} | $${oldTotal.toLocaleString().padEnd(11)} | $${newTotal.toLocaleString().padEnd(10)} | -$${reduction.toLocaleString()}`);
}
console.log('*Previous dependent cost ($15k/year per child)');

// Test critical scenarios
console.log('\n🎯 Critical Scenario Testing');
console.log('-' * 30);

const scenarios = [
  {
    name: 'Scenario 1: Single, Low Income, Owner-Occupied',
    params: {
      primaryIncome: 65000,
      secondaryIncome: 0,
      dependents: 0,
      hasHECS: false,
      hecsBalance: 0,
      scenario: 'single',
      existingDebts: 0,
      livingExpenses: 2000, // Monthly - will be overridden by HEM if lower
      interestRate: 0.055
    }
  },
  {
    name: 'Scenario 3: Couple, High Income, Owner-Occupied',
    params: {
      primaryIncome: 120000,
      secondaryIncome: 85000,
      dependents: 2,
      hasHECS: true,
      hecsBalance: 55000, // Combined $35k + $20k
      scenario: 'couple',
      existingDebts: 0,
      livingExpenses: 3000, // Monthly - will be overridden by HEM if lower
      interestRate: 0.055
    }
  },
  {
    name: 'Scenario 6: Young Couple, Entry Level',
    params: {
      primaryIncome: 75000,
      secondaryIncome: 60000,
      dependents: 0,
      hasHECS: true,
      hecsBalance: 33000, // Combined $15k + $18k
      scenario: 'couple',
      existingDebts: 0,
      livingExpenses: 3000, // Monthly - will be overridden by HEM if lower
      interestRate: 0.055
    }
  }
];

console.log('Scenario                          | New Borrowing Power | Expected QED  | Status');
console.log('----------------------------------|--------------------|--------------|---------');

for (const scenario of scenarios) {
  try {
    const result = calculateBorrowingPower(scenario.params);
    const qedExpected = scenario.name.includes('Single') ? 465000 : 750000;
    const variance = ((result.maxLoan - qedExpected) / qedExpected * 100).toFixed(1);
    const status = Math.abs(variance) < 10 ? '✅ GOOD' : Math.abs(variance) < 30 ? '⚠️ FAIR' : '🚨 POOR';
    
    console.log(`${scenario.name.slice(0, 33).padEnd(33)} | $${result.maxLoan.toLocaleString().padEnd(17)} | $${qedExpected.toLocaleString().padEnd(11)} | ${status}`);
    
    // Show detailed breakdown for Scenario 3 (worst case)
    if (scenario.name.includes('Scenario 3')) {
      console.log(`\n📋 Scenario 3 Detailed Breakdown:`);
      console.log(`   Gross Income: $${(scenario.params.primaryIncome + scenario.params.secondaryIncome).toLocaleString()}`);
      console.log(`   Net Income: $${result.netIncome.toLocaleString()}`);
      console.log(`   HECS Impact: $${result.hecsImpact.toLocaleString()}/year`);
      console.log(`   HEM Expenses: $${result.hemBenchmark.toLocaleString()}/month`);
      console.log(`   Surplus: $${result.surplus.toLocaleString()}/month`);
      console.log(`   DTI Ratio: ${result.dti}:1`);
    }
  } catch (error) {
    console.log(`${scenario.name.slice(0, 33).padEnd(33)} | ERROR: ${error.message}`);
  }
}

console.log('\n✅ Testing Complete!');
console.log('\nKey Improvements Expected:');
console.log('• HECS: Reduced from complex brackets to simple 15% above $67k');
console.log('• Dependents: Reduced from $1,250/month to $400/month per child');
console.log('• Scenario 3 should show major improvement due to both fixes');