#!/usr/bin/env node

// Verify if borrowing capacity calculation is correct
console.log('🔍 VERIFYING BORROWING CAPACITY CALCULATION');
console.log('=' * 50);

const monthlySurplus = 5297;
const assessmentRate = 0.085; // 8.5% (5.5% + 3% buffer)
const termYears = 30;

console.log('Monthly Surplus: $' + monthlySurplus.toLocaleString());
console.log('Assessment Rate: ' + (assessmentRate * 100).toFixed(1) + '% (5.5% + 3% buffer)');
console.log('Term: ' + termYears + ' years');

// Calculate loan capacity using standard P&I formula
const monthlyRate = assessmentRate / 12;
const totalPayments = termYears * 12;

// P&I formula: Loan = Payment × [(1 - (1 + r)^-n) / r]
const loanCapacity = monthlySurplus * ((1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate);

console.log('\n📊 LOAN CAPACITY CALCULATION:');
console.log('Monthly Rate: ' + (monthlyRate * 100).toFixed(4) + '%');
console.log('Total Payments: ' + totalPayments);
console.log('Calculated Loan Capacity: $' + Math.round(loanCapacity).toLocaleString());

console.log('\n✅ VERIFICATION:');
console.log('App shows: $607,524');
console.log('Expected: $' + Math.round(loanCapacity).toLocaleString());
console.log('Match?', Math.abs(loanCapacity - 607524) < 1000 ? '✅ CORRECT' : '❌ INCORRECT');

console.log('\n🧮 REVERSE CHECK:');
const monthlyPayment = 607524 * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
console.log('Monthly payment on $607,524 loan: $' + Math.round(monthlyPayment).toLocaleString());
console.log('Surplus available: $' + monthlySurplus.toLocaleString());
console.log('Utilization: ' + ((monthlyPayment / monthlySurplus) * 100).toFixed(1) + '%');

console.log('\n📋 ASSESSMENT:');
if (Math.abs(loanCapacity - 607524) < 1000) {
  console.log('✅ Borrowing capacity calculation is CORRECT');
} else {
  console.log('❌ Borrowing capacity calculation may have an issue');
  console.log('Difference: $' + Math.abs(loanCapacity - 607524).toLocaleString());
}