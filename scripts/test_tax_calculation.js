#!/usr/bin/env node

// Test the Australian tax calculation specifically
import { 
  calculateAustralianNetIncome
} from '../src/utils/financialCalculations.js';

console.log('🔍 TESTING TAX CALCULATION ACCURACY');
console.log('=' * 50);

const income = 80000;
const result = calculateAustralianNetIncome(income);

console.log('Income: $' + income.toLocaleString());
console.log('Income Tax: $' + result.incomeTax.toLocaleString());
console.log('Medicare Levy: $' + result.medicareLevy.toLocaleString());
console.log('Net Income (after tax): $' + result.netIncome.toLocaleString());

console.log('\n🧮 MANUAL CALCULATION CHECK:');
console.log('Expected tax on $80k: around $14,788');
console.log('Expected medicare: $80,000 * 2% = $1,600');
console.log('Expected net: $80,000 - $14,788 - $1,600 = $63,612');

console.log('\n❓ UI SHOWS:');
console.log('Net: $62,412 (difference of $' + (63612 - 62412) + ')');
console.log('This suggests the UI is doing something else with the net calculation');

// Test secondary income too
const secondary = 50000;
const secondaryResult = calculateAustralianNetIncome(secondary);

console.log('\n📊 SECONDARY INCOME ($50k):');
console.log('Income Tax: $' + secondaryResult.incomeTax.toLocaleString());
console.log('Medicare Levy: $' + secondaryResult.medicareLevy.toLocaleString()); 
console.log('Net Income: $' + secondaryResult.netIncome.toLocaleString());
console.log('Expected: $50,000 - $5,538 - $1,000 = $43,462');
console.log('UI shows: $42,712 (difference of $' + (43462 - 42712) + ')');