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
  PiggyBank
} from 'lucide-react'
import packageJson from '../../../../package.json'
import { useStepData, useToolkit } from '../ToolkitContext'
import SmartCalculatorDemo from '../Components/SmartCalculatorDemo'
import { 
  calculateMaxPurchasePrice, 
  calculateStampDuty,
  calculateLMI,
  calculateMortgagePayment,
  formatCurrency,
  HOME_GUARANTEE_SCHEME_CAPS,
  isEligibleForHomeGuaranteeScheme,
  calculateHomeGuaranteeMaxPrice
} from '../../../utils/financialCalculations'

const MaxPurchasePriceCalculator = () => {
  const navigate = useNavigate()
  const { data, setData, updateCalculations } = useStepData('purchasePrice')
  const { state, actions } = useToolkit()
  const { actions: toolkitActions } = useToolkit()
  
  const [errors, setErrors] = useState({})
  const [results, setResults] = useState(null)
  const [smartCalculatorScenarios, setSmartCalculatorScenarios] = useState(null)

  // Get borrowing power from Step 1
  const borrowingPower = state.borrowingPower.maxLoan || 0

  // Form state
  const [formData, setFormData] = useState({
    state: data.state || 'NSW',
    isFirstHomeBuyer: data.isFirstHomeBuyer || false,
    legalFees: 1500,
    inspectionFees: 500,
    lenderFees: 600,
    otherCosts: 500
  })

  // Update form data
  const handleInputChange = (field, value) => {
    const numericFields = ['legalFees', 'inspectionFees', 'lenderFees', 'otherCosts']
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

    const params = {
      state: formData.state,
      isFirstHomeBuyer: formData.isFirstHomeBuyer,
      legalFees: formData.legalFees,
      inspectionFees: formData.inspectionFees,
      lenderFees: formData.lenderFees,
      otherCosts: formData.otherCosts
    }

    // Calculate Home Guarantee Scheme scenario (first home buyers only)
    // Use a default 20% deposit (150k for 750k property) for calculation purposes
    const defaultDeposit = borrowingPower * 0.25 // Assume 80% LVR
    
    let resultHomeGuarantee = null
    if (formData.isFirstHomeBuyer) {
      const homeGuaranteeMaxPrice = calculateHomeGuaranteeMaxPrice(
        borrowingPower, 
        defaultDeposit, 
        formData.state, 
        'capital'  // Default to capital city rates
      )
      
      if (homeGuaranteeMaxPrice > 0) {
        // Calculate with 95% LVR but no LMI under Home Guarantee Scheme
        resultHomeGuarantee = calculateMaxPurchasePrice(
          Math.min(borrowingPower, homeGuaranteeMaxPrice * 0.95),
          defaultDeposit,
          { ...params, includeLMI: false, targetLVR: 95 }  // No LMI under scheme
        )
        // Override the max price to respect scheme caps
        resultHomeGuarantee.maxPrice = Math.min(resultHomeGuarantee.maxPrice, homeGuaranteeMaxPrice)
        resultHomeGuarantee.loanAmount = Math.min(resultHomeGuarantee.loanAmount, homeGuaranteeMaxPrice * 0.95)
      }
    }

    // Calculate maximum purchase price with conservative lending (avoiding LMI)
    // Using a more conservative loan amount to avoid LMI costs
    const resultWithoutLMI = calculateMaxPurchasePrice(
      Math.min(borrowingPower, defaultDeposit * 4),  // Cap at 80% LVR (deposit is 20%, loan is 80%)
      defaultDeposit, 
      { ...params, includeLMI: false, targetLVR: 80 }
    )
    
    // Calculate absolute maximum purchase price (with LMI if needed)
    // Using higher leverage but incurring LMI costs
    const resultWithLMI = calculateMaxPurchasePrice(
      Math.min(borrowingPower, defaultDeposit * 19),  // Cap at 95% LVR (deposit is 5%, loan is 95%)
      defaultDeposit, 
      { ...params, includeLMI: true, targetLVR: 95 }
    )

    const enhancedResult = {
      withoutLMI: resultWithoutLMI,
      withLMI: resultWithLMI,
      homeGuarantee: resultHomeGuarantee,
      availableFunds: borrowingPower + defaultDeposit,
      borrowingPower: borrowingPower,
      isFirstHomeBuyer: formData.isFirstHomeBuyer,
      homeGuaranteeCap: formData.isFirstHomeBuyer ? HOME_GUARANTEE_SCHEME_CAPS[formData.state]?.capital : null
    }

    setResults(enhancedResult)

    // Save data to context (using no-LMI scenario as default)
    setData({
      ...formData,
      maxPrice: resultWithoutLMI.maxPrice,
      costs: resultWithoutLMI.costs,
      cashRequired: resultWithoutLMI.cashRequired,
      lvr: resultWithoutLMI.lvr
    })

    updateCalculations({
      maxPrice: resultWithoutLMI.maxPrice,
      costs: resultWithoutLMI.costs,
      cashRequired: resultWithoutLMI.cashRequired,
      lvr: resultWithoutLMI.lvr
    })
  }

  // Auto-calculate when form changes
  useEffect(() => {
    if (borrowingPower) {
      const timer = setTimeout(() => {
        calculateResults()
      }, 500)
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
    if (!smartCalculatorScenarios) {
      setErrors({ general: 'Please complete the Smart Calculator before proceeding' })
      return
    }

    toolkitActions.completeStep(2)
    navigate('/first-home-buyer/budget-fit')
  }

  const handleBack = () => {
    navigate('/first-home-buyer/borrowing-power')
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

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Smart Property Calculator */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <SmartCalculatorDemo 
            borrowingPower={borrowingPower} 
            initialState={formData.state}
            onScenariosCalculated={setSmartCalculatorScenarios}
          />
        </motion.div>

        {/* Right Column: Results & Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Display scenarios from Smart Calculator */}
          {smartCalculatorScenarios ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Property Purchase Analysis</h3>
                <p className="text-gray-600">Based on your Smart Calculator inputs and borrowing capacity</p>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Available Funds:</span>
                    <div className="font-medium text-green-600">{formatCurrency(smartCalculatorScenarios.availableFunds)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Borrowing Power:</span>
                    <div className="font-medium text-blue-600">{formatCurrency(smartCalculatorScenarios.borrowingPower)}</div>
                  </div>
                </div>
              </div>

              {/* Main Results - Key Scenarios */}
              <div className="grid grid-cols-1 gap-4">
                {/* Home Guarantee Scheme - First Home Buyers Only */}
                {smartCalculatorScenarios.homeGuarantee && smartCalculatorScenarios.isFirstHomeBuyer && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-6 shadow-xl border-2 border-blue-300">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-blue-900">🏛️ Home Guarantee Scheme</h3>
                        <p className="text-sm text-blue-700">Minimum 5% deposit needed • Up to 95% no LMI</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                          Government Backed
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          Cap: {formatCurrency(smartCalculatorScenarios.homeGuaranteeCap)}
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-3">
                      {formatCurrency(smartCalculatorScenarios.homeGuarantee.maxPrice)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Loan Amount:</span>
                        <div className="font-medium">{formatCurrency(smartCalculatorScenarios.homeGuarantee.loanAmount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Monthly P&I:</span>
                        <div className="font-bold text-blue-600">{formatCurrency(Math.round(calculateMortgagePayment(smartCalculatorScenarios.homeGuarantee.loanAmount, 0.055, 30)))}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Cash Required:</span>
                        <div className="font-medium">{formatCurrency(smartCalculatorScenarios.homeGuarantee.cashRequired)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">LVR:</span>
                        <div className="font-medium">{smartCalculatorScenarios.homeGuarantee.lvr}%</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-100 rounded p-2">
                        <span className="text-blue-600">Deposit:</span>
                        <div className="font-medium">{formatCurrency(smartCalculatorScenarios.homeGuarantee.maxPrice - smartCalculatorScenarios.homeGuarantee.loanAmount)}</div>
                      </div>
                      <div className="bg-blue-100 rounded p-2">
                        <span className="text-blue-600">Stamp Duty:</span>
                        <div className="font-medium">{formatCurrency(smartCalculatorScenarios.homeGuarantee.costs.stampDuty)}</div>
                      </div>
                      <div className="bg-blue-100 rounded p-2">
                        <span className="text-blue-600">Other:</span>
                        <div className="font-medium">{formatCurrency(smartCalculatorScenarios.homeGuarantee.costs.total - smartCalculatorScenarios.homeGuarantee.costs.stampDuty)}</div>
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-blue-100 rounded-lg">
                      <p className="text-xs text-blue-800">
                        ✓ No LMI • ✓ 5% deposit • ✓ Govt backed
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Conservative Scenario */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 shadow-xl border-2 border-green-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-green-900">🛡️ Conservative Purchase</h3>
                      <p className="text-sm text-green-700">≤80% LVR • No LMI Required • Lower Risk</p>
                    </div>
                    <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                      Recommended
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-3">
                    {formatCurrency(smartCalculatorScenarios.conservative.maxPrice)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Loan Amount:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.conservative.loanAmount)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly P&I:</span>
                      <div className="font-bold text-green-600">{formatCurrency(Math.round(calculateMortgagePayment(smartCalculatorScenarios.conservative.loanAmount, 0.055, 30)))}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Cash Required:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.conservative.cashRequired)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">LVR:</span>
                      <div className="font-medium">{smartCalculatorScenarios.conservative.lvr}%</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-100 rounded p-2">
                      <span className="text-green-600">Deposit:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.conservative.maxPrice - smartCalculatorScenarios.conservative.loanAmount)}</div>
                    </div>
                    <div className="bg-green-100 rounded p-2">
                      <span className="text-green-600">Stamp Duty:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.conservative.costs.stampDuty)}</div>
                    </div>
                    <div className="bg-green-100 rounded p-2">
                      <span className="text-green-600">Other:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.conservative.costs.total - smartCalculatorScenarios.conservative.costs.stampDuty)}</div>
                    </div>
                  </div>
                </div>

                {/* Maximum Scenario */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-2xl p-6 shadow-xl border-2 border-orange-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-orange-900">🚀 Maximum Purchase</h3>
                      <p className="text-sm text-orange-700">≤95% LVR • LMI Required • Higher Reach</p>
                    </div>
                    <span className="px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                      +{formatCurrency(smartCalculatorScenarios.maximum.costs.lmi)} LMI
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-3">
                    {formatCurrency(smartCalculatorScenarios.maximum.maxPrice)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Loan Amount:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.maximum.loanAmount)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly P&I:</span>
                      <div className="font-bold text-orange-600">{formatCurrency(Math.round(calculateMortgagePayment(smartCalculatorScenarios.maximum.loanAmount, 0.055, 30)))}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Cash Required:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.maximum.cashRequired)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">LVR:</span>
                      <div className="font-medium">{smartCalculatorScenarios.maximum.lvr}%</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-orange-100 rounded p-2">
                      <span className="text-orange-600">Deposit:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.maximum.maxPrice - smartCalculatorScenarios.maximum.loanAmount)}</div>
                    </div>
                    <div className="bg-orange-100 rounded p-2">
                      <span className="text-orange-600">Stamp:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.maximum.costs.stampDuty)}</div>
                    </div>
                    <div className="bg-red-100 rounded p-2">
                      <span className="text-red-600">LMI:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.maximum.costs.lmi)}</div>
                    </div>
                    <div className="bg-orange-100 rounded p-2">
                      <span className="text-orange-600">Other:</span>
                      <div className="font-medium">{formatCurrency(smartCalculatorScenarios.maximum.costs.total - smartCalculatorScenarios.maximum.costs.stampDuty - smartCalculatorScenarios.maximum.costs.lmi)}</div>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-orange-100 rounded-lg">
                    <p className="text-xs text-orange-800">
                      ⚠️ Higher payments with LMI • Limited lenders at {smartCalculatorScenarios.maximum.lvr}% LVR
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-4">
                <Home className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smart Calculator Ready
              </h3>
              <p className="text-gray-600">
                Use the Smart Calculator to set your property parameters and see purchase scenarios
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
            
            {smartCalculatorScenarios && (
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
        
        {/* Version Display */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Otium First Home Buyer Toolkit</span>
            <span>v{packageJson.version}</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default MaxPurchasePriceCalculator