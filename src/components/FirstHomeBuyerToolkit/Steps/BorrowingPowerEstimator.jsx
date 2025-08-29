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
  CreditCard
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
  
  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    loanSettings: false,
    investmentProperty: false
  })

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
    monthlyLiabilities: data.monthlyLiabilities || '',
    
    // Loan Preferences
    propertyType: data.propertyType || 'owner-occupied', // 'owner-occupied' or 'investment'
    loanType: data.loanType || 'principal_interest',
    repaymentFrequency: data.repaymentFrequency || 'monthly',
    termYears: data.termYears || 30,
    interestRate: data.interestRate || 5.5,
    
    // Investment Property Specific
    expectedRentalYield: data.expectedRentalYield || 4.5,
    managementFees: data.managementFees || 8,
    marginalTaxRate: data.marginalTaxRate || 32.5
  })

  // Toggle collapsible sections
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Update form data
  const handleInputChange = (field, value) => {
    const numericFields = [
      'primaryIncome', 'secondaryIncome', 'monthlyLivingExpenses', 'hecsBalance', 
      'dependents', 'monthlyLiabilities', 'interestRate', 'termYears',
      'expectedRentalYield', 'managementFees', 'marginalTaxRate'
    ]
    const numericValue = numericFields.includes(field) 
      ? parseFloat(value) || 0 
      : value

    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }))

    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }

    // Auto-set HEM benchmark when scenario, income, or dependents change
    if (field === 'scenario' || field === 'primaryIncome' || field === 'dependents') {
      const totalIncome = field === 'primaryIncome' ? numericValue : formData.primaryIncome
      const scenario = field === 'scenario' ? value : formData.scenario
      const dependents = field === 'dependents' ? numericValue : formData.dependents
      
      if (totalIncome > 0) {
        const hemBenchmark = calculateHEMExpenses(scenario, totalIncome, dependents)
        
        // Auto-fill living expenses if not already set or if lower than HEM
        if (!formData.monthlyLivingExpenses || formData.monthlyLivingExpenses < hemBenchmark) {
          setFormData(prev => ({
            ...prev,
            [field]: numericValue,
            monthlyLivingExpenses: hemBenchmark
          }))
        }
      }
    }
  }

  // Calculate borrowing power
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

    const baseParams = {
      primaryIncome: formData.primaryIncome,
      secondaryIncome: formData.scenario === 'couple' ? formData.secondaryIncome : 0,
      existingDebts: 0,
      livingExpenses: formData.monthlyLivingExpenses,
      monthlyLiabilities: formData.monthlyLiabilities || 0,
      interestRate: formData.interestRate / 100,
      termYears: formData.termYears,
      dependents: formData.dependents,
      hasHECS: formData.hasHECS,
      hecsBalance: formData.hecsBalance,
      scenario: formData.scenario,
      loanType: formData.loanType,
      repaymentFrequency: formData.repaymentFrequency
    }

    const result = calculateBorrowingPower(baseParams)
    setResults(result)

    // Save data to context
    setData({
      ...formData,
      maxLoan: result.maxLoan,
      surplus: result.surplus,
      dti: result.dti,
      assessedExpenses: result.assessedExpenses,
      hemBenchmark: result.hemBenchmark,
      hecsImpact: result.hecsImpact
    })

    updateCalculations({
      maxLoan: result.maxLoan,
      surplus: result.surplus,
      dti: result.dti,
      assessedExpenses: result.assessedExpenses,
      hemBenchmark: result.hemBenchmark,
      hecsImpact: result.hecsImpact
    })
  }

  // Auto-calculate when form changes
  useEffect(() => {
    if (formData.primaryIncome && formData.monthlyLivingExpenses) {
      const timer = setTimeout(calculateResults, 500)
      return () => clearTimeout(timer)
    }
  }, [formData])

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
      
      {/* Scenario Selection */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">What's Your Situation?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: 'single', label: 'Single Person', icon: '👤', desc: 'Individual home buyer' },
            { value: 'couple', label: 'Couple', icon: '👫', desc: 'Two income earners' }
          ].map((scenario) => (
            <button
              key={scenario.value}
              onClick={() => handleInputChange('scenario', scenario.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.scenario === scenario.value
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="text-center space-y-2">
                <div className="text-2xl">{scenario.icon}</div>
                <div className="font-semibold">{scenario.label}</div>
                <div className="text-sm opacity-75">{scenario.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

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
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Include rent, food, transport, utilities, insurance, etc.
                </p>
                {(formData.primaryIncome > 0 || formData.secondaryIncome > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      const totalIncome = (formData.primaryIncome || 0) + (formData.secondaryIncome || 0)
                      const hemBenchmark = calculateHEMExpenses(formData.scenario, totalIncome, formData.dependents)
                      handleInputChange('monthlyLivingExpenses', hemBenchmark)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Use HEM Benchmark
                  </button>
                )}
              </div>
            </div>

            {/* Monthly Liabilities */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Debt Repayments
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.monthlyLiabilities}
                  onChange={(e) => handleInputChange('monthlyLiabilities', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Credit cards, personal loans, car loans, existing mortgages (exclude HECS)
              </p>
            </div>

            {/* HECS/HELP Debt Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasHECS"
                    checked={formData.hasHECS}
                    onChange={(e) => handleInputChange('hasHECS', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="hasHECS" className="text-sm font-semibold text-gray-700">
                    I have HECS/HELP debt
                  </label>
                </div>
                {formData.hasHECS && (formData.primaryIncome > 0 || formData.secondaryIncome > 0) && (
                  <div className="text-xs text-yellow-700">
                    Est. annual: {formatCurrency(calculateHECSRepayment((formData.primaryIncome || 0) + (formData.secondaryIncome || 0)))}
                  </div>
                )}
              </div>
              
              {formData.hasHECS && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HECS/HELP Balance (Optional)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={formData.hecsBalance}
                        onChange={(e) => handleInputChange('hecsBalance', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="25000"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      HECS repayments are calculated automatically based on your income
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Property Type Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Property Type</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <type.icon className="h-5 w-5 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs opacity-75">{type.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Loan Settings - Collapsible */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('loanSettings')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-700">Advanced Loan Settings</span>
                </div>
                {expandedSections.loanSettings ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {expandedSections.loanSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4 space-y-4 border-t border-gray-100"
                >
                  {/* Loan Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { value: 'principal_interest', label: 'Principal & Interest' },
                        { value: 'interest_only', label: 'Interest Only' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleInputChange('loanType', type.value)}
                          className={`p-2 rounded-md text-sm font-medium transition-all ${
                            formData.loanType === type.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300'
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  {/* Term and Rate */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loan Term (Years)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          min="5"
                          max="30"
                          value={formData.termYears}
                          onChange={(e) => handleInputChange('termYears', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interest Rate (%)
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="15"
                          value={formData.interestRate}
                          onChange={(e) => handleInputChange('interestRate', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="5.5"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
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
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-700">Investment Property Details</span>
                  </div>
                  {expandedSections.investmentProperty ? (
                    <ChevronUp className="h-5 w-5 text-orange-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-orange-400" />
                  )}
                </button>
                
                {expandedSections.investmentProperty && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-4 pb-4 space-y-4 border-t border-orange-100"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Rental Yield (%)
                        </label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={formData.expectedRentalYield}
                            onChange={(e) => handleInputChange('expectedRentalYield', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="4.5"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marginal Tax Rate (%)
                        </label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="47"
                            value={formData.marginalTaxRate}
                            onChange={(e) => handleInputChange('marginalTaxRate', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="32.5"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-orange-700 bg-orange-50 p-3 rounded-lg">
                      <Info className="inline h-3 w-3 mr-1" />
                      Investment properties have higher interest rates and stricter serviceability requirements. 
                      Rental income is typically assessed at 80% for serviceability calculations.
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </div>
        </motion.div>

        {/* Right Card: Borrowing Capacity Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {results ? (
            <>
              {/* Main Result */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-xl border-2 border-blue-200">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Estimated Borrowing Power
                    </h3>
                    <div className="text-4xl font-bold text-blue-600">
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
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                <h4 className="font-semibold text-gray-900 mb-4">Calculation Breakdown</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Surplus</span>
                    <span className="font-medium">{formatCurrency(results.surplus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assessed Expenses</span>
                    <span className="font-medium">{formatCurrency(results.assessedExpenses)}</span>
                  </div>
                  {results.hecsImpact > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">HECS/HELP Annual</span>
                      <span className="font-medium">{formatCurrency(results.hecsImpact)}</span>
                    </div>
                  )}
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