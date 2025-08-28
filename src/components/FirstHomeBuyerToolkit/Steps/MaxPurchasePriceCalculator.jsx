import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Home, 
  AlertTriangle, 
  ArrowRight,
  Info,
  Percent,
  FileText,
  CheckCircle,
  Gift,
  PiggyBank
} from 'lucide-react'
import { useStepData, useToolkit } from '../ToolkitContext'
import { 
  calculateMaxPurchasePrice, 
  calculateStampDuty,
  calculateLMI,
  formatCurrency 
} from '../../../utils/financialCalculations'

const australianStates = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' }
]

const MaxPurchasePriceCalculator = () => {
  const navigate = useNavigate()
  const { data, setData, updateCalculations } = useStepData('purchasePrice')
  const { state, actions } = useToolkit()
  const { actions: toolkitActions } = useToolkit()
  
  const [errors, setErrors] = useState({})
  const [results, setResults] = useState(null)

  // Get borrowing power from Step 1
  const borrowingPower = state.borrowingPower.maxLoan || 0

  // Form state
  const [formData, setFormData] = useState({
    deposit: data.deposit || '',
    state: data.state || 'NSW',
    isFirstHomeBuyer: data.isFirstHomeBuyer || false,
    targetLVR: data.targetLVR || 80,
    selectedScenario: data.selectedScenario || 'withoutLMI', // 'withoutLMI', 'withLMI', 'custom'
    customLVR: data.customLVR || 85,
    legalFees: 1500,
    inspectionFees: 500,
    lenderFees: 600,
    otherCosts: 500
  })

  // Update form data
  const handleInputChange = (field, value) => {
    const numericFields = ['deposit', 'targetLVR', 'customLVR', 'legalFees', 'inspectionFees', 'lenderFees', 'otherCosts']
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
  }

  // Calculate max purchase price
  const calculateResults = () => {
    if (!borrowingPower) {
      setErrors({ general: 'Please complete Step 1 (Borrowing Power) first' })
      return
    }

    if (!formData.deposit || formData.deposit <= 0) {
      setErrors({ deposit: 'Please enter your available deposit' })
      return
    }

    const params = {
      state: formData.state,
      isFirstHomeBuyer: formData.isFirstHomeBuyer,
      legalFees: formData.legalFees,
      inspectionFees: formData.inspectionFees,
      lenderFees: formData.lenderFees,
      otherCosts: formData.otherCosts
    }

    // Calculate all three scenarios
    const resultWithoutLMI = calculateMaxPurchasePrice(
      borrowingPower * 0.8, // 80% LVR limit
      formData.deposit, 
      { ...params, includeLMI: false, targetLVR: 80 }
    )
    
    const resultWithLMI = calculateMaxPurchasePrice(
      borrowingPower, 
      formData.deposit, 
      { ...params, includeLMI: true, targetLVR: 95 }
    )
    
    const resultCustomLVR = calculateMaxPurchasePrice(
      borrowingPower * (formData.customLVR / 100), 
      formData.deposit, 
      { ...params, includeLMI: formData.customLVR > 80, targetLVR: formData.customLVR }
    )

    // Select the result based on chosen scenario
    let primaryResult
    switch (formData.selectedScenario) {
      case 'withoutLMI':
        primaryResult = resultWithoutLMI
        break
      case 'withLMI':
        primaryResult = resultWithLMI
        break
      case 'custom':
        primaryResult = resultCustomLVR
        break
      default:
        primaryResult = resultWithoutLMI
    }

    const enhancedResult = {
      primary: primaryResult,
      withoutLMI: resultWithoutLMI,
      withLMI: resultWithLMI,
      customLVR: resultCustomLVR,
      availableFunds: borrowingPower + formData.deposit,
      selectedScenario: formData.selectedScenario
    }

    setResults(enhancedResult)

    // Save data to context
    setData({
      ...formData,
      maxPrice: primaryResult.maxPrice,
      costs: primaryResult.costs,
      cashRequired: primaryResult.cashRequired,
      lvr: primaryResult.lvr,
      selectedScenario: formData.selectedScenario
    })

    updateCalculations({
      maxPrice: primaryResult.maxPrice,
      costs: primaryResult.costs,
      cashRequired: primaryResult.cashRequired,
      lvr: primaryResult.lvr,
      selectedScenario: formData.selectedScenario
    })
  }

  // Auto-calculate when form changes
  useEffect(() => {
    if (borrowingPower && formData.deposit) {
      const timer = setTimeout(calculateResults, 500)
      return () => clearTimeout(timer)
    }
  }, [formData, borrowingPower])

  // Load existing results
  useEffect(() => {
    if (data.maxPrice) {
      // Recalculate to get full results object
      calculateResults()
    }
  }, [])

  const handleNext = () => {
    if (!results) {
      setErrors({ general: 'Please complete the calculation before proceeding' })
      return
    }

    toolkitActions.completeStep(2)
    navigate('/first-home-buyer/budget-fit')
  }

  const handleBack = () => {
    navigate('/first-home-buyer/borrowing-power')
  }

  // First Home Buyer scheme info
  const getSchemeInfo = () => {
    const schemes = {
      NSW: 'First Home Buyers Assistance Scheme - No stamp duty up to $650k, concessions up to $800k',
      VIC: 'First Home Owner Grant - $10,000 grant + stamp duty concessions',
      QLD: 'First Home Owner Grant - $15,000 for new homes + transfer duty concessions',
      WA: 'First Home Owner Grant - $10,000 + transfer duty relief',
      SA: 'First Home Owner Grant - $15,000 + stamp duty concessions',
      TAS: 'First Home Owner Grant - $20,000 + duty concessions',
      ACT: 'Stamp duty concessions for first home buyers',
      NT: 'First Home Owner Grant - $10,000 + stamp duty concessions'
    }
    
    return schemes[formData.state] || 'Various first home buyer concessions available'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Progress from Step 1 */}
      {borrowingPower > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Step 1 Complete</h3>
              <p className="text-green-700">
                Maximum borrowing power: <span className="font-bold">{formatCurrency(borrowingPower)}</span>
              </p>
            </div>
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Deposit & Location</h2>
          </div>

          <div className="space-y-6">
            {/* Available Deposit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Available Deposit *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => handleInputChange('deposit', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="100000"
                />
              </div>
              {errors.deposit && (
                <p className="text-red-500 text-sm mt-1">{errors.deposit}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Include savings, gifts, grants, and other funds available
              </p>
            </div>

            {/* State Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State/Territory *
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              >
                {australianStates.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Used for stamp duty calculations
              </p>
            </div>

            {/* First Home Buyer Status */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFirstHomeBuyer}
                  onChange={(e) => handleInputChange('isFirstHomeBuyer', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <Gift className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    I'm a first home buyer
                  </span>
                </div>
              </label>
              
              {formData.isFirstHomeBuyer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {formData.state} Scheme Benefits:
                      </p>
                      <p className="text-sm text-blue-800 mt-1">
                        {getSchemeInfo()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Scenario Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Choose Your Scenario *
              </label>
              <div className="space-y-3">
                {/* Without LMI Option */}
                <button
                  type="button"
                  onClick={() => handleInputChange('selectedScenario', 'withoutLMI')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    formData.selectedScenario === 'withoutLMI'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Without LMI (≤80% LVR)</div>
                      <div className="text-sm opacity-75">No Lenders Mortgage Insurance • Lower monthly costs</div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Recommended
                    </span>
                  </div>
                </button>

                {/* With LMI Option */}
                <button
                  type="button"
                  onClick={() => handleInputChange('selectedScenario', 'withLMI')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    formData.selectedScenario === 'withLMI'
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-yellow-300 hover:bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">With LMI (≤95% LVR)</div>
                      <div className="text-sm opacity-75">Higher purchase power • Additional upfront LMI costs</div>
                    </div>
                  </div>
                </button>

                {/* Custom LVR Option */}
                <button
                  type="button"
                  onClick={() => handleInputChange('selectedScenario', 'custom')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    formData.selectedScenario === 'custom'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Choose Your Own LVR</div>
                    <div className="text-sm opacity-75 mb-3">Set your target Loan-to-Value ratio</div>
                    
                    {formData.selectedScenario === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-1">
                            <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              min="5"
                              max="95"
                              step="1"
                              value={formData.customLVR}
                              onChange={(e) => handleInputChange('customLVR', e.target.value)}
                              className="w-full px-3 pr-10 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                              placeholder="85"
                            />
                          </div>
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            LVR Target
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          {formData.customLVR > 80 ? 'LMI will apply' : 'No LMI required'}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Estimated Costs</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-gray-600 mb-1">Legal Fees</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="number"
                      value={formData.legalFees}
                      onChange={(e) => handleInputChange('legalFees', e.target.value)}
                      className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-600 mb-1">Inspections</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="number"
                      value={formData.inspectionFees}
                      onChange={(e) => handleInputChange('inspectionFees', e.target.value)}
                      className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-600 mb-1">Lender Fees</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="number"
                      value={formData.lenderFees}
                      onChange={(e) => handleInputChange('lenderFees', e.target.value)}
                      className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-600 mb-1">Other Costs</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="number"
                      value={formData.otherCosts}
                      onChange={(e) => handleInputChange('otherCosts', e.target.value)}
                      className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
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
              {/* Main Result */}
              <div className="bg-gradient-to-br from-green-50 to-blue-100 rounded-2xl p-8 shadow-xl border-2 border-green-200">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Maximum Purchase Price
                    </h3>
                    <div className="text-4xl font-bold text-green-600">
                      {formatCurrency(results.primary.maxPrice)}
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      LVR: {results.primary.lvr.toFixed(1)}% • {results.selectedScenario === 'withoutLMI' ? 'No LMI' : results.selectedScenario === 'withLMI' ? 'With LMI' : `Custom ${results.primary.lvr.toFixed(1)}% LVR`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scenario Comparison */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                <h4 className="font-semibold text-gray-900 mb-4">Purchase Scenarios</h4>
                
                <div className="space-y-4">
                  {/* Without LMI Scenario */}
                  <div className={`border-2 rounded-lg p-4 transition-all ${
                    results.selectedScenario === 'withoutLMI' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-gray-900">Without LMI (≤80% LVR)</h5>
                      <div className="flex space-x-2">
                        <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                          Recommended
                        </span>
                        {results.selectedScenario === 'withoutLMI' && (
                          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(results.withoutLMI.maxPrice)}
                    </div>
                    <p className="text-sm text-gray-600">
                      No LMI required • Lower monthly costs • LVR: {results.withoutLMI.lvr.toFixed(1)}%
                    </p>
                  </div>

                  {/* With LMI Scenario */}
                  <div className={`border-2 rounded-lg p-4 transition-all ${
                    results.selectedScenario === 'withLMI' 
                      ? 'border-yellow-500 bg-yellow-50' 
                      : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-gray-900">With LMI (≤95% LVR)</h5>
                      <div className="flex space-x-2">
                        {results.withLMI.costs.lmi > 0 && (
                          <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            +{formatCurrency(results.withLMI.costs.lmi)} LMI
                          </span>
                        )}
                        {results.selectedScenario === 'withLMI' && (
                          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(results.withLMI.maxPrice)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Higher purchase power • Additional upfront costs • LVR: {results.withLMI.lvr.toFixed(1)}%
                    </p>
                  </div>

                  {/* Custom LVR Scenario */}
                  {results.selectedScenario === 'custom' && (
                    <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-gray-900">Custom LVR ({results.customLVR.lvr.toFixed(1)}%)</h5>
                        <div className="flex space-x-2">
                          {results.customLVR.costs.lmi > 0 && (
                            <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                              +{formatCurrency(results.customLVR.costs.lmi)} LMI
                            </span>
                          )}
                          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Selected
                          </span>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(results.customLVR.maxPrice)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Your custom scenario • LVR: {results.customLVR.lvr.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                <h4 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stamp Duty</span>
                    <span className="font-medium">{formatCurrency(results.primary.costs.stampDuty)}</span>
                  </div>
                  
                  {results.primary.costs.lmi > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lenders Mortgage Insurance</span>
                      <span className="font-medium text-yellow-600">{formatCurrency(results.primary.costs.lmi)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Legal & Professional</span>
                    <span className="font-medium">{formatCurrency(results.primary.costs.legalFees)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inspections & Reports</span>
                    <span className="font-medium">{formatCurrency(results.primary.costs.inspectionFees)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lender & Other Fees</span>
                    <span className="font-medium">{formatCurrency(results.primary.costs.lenderFees + results.primary.costs.otherCosts)}</span>
                  </div>
                  
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total Upfront Costs</span>
                    <span className="text-red-600">{formatCurrency(results.primary.costs.total)}</span>
                  </div>
                  
                  {/* Achievability Analysis */}
                  <div className="border-t pt-3 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Achievability Analysis</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        results.primary.cashRequired <= results.availableFunds
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {results.primary.cashRequired <= results.availableFunds ? 'Achievable' : 'Shortfall'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Available funds: {formatCurrency(results.availableFunds)} • Required: {formatCurrency(results.primary.cashRequired)}
                      {results.primary.cashRequired > results.availableFunds && (
                        <div className="text-red-600 mt-1">
                          Shortfall: {formatCurrency(results.primary.cashRequired - results.availableFunds)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash Requirements */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                <h4 className="font-semibold text-gray-900 mb-4">Cash Requirements</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Price</span>
                    <span className="font-medium">{formatCurrency(results.primary.maxPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Less: Loan Amount</span>
                    <span className="font-medium">-{formatCurrency(results.primary.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plus: All Costs</span>
                    <span className="font-medium">+{formatCurrency(results.primary.costs.total)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total Cash Needed</span>
                    <span className={results.primary.cashRequired <= formData.deposit ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(results.primary.cashRequired)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Your Available Deposit</span>
                    <span className="font-medium">{formatCurrency(formData.deposit)}</span>
                  </div>
                  {results.primary.cashRequired > formData.deposit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <p className="text-red-800 text-sm font-medium">
                          Need additional {formatCurrency(results.primary.cashRequired - formData.deposit)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-4">
                <Home className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Calculate
              </h3>
              <p className="text-gray-600">
                Enter your deposit and location to see your maximum purchase price
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Back: Borrowing Power
            </button>
            
            {results && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Next: Budget Check</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <div className="flex items-start space-x-3">
          <PiggyBank className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Smart Buying Tips</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Consider staying under 80% LVR to avoid LMI and reduce costs</p>
              <p>• Factor in ongoing costs like council rates, strata fees, and maintenance (typically 1-1.5% of property value annually)</p>
              <p>• Keep some cash aside for post-settlement expenses and emergencies</p>
              <p>• {formData.isFirstHomeBuyer ? 'Take advantage of first home buyer grants and concessions' : 'Consider if you might be eligible for first home buyer benefits'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default MaxPurchasePriceCalculator