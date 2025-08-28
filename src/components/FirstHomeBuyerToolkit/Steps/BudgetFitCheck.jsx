import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  PieChart, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Home,
  Calendar,
  Target,
  Info
} from 'lucide-react'
import { useStepData, useToolkit } from '../ToolkitContext'
import { 
  calculateAffordability, 
  calculateMortgagePayment,
  formatCurrency 
} from '../../../utils/financialCalculations'

const BudgetFitCheck = () => {
  const navigate = useNavigate()
  const { data, setData, updateCalculations } = useStepData('budgetFit')
  const { state, actions } = useToolkit()
  
  const [errors, setErrors] = useState({})
  const [results, setResults] = useState(null)

  // Get data from previous steps
  const borrowingPower = state.borrowingPower.maxLoan || 0
  const maxPrice = state.purchasePrice.maxPrice || 0
  const interestRate = state.borrowingPower.interestRate || 6.5

  // Form state
  const [formData, setFormData] = useState({
    monthlyIncome: data.monthlyIncome || '',
    monthlyExpenses: data.monthlyExpenses || '',
    propertyPrice: maxPrice || '',
    ownershipCosts: data.ownershipCosts || 0.01, // 1% annually
    stressTestRate: (interestRate + 1) || 7.5, // Add 1% buffer
    includeRateRise: true
  })

  // Update form data
  const handleInputChange = (field, value) => {
    const numericValue = ['monthlyIncome', 'monthlyExpenses', 'propertyPrice', 'ownershipCosts', 'stressTestRate'].includes(field) 
      ? parseFloat(value) || 0 
      : value

    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }))
  }

  // Calculate affordability
  const calculateResults = () => {
    if (!formData.monthlyIncome || !formData.monthlyExpenses) {
      return
    }

    const loanAmount = Math.min(borrowingPower, formData.propertyPrice * 0.95) // Cap at 95% LVR
    
    const params = {
      propertyPrice: formData.propertyPrice,
      loanAmount,
      monthlyIncome: formData.monthlyIncome,
      monthlyExpenses: formData.monthlyExpenses,
      interestRate: interestRate / 100,
      ownershipCosts: formData.ownershipCosts
    }

    const result = calculateAffordability(params)
    
    // Also calculate with stressed rate
    const stressedResult = calculateAffordability({
      ...params,
      interestRate: formData.stressTestRate / 100
    })

    const combinedResult = {
      ...result,
      stressedRepayment: stressedResult.monthlyRepayment,
      stressedSurplus: stressedResult.surplus,
      stressedSignal: stressedResult.signal,
      loanAmount
    }

    setResults(combinedResult)

    // Save to context
    setData({
      ...formData,
      affordability: combinedResult,
      signal: combinedResult.signal
    })

    updateCalculations({
      affordability: combinedResult,
      signal: combinedResult.signal
    })
  }

  // Auto-calculate when form changes
  useEffect(() => {
    if (formData.monthlyIncome && formData.monthlyExpenses && formData.propertyPrice) {
      const timer = setTimeout(calculateResults, 500)
      return () => clearTimeout(timer)
    }
  }, [formData])

  // Set property price from previous step
  useEffect(() => {
    if (maxPrice && !formData.propertyPrice) {
      setFormData(prev => ({ ...prev, propertyPrice: maxPrice }))
    }
  }, [maxPrice])

  const handleNext = () => {
    if (!results) {
      setErrors({ general: 'Please complete the budget analysis' })
      return
    }

    actions.completeStep(3)
    
    // Navigate based on affordability signal
    if (results.signal === 'red' || results.stressedSignal === 'red') {
      navigate('/first-home-buyer/deposit-timeline') // Need to save more
    } else {
      navigate('/first-home-buyer/property-search') // Can proceed to property search
    }
  }

  const handleBack = () => {
    navigate('/first-home-buyer/purchase-price')
  }

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'green': return 'text-green-600'
      case 'amber': return 'text-yellow-600'
      case 'red': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSignalBg = (signal) => {
    switch (signal) {
      case 'green': return 'from-green-50 to-green-100 border-green-200'
      case 'amber': return 'from-yellow-50 to-yellow-100 border-yellow-200'
      case 'red': return 'from-red-50 to-red-100 border-red-200'
      default: return 'from-gray-50 to-gray-100 border-gray-200'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Progress Summary */}
      {(borrowingPower > 0 || maxPrice > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {borrowingPower > 0 && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <span className="text-sm text-green-700">Borrowing Power:</span>
                  <span className="font-bold text-green-900 ml-2">{formatCurrency(borrowingPower)}</span>
                </div>
              </div>
            )}
            {maxPrice > 0 && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <span className="text-sm text-green-700">Max Purchase Price:</span>
                  <span className="font-bold text-green-900 ml-2">{formatCurrency(maxPrice)}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChart className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Monthly Budget</h2>
          </div>

          <div className="space-y-6">
            {/* Monthly Income */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Take-Home Income *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="6500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                After-tax income available for expenses and mortgage
              </p>
            </div>

            {/* Monthly Expenses */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Monthly Expenses *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.monthlyExpenses}
                  onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="4200"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Include all expenses except rent (will be replaced by ownership costs)
              </p>
            </div>

            {/* Target Property Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Property Price
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.propertyPrice}
                  onChange={(e) => handleInputChange('propertyPrice', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder={maxPrice || "750000"}
                />
              </div>
              {maxPrice && (
                <p className="text-xs text-blue-600 mt-1">
                  Your maximum: {formatCurrency(maxPrice)}
                </p>
              )}
            </div>

            {/* Ownership Costs */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Annual Ownership Costs</h4>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  As percentage of property value: {(formData.ownershipCosts * 100).toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="0.005"
                  max="0.025"
                  step="0.001"
                  value={formData.ownershipCosts}
                  onChange={(e) => handleInputChange('ownershipCosts', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5% (Unit)</span>
                  <span>1.5% (House)</span>
                  <span>2.5% (Maintenance-heavy)</span>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">Includes: Council rates, strata fees, insurance, utilities, maintenance</p>
                {formData.propertyPrice > 0 && (
                  <p className="font-medium">
                    Estimated: {formatCurrency((formData.propertyPrice * formData.ownershipCosts) / 12)} per month
                  </p>
                )}
              </div>
            </div>

            {/* Stress Test Option */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeRateRise}
                  onChange={(e) => handleInputChange('includeRateRise', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Test with rate rises (recommended)
                </span>
              </label>
              
              {formData.includeRateRise && (
                <div className="mt-3 pl-8">
                  <label className="block text-sm text-gray-600 mb-2">
                    Stress test rate: {formData.stressTestRate.toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min={interestRate}
                    max={interestRate + 3}
                    step="0.1"
                    value={formData.stressTestRate}
                    onChange={(e) => handleInputChange('stressTestRate', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {results ? (
            <>
              {/* Affordability Signal */}
              <div className={`bg-gradient-to-br ${getSignalBg(results.signal)} rounded-2xl p-8 shadow-xl border-2`}>
                <div className="text-center space-y-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${
                    results.signal === 'green' ? 'bg-green-600' : 
                    results.signal === 'amber' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    {results.signal === 'green' ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-white" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      results.signal === 'green' ? 'text-green-900' : 
                      results.signal === 'amber' ? 'text-yellow-900' : 'text-red-900'
                    }`}>
                      Budget Fit: <span className="capitalize">{results.signal}</span>
                    </h3>
                    <div className={`text-3xl font-bold ${getSignalColor(results.signal)}`}>
                      {results.surplus >= 0 ? '+' : ''}{formatCurrency(Math.abs(results.surplus))}
                    </div>
                    <p className={`text-sm mt-2 ${
                      results.signal === 'green' ? 'text-green-700' : 
                      results.signal === 'amber' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {results.surplus >= 0 ? 'Monthly surplus' : 'Monthly deficit'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                <h4 className="font-semibold text-gray-900 mb-4">Monthly Budget Breakdown</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Take-home Income</span>
                    <span className="font-medium text-green-600">+{formatCurrency(formData.monthlyIncome)}</span>
                  </div>
                  
                  <div className="border-t pt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Living Expenses</span>
                      <span className="font-medium text-red-600">-{formatCurrency(formData.monthlyExpenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mortgage Repayment</span>
                      <span className="font-medium text-red-600">-{formatCurrency(results.monthlyRepayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Ownership</span>
                      <span className="font-medium text-red-600">-{formatCurrency(results.monthlyOwnershipCosts)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Net Position</span>
                    <span className={results.surplus >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {results.surplus >= 0 ? '+' : ''}{formatCurrency(Math.abs(results.surplus))}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Surplus as % of income: {results.surplusPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Stress Test Results */}
              {formData.includeRateRise && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Stress Test ({formData.stressTestRate.toFixed(1)}% Rate)
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Higher Repayment</span>
                      <span className="font-medium text-red-600">{formatCurrency(results.stressedRepayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Position</span>
                      <span className={results.stressedSurplus >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {results.stressedSurplus >= 0 ? '+' : ''}{formatCurrency(Math.abs(results.stressedSurplus))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stress Test Result</span>
                      <span className={`font-bold capitalize ${getSignalColor(results.stressedSignal)}`}>
                        {results.stressedSignal}
                      </span>
                    </div>
                  </div>
                  
                  {results.stressedSignal !== 'green' && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        Consider a lower property price or building a larger deposit to improve affordability.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                <h4 className="font-semibold text-gray-900 mb-4">Recommendations</h4>
                
                <div className="space-y-3 text-sm">
                  {results.signal === 'green' && results.stressedSignal === 'green' && (
                    <>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <p className="text-green-800">Excellent budget fit! You can comfortably afford this property.</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                        <p className="text-gray-700">Consider setting aside your surplus for faster loan repayment or emergency fund.</p>
                      </div>
                    </>
                  )}
                  
                  {results.signal === 'amber' && (
                    <>
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <p className="text-yellow-800">Tight budget fit. Consider reducing the property price or increasing income.</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <p className="text-gray-700">Ensure you have adequate emergency savings before proceeding.</p>
                      </div>
                    </>
                  )}
                  
                  {(results.signal === 'red' || results.stressedSignal === 'red') && (
                    <>
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <p className="text-red-800">Budget shortfall detected. Consider saving for a larger deposit first.</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                        <p className="text-gray-700">Use our Deposit Timeline tool to create a savings plan.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-4">
                <PieChart className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Check Budget Fit
              </h3>
              <p className="text-gray-600">
                Enter your monthly income and expenses to see if this property fits your budget
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back: Purchase Price</span>
            </button>
            
            {results && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>
                  {(results.signal === 'red' || results.stressedSignal === 'red') 
                    ? 'Next: Save More' 
                    : 'Next: Find Properties'
                  }
                </span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Budget Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-purple-50 border border-purple-200 rounded-2xl p-6"
      >
        <div className="flex items-start space-x-3">
          <PieChart className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">Budget Planning Tips</h4>
            <div className="text-sm text-purple-800 space-y-1">
              <p>• Aim for at least 10-20% surplus for unexpected expenses and rate rises</p>
              <p>• Remember that property ownership costs vary: units (~0.5-1%) vs houses (~1-2% annually)</p>
              <p>• Consider future life changes: growing family, career changes, or desired lifestyle upgrades</p>
              <p>• Factor in the opportunity cost of being "house poor" - balance property goals with other financial objectives</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default BudgetFitCheck