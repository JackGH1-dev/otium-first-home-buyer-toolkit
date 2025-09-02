import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Info,
  Calculator,
  Users,
  ChevronDown,
  ChevronUp,
  Settings,
  Home,
  Building,
  Percent,
  Calendar,
  CreditCard,
  Plus,
  X,
  Car,
  Trash2
} from 'lucide-react'
import { useStepData, useToolkit } from '../ToolkitContext'
import { 
  calculateBorrowingPower, 
  calculateHECSRepayment,
  calculateHEMExpenses,
  calculateAustralianNetIncome,
  formatCurrency, 
  formatPercentage,
  validateFinancialInputs 
} from '../../../utils/financialCalculations'

const BorrowingPowerEstimator = () => {
  const navigate = useNavigate()
  const { data, setData, updateCalculations } = useStepData('borrowingPower')
  const { actions } = useToolkit()
  
  const [errors, setErrors] = useState({})
  const [results, setResults] = useState(null)
  const [liabilities, setLiabilities] = useState([])
  const [otherIncomes, setOtherIncomes] = useState([])
  const [showIncomeDropdown, setShowIncomeDropdown] = useState(false)
  
  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    loanSettings: false,
    investmentProperty: false,
    advancedOptions: false
  })
  const [showHECS, setShowHECS] = useState(false)
  const [useHEMBenchmark, setUseHEMBenchmark] = useState(false)
  const [showHEMTooltip, setShowHEMTooltip] = useState(false)
  const [showRentTooltip, setShowRentTooltip] = useState(false)
  const [showRentalShadingTooltip, setShowRentalShadingTooltip] = useState(false)

  // Enhanced form state with all loan preferences
  const [formData, setFormData] = useState({
    // Basic Info
    scenario: data.scenario || 'single',
    primaryIncome: data.primaryIncome || '',
    secondaryIncome: data.secondaryIncome || '',
    dependents: data.dependents || 0,
    monthlyLivingExpenses: data.monthlyLivingExpenses || '',
    hasHECS: data.hasHECS || false,
    hecsBalance: data.hecsBalance || '',
    monthlyLiabilities: data.monthlyLiabilities || 0,
    postcode: data.postcode || '',
    postPurchaseLiving: data.postPurchaseLiving || 'own-property',
    weeklyRentBoard: data.weeklyRentBoard || '',
    primaryHECSBalance: data.primaryHECSBalance || '',
    secondaryHECSBalance: data.secondaryHECSBalance || '',
    
    // Loan Preferences
    propertyType: data.propertyType || 'owner-occupied', // 'owner-occupied' or 'investment'
    loanType: data.loanType || 'principal_interest',
    repaymentFrequency: data.repaymentFrequency || 'monthly',
    termYears: data.termYears || 30,
    interestRate: data.interestRate || 5.5,
    
    // Investment Property Specific
    expectedRentalYield: data.expectedRentalYield || 4.5,
    managementFees: data.managementFees || 8,
    marginalTaxRate: data.marginalTaxRate || 32.5,
    // New investment property fields
    weeklyRent: data.weeklyRent || '',
    propertyOwnership: data.propertyOwnership || 'even_split',
    yourOwnershipPercent: data.yourOwnershipPercent || 50,
    partnerOwnershipPercent: data.partnerOwnershipPercent || 50,
    propertyExpenseType: data.propertyExpenseType || 'percentage', // 'percentage' or 'manual'
    propertyExpensePercent: data.propertyExpensePercent || 15,
    propertyExpenseManual: data.propertyExpenseManual || '',
    // Rental expense for "renting elsewhere"
    weeklyRentalExpense: data.weeklyRentalExpense || ''
  })

  // Toggle collapsible sections
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Liability management functions
  const addLiability = () => {
    const newLiability = {
      id: Date.now(),
      type: 'credit_card',
      description: '',
      monthlyPayment: 0,
      balance: 0,
      creditLimit: 0
    }
    setLiabilities(prev => [...prev, newLiability])
  }

  const removeLiability = (id) => {
    setLiabilities(prev => prev.filter(liability => liability.id !== id))
  }

  const updateLiability = (id, field, value) => {
    setLiabilities(prev => prev.map(liability => {
      if (liability.id === id) {
        const updatedLiability = {
          ...liability,
          [field]: ['monthlyPayment', 'balance', 'creditLimit'].includes(field) ? parseFloat(value) || 0 : value
        }
        
        // Auto-calculate monthly payment for credit cards based on 3.5% of limit  
        if (liability.type === 'credit_card' && field === 'creditLimit') {
          updatedLiability.monthlyPayment = (parseFloat(value) || 0) * 0.035
        }
        
        return updatedLiability
      }
      return liability
    }))
  }

  // Income types configuration
  const INCOME_TYPES = [
    { id: 'bonus', label: 'Bonus', shadingRate: 0.8, comingSoon: false },
    { id: 'commission', label: 'Commission', shadingRate: 0.8, comingSoon: false },
    { id: 'overtime', label: 'Overtime', shadingRate: 0.8, comingSoon: false },
    { id: 'allowances', label: 'Allowances', shadingRate: 0.8, comingSoon: false },
    { id: 'rental', label: 'Rental Income', shadingRate: 0.8, comingSoon: false },
    { id: 'self-employed', label: 'Self-Employment', shadingRate: 0.7, comingSoon: true },
    { id: 'government-benefits', label: 'Government Benefits', shadingRate: 1.0, comingSoon: true },
    { id: 'investment-income', label: 'Investment Income', shadingRate: 1.0, comingSoon: true }
  ]

  // Other income management functions
  const addOtherIncome = (type) => {
    const incomeType = INCOME_TYPES.find(t => t.id === type)
    if (!incomeType || incomeType.comingSoon) return
    
    const newIncome = {
      id: Date.now(),
      type,
      label: incomeType.label,
      amount: '',
      frequency: 'annual',
      shadingRate: incomeType.shadingRate
    }
    setOtherIncomes(prev => [...prev, newIncome])
    setShowIncomeDropdown(false)
  }

  const removeOtherIncome = (id) => {
    setOtherIncomes(prev => prev.filter(income => income.id !== id))
  }

  const updateOtherIncome = (id, field, value) => {
    setOtherIncomes(prev => prev.map(income => {
      if (income.id === id) {
        return {
          ...income,
          [field]: ['amount'].includes(field) ? parseFloat(value) || 0 : value
        }
      }
      return income
    }))
  }

  // Calculate total monthly liabilities from individual items
  const totalMonthlyLiabilities = liabilities.reduce((sum, liability) => sum + (liability.monthlyPayment || 0), 0)

  // Update formData when liabilities change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      monthlyLiabilities: totalMonthlyLiabilities
    }))
  }, [totalMonthlyLiabilities])

  // Update form data
  // Auto-calculate tax rate based on actual income
  const getAutoTaxRate = (income) => {
    const annualIncome = parseFloat(income) || parseFloat(formData.primaryIncome) || 0
    // Calculate marginal tax rate based on income brackets
    if (annualIncome > 190000) return 45
    if (annualIncome > 135000) return 37
    if (annualIncome > 45000) return 30
    if (annualIncome > 18200) return 16
    return 0
  }

  const handleInputChange = (field, value) => {
    const numericFields = [
      'primaryIncome', 'secondaryIncome', 'monthlyLivingExpenses', 'hecsBalance', 
      'dependents', 'monthlyLiabilities', 'interestRate', 'termYears',
      'expectedRentalYield', 'managementFees', 'marginalTaxRate',
      'weeklyRent', 'yourOwnershipPercent', 'partnerOwnershipPercent', 
      'propertyExpensePercent', 'propertyExpenseManual', 'weeklyRentalExpense'
    ]
    const numericValue = numericFields.includes(field) 
      ? parseFloat(value) || 0 
      : value

    setFormData(prev => {
      const newData = { ...prev, [field]: numericValue }
      
      // Auto-update tax rate when income changes
      if (field === 'primaryIncome') {
        newData.marginalTaxRate = getAutoTaxRate(numericValue)
      }
      
      // Handle property ownership changes
      if (field === 'propertyOwnership') {
        // Reset to even split when ownership type changes
        if (numericValue === 'even_split') {
          newData.yourOwnershipPercent = 50
          newData.partnerOwnershipPercent = 50
        }
      }
      
      // Keep ownership percentages in sync (always total 100%)
      if (field === 'yourOwnershipPercent') {
        newData.partnerOwnershipPercent = 100 - numericValue
      } else if (field === 'partnerOwnershipPercent') {
        newData.yourOwnershipPercent = 100 - numericValue
      }
      
      return newData
    })

    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }

    // Auto-set HEM benchmark when checkbox is ticked and relevant inputs change
    if (useHEMBenchmark && (field === 'scenario' || field === 'primaryIncome' || field === 'secondaryIncome' || field === 'dependents')) {
      const totalIncome = field === 'primaryIncome' ? numericValue : 
                         field === 'secondaryIncome' ? (formData.primaryIncome || 0) + numericValue :
                         (formData.primaryIncome || 0) + (formData.secondaryIncome || 0)
      const scenario = field === 'scenario' ? value : formData.scenario
      const dependents = field === 'dependents' ? numericValue : formData.dependents
      
      if (totalIncome > 0) {
        const hemBenchmark = calculateHEMExpenses(scenario, totalIncome, dependents)
        
        setFormData(prev => ({
          ...prev,
          [field]: numericValue,
          monthlyLivingExpenses: hemBenchmark
        }))
        return
      }
    }
  }

  // Calculate rental expense for post-purchase living
  const calculateRentalExpense = (postPurchaseLiving, weeklyRentBoard) => {
    if (postPurchaseLiving === 'own-property') return 0
    
    const NOTIONAL_RENT_WEEKLY = 150 // Minimum lender assessment
    const userWeeklyAmount = parseFloat(weeklyRentBoard) || parseFloat(formData.weeklyRentalExpense) || 0
    const weeklyRent = Math.max(userWeeklyAmount, NOTIONAL_RENT_WEEKLY)
    
    return weeklyRent * 52 / 12 // Convert to monthly
  }

  // Calculate total other income with shading
  const calculateOtherIncomeTotal = () => {
    return otherIncomes.reduce((sum, income) => {
      const amount = parseFloat(income.amount) || 0
      const annualAmount = income.frequency === 'monthly' ? amount * 12 : amount
      return sum + (annualAmount * income.shadingRate)
    }, 0)
  }

  // Enhanced borrowing power calculation
  const calculateResults = () => {
    // Validate inputs
    const validationErrors = validateFinancialInputs({
      income: formData.primaryIncome,
      expenses: formData.monthlyLivingExpenses,
      interestRate: formData.interestRate / 100
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // 1. Calculate total income (with shading for other income)
    const primaryIncome = parseFloat(formData.primaryIncome) || 0
    const secondaryIncome = formData.scenario === 'couple' ? parseFloat(formData.secondaryIncome) || 0 : 0
    const otherIncomeTotal = calculateOtherIncomeTotal()
    
    // Calculate net income including investment property (Net Income Method)
    let grossRentalIncome = 0
    let totalGrossIncome = primaryIncome + secondaryIncome + otherIncomeTotal
    let totalNetIncome = 0
    
    if (formData.propertyType === 'investment' && parseFloat(formData.weeklyRent) > 0) {
      const weeklyRent = parseFloat(formData.weeklyRent) || 0
      const grossAnnualRent = weeklyRent * 52
      
      // Apply ownership percentage to gross rental income
      const ownershipPercent = formData.propertyOwnership === 'you_only' ? 100 :
                              formData.propertyOwnership === 'partner_only' ? 0 :
                              parseFloat(formData.yourOwnershipPercent) || 50
      grossRentalIncome = (grossAnnualRent * ownershipPercent) / 100
      
      // Calculate investment property expenses and interest deductions
      const interestRate = parseFloat(formData.interestRate) || 5.5
      const estimatedPropertyValue = (weeklyRent * 52) / 0.035 // 3.5% yield assumption (more realistic)
      const estimatedLoanAmount = estimatedPropertyValue * 0.8 // 80% LVR
      const annualInterest = estimatedLoanAmount * (interestRate / 100)
      const rentalExpenses = grossRentalIncome * 0.2 // 20% expenses
      
      
      // Calculate net taxable rental income
      const netTaxableRentalIncome = grossRentalIncome - rentalExpenses - annualInterest
      
      // Calculate total taxable income
      const totalTaxableIncome = totalGrossIncome + netTaxableRentalIncome
      
      // Calculate tax payable on taxable income
      const taxCalculationResult = calculateAustralianNetIncome(totalTaxableIncome)
      const taxPayable = totalTaxableIncome - taxCalculationResult.netIncome
      
      // Calculate final net income: Gross Income - Tax Payable
      const totalGrossIncome_All = totalGrossIncome + grossRentalIncome
      totalNetIncome = totalGrossIncome_All - taxPayable
      
      // Add gross rental to total gross for HECS calculation
      totalGrossIncome += grossRentalIncome
    } else {
      // No investment property - calculate tax on employment income only
      const totalTaxResult = calculateAustralianNetIncome(totalGrossIncome)
      totalNetIncome = totalTaxResult.netIncome
    }
    
    // Debug logging

    // 2. Calculate HECS repayments for each applicant
    const primaryHECS = formData.primaryHECSBalance > 0 ? calculateHECSRepayment(primaryIncome) : 0
    const secondaryHECS = formData.scenario === 'couple' && formData.secondaryHECSBalance > 0 
      ? calculateHECSRepayment(secondaryIncome) : 0
    const totalAnnualHECS = primaryHECS + secondaryHECS

    // 3. Calculate post-purchase rental expense
    const rentalExpense = calculateRentalExpense(formData.postPurchaseLiving, formData.weeklyRentBoard)
    
    
    // 4. Enhanced base parameters
    const baseParams = {
      primaryIncome: totalGrossIncome, // Keep for HECS calculation
      secondaryIncome: 0, // Already included in primaryIncome
      preCalculatedNetIncome: totalNetIncome, // Pass our calculated net income
      existingDebts: 0,
      livingExpenses: (parseFloat(formData.monthlyLivingExpenses) || 0) + rentalExpense,
      monthlyLiabilities: totalMonthlyLiabilities + (totalAnnualHECS / 12), // Include HECS
      interestRate: formData.interestRate / 100,
      termYears: formData.termYears,
      dependents: formData.dependents,
      hasHECS: totalAnnualHECS > 0,
      hecsBalance: (parseFloat(formData.primaryHECSBalance) || 0) + (parseFloat(formData.secondaryHECSBalance) || 0),
      scenario: formData.scenario,
      loanType: formData.loanType,
      repaymentFrequency: formData.repaymentFrequency,
      // Enhanced details
      otherIncomeTotal,
      netRentalIncome: grossRentalIncome,
      rentalExpense,
      totalAnnualHECS
    }

    
    const result = calculateBorrowingPower(baseParams)
    
    
    // Add enhanced details to results
    const enhancedResult = {
      ...result,
      totalAnnualIncome: totalGrossIncome,
      otherIncomeTotal,
      netRentalIncome: grossRentalIncome,
      grossRentalIncome,
      rentalExpense,
      hecsImpact: totalAnnualHECS,
      details: {
        primaryIncome,
        secondaryIncome,
        otherIncomeTotal,
        monthlyExpenses: parseFloat(formData.monthlyLivingExpenses) || 0,
        rentalExpense,
        hecsRepayment: totalAnnualHECS,
        monthlyLiabilities: totalMonthlyLiabilities
      }
    }
    
    setResults(enhancedResult)

    // Save data to context with enhanced fields
    setData({
      ...formData,
      otherIncomes,
      maxLoan: enhancedResult.maxLoan,
      surplus: enhancedResult.surplus,
      dti: enhancedResult.dti,
      assessedExpenses: enhancedResult.assessedExpenses,
      hemBenchmark: enhancedResult.hemBenchmark,
      hecsImpact: enhancedResult.hecsImpact,
      totalAnnualIncome: enhancedResult.totalAnnualIncome,
      rentalExpense: enhancedResult.rentalExpense
    })

    updateCalculations({
      maxLoan: enhancedResult.maxLoan,
      surplus: enhancedResult.surplus,
      dti: enhancedResult.dti,
      assessedExpenses: enhancedResult.assessedExpenses,
      hemBenchmark: enhancedResult.hemBenchmark,
      hecsImpact: enhancedResult.hecsImpact,
      totalAnnualIncome: enhancedResult.totalAnnualIncome,
      rentalExpense: enhancedResult.rentalExpense
    })
  }

  // Auto-calculate when form changes
  useEffect(() => {
    if (formData.primaryIncome && formData.monthlyLivingExpenses) {
      const timer = setTimeout(calculateResults, 500)
      return () => clearTimeout(timer)
    }
  }, [formData, otherIncomes, liabilities])

  // Auto-update HEM when checkbox is ticked and inputs change
  useEffect(() => {
    if (useHEMBenchmark && (formData.primaryIncome > 0 || formData.secondaryIncome > 0)) {
      const totalIncome = (formData.primaryIncome || 0) + (formData.secondaryIncome || 0)
      const hemBenchmark = calculateHEMExpenses(formData.scenario, totalIncome, formData.dependents)
      if (formData.monthlyLivingExpenses !== hemBenchmark) {
        setFormData(prev => ({
          ...prev,
          monthlyLivingExpenses: hemBenchmark
        }))
      }
    }
  }, [useHEMBenchmark, formData.scenario, formData.primaryIncome, formData.secondaryIncome, formData.dependents])

  // Load existing results
  useEffect(() => {
    if (data.maxLoan) {
      setResults({
        maxLoan: data.maxLoan,
        surplus: data.surplus,
        dti: data.dti,
        assessedExpenses: data.assessedExpenses,
        hemBenchmark: data.hemBenchmark,
        hecsImpact: data.hecsImpact
      })
    }
  }, [])

  const handleNext = () => {
    if (!results || results.maxLoan <= 0) {
      setErrors({ general: 'Please complete the calculation before proceeding' })
      return
    }

    actions.completeStep(1)
    navigate('/first-home-buyer/purchase-price')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Main Calculator - 2 Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Card: Income, Expenses & Liabilities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Calculator className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Income & Expenses</h3>
          </div>

          <div className="space-y-6">
            {/* Scenario Selection - Compact Design */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Your Situation</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'single', label: 'Single Person', icon: '👤' },
                  { value: 'couple', label: 'Couple', icon: '👫' }
                ].map((scenario) => (
                  <button
                    key={scenario.value}
                    onClick={() => handleInputChange('scenario', scenario.value)}
                    className={`p-2 rounded-lg border transition-all text-center text-sm ${
                      formData.scenario === scenario.value
                        ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="mr-1">{scenario.icon}</span>
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Income */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.scenario === 'couple' ? 'Primary Annual Income *' : 'Annual Income *'}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.primaryIncome}
                  onChange={(e) => handleInputChange('primaryIncome', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="85000"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Gross income before tax
                </p>
                {formData.primaryIncome > 0 && (
                  <p className="text-xs text-blue-600 font-medium">
                    Net: {formatCurrency(calculateAustralianNetIncome(formData.primaryIncome).netIncome)}
                  </p>
                )}
              </div>
            </div>


            {/* Secondary Income (Couple only) */}
            {formData.scenario === 'couple' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Partner Annual Income
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.secondaryIncome}
                    onChange={(e) => handleInputChange('secondaryIncome', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="65000"
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Partner's gross income (optional)
                  </p>
                  {formData.secondaryIncome > 0 && (
                    <p className="text-xs text-blue-600 font-medium">
                      Net: {formatCurrency(calculateAustralianNetIncome(formData.secondaryIncome).netIncome)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Other Income Sources - Only show when there are income sources OR add button */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Other Income Sources
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIncomeDropdown(!showIncomeDropdown)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Income</span>
                  </button>
                  
                  {showIncomeDropdown && (
                    <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
                      <div className="p-2">
                        {INCOME_TYPES.map(type => (
                          <button
                            key={type.id}
                            onClick={() => addOtherIncome(type.id)}
                            disabled={type.comingSoon}
                            className={`block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors ${
                              type.comingSoon ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                            }`}
                          >
                            {type.label}
                            {type.comingSoon && <span className="text-gray-400 ml-2">(Coming Soon)</span>}
                            {!type.comingSoon && <span className="text-blue-600 ml-2 text-xs">({(type.shadingRate * 100)}% assessed)</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Only show content area if there are other incomes */}
              {otherIncomes.length > 0 && (
                <div className="space-y-3">
                  {otherIncomes.map((income) => (
                    <div key={income.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                            {income.label}
                          </span>
                          <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            {(income.shadingRate * 100)}% assessed
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOtherIncome(income.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Amount
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                            <input
                              type="number"
                              value={income.amount}
                              onChange={(e) => updateOtherIncome(income.id, 'amount', e.target.value)}
                              className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                              placeholder="10000"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Frequency
                          </label>
                          <select
                            value={income.frequency}
                            onChange={(e) => updateOtherIncome(income.id, 'frequency', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                          >
                            <option value="annual">Annual</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </div>
                      
                      {income.amount > 0 && (
                        <div className="mt-2 text-xs text-blue-700">
                          Assessed value: {formatCurrency(
                            (income.frequency === 'monthly' ? income.amount * 12 : income.amount) * income.shadingRate
                          )}/year
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Additional income is assessed at reduced rates for lending purposes
                  </p>
                </div>
              )}
            </div>

            {/* Dependents */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Dependents
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.dependents}
                  onChange={(e) => handleInputChange('dependents', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Children or other dependents you financially support
              </p>
            </div>

            {/* Postcode for HEM */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Your Current Postcode
              </label>
              <input
                type="text"
                value={formData.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
                className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="2000"
                maxLength="4"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for location-based living expense calculations
              </p>
            </div>

            {/* Monthly Living Expenses */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Living Expenses *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.monthlyLivingExpenses}
                  onChange={(e) => handleInputChange('monthlyLivingExpenses', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="3800"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Include food, transport, utilities, insurance, entertainment, etc.
                  </p>
                </div>
                
                {(formData.primaryIncome > 0 || formData.secondaryIncome > 0) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="useHEM"
                        checked={useHEMBenchmark}
                        onChange={(e) => {
                          setUseHEMBenchmark(e.target.checked)
                          if (e.target.checked) {
                            const totalIncome = (formData.primaryIncome || 0) + (formData.secondaryIncome || 0)
                            const hemBenchmark = calculateHEMExpenses(formData.scenario, totalIncome, formData.dependents)
                            handleInputChange('monthlyLivingExpenses', hemBenchmark)
                          }
                        }}
                        className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="useHEM" className="text-xs text-blue-600 font-medium">
                        Use HEM Benchmark
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={() => setShowHEMTooltip(true)}
                          onMouseLeave={() => setShowHEMTooltip(false)}
                          className="w-4 h-4 rounded-full bg-gray-300 text-white text-xs flex items-center justify-center hover:bg-gray-400 transition-colors"
                        >
                          ?
                        </button>
                        {showHEMTooltip && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-30">
                            <div className="font-medium mb-1">HEM Benchmark</div>
                            <div>
                              Household Expenditure Measure - Australian government data on typical household spending patterns based on income, dependents, and location. Used by lenders as a minimum expense assessment.
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* HECS/HELP Debt Section - Checkbox Design */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="hasHECS"
                  checked={showHECS || formData.primaryHECSBalance > 0 || formData.secondaryHECSBalance > 0}
                  onChange={(e) => {
                    setShowHECS(e.target.checked)
                    if (!e.target.checked) {
                      handleInputChange('primaryHECSBalance', '')
                      handleInputChange('secondaryHECSBalance', '')
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasHECS" className="text-sm font-semibold text-gray-700">
                  I have HECS/HELP debt
                </label>
              </div>
              
              {(showHECS || formData.primaryHECSBalance > 0 || formData.secondaryHECSBalance > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.scenario === 'couple' ? 'Primary Applicant' : 'HECS/HELP'} Balance
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={formData.primaryHECSBalance}
                        onChange={(e) => handleInputChange('primaryHECSBalance', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="25000"
                      />
                    </div>
                    {formData.primaryHECSBalance > 0 && formData.primaryIncome > 0 && (
                      <p className="text-xs text-yellow-700 mt-1">
                        Annual repayment: {formatCurrency(calculateHECSRepayment(formData.primaryIncome))}
                      </p>
                    )}
                  </div>
                  
                  {formData.scenario === 'couple' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Applicant Balance
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={formData.secondaryHECSBalance}
                          onChange={(e) => handleInputChange('secondaryHECSBalance', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="25000"
                        />
                      </div>
                      {formData.secondaryHECSBalance > 0 && formData.secondaryIncome > 0 && (
                        <p className="text-xs text-yellow-700 mt-1">
                          Annual repayment: {formatCurrency(calculateHECSRepayment(formData.secondaryIncome))}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600">
                    HECS repayments are calculated automatically based on individual incomes
                  </p>
                </motion.div>
              )}
            </div>

            {/* Other Commitments & Liabilities */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Other Monthly Commitments
                </label>
                <button
                  type="button"
                  onClick={addLiability}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Commitment</span>
                </button>
              </div>

              {liabilities.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 mb-2">No other commitments</p>
                  <p className="text-xs text-gray-400">Add credit cards, loans, BNPL, or other debts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liabilities.map((liability) => (
                    <div key={liability.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {liability.type === 'credit_card' && <CreditCard className="h-4 w-4 text-red-500" />}
                          {liability.type === 'personal_loan' && <DollarSign className="h-4 w-4 text-orange-500" />}
                          {liability.type === 'car_loan' && <Car className="h-4 w-4 text-blue-500" />}
                          {liability.type === 'bnpl' && <span className="text-sm">📱</span>}
                          {liability.type === 'other_mortgage' && <Home className="h-4 w-4 text-green-500" />}
                          {liability.type === 'other' && <Settings className="h-4 w-4 text-gray-500" />}
                          <select
                            value={liability.type}
                            onChange={(e) => updateLiability(liability.id, 'type', e.target.value)}
                            className="text-sm font-medium bg-transparent border-none focus:outline-none"
                          >
                            <option value="credit_card">Credit Card</option>
                            <option value="personal_loan">Personal Loan</option>
                            <option value="car_loan">Car Loan</option>
                            <option value="bnpl">Buy Now Pay Later (BNPL)</option>
                            <option value="other_mortgage">Other Mortgage</option>
                            <option value="other">Other Commitment</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLiability(liability.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={liability.description}
                            onChange={(e) => updateLiability(liability.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                            placeholder={
                              liability.type === 'credit_card' ? 'Westpac Credit Card' :
                              liability.type === 'car_loan' ? 'Toyota Camry' :
                              liability.type === 'bnpl' ? 'Afterpay/Zip' :
                              liability.type === 'other_mortgage' ? 'Investment Property' :
                              'Description'
                            }
                          />
                        </div>
                        {liability.type === 'credit_card' ? (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Credit Limit
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <input
                                  type="number"
                                  value={liability.creditLimit}
                                  onChange={(e) => updateLiability(liability.id, 'creditLimit', e.target.value)}
                                  className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                                  placeholder="10000"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Monthly Payment (Auto)
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <input
                                  type="number"
                                  value={liability.monthlyPayment}
                                  readOnly
                                  className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                  placeholder="Auto-calculated"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">3.5% of credit limit</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Monthly Payment
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <input
                                  type="number"
                                  value={liability.monthlyPayment}
                                  onChange={(e) => updateLiability(liability.id, 'monthlyPayment', e.target.value)}
                                  className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {liability.type === 'credit_card' ? 'Credit Limit' : 'Total Balance'} (Optional)
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <input
                                  type="number"
                                  value={liability.type === 'credit_card' ? liability.creditLimit : liability.balance}
                                  onChange={(e) => updateLiability(liability.id, liability.type === 'credit_card' ? 'creditLimit' : 'balance', e.target.value)}
                                  className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Total Summary */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-700">Total Monthly Commitments</span>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(totalMonthlyLiabilities)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Include all monthly commitments - HECS repayments calculated separately above
              </p>
            </div>

            {/* Advanced Options - Progressive Disclosure */}
            <div className="border border-gray-200 rounded-lg mt-6">
              <button
                onClick={() => toggleSection('advancedOptions')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Show Advanced Options</span>
                </div>
                {expandedSections.advancedOptions ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.advancedOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4 space-y-4 border-t border-gray-100"
                >
                  {/* Future: Assets & Savings */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-700">Assets & Savings</h4>
                        <p className="text-sm text-gray-500">Deposit source, existing property value</p>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
                    </div>
                  </div>

                  {/* Future: Risk Assessment */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-700">Risk Assessment</h4>
                        <p className="text-sm text-gray-500">Stress testing, job security factors</p>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
                    </div>
                  </div>

                  {/* Future: Guarantor Support */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-700">Family Guarantee</h4>
                        <p className="text-sm text-gray-500">Parent/family guarantee scenarios</p>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-blue-600 text-center pt-2">
                    💡 These advanced features are in development and will be available soon
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Side: Loan Settings & Results */}
        <div className="space-y-6">
          {/* Loan Settings Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Loan Preferences</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Property Type Selection */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Property Type</h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { 
                      value: 'owner-occupied', 
                      label: 'Owner Occupied', 
                      icon: Home,
                      desc: 'Live in the property'
                    },
                    { 
                      value: 'investment', 
                      label: 'Investment Property', 
                      icon: Building,
                      desc: 'Rent out for income'
                    }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleInputChange('propertyType', type.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.propertyType === type.value
                          ? 'bg-purple-50 border-purple-500 text-purple-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <type.icon className="h-4 w-4 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs opacity-75">{type.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Post-Purchase Living Situation - Compact Layout */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      After this purchase, you will be
                    </label>
                    <select
                      value={formData.postPurchaseLiving}
                      onChange={(e) => handleInputChange('postPurchaseLiving', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      {formData.propertyType === 'owner-occupied' ? (
                        <>
                          <option value="own-property">Living in the purchased property</option>
                          <option value="renting">Renting elsewhere</option>
                          <option value="parents">Living with parents/family</option>
                          <option value="other">Other arrangement</option>
                        </>
                      ) : (
                        <>
                          <option value="renting">Renting elsewhere</option>
                          <option value="parents">Living with parents/family</option>
                          <option value="other">Other arrangement</option>
                        </>
                      )}
                    </select>
                  </div>

                  {formData.postPurchaseLiving !== 'own-property' && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      className="relative"
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="flex items-center gap-1">
                          Weekly Rent
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onMouseEnter={() => setShowRentTooltip(true)}
                              onMouseLeave={() => setShowRentTooltip(false)}
                              className="w-4 h-4 rounded-full bg-gray-300 text-white text-xs flex items-center justify-center hover:bg-gray-400 transition-colors"
                            >
                              ?
                            </button>
                            {showRentTooltip && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-30">
                                <div className="font-medium mb-1">Minimum Assessment</div>
                                <div>
                                  Lenders use minimum $150/week for assessment purposes, even if your actual rent is lower.
                                </div>
                              </div>
                            )}
                          </div>
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <input
                          type="number"
                          value={formData.weeklyRentBoard}
                          onChange={(e) => handleInputChange('weeklyRentBoard', e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                          placeholder="350"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>


              {/* Investment Property Details - Collapsible */}
              {formData.propertyType === 'investment' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border border-orange-200 rounded-lg"
                >
                  <button
                    onClick={() => toggleSection('investmentProperty')}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-700 text-sm">Investment Details</span>
                    </div>
                    {expandedSections.investmentProperty ? (
                      <ChevronUp className="h-4 w-4 text-orange-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-orange-400" />
                    )}
                  </button>
                  
                  {expandedSections.investmentProperty && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-3 pb-3 space-y-3 border-t border-orange-100"
                    >
                      <div className="grid grid-cols-1 gap-3">
                        {/* Weekly Rent Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weekly Rent
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                            <input
                              type="number"
                              min="0"
                              value={formData.weeklyRent}
                              onChange={(e) => handleInputChange('weeklyRent', e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                              placeholder="500"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Expected weekly rental income</p>
                        </div>

                        {/* Property Ownership Structure */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Property Ownership
                          </label>
                          <select
                            value={formData.propertyOwnership}
                            onChange={(e) => handleInputChange('propertyOwnership', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                          >
                            <option value="even_split">You & Partner (50/50 split)</option>
                            <option value="manual_split">You & Partner (manual split)</option>
                            <option value="you_only">You only (100%)</option>
                            <option value="partner_only">Partner only (0%)</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Ownership affects your portion of rental income</p>
                        </div>

                        {/* Manual Ownership Percentages */}
                        {(formData.propertyOwnership === 'manual_split' || formData.propertyOwnership === 'even_split') && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Your Share (%)
                              </label>
                              <div className="relative">
                                <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={formData.yourOwnershipPercent}
                                  onChange={(e) => handleInputChange('yourOwnershipPercent', e.target.value)}
                                  disabled={formData.propertyOwnership === 'even_split'}
                                  className={`w-full pl-6 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:border-orange-500 focus:outline-none ${
                                    formData.propertyOwnership === 'even_split' ? 'bg-gray-50 text-gray-600' : ''
                                  }`}
                                  placeholder="50"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Partner Share (%)
                              </label>
                              <div className="relative">
                                <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={formData.partnerOwnershipPercent}
                                  onChange={(e) => handleInputChange('partnerOwnershipPercent', e.target.value)}
                                  disabled={formData.propertyOwnership === 'even_split'}
                                  className={`w-full pl-6 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:border-orange-500 focus:outline-none ${
                                    formData.propertyOwnership === 'even_split' ? 'bg-gray-50 text-gray-600' : ''
                                  }`}
                                  placeholder="50"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Auto Tax Rate Display */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marginal Tax Rate
                          </label>
                          <div className="relative">
                            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                            <input
                              type="number"
                              value={formData.marginalTaxRate}
                              readOnly
                              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                            />
                          </div>
                          <p className="text-xs text-orange-600 mt-1">Based on your annual income</p>
                        </div>

                      </div>
                      <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded-lg flex items-center gap-1">
                        <Info className="h-3 w-3 flex-shrink-0" />
                        <span>Your share of net rental income = Weekly rent × 52 × 80% × Your ownership %</span>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onMouseEnter={() => setShowRentalShadingTooltip(true)}
                            onMouseLeave={() => setShowRentalShadingTooltip(false)}
                            className="w-4 h-4 rounded-full bg-orange-400 text-white text-xs flex items-center justify-center hover:bg-orange-500 transition-colors"
                          >
                            ?
                          </button>
                          {showRentalShadingTooltip && (
                            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-30">
                              <div className="font-medium mb-1">20% Rental Income Shading</div>
                              <div>
                                Lenders apply a 20% reduction to gross rental income to account for potential vacancies, maintenance costs, and property management fees.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Loan Settings - Collapsible */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('loanSettings')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-700 text-sm">Loan Settings</span>
                  </div>
                  {expandedSections.loanSettings ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.loanSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 pb-3 space-y-3 border-t border-gray-100"
                  >
                    {/* Loan Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loan Type
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { value: 'principal_interest', label: 'Principal & Interest' },
                          { value: 'interest_only', label: 'Interest Only' }
                        ].map((type) => (
                          <button
                            key={type.value}
                            onClick={() => handleInputChange('loanType', type.value)}
                            className={`p-2 rounded-md text-xs font-medium transition-all ${
                              formData.loanType === type.value
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Repayment Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repayment Frequency
                      </label>
                      <select
                        value={formData.repaymentFrequency}
                        onChange={(e) => handleInputChange('repaymentFrequency', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    {/* Term and Rate */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Term (Years)
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                          <input
                            type="number"
                            min="5"
                            max="30"
                            value={formData.termYears}
                            onChange={(e) => handleInputChange('termYears', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate (%)
                        </label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="15"
                            value={formData.interestRate}
                            onChange={(e) => handleInputChange('interestRate', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="5.5"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

            </div>
          </motion.div>

          {/* Results Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
          {results ? (
            <>
              {/* Main Result */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 shadow-xl border-2 border-green-200">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Estimated Borrowing Power
                    </h3>
                    <div className="text-4xl font-bold text-green-600">
                      {formatCurrency(results.maxLoan)}
                    </div>
                  </div>

                  {results.dti > 6 && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <p className="text-yellow-800 text-sm font-medium">
                          High debt-to-income ratio ({results.dti.toFixed(1)}:1)
                        </p>
                      </div>
                    </div>
                  )}

                  {results.hecsImpact > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-yellow-600" />
                        <p className="text-yellow-800 text-sm">
                          HECS/HELP impact: -{formatCurrency(results.hecsImpact)}/year
                        </p>
                      </div>
                    </div>
                  )}


                  {results.otherIncomeTotal > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-emerald-600" />
                        <p className="text-emerald-800 text-sm">
                          Other income assessed: {formatCurrency(results.otherIncomeTotal)}/year
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                <h4 className="font-semibold text-gray-900 mb-4">Calculation Breakdown</h4>
                
                <div className="space-y-3 text-sm">
                  {results.totalAnnualIncome && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Annual Income</span>
                      <span className="font-medium">{formatCurrency(results.totalAnnualIncome)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Surplus</span>
                    <span className="font-medium">{formatCurrency(results.surplus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assessed Expenses</span>
                    <span className="font-medium">{formatCurrency(results.assessedExpenses)}</span>
                  </div>
                  {results.rentalExpense > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">+ Rental Expense</span>
                      <span className="font-medium">{formatCurrency(results.rentalExpense)}</span>
                    </div>
                  )}
                  {results.hecsImpact > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">HECS/HELP Annual</span>
                      <span className="font-medium">{formatCurrency(results.hecsImpact)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Commitments</span>
                    <span className="font-medium">{formatCurrency(totalMonthlyLiabilities + (results.hecsImpact || 0) / 12)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Debt-to-Income Ratio</span>
                    <span className="font-medium">{results.dti.toFixed(1)}:1</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Assessment Rate</span>
                    <span className="font-medium">{formatPercentage((formData.interestRate + 3) / 100)}</span>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Next: Calculate Max Purchase Price</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 text-center">
              <div className="text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter your income and expenses to calculate your borrowing power</p>
              </div>
            </div>
          )}
          </motion.div>
        </div>
      </div>

      {/* Important Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Important Notes</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• This is an estimate based on typical lending criteria (5.5% + 3% stress test buffer)</p>
              <p>• Actual lending decisions depend on credit history, employment type, and lender policies</p>
              <p>• Results use HEM (Household Expenditure Measure) benchmarks where applicable</p>
              <p>• Assessment assumes 30-year principal & interest loan</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default BorrowingPowerEstimator