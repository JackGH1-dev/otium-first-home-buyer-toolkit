#!/usr/bin/env node

// Test HECS calculation - INDIVIDUAL basis (correct approach)
import { 
  calculateHECSRepayment
} from '../src/utils/financialCalculations.js';

console.log('🔍 TESTING HECS - INDIVIDUAL BASIS (CORRECT)');
console.log('=' * 50);

const primary = 80000;
const secondary = 50000;

console.log('Primary Income: $' + primary.toLocaleString());
console.log('Secondary Income: $' + secondary.toLocaleString());

console.log('\n📊 INDIVIDUAL HECS CALCULATIONS:');
console.log('HECS Threshold 2025-26: $67,000');
console.log('Each person pays HECS based on THEIR OWN income');

// Calculate HECS individually (CORRECT)
const primaryHECS = calculateHECSRepayment(primary);
const secondaryHECS = calculateHECSRepayment(secondary);
const totalHECS = primaryHECS + secondaryHECS;

console.log('\n✅ CORRECT INDIVIDUAL HECS:');
console.log('Primary ($80k): $' + primaryHECS.toLocaleString());
console.log('Secondary ($50k): $' + secondaryHECS.toLocaleString());
console.log('Total HECS: $' + totalHECS.toLocaleString());

console.log('\n🎯 FOR UI DISPLAY:');
console.log('Primary Card should show: -$' + primaryHECS.toLocaleString() + ' HECS');
console.log('Secondary Card should show: NO HECS (below threshold)');

console.log('\n❌ WRONG (what we were doing):');
const combinedHECS = calculateHECSRepayment(primary + secondary);
console.log('Combined income HECS: $' + combinedHECS.toLocaleString());
console.log('This is incorrect - HECS is individual, not household');