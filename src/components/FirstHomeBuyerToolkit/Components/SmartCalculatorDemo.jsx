import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Percent, 
  AlertTriangle,
  Info,
  CheckCircle,
  Gift,
  MapPin,
  Calculator,
  TrendingUp,
  Home
} from 'lucide-react'
import { 
  smartAutoCalculate, 
  formatCurrency, 
  formatPercentage,
  calculateStampDuty,
  calculateLMI,
  calculateMaxPurchasePrice,
  calculateHomeGuaranteeMaxPrice,
  calculateUpfrontCosts,
  calculateMortgageRegistrationFee,
  calculateTransferFee,
  HOME_GUARANTEE_SCHEME_CAPS
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

const SmartCalculatorDemo = ({ borrowingPower = 600000, initialState = 'NSW', onScenariosCalculated = null }) => {
  // Field values
  const [values, setValues] = useState({
    propertyValue: 750000,
    fundsAvailable: 150000,
    lvr: 80,
    loanAmount: 600000
  })

  // Location and buyer status
  const [state, setState] = useState(initialState)
  const [isFirstHomeBuyer, setIsFirstHomeBuyer] = useState(false)

  // Field lock states (determines which fields are manually input vs auto-calculated)
  const [lockedFields, setLockedFields] = useState(['propertyValue', 'lvr'])
  
  // Calculation results
  const [results, setResults] = useState(null)
  const [purchaseScenarios, setPurchaseScenarios] = useState(null)

  // Toggle field lock/unlock
  const toggleFieldLock = (field) => {
    console.log(`🔄 TOGGLE CALLED for ${field}`)
    setLockedFields(prev => {
      const currentlyLocked = prev.includes(field)
      console.log(`📊 Field ${field} - Currently locked: ${currentlyLocked}`)
      console.log(`📋 Current locked fields:`, prev)
      
      let newLocked
      if (currentlyLocked) {
        // Unlocking a field
        newLocked = prev.filter(f => f !== field)
        console.log(`🔓 After unlocking ${field}:`, newLocked)
        
        // Ensure we don't go below 2 locked fields (need at least 2 inputs for calculation)
        if (newLocked.length < 2) {
          console.log('❌ PREVENTED: Would have <2 locked fields (need minimum 2 inputs)')
          return prev
        }
        console.log(`✅ UNLOCKING ${field} - New state:`, newLocked)
      } else {
        // Locking a field
        newLocked = [...prev, field]
        console.log(`🔒 After locking ${field}:`, newLocked)
        
        // Allow up to 4 fields to be locked (all fields for surplus calculation)
        if (newLocked.length > 4) {
          console.log('❌ PREVENTED: Would have >4 locked fields')
          return prev
        }
        console.log(`✅ LOCKING ${field} - New state:`, newLocked)
      }
      
      console.log(`🎯 FINAL STATE for ${field}:`, newLocked)
      return newLocked
    })
  }

  // Update field values
  const updateValue = (field, value) => {
    const numericValue = parseFloat(value) || 0
    setValues(prev => ({
      ...prev,
      [field]: numericValue
    }))
  }

  // Calculate surplus funds when all 4 fields are known
  const calculateSurplusFunds = () => {
    if (lockedFields.length === 4) {
      // All fields are inputs - calculate surplus/shortfall
      const costs = calculateUpfrontCosts(values.propertyValue, values.loanAmount, {
        state,
        isFirstHomeBuyer,
        includeLMI: values.lvr > 80
      })
      
      // Total Funds Required = Property Value + Transaction Costs
      const totalFundsRequired = values.propertyValue + costs.total
      
      // Total Funds Available = Funds Available + Loan Amount
      const totalFundsAvailable = values.fundsAvailable + values.loanAmount
      
      // Surplus = Total Funds Available - Total Funds Required
      const surplus = totalFundsAvailable - totalFundsRequired
      
      return {
        surplus,
        totalFundsRequired,
        totalFundsAvailable,
        propertyValue: values.propertyValue,
        transactionCosts: costs.total,
        fundsAvailable: values.fundsAvailable,
        loanAmount: values.loanAmount,
        costs,
        isValid: values.lvr >= 5 && values.lvr <= 95
      }
    }
    return null
  }

  // Handle auto-calculated field updates when results change
  useEffect(() => {
    // Only update auto-calculated fields when we have results with metadata
    if (results?.metadata?.autoCalculatedFields && results.strategy !== 'SURPLUS_ANALYSIS') {
      setValues(prev => {
        const updated = { ...prev }
        let hasChanges = false
        results.metadata.autoCalculatedFields.forEach(field => {
          if (results[field] !== undefined && results[field] !== prev[field]) {
            updated[field] = results[field]
            hasChanges = true
          }
        })
        return hasChanges ? updated : prev // Only update state if there are actual changes
      })
    }
  }, [results?.metadata, results?.strategy, results?.propertyValue, results?.fundsAvailable, results?.lvr, results?.loanAmount])

  // Separate effect to handle manual value changes (user input)
  useEffect(() => {
    // Only trigger calculations when locked fields have user input
    const hasUserInput = lockedFields.some(field => values[field] > 0)
    if (hasUserInput && lockedFields.length >= 1) {
      // Use the values from state to trigger calculation
      let calculation = null
      
      if (lockedFields.length === 4) {
        // All fields locked - calculate surplus funds
        calculation = calculateSurplusFunds()
        if (calculation) {
          calculation.strategy = 'SURPLUS_ANALYSIS'
          calculation.propertyValue = values.propertyValue
          calculation.fundsAvailable = values.fundsAvailable
          calculation.lvr = values.lvr
          calculation.loanAmount = values.loanAmount
          calculation.depositAmount = values.propertyValue - values.loanAmount
          calculation.surplus = calculation.surplus
        }
      } else if (lockedFields.length >= 2) {
        // Normal smart calculation with 2-3 inputs
        calculation = smartAutoCalculate(values, lockedFields, borrowingPower, state, isFirstHomeBuyer)
        
        // Add stamp duty and LMI calculations
        if (calculation?.propertyValue && calculation?.loanAmount) {
          const stampDuty = calculateStampDuty(calculation.propertyValue, state, isFirstHomeBuyer)
          const lmi = calculation.lvr > 80 ? calculateLMI(calculation.loanAmount, calculation.propertyValue) : 0
          
          calculation.stampDuty = stampDuty
          calculation.lmi = lmi
          calculation.totalTransactionCosts = calculation.costs?.total || 0
          calculation.isFirstHomeBuyer = isFirstHomeBuyer
          calculation.state = state
          
          // Check Home Guarantee Scheme eligibility
          if (isFirstHomeBuyer && calculation.lvr > 80) {
            const schemeCap = HOME_GUARANTEE_SCHEME_CAPS[state]?.capital || 0
            calculation.homeGuaranteeEligible = calculation.propertyValue <= schemeCap
            calculation.homeGuaranteeCap = schemeCap
          }
        }
      }
      
      if (calculation) {
        setResults(calculation)
        
        // Calculate Purchase Price Scenarios based on current calculation (not for surplus analysis)
        if (calculation.strategy !== 'SURPLUS_ANALYSIS' && calculation.isValid && calculation.fundsAvailable && borrowingPower) {
          const scenarios = calculatePurchaseScenarios(calculation, borrowingPower, state, isFirstHomeBuyer)
          setPurchaseScenarios(scenarios)
          
          // Notify parent component about scenarios
          if (onScenariosCalculated) {
            onScenariosCalculated(scenarios)
          }
        }
      }
    }
  }, [values.propertyValue, values.fundsAvailable, values.lvr, values.loanAmount, lockedFields, borrowingPower, state, isFirstHomeBuyer])

  const isFieldLocked = (field) => lockedFields.includes(field)
  const isFieldAutoCalculated = (field) => results?.metadata?.autoCalculatedFields?.includes(field)

  // Custom toggle component
  const ToggleSwitch = ({ isOn, onToggle, disabled = false, fieldName = '' }) => {
    const handleClick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log(`🖱️ Toggle clicked for ${fieldName}, current isOn: ${isOn}`)
      onToggle()
    }
    
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          isOn ? 'bg-blue-600' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-80'}`}
      >
        <motion.div
          className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
          animate={{
            x: isOn ? 24 : 2,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        >
          <div className={`w-2 h-2 rounded-full ${isOn ? 'bg-blue-600' : 'bg-gray-400'}`} />
        </motion.div>
      </button>
    )
  }

  // Calculate Conservative and Maximum Purchase Price scenarios
  const calculatePurchaseScenarios = (calculation, borrowingPower, state, isFirstHomeBuyer) => {
    const availableFunds = calculation.fundsAvailable
    
    const params = {
      state: state,
      isFirstHomeBuyer: isFirstHomeBuyer,
      legalFees: 1500,
      inspectionFees: 500, 
      lenderFees: 600,
      otherCosts: 500
    }

    // Use actual funds from Smart Calculator instead of estimated deposit
    const effectiveDeposit = Math.max(availableFunds * 0.8, 50000) // Conservative estimate of deposit portion
    
    let homeGuaranteeScenario = null
    if (isFirstHomeBuyer) {
      const homeGuaranteeMaxPrice = calculateHomeGuaranteeMaxPrice(
        borrowingPower, 
        effectiveDeposit, 
        state, 
        'capital'
      )
      
      if (homeGuaranteeMaxPrice > 0) {
        homeGuaranteeScenario = calculateMaxPurchasePrice(
          Math.min(borrowingPower, homeGuaranteeMaxPrice * 0.95),
          effectiveDeposit,
          { ...params, includeLMI: false, targetLVR: 95 }
        )
        homeGuaranteeScenario.maxPrice = Math.min(homeGuaranteeScenario.maxPrice, homeGuaranteeMaxPrice)
        homeGuaranteeScenario.loanAmount = Math.min(homeGuaranteeScenario.loanAmount, homeGuaranteeMaxPrice * 0.95)
        homeGuaranteeScenario.scenario = 'homeGuarantee'
        homeGuaranteeScenario.description = 'Home Guarantee Scheme (5% deposit, no LMI)'
      }
    }

    // Conservative scenario - 80% LVR, no LMI
    const conservativeScenario = calculateMaxPurchasePrice(
      Math.min(borrowingPower, effectiveDeposit * 4), // 80% LVR cap
      effectiveDeposit,
      { ...params, includeLMI: false, targetLVR: 80 }
    )
    conservativeScenario.scenario = 'conservative'
    conservativeScenario.description = 'Conservative (≤80% LVR, no LMI)'

    // Maximum scenario - 95% LVR, with LMI
    const maximumScenario = calculateMaxPurchasePrice(
      Math.min(borrowingPower, effectiveDeposit * 19), // 95% LVR cap
      effectiveDeposit,
      { ...params, includeLMI: true, targetLVR: 95 }
    )
    maximumScenario.scenario = 'maximum'
    maximumScenario.description = 'Maximum (≤95% LVR, with LMI)'

    return {
      availableFunds: availableFunds,
      borrowingPower: borrowingPower,
      conservative: conservativeScenario,
      maximum: maximumScenario,
      homeGuarantee: homeGuaranteeScenario,
      isFirstHomeBuyer: isFirstHomeBuyer,
      homeGuaranteeCap: isFirstHomeBuyer ? HOME_GUARANTEE_SCHEME_CAPS[state]?.capital : null
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Smart Property Calculator
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Lock/unlock fields to auto-calculate the others. Strategy: <span className="font-medium text-blue-600">{results?.strategy || 'None'}</span>
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-gray-500">Locked fields ({lockedFields.length}/4):</span>
            {lockedFields.map(field => (
              <span key={field} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                🔒 {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            ))}
            {lockedFields.length === 0 && (
              <span className="text-red-500">No fields locked - click toggles to set inputs</span>
            )}
            {lockedFields.length === 4 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                💰 Surplus Analysis Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Location and Buyer Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            State/Territory
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
          >
            {australianStates.map(s => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFirstHomeBuyer}
              onChange={(e) => setIsFirstHomeBuyer(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                I'm a first home buyer
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Property Value */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
            Property Value
            <ToggleSwitch
              isOn={isFieldLocked('propertyValue')}
              onToggle={() => toggleFieldLock('propertyValue')}
              fieldName="propertyValue"
            />
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={values.propertyValue}
              onChange={(e) => updateValue('propertyValue', e.target.value)}
              disabled={!isFieldLocked('propertyValue')}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors ${
                isFieldLocked('propertyValue')
                  ? 'border-blue-300 bg-white text-gray-900'
                  : 'border-gray-300 bg-gray-50 text-gray-600'
              }`}
            />
          </div>
          {isFieldAutoCalculated('propertyValue') && (
            <p className="text-xs text-green-600 font-medium">✓ Auto-calculated</p>
          )}
        </div>

        {/* Funds Available */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
            Funds Available
            <ToggleSwitch
              isOn={isFieldLocked('fundsAvailable')}
              onToggle={() => toggleFieldLock('fundsAvailable')}
              fieldName="fundsAvailable"
            />
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={values.fundsAvailable}
              onChange={(e) => updateValue('fundsAvailable', e.target.value)}
              disabled={!isFieldLocked('fundsAvailable')}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors ${
                isFieldLocked('fundsAvailable')
                  ? 'border-blue-300 bg-white text-gray-900'
                  : 'border-gray-300 bg-gray-50 text-gray-600'
              }`}
            />
          </div>
          {isFieldAutoCalculated('fundsAvailable') && (
            <p className="text-xs text-green-600 font-medium">✓ Auto-calculated</p>
          )}
        </div>

        {/* LVR */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
            LVR (Loan-to-Value Ratio)
            <ToggleSwitch
              isOn={isFieldLocked('lvr')}
              onToggle={() => toggleFieldLock('lvr')}
              fieldName="lvr"
            />
          </label>
          <div className="relative">
            <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              min="5"
              max="95"
              step="0.1"
              value={values.lvr}
              onChange={(e) => updateValue('lvr', e.target.value)}
              disabled={!isFieldLocked('lvr')}
              className={`w-full pl-4 pr-10 py-3 border rounded-lg transition-colors ${
                isFieldLocked('lvr')
                  ? 'border-blue-300 bg-white text-gray-900'
                  : 'border-gray-300 bg-gray-50 text-gray-600'
              }`}
            />
          </div>
          {isFieldAutoCalculated('lvr') && (
            <p className="text-xs text-green-600 font-medium">✓ Auto-calculated</p>
          )}
        </div>

        {/* Loan Amount */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
            Loan Amount
            <ToggleSwitch
              isOn={isFieldLocked('loanAmount')}
              onToggle={() => toggleFieldLock('loanAmount')}
              fieldName="loanAmount"
            />
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={values.loanAmount}
              onChange={(e) => updateValue('loanAmount', e.target.value)}
              disabled={!isFieldLocked('loanAmount')}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors ${
                isFieldLocked('loanAmount')
                  ? 'border-blue-300 bg-white text-gray-900'
                  : 'border-gray-300 bg-gray-50 text-gray-600'
              }`}
            />
          </div>
          {isFieldLocked('loanAmount') && (
            <button
              onClick={() => updateValue('loanAmount', borrowingPower)}
              className="w-full mt-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Use Max Borrowing Power ({formatCurrency(borrowingPower)})
            </button>
          )}
          {isFieldAutoCalculated('loanAmount') && (
            <p className="text-xs text-green-600 font-medium">✓ Auto-calculated</p>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {results?.validation && (
        <div className="space-y-3 mb-4">
          {/* Errors */}
          {results.validation.errors?.map((error, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{error.message}</p>
                {results.recovery?.map((solution, sIndex) => (
                  <p key={sIndex} className="text-xs text-red-600 mt-1">💡 {solution.message}</p>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Warnings */}
          {results.validation.warnings?.map((warning, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">{warning.message}</p>
              </div>
            </motion.div>
          ))}

          {/* Success */}
          {results.validation.isValid && !results.validation.hasWarnings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800">All calculations are valid!</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Calculation Summary */}
      {results && results.isValid && (
        <div className="space-y-4">
          {/* Main Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              {results.strategy === 'SURPLUS_ANALYSIS' ? 'Surplus Analysis' : 'Calculation Summary'}
            </h4>
            
            {results.strategy === 'SURPLUS_ANALYSIS' ? (
              // Surplus Analysis Display
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Total Funds Required:</span>
                    <div className="font-medium">{formatCurrency(results.totalFundsRequired)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Funds Available:</span>
                    <div className="font-medium">{formatCurrency(results.totalFundsAvailable)}</div>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  results.surplus >= 0 
                    ? 'bg-green-100 border border-green-200' 
                    : 'bg-red-100 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${
                      results.surplus >= 0 ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {results.surplus >= 0 ? 'Surplus Funds:' : 'Shortfall:'}
                    </span>
                    <div className={`text-lg font-bold ${
                      results.surplus >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Math.abs(results.surplus))}
                    </div>
                  </div>
                  <div className={`text-xs mt-1 ${
                    results.surplus >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {results.surplus >= 0 
                      ? '✓ You have extra funds available for additional costs or savings' 
                      : '⚠️ You need additional funds to complete this purchase'
                    }
                  </div>
                </div>
              </div>
            ) : (
              // Normal Calculation Summary
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Deposit Required:</span>
                  <div className="font-medium">{formatCurrency(results.depositAmount || 0)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Cash Needed:</span>
                  <div className="font-medium">{formatCurrency((results.depositAmount || 0) + (results.totalTransactionCosts || 0))}</div>
                </div>
              </div>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Transaction Costs Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Stamp Duty ({state}){isFirstHomeBuyer && ' (First Home Buyer)'}</span>
                <span className="font-medium">{formatCurrency(results.stampDuty || results.costs?.stampDuty || 0)}</span>
              </div>
              {(results.lvr > 80 || (results.costs && results.costs.lmi > 0)) && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lenders Mortgage Insurance (LMI)</span>
                  <span className="font-medium text-orange-600">{formatCurrency(results.lmi || results.costs?.lmi || 0)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Legal Fees</span>
                <span className="font-medium">{formatCurrency(results.costs?.legalFees || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Building & Pest Inspection</span>
                <span className="font-medium">{formatCurrency(results.costs?.inspectionFees || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mortgage Registration Fee ({state})</span>
                <span className="font-medium">{formatCurrency(results.costs?.mortgageRegistrationFee || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Title Transfer Fee ({state})</span>
                <span className="font-medium">{formatCurrency(results.costs?.transferFee || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center font-semibold">
                <span className="text-gray-700">Total Transaction Costs</span>
                <span className="text-blue-600">{formatCurrency(
                  (results.stampDuty || results.costs?.stampDuty || 0) +
                  ((results.lvr > 80 || (results.costs && results.costs.lmi > 0)) ? (results.lmi || results.costs?.lmi || 0) : 0) +
                  (results.costs?.legalFees || 0) +
                  (results.costs?.inspectionFees || 0) +
                  (results.costs?.mortgageRegistrationFee || 0) +
                  (results.costs?.transferFee || 0)
                )}</span>
              </div>
            </div>

            {/* Home Guarantee Scheme Alert */}
            {isFirstHomeBuyer && results.lvr > 80 && results.homeGuaranteeEligible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg"
              >
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Home Guarantee Scheme Eligible!</p>
                    <p className="text-green-700">You can buy with 5% deposit and NO LMI (saves {formatCurrency(results.lmi || 0)})</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* LMI Warning for high LVR */}
            {!isFirstHomeBuyer && results.lvr > 90 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-900">High LVR Warning</p>
                    <p className="text-orange-700">LVR above 90% means higher LMI costs and limited lender options</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Borrowing Power Exceeded Warning */}
            {results.borrowingPowerLimited && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-900">Borrowing Power Exceeded</p>
                    <p className="text-red-700">
                      This loan amount ({formatCurrency(results.loanAmount)}) exceeds your maximum borrowing power ({formatCurrency(borrowingPower)}) by {formatCurrency(results.borrowingPowerShortfall)}.
                    </p>
                    <p className="text-red-700 mt-1">
                      <strong>Realistic loan amount:</strong> {formatCurrency(results.maxAffordableLoanAmount || borrowingPower)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 <strong>Tip:</strong> Lock the fields you know, unlock the ones you want calculated. Need at least 2 locked fields.</p>
      </div>
    </div>
  )
}

export default SmartCalculatorDemo