#!/usr/bin/env node

// Final results summary with before/after comparison
import { calculateBorrowingPower } from '../src/utils/financialCalculations.js';

console.log('🎉 FINAL RESULTS SUMMARY');
console.log('=' * 60);

const scenarios = [
  {
    name: 'Scenario 1: Single, Low Income, Owner-Occupied',
    expected: { min: 350000, max: 400000 },
    oldResult: 312530,
    params: {
      primaryIncome: 65000,
      secondaryIncome: 0,
      dependents: 0,
      hasHECS: false,
      hecsBalance: 0,
      scenario: 'single',
      existingDebts: 0,
      livingExpenses: 2000,
      interestRate: 0.055
    }
  },
  {
    name: 'Scenario 2: Single, Medium Income, Investment',
    expected: { min: 600000, max: 700000 },
    oldResult: 502553,
    params: {
      primaryIncome: 95000,
      secondaryIncome: 0,
      dependents: 0,
      hasHECS: true,
      hecsBalance: 25000,
      scenario: 'single',
      existingDebts: 0,
      livingExpenses: 2000,
      interestRate: 0.058
    }
  },
  {
    name: 'Scenario 3: Couple, High Income, Owner-Occupied',
    expected: { min: 900000, max: 1000000 },
    oldResult: 237413, // This was the worst case!
    params: {
      primaryIncome: 120000,
      secondaryIncome: 85000,
      dependents: 2,
      hasHECS: true,
      hecsBalance: 55000,
      scenario: 'couple',
      existingDebts: 0,
      livingExpenses: 3000,
      interestRate: 0.055
    }
  },
  {
    name: 'Scenario 4: Couple, High Income, Investment',
    expected: { min: 1200000, max: 1500000 },
    oldResult: 1060237,
    params: {
      primaryIncome: 140000,
      secondaryIncome: 75000,
      dependents: 0,
      hasHECS: false,
      hecsBalance: 0,
      scenario: 'couple',
      existingDebts: 0,
      livingExpenses: 3000,
      interestRate: 0.058
    }
  },
  {
    name: 'Scenario 5: Single, Very High Income, Investment',
    expected: { min: 1500000, max: 2000000 },
    oldResult: 660016,
    params: {
      primaryIncome: 180000,
      secondaryIncome: 0,
      dependents: 1,
      hasHECS: true,
      hecsBalance: 45000,
      scenario: 'single',
      existingDebts: 0,
      livingExpenses: 2000,
      interestRate: 0.058
    }
  },
  {
    name: 'Scenario 6: Young Couple, Entry Level',
    expected: { min: 650000, max: 750000 },
    oldResult: 425720,
    params: {
      primaryIncome: 75000,
      secondaryIncome: 60000,
      dependents: 0,
      hasHECS: true,
      hecsBalance: 33000,
      scenario: 'couple',
      existingDebts: 0,
      livingExpenses: 3000,
      interestRate: 0.055
    }
  }
];

console.log('📊 Before vs After Comparison');
console.log('Scenario                          | Before      | After       | Improvement | Expected Range    | Status');
console.log('----------------------------------|-------------|-------------|-------------|-------------------|--------');

let improvedCount = 0;
let inRangeCount = 0;
const totalScenarios = scenarios.length;

for (const scenario of scenarios) {
  try {
    const result = calculateBorrowingPower(scenario.params);
    const newResult = result.maxLoan;
    const oldResult = scenario.oldResult;
    const improvement = newResult - oldResult;
    const improvementPct = ((improvement / oldResult) * 100);
    
    const minExpected = scenario.expected.min;
    const maxExpected = scenario.expected.max;
    const midpoint = (minExpected + maxExpected) / 2;
    
    // Status determination
    let status;
    if (newResult >= minExpected && newResult <= maxExpected) {
      status = '✅ IN RANGE';
      inRangeCount++;
    } else if (newResult < minExpected) {
      const belowBy = ((minExpected - newResult) / minExpected * 100);
      status = belowBy < 15 ? '⚠️ CLOSE' : '🚨 LOW';
    } else {
      status = '⚠️ HIGH';
    }
    
    if (improvement > 0) improvedCount++;
    
    console.log(
      `${scenario.name.slice(0, 33).padEnd(33)} | ` +
      `$${oldResult.toLocaleString().padEnd(10)} | ` +
      `$${newResult.toLocaleString().padEnd(10)} | ` +
      `${improvement > 0 ? '+' : ''}$${improvement.toLocaleString().padEnd(9)} | ` +
      `$${minExpected.toLocaleString()}-${maxExpected.toLocaleString().padEnd(7)} | ` +
      `${status}`
    );
    
  } catch (error) {
    console.log(`${scenario.name.slice(0, 33).padEnd(33)} | ERROR: ${error.message}`);
  }
}

console.log('\n📈 Summary Statistics');
console.log('-' * 40);
console.log(`Total Scenarios: ${totalScenarios}`);
console.log(`Improved Results: ${improvedCount}/${totalScenarios} (${(improvedCount/totalScenarios*100).toFixed(1)}%)`);
console.log(`Within Expected Range: ${inRangeCount}/${totalScenarios} (${(inRangeCount/totalScenarios*100).toFixed(1)}%)`);

console.log('\n🔧 Key Technical Fixes Applied:');
console.log('✅ HECS Calculation: Updated to 2025-26 marginal system ($67k threshold, 15.6% effective rate)');
console.log('✅ HECS Deduction: Now properly deducted from gross income (like tax)');
console.log('✅ HEM Dependents: Reduced from $1,250/month to $400/month per child');
console.log('✅ Calculation Method: HECS calculated on gross, deducted from net income');

console.log('\n💡 Professional Accuracy Assessment:');
if (inRangeCount / totalScenarios >= 0.7) {
  console.log('🎉 EXCELLENT: Calculator now meets professional lending standards!');
} else if (inRangeCount / totalScenarios >= 0.5) {
  console.log('⚠️ GOOD: Significant improvements, minor adjustments may be needed');
} else {
  console.log('🚨 NEEDS WORK: Additional adjustments required for professional use');
}

// Show biggest improvements
console.log('\n🚀 Biggest Improvements:');
const sortedByImprovement = scenarios.map(s => {
  const result = calculateBorrowingPower(s.params);
  return {
    name: s.name,
    improvement: result.maxLoan - s.oldResult,
    improvementPct: ((result.maxLoan - s.oldResult) / s.oldResult * 100)
  };
}).sort((a, b) => b.improvement - a.improvement);

for (let i = 0; i < Math.min(3, sortedByImprovement.length); i++) {
  const item = sortedByImprovement[i];
  console.log(`${i + 1}. ${item.name}: +$${item.improvement.toLocaleString()} (+${item.improvementPct.toFixed(1)}%)`);
}