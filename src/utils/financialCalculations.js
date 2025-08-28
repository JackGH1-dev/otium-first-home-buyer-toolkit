/**
 * First-Home Buyer Toolkit - Financial Calculation Utilities
 * All calculations follow Australian lending and property market standards
 */

// Mortgage payment calculation (Principal & Interest)
export const calculateMortgagePayment = (principal, annualRate, termYears) => {
  if (!principal || !annualRate || !termYears) return 0
  
  const monthlyRate = annualRate / 12
  const totalMonths = termYears * 12
  
  if (monthlyRate === 0) return principal / totalMonths
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                  (Math.pow(1 + monthlyRate, totalMonths) - 1)
  
  return Math.round(payment * 100) / 100
}

// Enhanced borrowing power calculation with HECS/HELP and scenario support
export const calculateBorrowingPower = (params) => {
  const {
    primaryIncome,
    secondaryIncome = 0,
    existingDebts = 0,
    livingExpenses,
    interestRate,
    stressTestBuffer = 0.03, // 3% buffer
    termYears = 30,
    dependents = 0,
    hasHECS = false,
    hecsBalance = 0,
    scenario = 'single', // 'single', 'couple'
    loanType = 'principal_interest', // 'principal_interest' or 'interest_only'
    repaymentFrequency = 'monthly' // 'monthly', 'fortnightly', 'weekly'
  } = params

  // Calculate net income after tax for both incomes
  const primaryNetIncome = calculateAustralianNetIncome(primaryIncome).netIncome
  const secondaryNetIncome = secondaryIncome > 0 ? calculateAustralianNetIncome(secondaryIncome).netIncome : 0
  const totalNetIncome = primaryNetIncome + secondaryNetIncome
  const monthlyNetIncome = totalNetIncome / 12
  
  // Keep gross income for HECS calculation and display
  const totalGrossIncome = primaryIncome + secondaryIncome

  // Calculate HECS/HELP repayment based on gross income (as per ATO)
  const annualHECSPayment = hasHECS ? calculateHECSRepayment(totalGrossIncome) : 0
  const monthlyHECSPayment = annualHECSPayment / 12

  // Calculate HEM benchmark and assessed expenses
  const hemBenchmark = calculateHEMExpenses(scenario, totalNetIncome, dependents)
  const userMonthlyExpenses = livingExpenses
  // Use HEM benchmark for assessment UNLESS user input is higher
  const assessedExpenses = Math.max(userMonthlyExpenses, hemBenchmark)

  // Monthly liability payments (direct from detailed breakdown)
  const monthlyDebtPayments = params.monthlyLiabilities || 0

  // Stressed interest rate
  const stressedRate = interestRate + stressTestBuffer

  // Calculate serviceable surplus using net income
  const totalMonthlyCommitments = assessedExpenses + monthlyDebtPayments + monthlyHECSPayment
  const surplus = monthlyNetIncome - totalMonthlyCommitments

  if (surplus <= 0) {
    return { 
      maxLoan: 0, 
      surplus: 0, 
      dti: 0,
      assessedExpenses: Math.round(assessedExpenses),
      hemBenchmark: Math.round(hemBenchmark),
      hecsImpact: Math.round(annualHECSPayment),
      stressedRate,
      grossIncome: totalGrossIncome,
      netIncome: totalNetIncome,
      primaryNetIncome,
      secondaryNetIncome
    }
  }

  // Calculate maximum loan amount at stressed rate
  // No additional buffer needed - 3% stress test already provides adequate safety
  const maxMonthlyPayment = surplus // Use full surplus (stress test already applied)
  
  let maxLoan
  let assessmentPayment = maxMonthlyPayment
  
  if (loanType === 'interest_only') {
    // For IO loans: assess based on P&I payment after 5-year IO period
    // But calculate initial loan amount based on IO payment capacity
    const ioLoanAmount = calculateLoanFromInterestOnlyPayment(maxMonthlyPayment, stressedRate)
    const piPaymentAfterIO = calculatePIAfterIO(ioLoanAmount, stressedRate, termYears - 5)
    
    console.log('Interest Only Debug:', {
      maxMonthlyPayment,
      surplus,
      stressedRate: (stressedRate * 100).toFixed(1) + '%',
      termYears,
      ioRemainYears: termYears - 5,
      ioLoanAmount,
      piPaymentAfterIO,
      willReduceLoan: piPaymentAfterIO > surplus
    })
    
    // Assessment uses the higher P&I payment (conservative approach)
    assessmentPayment = piPaymentAfterIO
    
    // If the P&I payment after IO is higher than surplus, reduce loan amount
    if (piPaymentAfterIO > surplus) {
      maxLoan = calculateLoanFromPayment(surplus, stressedRate, termYears - 5)
    } else {
      maxLoan = ioLoanAmount
    }
  } else {
    // Standard P&I loan
    maxLoan = calculateLoanFromPayment(maxMonthlyPayment, stressedRate, termYears)
  }

  // Calculate DTI (Debt to Income ratio) - excludes HECS balance, uses gross income
  const totalDebt = (monthlyDebtPayments * 12) + maxLoan
  const dti = totalDebt / totalGrossIncome

  return {
    maxLoan: Math.round(maxLoan),
    surplus: Math.round(surplus),
    dti: Math.round(dti * 100) / 100,
    assessedExpenses: Math.round(assessedExpenses),
    hemBenchmark: Math.round(hemBenchmark),
    hecsImpact: Math.round(annualHECSPayment),
    stressedRate,
    maxMonthlyPayment: Math.round(maxMonthlyPayment),
    assessmentPayment: Math.round(assessmentPayment),
    scenario,
    loanType,
    repaymentFrequency,
    grossIncome: totalGrossIncome,
    netIncome: totalNetIncome,
    primaryNetIncome: Math.round(primaryNetIncome),
    secondaryNetIncome: Math.round(secondaryNetIncome),
    // Payment frequency breakdown
    paymentBreakdown: {
      monthly: Math.round(maxMonthlyPayment),
      fortnightly: Math.round(calculatePaymentByFrequency(maxMonthlyPayment, 'fortnightly')),
      weekly: Math.round(calculatePaymentByFrequency(maxMonthlyPayment, 'weekly'))
    }
  }
}

// Calculate loan amount from desired payment (Principal & Interest)
export const calculateLoanFromPayment = (monthlyPayment, annualRate, termYears) => {
  const monthlyRate = annualRate / 12
  const totalMonths = termYears * 12
  
  if (monthlyRate === 0) return monthlyPayment * totalMonths
  
  const loan = monthlyPayment * (Math.pow(1 + monthlyRate, totalMonths) - 1) / 
               (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))
  
  return loan
}

// Calculate loan amount from interest-only payment
export const calculateLoanFromInterestOnlyPayment = (monthlyPayment, annualRate) => {
  const monthlyRate = annualRate / 12
  
  if (monthlyRate === 0) return 0
  
  return monthlyPayment / monthlyRate
}

// Calculate monthly payment for different frequencies
export const calculatePaymentByFrequency = (monthlyPayment, frequency) => {
  switch (frequency) {
    case 'weekly':
      return monthlyPayment * 12 / 52
    case 'fortnightly':
      return monthlyPayment * 12 / 26
    case 'monthly':
    default:
      return monthlyPayment
  }
}

// Calculate effective monthly payment from frequency
export const calculateMonthlyFromFrequency = (payment, frequency) => {
  switch (frequency) {
    case 'weekly':
      return payment * 52 / 12
    case 'fortnightly':
      return payment * 26 / 12
    case 'monthly':
    default:
      return payment
  }
}

// Calculate P&I payment after interest-only period
export const calculatePIAfterIO = (loanAmount, annualRate, remainingYears) => {
  const monthlyRate = annualRate / 12
  const totalMonths = remainingYears * 12
  
  if (monthlyRate === 0) return loanAmount / totalMonths
  
  const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
                  (Math.pow(1 + monthlyRate, totalMonths) - 1)
  
  return payment
}

// HECS/HELP repayment thresholds and rates (2025-26 financial year)
export const HECS_HELP_THRESHOLDS = [
  { min: 0, max: 51549, rate: 0 },
  { min: 51550, max: 59517, rate: 0.01 },
  { min: 59518, max: 63089, rate: 0.02 },
  { min: 63090, max: 66875, rate: 0.025 },
  { min: 66876, max: 70888, rate: 0.03 },
  { min: 70889, max: 75140, rate: 0.035 },
  { min: 75141, max: 79649, rate: 0.04 },
  { min: 79650, max: 84429, rate: 0.045 },
  { min: 84430, max: 89494, rate: 0.05 },
  { min: 89495, max: 94865, rate: 0.055 },
  { min: 94866, max: 100557, rate: 0.06 },
  { min: 100558, max: 106590, rate: 0.065 },
  { min: 106591, max: 112985, rate: 0.07 },
  { min: 112986, max: 119764, rate: 0.075 },
  { min: 119765, max: 126950, rate: 0.08 },
  { min: 126951, max: 134568, rate: 0.085 },
  { min: 134569, max: 142642, rate: 0.09 },
  { min: 142643, max: 151200, rate: 0.095 },
  { min: 151201, max: Infinity, rate: 0.1 }
]

// Calculate HECS/HELP annual repayment based on income
export const calculateHECSRepayment = (annualIncome) => {
  for (const threshold of HECS_HELP_THRESHOLDS) {
    if (annualIncome >= threshold.min && annualIncome <= threshold.max) {
      return annualIncome * threshold.rate
    }
  }
  return 0
}

// HEM (Household Expenditure Measure) data based on updated 2024-25 research
export const HEM_BENCHMARKS = {
  single: {
    base: 24600, // Annual base expenses for single person ($2,050/month)
    income_adjustment: 0.12 // Additional 12% for higher income brackets
  },
  couple: {
    base: 36000, // Annual base expenses for couple (proportional adjustment)
    income_adjustment: 0.15 // Additional 15% for higher income brackets
  },
  dependent: {
    cost: 15000, // Additional annual cost per dependent (proportional adjustment)
    age_multiplier: {
      under_5: 0.8,
      age_5_12: 1.0,
      age_13_18: 1.3
    }
  }
}

// Australian Income Tax Calculation (2024-25 Financial Year)
export const calculateAustralianNetIncome = (grossIncome) => {
  // Step 1: Calculate income tax using 2024-25 tax brackets
  let incomeTax = 0;
  
  if (grossIncome > 190000) {
    incomeTax = 51638 + (grossIncome - 190000) * 0.45;
  } else if (grossIncome > 135000) {
    incomeTax = 31288 + (grossIncome - 135000) * 0.37;
  } else if (grossIncome > 45000) {
    incomeTax = 4288 + (grossIncome - 45000) * 0.30;
  } else if (grossIncome > 18200) {
    incomeTax = (grossIncome - 18200) * 0.16;
  } else {
    incomeTax = 0;
  }
  
  // Step 2: Calculate Low Income Tax Offset (LITO)
  let lito = 0;
  if (grossIncome <= 37500) {
    lito = 700;
  } else if (grossIncome <= 45000) {
    lito = 700 - (grossIncome - 37500) * 0.05;
  } else if (grossIncome <= 66667) {
    lito = 325 - (grossIncome - 45000) * 0.015;
  }
  
  // Step 3: Calculate Medicare Levy
  let medicareLevy = 0;
  if (grossIncome > 34027) {
    medicareLevy = grossIncome * 0.02;
  } else if (grossIncome > 27222) {
    medicareLevy = (grossIncome - 27222) * 0.10;
  }
  
  // Step 4: Calculate total tax
  const totalTax = Math.max(0, incomeTax - lito + medicareLevy);
  
  // Step 5: Calculate net income
  const netIncome = grossIncome - totalTax;
  
  return {
    grossIncome,
    incomeTax: Math.max(0, incomeTax - lito),
    medicareLevy,
    lito,
    totalTax,
    netIncome,
    effectiveTaxRate: grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0
  };
}

// Enhanced HEM calculation with scenario-based expenses
export const calculateHEMExpenses = (scenario, totalIncome, dependents = 0) => {
  const baseData = HEM_BENCHMARKS[scenario] || HEM_BENCHMARKS.single
  
  // Base living expenses
  let annualExpenses = baseData.base
  
  // Income adjustment for higher earners
  if (totalIncome > 70000) {
    const excessIncome = totalIncome - 70000
    annualExpenses += excessIncome * baseData.income_adjustment
  }
  
  // Add dependent costs
  if (dependents > 0) {
    annualExpenses += dependents * HEM_BENCHMARKS.dependent.cost
  }
  
  return Math.round(annualExpenses / 12) // Return monthly amount
}

// Benchmark living expenses based on HEM (Household Expenditure Measure)
export const calculateBenchmarkExpenses = (annualIncome, dependents = 0, scenario = 'single') => {
  return calculateHEMExpenses(scenario, annualIncome, dependents)
}

// LVR calculation
export const calculateLVR = (loanAmount, propertyValue) => {
  if (!propertyValue) return 0
  return (loanAmount / propertyValue) * 100
}

// LMI estimation (simplified)
export const calculateLMI = (loanAmount, propertyValue) => {
  const lvr = calculateLVR(loanAmount, propertyValue)
  
  if (lvr <= 80) return 0
  
  // Simplified LMI calculation based on LVR
  const lmiRate = getLMIRate(lvr)
  return Math.round(loanAmount * lmiRate)
}

const getLMIRate = (lvr) => {
  if (lvr <= 80) return 0
  if (lvr <= 85) return 0.0045 // 0.45%
  if (lvr <= 90) return 0.0078 // 0.78%
  if (lvr <= 95) return 0.0155 // 1.55%
  return 0.0310 // 3.10%
}

// Stamp duty calculation (NSW as default, expandable)
export const calculateStampDuty = (propertyValue, state = 'NSW', isFirstHomeBuyer = false) => {
  if (state === 'NSW') {
    return calculateNSWStampDuty(propertyValue, isFirstHomeBuyer)
  }
  // Add other states as needed
  return calculateNSWStampDuty(propertyValue, isFirstHomeBuyer)
}

const calculateNSWStampDuty = (value, isFirstHomeBuyer) => {
  // First Home Buyer exemptions/concessions
  if (isFirstHomeBuyer) {
    if (value <= 650000) return 0 // Full exemption
    if (value <= 800000) {
      // Concession applies
      return Math.max(0, calculateNSWStampDutyStandard(value) - (650000 - value) * 0.045)
    }
  }
  
  return calculateNSWStampDutyStandard(value)
}

const calculateNSWStampDutyStandard = (value) => {
  if (value <= 14000) return value * 0.0125
  if (value <= 32000) return 175 + (value - 14000) * 0.015
  if (value <= 85000) return 445 + (value - 32000) * 0.0175
  if (value <= 319000) return 1372.50 + (value - 85000) * 0.035
  if (value <= 1064000) return 9562.50 + (value - 319000) * 0.045
  return 43087.50 + (value - 1064000) * 0.055
}

// Total upfront costs calculation
export const calculateUpfrontCosts = (propertyValue, loanAmount, params = {}) => {
  const {
    state = 'NSW',
    isFirstHomeBuyer = false,
    includeLMI = true,
    legalFees = 1500,
    inspectionFees = 500,
    lenderFees = 600,
    otherCosts = 500
  } = params

  const stampDuty = calculateStampDuty(propertyValue, state, isFirstHomeBuyer)
  const lmi = includeLMI ? calculateLMI(loanAmount, propertyValue) : 0
  
  const costs = {
    stampDuty,
    lmi,
    legalFees,
    inspectionFees,
    lenderFees,
    otherCosts,
    total: stampDuty + lmi + legalFees + inspectionFees + lenderFees + otherCosts
  }
  
  return costs
}

// Maximum purchase price calculation
export const calculateMaxPurchasePrice = (maxLoan, deposit, params = {}) => {
  const {
    state = 'NSW',
    isFirstHomeBuyer = false,
    targetLVR = 80,
    legalFees = 1500,
    inspectionFees = 500,
    lenderFees = 600,
    otherCosts = 500
  } = params

  const availableFunds = maxLoan + deposit
  const fixedCosts = legalFees + inspectionFees + lenderFees + otherCosts

  // Iterative calculation to find maximum price accounting for stamp duty and LMI
  let maxPrice = availableFunds - fixedCosts
  let iteration = 0
  
  while (iteration < 10) { // Prevent infinite loops
    const costs = calculateUpfrontCosts(maxPrice, maxLoan, {
      state,
      isFirstHomeBuyer,
      includeLMI: calculateLVR(maxLoan, maxPrice) > 80,
      legalFees,
      inspectionFees,
      lenderFees,
      otherCosts
    })
    
    const requiredFunds = costs.total + (maxPrice - maxLoan)
    
    if (requiredFunds <= availableFunds) break
    
    maxPrice = maxPrice - (requiredFunds - availableFunds)
    iteration++
  }

  const finalCosts = calculateUpfrontCosts(maxPrice, maxLoan, {
    state,
    isFirstHomeBuyer,
    includeLMI: calculateLVR(maxLoan, maxPrice) > 80,
    legalFees,
    inspectionFees,
    lenderFees,
    otherCosts
  })

  return {
    maxPrice: Math.round(maxPrice),
    costs: finalCosts,
    depositRequired: Math.round(maxPrice - maxLoan),
    cashRequired: Math.round(finalCosts.total),
    lvr: Math.round(calculateLVR(maxLoan, maxPrice) * 10) / 10
  }
}

// Budget affordability check
export const calculateAffordability = (params) => {
  const {
    propertyPrice,
    loanAmount,
    monthlyIncome,
    monthlyExpenses,
    interestRate,
    termYears = 30,
    ownershipCosts = 0.01 // 1% of property value per year
  } = params

  const monthlyRepayment = calculateMortgagePayment(loanAmount, interestRate, termYears)
  const monthlyOwnershipCosts = (propertyPrice * ownershipCosts) / 12
  const totalMonthlyCosts = monthlyRepayment + monthlyOwnershipCosts

  const surplus = monthlyIncome - monthlyExpenses - totalMonthlyCosts
  const surplusPercentage = (surplus / monthlyIncome) * 100

  // Affordability scoring
  let signal = 'red'
  if (surplusPercentage > 20) signal = 'green'
  else if (surplusPercentage > 10) signal = 'amber'

  return {
    monthlyRepayment: Math.round(monthlyRepayment),
    monthlyOwnershipCosts: Math.round(monthlyOwnershipCosts),
    totalMonthlyCosts: Math.round(totalMonthlyCosts),
    surplus: Math.round(surplus),
    surplusPercentage: Math.round(surplusPercentage * 10) / 10,
    signal
  }
}

// Deposit timeline calculation
export const calculateDepositTimeline = (params) => {
  const {
    targetDeposit,
    currentSavings = 0,
    monthlyContribution,
    returnRate = 0.02, // 2% annual return for conservative savings
    emergencyFund = 0
  } = params

  const adjustedTarget = targetDeposit + emergencyFund
  const shortfall = Math.max(0, adjustedTarget - currentSavings)
  
  if (shortfall === 0) {
    return {
      monthsToTarget: 0,
      targetDate: new Date(),
      monthlyRequired: 0,
      projectedBalance: currentSavings
    }
  }

  const monthlyReturn = returnRate / 12
  let months = 0
  let balance = currentSavings

  // Calculate months to reach target with compound interest
  while (balance < adjustedTarget && months < 600) { // Cap at 50 years
    balance = balance * (1 + monthlyReturn) + monthlyContribution
    months++
  }

  const targetDate = new Date()
  targetDate.setMonth(targetDate.getMonth() + months)

  return {
    monthsToTarget: months,
    targetDate,
    monthlyRequired: Math.round(monthlyContribution),
    projectedBalance: Math.round(balance),
    yearsToTarget: Math.round((months / 12) * 10) / 10
  }
}

// Format currency for Australian locale
export const formatCurrency = (amount, showCents = false) => {
  if (amount === undefined || amount === null) return '$0'
  
  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  })
  
  return formatter.format(amount)
}

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`
}

// Reverse calculation: Purchase price to affordability assessment
export const calculateReverseAffordability = (params) => {
  const {
    targetPrice,
    primaryIncome,
    secondaryIncome = 0,
    existingDebts = 0,
    livingExpenses,
    deposit,
    interestRate,
    termYears = 30,
    dependents = 0,
    hasHECS = false,
    hecsBalance = 0,
    scenario = 'single',
    state = 'NSW',
    isFirstHomeBuyer = false
  } = params

  const totalIncome = primaryIncome + secondaryIncome
  const loanAmount = targetPrice - deposit

  // Calculate all costs
  const upfrontCosts = calculateUpfrontCosts(targetPrice, loanAmount, {
    state,
    isFirstHomeBuyer,
    includeLMI: calculateLVR(loanAmount, targetPrice) > 80
  })

  const totalCashRequired = deposit + upfrontCosts.total

  // Calculate ongoing affordability
  const affordability = calculateAffordability({
    propertyPrice: targetPrice,
    loanAmount,
    monthlyIncome: totalIncome / 12,
    monthlyExpenses: livingExpenses / 12,
    interestRate,
    termYears
  })

  // Enhanced affordability with HECS impact
  const annualHECSPayment = hasHECS ? calculateHECSRepayment(totalIncome) : 0
  const monthlyHECSPayment = annualHECSPayment / 12
  
  const adjustedSurplus = affordability.surplus - monthlyHECSPayment
  const adjustedSurplusPercentage = (adjustedSurplus / (totalIncome / 12)) * 100

  // Affordability scoring with HECS consideration
  let signal = 'red'
  if (adjustedSurplusPercentage > 20) signal = 'green'
  else if (adjustedSurplusPercentage > 10) signal = 'amber'

  // Check borrowing capacity
  const borrowingPower = calculateBorrowingPower({
    primaryIncome,
    secondaryIncome,
    existingDebts,
    livingExpenses,
    interestRate,
    dependents,
    hasHECS,
    hecsBalance,
    scenario
  })

  const canBorrow = loanAmount <= borrowingPower.maxLoan

  return {
    targetPrice,
    loanAmount,
    deposit,
    totalCashRequired: Math.round(totalCashRequired),
    upfrontCosts,
    lvr: Math.round(calculateLVR(loanAmount, targetPrice) * 10) / 10,
    monthlyRepayment: affordability.monthlyRepayment,
    monthlyOwnershipCosts: affordability.monthlyOwnershipCosts,
    totalMonthlyCosts: affordability.totalMonthlyCosts,
    surplus: Math.round(adjustedSurplus),
    surplusPercentage: Math.round(adjustedSurplusPercentage * 10) / 10,
    signal,
    canBorrow,
    borrowingShortfall: canBorrow ? 0 : Math.round(loanAmount - borrowingPower.maxLoan),
    hecsImpact: Math.round(annualHECSPayment),
    borrowingPower: borrowingPower.maxLoan
  }
}

// Validation helpers
export const validateFinancialInputs = (inputs) => {
  const errors = {}
  
  if (!inputs.income || inputs.income <= 0) {
    errors.income = 'Income must be greater than 0'
  }
  
  if (inputs.expenses && inputs.expenses < 0) {
    errors.expenses = 'Expenses cannot be negative'
  }
  
  if (inputs.interestRate && (inputs.interestRate <= 0 || inputs.interestRate > 0.3)) {
    errors.interestRate = 'Interest rate must be between 0% and 30%'
  }
  
  return errors
}