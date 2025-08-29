import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Percent, 
  Lock, 
  LockOpen,
  AlertTriangle,
  Info,
  CheckCircle,
  Gift,
  MapPin,
  Calculator
} from 'lucide-react'
import { 
  smartAutoCalculate, 
  formatCurrency, 
  formatPercentage,
  calculateStampDuty,
  calculateLMI,
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

const SmartCalculatorDemo = ({ borrowingPower = 600000, initialState = 'NSW' }) => {
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
  const [lockedFields, setLockedFields] = useState(['propertyValue', 'fundsAvailable'])
  
  // Calculation results
  const [results, setResults] = useState(null)

  // Toggle field lock/unlock
  const toggleFieldLock = (field) => {
    setLockedFields(prev => {
      const currentlyLocked = prev.includes(field)
      console.log(`Toggling ${field}, currently locked:`, currentlyLocked, 'Current locked fields:', prev)
      
      let newLocked
      if (currentlyLocked) {
        // Unlocking a field
        newLocked = prev.filter(f => f !== field)
        console.log('After unlocking:', newLocked)
        
        // Ensure we don't go below 1 locked field (need at least 1 input)
        if (newLocked.length < 1) {
          console.log('Prevented: Would have 0 locked fields')
          return prev
        }
      } else {
        // Locking a field
        newLocked = [...prev, field]
        console.log('After locking:', newLocked)
        
        // Don't allow more than 3 locked fields (would over-constrain)
        if (newLocked.length > 3) {
          console.log('Prevented: Would have >3 locked fields')
          return prev
        }
      }
      
      console.log('Final locked fields:', newLocked)
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

  // Run smart calculation when values, locked fields, or buyer status change
  useEffect(() => {
    if (lockedFields.length >= 2) {
      const calculation = smartAutoCalculate(values, lockedFields, borrowingPower, state)
      
      // Calculate additional costs based on state and first home buyer status
      if (calculation.propertyValue && calculation.loanAmount) {
        const stampDuty = calculateStampDuty(calculation.propertyValue, state, isFirstHomeBuyer)
        const lmi = calculation.lvr > 80 ? calculateLMI(calculation.loanAmount, calculation.propertyValue) : 0
        
        calculation.stampDuty = stampDuty
        calculation.lmi = lmi
        calculation.totalTransactionCosts = (calculation.costs?.total || 0) + stampDuty + lmi
        calculation.isFirstHomeBuyer = isFirstHomeBuyer
        calculation.state = state
        
        // Check Home Guarantee Scheme eligibility
        if (isFirstHomeBuyer && calculation.lvr > 80) {
          const schemeCap = HOME_GUARANTEE_SCHEME_CAPS[state]?.capital || 0
          calculation.homeGuaranteeEligible = calculation.propertyValue <= schemeCap
          calculation.homeGuaranteeCap = schemeCap
        }
      }
      
      setResults(calculation)
      
      // Update auto-calculated fields
      if (calculation.metadata?.autoCalculatedFields) {
        setValues(prev => {
          const updated = { ...prev }
          calculation.metadata.autoCalculatedFields.forEach(field => {
            if (calculation[field] !== undefined) {
              updated[field] = calculation[field]
            }
          })
          return updated
        })
      }
    }
  }, [values, lockedFields, borrowingPower, state, isFirstHomeBuyer])

  const isFieldLocked = (field) => lockedFields.includes(field)
  const isFieldAutoCalculated = (field) => results?.metadata?.autoCalculatedFields?.includes(field)

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
            <span className="text-gray-500">Locked fields:</span>
            {lockedFields.map(field => (
              <span key={field} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                🔒 {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            ))}
            {lockedFields.length === 0 && (
              <span className="text-red-500">No fields locked - click lock icons to set inputs</span>
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
            <button
              onClick={() => toggleFieldLock('propertyValue')}
              className={`p-1 rounded transition-colors ${
                isFieldLocked('propertyValue') 
                  ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isFieldLocked('propertyValue') ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            </button>
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
            <button
              onClick={() => toggleFieldLock('fundsAvailable')}
              className={`p-1 rounded transition-colors ${
                isFieldLocked('fundsAvailable') 
                  ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isFieldLocked('fundsAvailable') ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            </button>
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
            <button
              onClick={() => toggleFieldLock('lvr')}
              className={`p-1 rounded transition-colors ${
                isFieldLocked('lvr') 
                  ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isFieldLocked('lvr') ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            </button>
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
            <button
              onClick={() => toggleFieldLock('loanAmount')}
              className={`p-1 rounded transition-colors ${
                isFieldLocked('loanAmount') 
                  ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isFieldLocked('loanAmount') ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            </button>
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
            <h4 className="font-semibold text-gray-900 mb-3">Calculation Summary</h4>
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
                <span className="font-medium">{formatCurrency(results.stampDuty || 0)}</span>
              </div>
              {results.lvr > 80 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lenders Mortgage Insurance (LMI)</span>
                  <span className="font-medium text-orange-600">{formatCurrency(results.lmi || 0)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Other Costs (Legal, Inspection, etc.)</span>
                <span className="font-medium">{formatCurrency((results.costs?.total || 0) - (results.stampDuty || 0) - (results.lmi || 0))}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center font-semibold">
                <span className="text-gray-700">Total Transaction Costs</span>
                <span className="text-blue-600">{formatCurrency(results.totalTransactionCosts || results.costs?.total || 0)}</span>
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