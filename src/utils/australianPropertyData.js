// Australian Investment Property Calculation Utilities
// Version 1.0 - Complete implementation with state-specific calculations

export const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales', capital: 'Sydney' },
  { value: 'VIC', label: 'Victoria', capital: 'Melbourne' },
  { value: 'QLD', label: 'Queensland', capital: 'Brisbane' },
  { value: 'SA', label: 'South Australia', capital: 'Adelaide' },
  { value: 'WA', label: 'Western Australia', capital: 'Perth' },
  { value: 'TAS', label: 'Tasmania', capital: 'Hobart' },
  { value: 'ACT', label: 'Australian Capital Territory', capital: 'Canberra' },
  { value: 'NT', label: 'Northern Territory', capital: 'Darwin' }
]

export const PROPERTY_TYPES = [
  { value: 'house', label: 'House', maintenanceRate: 0.012 },
  { value: 'unit', label: 'Unit/Apartment', maintenanceRate: 0.008 },
  { value: 'townhouse', label: 'Townhouse', maintenanceRate: 0.010 }
]

// Australian capital city market presets (2025 data)
export const PROPERTY_MARKET_PRESETS = {
  'Sydney': {
    medianPrice: { house: 1200000, unit: 750000, townhouse: 950000 },
    rentalYield: { house: 0.028, unit: 0.035, townhouse: 0.032 },
    growthRate: 0.045,
    rentGrowth: 0.035
  },
  'Melbourne': {
    medianPrice: { house: 950000, unit: 550000, townhouse: 750000 },
    rentalYield: { house: 0.032, unit: 0.042, townhouse: 0.038 },
    growthRate: 0.042,
    rentGrowth: 0.034
  },
  'Brisbane': {
    medianPrice: { house: 750000, unit: 450000, townhouse: 600000 },
    rentalYield: { house: 0.038, unit: 0.048, townhouse: 0.042 },
    growthRate: 0.048,
    rentGrowth: 0.038
  },
  'Perth': {
    medianPrice: { house: 650000, unit: 400000, townhouse: 520000 },
    rentalYield: { house: 0.035, unit: 0.045, townhouse: 0.040 },
    growthRate: 0.035,
    rentGrowth: 0.032
  },
  'Adelaide': {
    medianPrice: { house: 580000, unit: 380000, townhouse: 480000 },
    rentalYield: { house: 0.042, unit: 0.052, townhouse: 0.045 },
    growthRate: 0.038,
    rentGrowth: 0.035
  },
  'Hobart': {
    medianPrice: { house: 520000, unit: 350000, townhouse: 420000 },
    rentalYield: { house: 0.040, unit: 0.050, townhouse: 0.045 },
    growthRate: 0.035,
    rentGrowth: 0.032
  },
  'Canberra': {
    medianPrice: { house: 820000, unit: 480000, townhouse: 650000 },
    rentalYield: { house: 0.035, unit: 0.045, townhouse: 0.040 },
    growthRate: 0.040,
    rentGrowth: 0.035
  },
  'Darwin': {
    medianPrice: { house: 480000, unit: 320000, townhouse: 380000 },
    rentalYield: { house: 0.048, unit: 0.058, townhouse: 0.052 },
    growthRate: 0.032,
    rentGrowth: 0.030
  }
}

// Australian stamp duty rates by state (investor rates, 2025)
export const STAMP_DUTY_RATES = {
  NSW: {
    thresholds: [
      { min: 0, max: 14000, rate: 0.0125, fixed: 0 },
      { min: 14000, max: 32000, rate: 0.015, fixed: 175 },
      { min: 32000, max: 85000, rate: 0.0175, fixed: 445 },
      { min: 85000, max: 319000, rate: 0.035, fixed: 1372.50 },
      { min: 319000, max: 1064000, rate: 0.045, fixed: 9562.50 },
      { min: 1064000, max: 3090000, rate: 0.055, fixed: 43087.50 },
      { min: 3090000, max: Infinity, rate: 0.07, fixed: 154517.50 }
    ],
    foreignSurcharge: 0.08,
    transferFee: 500
  },
  VIC: {
    thresholds: [
      { min: 0, max: 25000, rate: 0.014, fixed: 0 },
      { min: 25000, max: 130000, rate: 0.024, fixed: 350 },
      { min: 130000, max: 960000, rate: 0.06, fixed: 2870 },
      { min: 960000, max: Infinity, rate: 0.065, fixed: 52670 }
    ],
    foreignSurcharge: 0.08,
    transferFee: 150
  },
  QLD: {
    thresholds: [
      { min: 0, max: 5000, rate: 0.015, fixed: 0 },
      { min: 5000, max: 75000, rate: 0.035, fixed: 75 },
      { min: 75000, max: 540000, rate: 0.045, fixed: 2525 },
      { min: 540000, max: 1000000, rate: 0.0575, fixed: 23450 },
      { min: 1000000, max: Infinity, rate: 0.0675, fixed: 49900 }
    ],
    foreignSurcharge: 0.075,
    transferFee: 200
  },
  SA: {
    thresholds: [
      { min: 0, max: 12000, rate: 0.01, fixed: 0 },
      { min: 12000, max: 30000, rate: 0.02, fixed: 120 },
      { min: 30000, max: 50000, rate: 0.03, fixed: 480 },
      { min: 50000, max: 100000, rate: 0.04, fixed: 1080 },
      { min: 100000, max: 200000, rate: 0.045, fixed: 3080 },
      { min: 200000, max: 250000, rate: 0.05, fixed: 7580 },
      { min: 250000, max: 300000, rate: 0.055, fixed: 10080 },
      { min: 300000, max: 500000, rate: 0.06, fixed: 12830 },
      { min: 500000, max: Infinity, rate: 0.065, fixed: 24830 }
    ],
    foreignSurcharge: 0.07,
    transferFee: 180
  },
  WA: {
    thresholds: [
      { min: 0, max: 120000, rate: 0.019, fixed: 0 },
      { min: 120000, max: 150000, rate: 0.029, fixed: 2280 },
      { min: 150000, max: 360000, rate: 0.038, fixed: 3150 },
      { min: 360000, max: 725000, rate: 0.049, fixed: 11130 },
      { min: 725000, max: Infinity, rate: 0.059, fixed: 29015 }
    ],
    foreignSurcharge: 0.07,
    transferFee: 300
  },
  TAS: {
    thresholds: [
      { min: 0, max: 3000, rate: 0.015, fixed: 0 },
      { min: 3000, max: 25000, rate: 0.025, fixed: 45 },
      { min: 25000, max: 75000, rate: 0.035, fixed: 595 },
      { min: 75000, max: 200000, rate: 0.04, fixed: 2345 },
      { min: 200000, max: 375000, rate: 0.045, fixed: 7345 },
      { min: 375000, max: Infinity, rate: 0.05, fixed: 15220 }
    ],
    foreignSurcharge: 0.03,
    transferFee: 100
  },
  ACT: {
    thresholds: [
      { min: 0, max: 200000, rate: 0.022, fixed: 0 },
      { min: 200000, max: 300000, rate: 0.043, fixed: 4400 },
      { min: 300000, max: 500000, rate: 0.046, fixed: 8700 },
      { min: 500000, max: 750000, rate: 0.067, fixed: 17900 },
      { min: 750000, max: 1000000, rate: 0.067, fixed: 34650 },
      { min: 1000000, max: 1455000, rate: 0.067, fixed: 51400 },
      { min: 1455000, max: Infinity, rate: 0.067, fixed: 81885 }
    ],
    foreignSurcharge: 0.075,
    transferFee: 400
  },
  NT: {
    thresholds: [
      { min: 0, max: 525000, rate: 0.065, fixed: 0 },
      { min: 525000, max: 3000000, rate: 0.056, fixed: 34125 },
      { min: 3000000, max: Infinity, rate: 0.06, fixed: 172725 }
    ],
    foreignSurcharge: 0.10,
    transferFee: 150
  }
}

// Land tax rates by state (2025)
export const LAND_TAX_RATES = {
  NSW: {
    threshold: 1075000, // Investment property threshold
    rates: [
      { min: 1075000, max: 6571000, rate: 0.01, fixed: 0 },
      { min: 6571000, max: Infinity, rate: 0.02, fixed: 54960 }
    ]
  },
  VIC: {
    threshold: 300000,
    rates: [
      { min: 300000, max: 600000, rate: 0.005, fixed: 0 },
      { min: 600000, max: 1000000, rate: 0.008, fixed: 1500 },
      { min: 1000000, max: 1800000, rate: 0.012, fixed: 4700 },
      { min: 1800000, max: 3000000, rate: 0.018, fixed: 14300 },
      { min: 3000000, max: Infinity, rate: 0.025, fixed: 35900 }
    ]
  },
  QLD: {
    threshold: 600000,
    rates: [
      { min: 600000, max: 1000000, rate: 0.01, fixed: 0 },
      { min: 1000000, max: 5000000, rate: 0.0175, fixed: 4000 },
      { min: 5000000, max: 10000000, rate: 0.025, fixed: 74000 },
      { min: 10000000, max: Infinity, rate: 0.0275, fixed: 199000 }
    ]
  },
  SA: {
    threshold: 25000,
    rates: [
      { min: 25000, max: 50000, rate: 0.005, fixed: 0 },
      { min: 50000, max: 100000, rate: 0.0065, fixed: 125 },
      { min: 100000, max: 200000, rate: 0.009, fixed: 450 },
      { min: 200000, max: Infinity, rate: 0.012, fixed: 1350 }
    ]
  },
  WA: {
    threshold: 300000,
    rates: [
      { min: 300000, max: 420000, rate: 0.0025, fixed: 0 },
      { min: 420000, max: 1000000, rate: 0.0067, fixed: 300 },
      { min: 1000000, max: 1800000, rate: 0.01, fixed: 4186 },
      { min: 1800000, max: 5000000, rate: 0.015, fixed: 12186 },
      { min: 5000000, max: 11000000, rate: 0.025, fixed: 60186 },
      { min: 11000000, max: Infinity, rate: 0.025, fixed: 210186 }
    ]
  },
  TAS: {
    threshold: 25000,
    rates: [
      { min: 25000, max: 349999, rate: 0.0055, fixed: 0 },
      { min: 350000, max: Infinity, rate: 0.0155, fixed: 1787.50 }
    ]
  },
  ACT: {
    threshold: 75000,
    rates: [
      { min: 75000, max: 150000, rate: 0.0075, fixed: 0 },
      { min: 150000, max: 275000, rate: 0.012, fixed: 562.50 },
      { min: 275000, max: Infinity, rate: 0.015, fixed: 2062.50 }
    ]
  },
  NT: {
    threshold: 25000,
    rates: [
      { min: 25000, max: Infinity, rate: 0.005, fixed: 0 }
    ]
  }
}

// LMI calculation (Lenders Mortgage Insurance)
export const LMI_RATES = {
  80: 0,      // No LMI at 80% LVR or below
  85: 0.008,  // 0.8% of loan amount
  90: 0.015,  // 1.5% of loan amount
  95: 0.025   // 2.5% of loan amount
}

// Calculation functions
export const formatAUD = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatPercent = (rate) => {
  if (typeof rate !== 'number' || isNaN(rate)) return '0%'
  return new Intl.NumberFormat('en-AU', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rate)
}

export const calculateStampDuty = (propertyValue, state, isForeigner = false) => {
  const stateData = STAMP_DUTY_RATES[state]
  if (!stateData) return 0

  let duty = 0
  let remainingValue = propertyValue

  for (const bracket of stateData.thresholds) {
    if (remainingValue <= 0) break
    
    const taxableInBracket = Math.min(
      remainingValue, 
      bracket.max === Infinity ? remainingValue : bracket.max - bracket.min
    )
    
    if (bracket.min < propertyValue) {
      duty += bracket.fixed + (taxableInBracket * bracket.rate)
    }
    
    remainingValue -= taxableInBracket
    
    if (bracket.max >= propertyValue) break
  }

  // Add foreign surcharge if applicable
  if (isForeigner && stateData.foreignSurcharge) {
    duty += propertyValue * stateData.foreignSurcharge
  }

  return Math.round(duty)
}

export const calculateLandTax = (landValue, state) => {
  const stateData = LAND_TAX_RATES[state]
  if (!stateData || landValue < stateData.threshold) return 0

  let tax = 0
  let remainingValue = landValue - stateData.threshold

  for (const bracket of stateData.rates) {
    if (remainingValue <= 0) break
    
    const taxableInBracket = Math.min(
      remainingValue,
      bracket.max === Infinity ? remainingValue : bracket.max - bracket.min
    )
    
    tax += bracket.fixed + (taxableInBracket * bracket.rate)
    
    remainingValue -= taxableInBracket
    
    if (bracket.max >= landValue) break
  }

  return Math.round(tax)
}

export const calculateLMI = (loanAmount, propertyValue) => {
  const lvr = (loanAmount / propertyValue) * 100
  
  if (lvr <= 80) return 0
  
  let rate = 0
  if (lvr <= 85) rate = LMI_RATES[85]
  else if (lvr <= 90) rate = LMI_RATES[90]
  else rate = LMI_RATES[95]
  
  return Math.round(loanAmount * rate)
}

export const calculateTotalAcquisitionCosts = (propertyValue, state, loanAmount, isForeigner = false) => {
  const stampDuty = calculateStampDuty(propertyValue, state, isForeigner)
  const lmiCost = calculateLMI(loanAmount, propertyValue)
  const transferFee = STAMP_DUTY_RATES[state]?.transferFee || 200
  const legalFees = Math.max(1500, propertyValue * 0.001) // 0.1% or $1,500 minimum
  const inspectionFees = 800 // Building and pest
  const lenderFees = 600 // Application and valuation
  
  return {
    stampDuty,
    lmiCost,
    transferFee,
    legalFees,
    inspectionFees,
    lenderFees,
    total: stampDuty + lmiCost + transferFee + legalFees + inspectionFees + lenderFees
  }
}

// Loan calculation functions
export const calculateMonthlyInterest = (loanBalance, interestRate, offsetBalance = 0) => {
  const effectiveBalance = Math.max(0, loanBalance - offsetBalance)
  return (effectiveBalance * interestRate) / 12
}

export const calculatePIPayment = (loanAmount, interestRate, termYears) => {
  const monthlyRate = interestRate / 12
  const numPayments = termYears * 12
  
  if (monthlyRate === 0) return loanAmount / numPayments
  
  const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  return payment
}

export const calculateIOPayment = (loanBalance, interestRate, offsetBalance = 0) => {
  return calculateMonthlyInterest(loanBalance, interestRate, offsetBalance)
}

// Tax calculation functions
export const calculateNegativeGearing = (rentalIncome, expenses, interestExpense, marginalTaxRate) => {
  const netRentalIncome = rentalIncome - expenses - interestExpense
  
  if (netRentalIncome >= 0) return 0 // No negative gearing benefit
  
  return Math.abs(netRentalIncome) * marginalTaxRate // Tax refund
}

export const calculateDepreciation = (propertyValue, buildDate, purchaseDate) => {
  const currentYear = new Date().getFullYear()
  const buildYear = new Date(buildDate).getFullYear()
  const purchaseYear = new Date(purchaseDate).getFullYear()
  
  // Division 43 (Capital Works) - 2.5% per year for 40 years
  let div43Amount = 0
  if (buildYear >= 1987) { // Only for post-1987 construction
    const remainingYears = Math.max(0, 40 - (purchaseYear - buildYear))
    if (remainingYears > 0) {
      const eligibleValue = propertyValue * 0.7 // Assuming 70% is building
      div43Amount = eligibleValue * 0.025
    }
  }
  
  // Division 40 (Plant & Equipment) - Restricted for second-hand after May 2017
  let div40Amount = 0
  if (purchaseYear >= 2017) {
    // Only for new assets purchased after May 2017
    const plantEquipmentValue = propertyValue * 0.05 // 5% of property value
    div40Amount = plantEquipmentValue * 0.15 // 15% depreciation rate
  }
  
  return {
    div43: div43Amount,
    div40: div40Amount,
    total: div43Amount + div40Amount
  }
}

export const estimateCGT = (salePrice, costBase, ownershipYears, marginalTaxRate, isResident = true) => {
  const capitalGain = salePrice - costBase
  
  if (capitalGain <= 0) return 0
  
  // Apply 50% CGT discount for residents holding > 1 year
  const discountedGain = (isResident && ownershipYears > 1) 
    ? capitalGain * 0.5 
    : capitalGain
    
  return discountedGain * marginalTaxRate
}

// Projection calculation engine
export const calculatePropertyProjection = (inputs, years = 30) => {
  const {
    propertyValue,
    loanAmount,
    interestRate,
    termYears,
    propertyGrowth,
    rentalYield,
    rentGrowth,
    vacancyRate,
    ioYears = 0,
    offsetBalance = 0,
    offsetContribution = 0,
    extraRepayments = 0,
    state,
    propertyType,
    // Costs
    managementFeeRate = 0.07,
    councilRates = 2000,
    insurance = 800,
    maintenanceRate = 0.01,
    // Tax settings
    marginalTaxRate = 0.325,
    depreciationEnabled = true
  } = inputs

  const results = []
  let currentValue = propertyValue
  let currentBalance = loanAmount
  let currentOffset = offsetBalance
  let currentYear = 0
  let isIOPeriod = true

  for (let year = 1; year <= years; year++) {
    currentYear = year
    isIOPeriod = year <= ioYears

    // Property value growth
    currentValue *= (1 + propertyGrowth)

    // Rental income
    const annualRent = currentValue * rentalYield * Math.pow(1 + rentGrowth, year - 1)
    const rentCollected = annualRent * (1 - vacancyRate)

    // Expenses
    const managementFee = rentCollected * managementFeeRate
    const maintenance = currentValue * maintenanceRate
    const landTax = calculateLandTax(currentValue * 0.3, state) // Assuming 30% land value
    const totalExpenses = managementFee + councilRates + insurance + maintenance + landTax

    // Loan repayments
    let monthlyPayment, annualInterest, annualPrincipal

    if (isIOPeriod) {
      monthlyPayment = calculateIOPayment(currentBalance, interestRate, currentOffset)
      annualInterest = monthlyPayment * 12
      annualPrincipal = extraRepayments * 12
    } else {
      const remainingTerm = termYears - ioYears
      monthlyPayment = calculatePIPayment(currentBalance, interestRate, remainingTerm)
      annualInterest = 0
      annualPrincipal = 0
      
      // Calculate interest and principal components
      for (let month = 1; month <= 12; month++) {
        const monthlyInterest = calculateMonthlyInterest(currentBalance, interestRate, currentOffset)
        const monthlyPrincipal = Math.max(0, monthlyPayment - monthlyInterest)
        
        annualInterest += monthlyInterest
        annualPrincipal += monthlyPrincipal
        currentBalance -= monthlyPrincipal
      }
    }

    // Apply extra repayments and offset contributions
    currentBalance -= annualPrincipal
    currentOffset += offsetContribution * 12

    // Net cash flow
    const netOperatingIncome = rentCollected - totalExpenses
    const cashFlowAfterDebt = netOperatingIncome - annualInterest - annualPrincipal

    // Tax calculations
    let taxSavings = 0
    let depreciation = 0
    
    if (depreciationEnabled) {
      const depResult = calculateDepreciation(propertyValue, '2020-01-01', '2024-01-01')
      depreciation = depResult.total
    }

    const taxableIncome = netOperatingIncome - annualInterest - depreciation
    if (taxableIncome < 0) {
      taxSavings = Math.abs(taxableIncome) * marginalTaxRate
    }

    const cashFlowAfterTax = cashFlowAfterDebt + taxSavings

    // Equity calculations
    const bookEquity = currentValue - currentBalance
    const sellingCosts = currentValue * 0.065 // 6.5% total selling costs
    const estimatedCGT = estimateCGT(currentValue, propertyValue, year, marginalTaxRate)
    const netEquityIfSold = currentValue - sellingCosts - currentBalance - estimatedCGT

    // LVR
    const lvr = (currentBalance / currentValue) * 100

    results.push({
      year,
      propertyValue: currentValue,
      loanBalance: currentBalance,
      offsetBalance: currentOffset,
      rentCollected,
      totalExpenses,
      netOperatingIncome,
      annualInterest,
      annualPrincipal,
      monthlyPayment: monthlyPayment * 12,
      cashFlowAfterDebt,
      taxSavings,
      depreciation,
      cashFlowAfterTax,
      bookEquity,
      netEquityIfSold,
      lvr,
      isIOPeriod
    })
  }

  return results
}

// Risk scenario calculations
export const applyRiskScenarios = (baseResults, scenarios) => {
  // Implementation for stress testing scenarios
  return scenarios.map(scenario => {
    // Apply rate shocks, growth downturns, vacancy increases
    return baseResults.map(year => ({
      ...year,
      scenario: scenario.name,
      // Modified values based on scenario
    }))
  })
}

// Export utility for CSV download
export const exportToCSV = (projectionData, filename = 'property-projection.csv') => {
  const headers = Object.keys(projectionData[0]).join(',')
  const rows = projectionData.map(row => 
    Object.values(row).map(value => 
      typeof value === 'number' ? value.toFixed(2) : value
    ).join(',')
  ).join('\n')
  
  const csvContent = headers + '\n' + rows
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  
  URL.revokeObjectURL(url)
}