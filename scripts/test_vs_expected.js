#!/usr/bin/env node

// Test our results vs expected ranges (ignore QED)
import { 
  calculateBorrowingPower, 
  calculateHECSRepayment, 
  calculateAustralianNetIncome 
} from '../src/utils/financialCalculations.js';

console.log('🎯 New Results vs Expected Ranges');
console.log('=' * 50);

// Test your HECS calculation example first
console.log('\n💰 HECS Calculation Verification');
console.log('Your example: $150k income should have $12,950 HECS repayment');
const testHECS = calculateHECSRepayment(150000);
console.log(`Our calculation: $${testHECS.toLocaleString()}`);
console.log(`Expected: $12,950`);
console.log(`Match: ${testHECS === 12950 ? '✅ PERFECT' : '❌ MISMATCH'}`);

// Test net income calculation too
console.log('\nNet Income Calculation Test:');
const netIncomeCalc = calculateAustralianNetIncome(150000);
console.log(`Gross: $${netIncomeCalc.grossIncome.toLocaleString()}`);
console.log(`Income Tax: $${netIncomeCalc.incomeTax.toLocaleString()}`);
console.log(`Medicare Levy: $${netIncomeCalc.medicareLevy.toLocaleString()}`);
console.log(`Total Tax: $${netIncomeCalc.totalTax.toLocaleString()}`);
console.log(`Net Income: $${netIncomeCalc.netIncome.toLocaleString()}`);
console.log(`Expected Net (with HECS): $97,212`);

// Now test all scenarios vs expected ranges
console.log('\n📊 Scenario Results vs Expected Ranges');
console.log('-' * 60);

const scenarios = [
  {
    name: 'Scenario 1: Single, Low Income, Owner-Occupied',
    expected: { min: 350000, max: 400000 },
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

console.log('Scenario                          | Our Result    | Expected Range        | Variance      | Status');
console.log('----------------------------------|---------------|----------------------|---------------|--------');

let totalScenarios = 0;
let withinRange = 0;

for (const scenario of scenarios) {
  try {
    const result = calculateBorrowingPower(scenario.params);
    const ourResult = result.maxLoan;
    const minExpected = scenario.expected.min;
    const maxExpected = scenario.expected.max;
    const midpoint = (minExpected + maxExpected) / 2;
    
    // Calculate variance from midpoint
    const variance = ((ourResult - midpoint) / midpoint * 100);
    
    // Determine status
    let status;
    if (ourResult >= minExpected && ourResult <= maxExpected) {
      status = '✅ IN RANGE';
      withinRange++;
    } else if (ourResult < minExpected) {
      const belowBy = ((minExpected - ourResult) / minExpected * 100);
      status = belowBy < 20 ? '⚠️ BELOW' : '🚨 LOW';
    } else {
      const aboveBy = ((ourResult - maxExpected) / maxExpected * 100);
      status = aboveBy < 20 ? '⚠️ ABOVE' : '🚨 HIGH';
    }
    
    totalScenarios++;
    
    console.log(
      `${scenario.name.slice(0, 33).padEnd(33)} | ` +
      `$${ourResult.toLocaleString().padEnd(12)} | ` +
      `$${minExpected.toLocaleString()}-${maxExpected.toLocaleString().padEnd(9)} | ` +
      `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`.padEnd(13) + ' | ' +
      `${status}`
    );
    
    // Show detailed breakdown for scenarios with issues
    if (status.includes('🚨') || status.includes('⚠️')) {
      console.log(`    → Gross: $${(scenario.params.primaryIncome + scenario.params.secondaryIncome).toLocaleString()}, ` +
                  `Net: $${result.netIncome.toLocaleString()}, ` +
                  `HECS: $${result.hecsImpact.toLocaleString()}/yr, ` +
                  `HEM: $${result.hemBenchmark.toLocaleString()}/mo, ` +
                  `Surplus: $${result.surplus.toLocaleString()}/mo`);
    }
    
  } catch (error) {
    console.log(`${scenario.name.slice(0, 33).padEnd(33)} | ERROR: ${error.message}`);
    totalScenarios++;
  }
}

console.log('\n📈 Summary Statistics');
console.log('-' * 25);
console.log(`Total Scenarios: ${totalScenarios}`);
console.log(`Within Expected Range: ${withinRange} (${(withinRange/totalScenarios*100).toFixed(1)}%)`);
console.log(`Outside Range: ${totalScenarios - withinRange} (${((totalScenarios - withinRange)/totalScenarios*100).toFixed(1)}%)`);

if (withinRange / totalScenarios >= 0.7) {
  console.log('🎉 GOOD: Majority of scenarios within expected professional ranges!');
} else if (withinRange / totalScenarios >= 0.5) {
  console.log('⚠️ FAIR: About half of scenarios need adjustment');
} else {
  console.log('🚨 POOR: Major adjustments needed for professional accuracy');
}

console.log('\n🎯 Next Steps:');
if (withinRange < totalScenarios) {
  console.log('• Review scenarios outside expected ranges');
  console.log('• Consider adjusting HEM benchmarks or stress test buffers');
  console.log('• Validate HECS calculation method (gross income deduction)');
}