#!/usr/bin/env node

// Test HECS calculation for couple scenario
import { 
  calculateHECSRepayment
} from '../src/utils/financialCalculations.js';

console.log('🔍 TESTING HECS FOR COUPLE SCENARIO');
console.log('=' * 50);

const primary = 80000;
const secondary = 50000;
const combined = primary + secondary;

console.log('Primary Income: $' + primary.toLocaleString());
console.log('Secondary Income: $' + secondary.toLocaleString());
console.log('Combined Income: $' + combined.toLocaleString());

console.log('\n📊 HECS CALCULATIONS:');
console.log('HECS Threshold 2025-26: $67,000');

// Test individual incomes
const primaryHECS = calculateHECSRepayment(primary);
const secondaryHECS = calculateHECSRepayment(secondary);
const combinedHECS = calculateHECSRepayment(combined);

console.log('\nIndividual HECS:');
console.log('Primary ($80k): $' + primaryHECS.toLocaleString());
console.log('Secondary ($50k): $' + secondaryHECS.toLocaleString());
console.log('Total if calculated individually: $' + (primaryHECS + secondaryHECS).toLocaleString());

console.log('\nCombined HECS:');
console.log('Combined ($130k): $' + combinedHECS.toLocaleString());

console.log('\n✅ CORRECT APPROACH:');
console.log('HECS is calculated on COMBINED household income for couples');
console.log('So $130k combined = $' + combinedHECS.toLocaleString() + ' total HECS');
console.log('This should be split proportionally:');
console.log('Primary share: $' + Math.round(combinedHECS * (primary/combined)).toLocaleString());
console.log('Secondary share: $' + Math.round(combinedHECS * (secondary/combined)).toLocaleString());

console.log('\n⚠️ IMPORTANT:');
console.log('$50k alone = NO HECS (below $67k threshold)');
console.log('But in couple, they share the combined HECS liability');