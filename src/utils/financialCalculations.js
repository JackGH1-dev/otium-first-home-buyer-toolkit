/**
 * First-Home Buyer Toolkit - Financial Calculation Utilities
 * All calculations follow Australian lending and property market standards
 */

// Home Guarantee Scheme property price caps (effective October 1, 2025)
export const HOME_GUARANTEE_SCHEME_CAPS = {
  NSW: {
    capital: 1500000,      // Sydney
    regional: 1500000,     // Newcastle, Illawarra, Lake Macquarie
    other: 800000          // Other regional areas
  },
  VIC: {
    capital: 950000,       // Melbourne
    regional: 950000,      // Geelong
    other: 650000          // Other regional areas
  },
  QLD: {
    capital: 1000000,      // Brisbane
    regional: 1000000,     // Gold Coast, Sunshine Coast
    other: 700000          // Other regional areas
  },
  WA: {
    capital: 850000,       // Perth
    regional: 850000,      // Perth metro
    other: 600000          // Other regional areas
  },
  SA: {
    capital: 900000,       // Adelaide
    regional: 900000,      // Adelaide metro
    other: 500000          // Other regional areas
  },
  TAS: {
    capital: 700000,       // Hobart
    regional: 700000,      // Greater Hobart
    other: 550000          // Other regional areas
  },
  ACT: {
    capital: 1000000,      // Canberra
    regional: 1000000,     // All ACT
    other: 1000000         // All ACT
  },
  NT: {
    capital: 600000,       // Darwin
    regional: 600000,      // Darwin metro
    other: 600000          // Other regional areas
  }
}

// Check if property price is eligible for Home Guarantee Scheme
export const isEligibleForHomeGuaranteeScheme = (propertyPrice, state, isFirstHomeBuyer, area = 'capital') => {
  if (!isFirstHomeBuyer) return false
  
  const stateCaps = HOME_GUARANTEE_SCHEME_CAPS[state]
  if (!stateCaps) return false
  
  const applicableCap = stateCaps[area] || stateCaps.capital
  return propertyPrice <= applicableCap
}

// Calculate maximum property price under Home Guarantee Scheme (5% deposit, no LMI)
export const calculateHomeGuaranteeMaxPrice = (borrowingPower, deposit, state, area = 'capital') => {
  const stateCaps = HOME_GUARANTEE_SCHEME_CAPS[state]
  if (!stateCaps) return 0
  
  const priceCap = stateCaps[area] || stateCaps.capital
  
  // With 5% deposit, loan can be up to 95% of property value
  // So: loan = property * 0.95
  // Therefore: property = loan / 0.95
  const maxPriceFromBorrowingPower = borrowingPower / 0.95
  
  // Also limited by available deposit (5% minimum)
  const maxPriceFromDeposit = deposit / 0.05
  
  // Take the smallest of: borrowing power limit, deposit limit, and scheme cap
  return Math.min(maxPriceFromBorrowingPower, maxPriceFromDeposit, priceCap)
}

// Smart Auto-Calculation System for Property Purchase
export const smartAutoCalculate = (inputs, lockedFields, borrowingPower, state = 'NSW') => {
  const { propertyValue, fundsAvailable, lvr, loanAmount } = inputs
  
  // Determine calculation strategy based on locked fields
  const strategy = determineCalculationStrategy(lockedFields)
  
  let result = {}
  
  switch (strategy) {
    case 'PROPERTY_FUNDS':
      result = calculateFromPropertyAndFunds(propertyValue, fundsAvailable, state)
      break
    case 'PROPERTY_LVR':
      result = calculateFromPropertyAndLVR(propertyValue, lvr, state)
      break
    case 'FUNDS_LVR':
      result = calculateFromFundsAndLVR(fundsAvailable, lvr, borrowingPower, state)
      break
    case 'LOAN_PROPERTY':
      result = calculateFromLoanAndProperty(loanAmount, propertyValue, state)
      break
    case 'LOAN_LVR':
      result = calculateFromLoanAndLVR(loanAmount, lvr, state)
      break
    case 'LOAN_FUNDS':
      result = calculateFromLoanAndFunds(loanAmount, fundsAvailable, state)
      break
    default:
      result = { error: 'Invalid input combination', strategy: 'INVALID' }
  }
  
  // Apply constraints and validation with enhanced parameters
  const validation = validatePropertyCalculation({
    ...result, 
    borrowingPower,
    lockedFields,
    convergenceFailure: result.convergenceFailure,
    iterations: result.iterations
  })
  
  // Handle edge cases
  if (!validation.isValid) {
    const recovery = handleCalculationEdgeCases({...result, borrowingPower}, validation.errors)
    result = { ...result, recovery }
  }
  
  return {
    ...result,
    validation,
    strategy,
    metadata: {
      autoCalculatedFields: getAutoCalculatedFields(lockedFields),
      timestamp: new Date()
    }
  }
}

// Helper function to determine calculation strategy
const determineCalculationStrategy = (lockedFields) => {
  const locked = new Set(lockedFields)
  
  if (locked.has('propertyValue') && locked.has('fundsAvailable')) {
    return 'PROPERTY_FUNDS'  // Most common: "I want this house and have this cash"
  }
  if (locked.has('propertyValue') && locked.has('lvr')) {
    return 'PROPERTY_LVR'    // Targeting specific LVR
  }
  if (locked.has('fundsAvailable') && locked.has('lvr')) {
    return 'FUNDS_LVR'       // "I have X cash and want Y% deposit"
  }
  if (locked.has('loanAmount') && locked.has('propertyValue')) {
    return 'LOAN_PROPERTY'   // Borrowing capacity known, evaluating property
  }
  if (locked.has('loanAmount') && locked.has('lvr')) {
    return 'LOAN_LVR'        // Reverse engineering from loan capacity
  }
  if (locked.has('loanAmount') && locked.has('fundsAvailable')) {
    return 'LOAN_FUNDS'      // Validating loan vs deposit ratio
  }
  
  return 'INVALID'
}

// Calculation implementations
const calculateFromPropertyAndFunds = (propertyValue, fundsAvailable, state) => {
  // Initial estimation with 80% LVR assumption
  let initialCosts = calculateUpfrontCosts(propertyValue, propertyValue * 0.8, {
    state,
    isFirstHomeBuyer: true,
    includeLMI: false
  })
  
  let availableForDeposit = fundsAvailable - initialCosts.total
  let loanAmount = propertyValue - availableForDeposit
  let lvr = (loanAmount / propertyValue) * 100
  
  // Recalculate costs with actual LVR if different from 80%
  if (Math.abs(lvr - 80) > 1) { // If LVR differs significantly from 80%
    const actualCosts = calculateUpfrontCosts(propertyValue, loanAmount, {
      state,
      isFirstHomeBuyer: true,
      includeLMI: lvr > 80
    })
    
    // Adjust calculation with actual costs
    availableForDeposit = fundsAvailable - actualCosts.total
    loanAmount = propertyValue - availableForDeposit
    lvr = (loanAmount / propertyValue) * 100
    
    // Use actual costs for final result
    initialCosts = actualCosts
  }
  
  return {
    propertyValue: Math.round(propertyValue),
    fundsAvailable: Math.round(fundsAvailable),
    loanAmount: Math.round(loanAmount),
    lvr: Math.round(lvr * 10) / 10,
    depositAmount: Math.round(availableForDeposit),
    costs: initialCosts,
    isValid: lvr <= 95 && availableForDeposit >= propertyValue * 0.05
  }
}

const calculateFromPropertyAndLVR = (propertyValue, lvr, state) => {
  const loanAmount = propertyValue * (lvr / 100)
  const depositAmount = propertyValue - loanAmount
  const costs = calculateUpfrontCosts(propertyValue, loanAmount, {
    state,
    isFirstHomeBuyer: true,
    includeLMI: lvr > 80
  })
  const fundsAvailable = depositAmount + costs.total
  
  return {
    propertyValue: Math.round(propertyValue),
    lvr: Math.round(lvr * 10) / 10,
    loanAmount: Math.round(loanAmount),
    fundsAvailable: Math.round(fundsAvailable),
    depositAmount: Math.round(depositAmount),
    costs,
    isValid: lvr >= 5 && lvr <= 95
  }
}

const calculateFromFundsAndLVR = (fundsAvailable, lvr, borrowingPower, state) => {
  // Iterative approach to find accurate property value (replaces inaccurate 5% estimate)
  let propertyValue = fundsAvailable * 5 // Better starting estimate based on typical cost ratios
  let iteration = 0
  
  while (iteration < 15) { // Increased iteration limit for better convergence
    const loanAmount = Math.min(propertyValue * (lvr / 100), borrowingPower)
    const costs = calculateUpfrontCosts(propertyValue, loanAmount, {
      state,
      isFirstHomeBuyer: true,
      includeLMI: lvr > 80
    })
    
    const requiredFunds = (propertyValue - loanAmount) + costs.total
    
    if (Math.abs(requiredFunds - fundsAvailable) < 100) break // Tighter tolerance for accuracy
    
    // Adjust property value proportionally
    propertyValue = propertyValue * (fundsAvailable / requiredFunds)
    iteration++
  }
  
  const finalLoanAmount = Math.min(propertyValue * (lvr / 100), borrowingPower)
  const finalCosts = calculateUpfrontCosts(propertyValue, finalLoanAmount, {
    state,
    isFirstHomeBuyer: true,
    includeLMI: lvr > 80
  })
  
  const actualFundsNeeded = propertyValue - finalLoanAmount + finalCosts.total
  
  return {
    propertyValue: Math.round(propertyValue),
    fundsAvailable: Math.round(fundsAvailable),
    lvr: Math.round(lvr * 10) / 10,
    loanAmount: Math.round(finalLoanAmount),
    depositAmount: Math.round(propertyValue - finalLoanAmount),
    costs: finalCosts,
    actualFundsNeeded: Math.round(actualFundsNeeded),
    isValid: actualFundsNeeded <= fundsAvailable && finalLoanAmount <= borrowingPower,
    iterations: iteration // Debug info
  }
}

const calculateFromLoanAndProperty = (loanAmount, propertyValue, state) => {
  const lvr = (loanAmount / propertyValue) * 100
  const depositAmount = propertyValue - loanAmount
  const costs = calculateUpfrontCosts(propertyValue, loanAmount, {
    state,
    isFirstHomeBuyer: true,
    includeLMI: lvr > 80
  })
  const fundsAvailable = depositAmount + costs.total
  
  return {
    loanAmount: Math.round(loanAmount),
    propertyValue: Math.round(propertyValue),
    lvr: Math.round(lvr * 10) / 10,
    fundsAvailable: Math.round(fundsAvailable),
    depositAmount: Math.round(depositAmount),
    costs,
    isValid: lvr >= 5 && lvr <= 95
  }
}

const calculateFromLoanAndLVR = (loanAmount, lvr, state) => {
  const propertyValue = loanAmount / (lvr / 100)
  const depositAmount = propertyValue - loanAmount
  const costs = calculateUpfrontCosts(propertyValue, loanAmount, {
    state,
    isFirstHomeBuyer: true,
    includeLMI: lvr > 80
  })
  const fundsAvailable = depositAmount + costs.total
  
  return {
    loanAmount: Math.round(loanAmount),
    lvr: Math.round(lvr * 10) / 10,
    propertyValue: Math.round(propertyValue),
    fundsAvailable: Math.round(fundsAvailable),
    depositAmount: Math.round(depositAmount),
    costs,
    isValid: lvr >= 5 && lvr <= 95
  }
}

const calculateFromLoanAndFunds = (loanAmount, fundsAvailable, state) => {
  // Better starting estimate based on typical cost ratios
  let propertyValue = loanAmount * 1.25 // Start with 80% LVR estimate
  let iteration = 0
  let lastAdjustment = 0
  let convergenceFailure = false
  
  while (iteration < 15) { // Increased iteration limit
    const costs = calculateUpfrontCosts(propertyValue, loanAmount, {
      state,
      isFirstHomeBuyer: true,
      includeLMI: calculateLVR(loanAmount, propertyValue) > 80
    })
    
    const depositAmount = propertyValue - loanAmount
    const totalFundsNeeded = depositAmount + costs.total
    const difference = Math.abs(totalFundsNeeded - fundsAvailable)
    
    if (difference < 100) break // Tighter tolerance for better accuracy
    
    // Calculate adjustment with dampening to prevent oscillation
    const rawAdjustment = fundsAvailable / totalFundsNeeded
    const dampening = iteration > 5 ? 0.5 : 0.8 // Reduce adjustment magnitude after 5 iterations
    const adjustment = 1 + (rawAdjustment - 1) * dampening
    
    // Detect oscillation (adjustment flipping back and forth)
    if (iteration > 1 && Math.sign(adjustment - 1) !== Math.sign(lastAdjustment - 1)) {
      // Use average of current and target to break oscillation
      const targetPropertyValue = propertyValue * rawAdjustment
      propertyValue = (propertyValue + targetPropertyValue) / 2
    } else {
      propertyValue = propertyValue * adjustment
    }
    
    lastAdjustment = adjustment
    iteration++
  }
  
  // Check for convergence failure
  if (iteration >= 15) {
    convergenceFailure = true
  }
  
  const lvr = (loanAmount / propertyValue) * 100
  const finalCosts = calculateUpfrontCosts(propertyValue, loanAmount, {
    state,
    isFirstHomeBuyer: true,
    includeLMI: lvr > 80
  })
  
  return {
    loanAmount: Math.round(loanAmount),
    fundsAvailable: Math.round(fundsAvailable),
    propertyValue: Math.round(propertyValue),
    lvr: Math.round(lvr * 10) / 10,
    depositAmount: Math.round(propertyValue - loanAmount),
    costs: finalCosts,
    isValid: lvr >= 5 && lvr <= 95 && !convergenceFailure,
    iterations: iteration, // Debug info
    convergenceFailure
  }
}

// Enhanced validation system with constraint override detection
export const validatePropertyCalculation = (inputs) => {
  const { 
    lvr, 
    loanAmount, 
    borrowingPower, 
    propertyValue, 
    fundsAvailable, 
    depositAmount,
    lockedFields = [],
    convergenceFailure = false,
    iterations = 0
  } = inputs
  
  const errors = []
  const warnings = []

  // Hard Constraints
  if (lvr < 5 || lvr > 95) {
    errors.push({
      field: 'lvr',
      message: `LVR must be between 5% and 95% (current: ${lvr.toFixed(1)}%)`,
      severity: 'error',
      code: 'INVALID_LVR'
    })
  }

  if (borrowingPower && loanAmount > borrowingPower) {
    // Check if borrowing power override affects locked LVR field
    if (lockedFields.includes('lvr')) {
      const actualLVR = (borrowingPower / propertyValue) * 100
      warnings.push({
        field: 'borrowingPower',
        message: `Borrowing capacity limits loan to ${formatCurrency(borrowingPower)}, actual LVR will be ${actualLVR.toFixed(1)}% instead of locked ${lvr.toFixed(1)}%`,
        severity: 'warning',
        code: 'BORROWING_POWER_OVERRIDE_LVR',
        suggestedValue: actualLVR
      })
    }
    
    errors.push({
      field: 'loanAmount',
      message: `Loan exceeds borrowing capacity by ${formatCurrency(loanAmount - borrowingPower)}`,
      severity: 'error',
      code: 'EXCEEDS_BORROWING_POWER'
    })
  }

  if (depositAmount < 0) {
    errors.push({
      field: 'deposit',
      message: 'Insufficient funds for required deposit',
      severity: 'error',
      code: 'NEGATIVE_DEPOSIT'
    })
  }

  // Convergence failure warnings
  if (convergenceFailure) {
    warnings.push({
      field: 'calculation',
      message: `Calculation failed to converge after ${iterations} iterations - results may be inaccurate`,
      severity: 'warning',
      code: 'CONVERGENCE_FAILED'
    })
  }

  // Iteration performance warnings
  if (iterations > 10) {
    warnings.push({
      field: 'calculation',
      message: `Calculation required ${iterations} iterations - consider adjusting input values slightly for better performance`,
      severity: 'info',
      code: 'HIGH_ITERATION_COUNT'
    })
  }

  // Soft Constraints (Warnings)
  if (lvr > 80) {
    const lmiCost = calculateLMI(propertyValue, loanAmount, true)
    warnings.push({
      field: 'lvr',
      message: `LMI will apply at LVR above 80% (estimated: ${formatCurrency(lmiCost)})`,
      severity: 'warning',
      cost: lmiCost,
      code: 'LMI_APPLIES'
    })
  }

  if (lvr > 90) {
    warnings.push({
      field: 'lvr',
      message: 'High-risk LVR above 90% - limited lender options',
      severity: 'warning',
      code: 'HIGH_RISK_LVR'
    })
  }

  // Home Guarantee Scheme eligibility hint
  if (lvr > 80 && lvr <= 95 && lockedFields.includes('lvr')) {
    warnings.push({
      field: 'homeGuaranteeScheme',
      message: 'First home buyers may qualify for Home Guarantee Scheme (5% deposit, no LMI)',
      severity: 'info',
      code: 'HGS_ELIGIBLE_HINT'
    })
  }

  return { 
    errors, 
    warnings, 
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0
  }
}

// Edge case handling
const handleCalculationEdgeCases = (inputs, errors) => {
  const solutions = []
  
  for (const error of errors) {
    switch (error.code) {
      case 'NEGATIVE_DEPOSIT':
        solutions.push({
          action: 'ADJUST_PROPERTY_VALUE',
          suggestion: inputs.fundsAvailable * 1.25, // 80% LVR estimate
          message: 'Consider a lower-priced property that fits your budget'
        })
        break
        
      case 'EXCEEDS_BORROWING_POWER':
        solutions.push({
          action: 'SHOW_ALTERNATIVES',
          alternatives: [
            { 
              description: 'Lower property price', 
              value: inputs.borrowingPower * 1.25,
              type: 'propertyValue'
            },
            { 
              description: 'Increase deposit', 
              value: inputs.loanAmount - inputs.borrowingPower,
              type: 'additionalDeposit'
            }
          ]
        })
        break
        
      case 'INVALID_LVR':
        solutions.push({
          action: 'ADJUST_LVR',
          suggestion: Math.max(5, Math.min(95, inputs.lvr)),
          message: 'LVR has been adjusted to valid range'
        })
        break
    }
  }
  
  return solutions
}

// Get auto-calculated fields
const getAutoCalculatedFields = (lockedFields) => {
  const allFields = ['propertyValue', 'fundsAvailable', 'lvr', 'loanAmount']
  return allFields.filter(field => !lockedFields.includes(field))
}

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
      return Math.round(Math.max(0, calculateNSWStampDutyStandard(value) - (650000 - value) * 0.045))
    }
  }
  
  return Math.round(calculateNSWStampDutyStandard(value))
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
    stampDuty: Math.round(stampDuty),
    lmi: Math.round(lmi),
    legalFees: Math.round(legalFees),
    inspectionFees: Math.round(inspectionFees),
    lenderFees: Math.round(lenderFees),
    otherCosts: Math.round(otherCosts),
    total: Math.round(stampDuty + lmi + legalFees + inspectionFees + lenderFees + otherCosts)
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
    loanAmount: Math.round(maxLoan),
    costs: finalCosts,
    depositRequired: Math.round(maxPrice - maxLoan),
    cashRequired: Math.round((maxPrice - maxLoan) + finalCosts.total),
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

// Calculate negative gearing tax benefits for investment properties
export const calculateNegativeGearingBenefit = (rentalIncome, expenses, marginalTaxRate) => {
  // Calculate annual rental loss (if property is negatively geared)
  const rentalLoss = Math.max(0, expenses - rentalIncome)
  
  // Calculate tax benefit based on marginal tax rate
  const annualTaxSaving = rentalLoss * marginalTaxRate
  const monthlyTaxBenefit = annualTaxSaving / 12
  
  // Calculate effective rental yield after tax benefits
  const netRentalCost = rentalLoss - annualTaxSaving
  
  return {
    rentalLoss: Math.round(rentalLoss),
    annualTaxSaving: Math.round(annualTaxSaving),
    monthlyTaxBenefit: Math.round(monthlyTaxBenefit),
    netRentalCost: Math.round(netRentalCost),
    isNegativelyGeared: rentalLoss > 0,
    effectiveRentalReturn: rentalIncome + annualTaxSaving
  }
}

// Australian marginal tax rate brackets (2024-25)
export const getAustralianTaxBracket = (annualIncome) => {
  if (annualIncome <= 18200) return 0
  if (annualIncome <= 45000) return 19
  if (annualIncome <= 120000) return 32.5
  if (annualIncome <= 180000) return 37
  return 45
}

// Calculate assessable rental income for lending (typically 80% of gross rent)
export const calculateAssessableRentalIncome = (grossRent, assessmentRate = 0.8) => {
  return grossRent * assessmentRate
}

// Investment property serviceability calculation
export const calculateInvestmentServiceability = (params) => {
  const {
    loanAmount,
    interestRate,
    rentalIncome,
    otherIncome,
    expenses,
    marginalTaxRate = 0.325,
    assessmentBuffer = 0.03 // APRA 3% buffer
  } = params

  const serviceabilityRate = interestRate + assessmentBuffer
  const assessableRental = calculateAssessableRentalIncome(rentalIncome)
  const totalAssessableIncome = assessableRental + otherIncome
  
  // Calculate monthly repayment at stressed rate
  const monthlyRepayment = calculateMortgagePayment(loanAmount, serviceabilityRate, 30) / 12
  const monthlySurplus = (totalAssessableIncome / 12) - expenses - monthlyRepayment
  
  // Calculate negative gearing benefits
  const annualInterest = loanAmount * interestRate
  const totalAnnualExpenses = annualInterest + (expenses * 12)
  const negativeGearingCalc = calculateNegativeGearingBenefit(
    rentalIncome, 
    totalAnnualExpenses, 
    marginalTaxRate
  )
  
  return {
    serviceabilityRate: serviceabilityRate,
    assessableIncome: Math.round(totalAssessableIncome),
    monthlyRepayment: Math.round(monthlyRepayment),
    monthlySurplus: Math.round(monthlySurplus),
    passesServiceability: monthlySurplus > 0,
    negativeGearingBenefit: negativeGearingCalc.annualTaxSaving,
    effectiveYield: (rentalIncome + negativeGearingCalc.annualTaxSaving) / loanAmount * 100
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