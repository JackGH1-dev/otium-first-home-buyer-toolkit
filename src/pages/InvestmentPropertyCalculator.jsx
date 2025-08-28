import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Home, Calculator, 
  DollarSign, PieChart, BarChart3, LineChart,
  Download, Save, Copy, AlertTriangle,
  Info, Target, Calendar, Percent,
  Settings, MapPin, Building, Banknote,
  ChevronDown, ChevronUp, Play, Pause,
  ArrowRight, CheckCircle, AlertCircle
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Currency formatting helpers
const formatCurrencyShort = (value) => {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `$${(value/1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `$${(value/1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(value/1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

const formatCurrencyFull = (value) => {
  return value.toLocaleString('en-AU', { 
    style: 'currency', 
    currency: 'AUD', 
    maximumFractionDigits: 0 
  })
}
import {
  AUSTRALIAN_STATES,
  PROPERTY_TYPES,
  PROPERTY_MARKET_PRESETS,
  calculateStampDuty,
  calculateLandTax,
  calculateLMI,
  calculateTotalAcquisitionCosts,
  calculatePropertyProjection,
  formatAUD,
  formatPercent,
  exportToCSV
} from '../utils/australianPropertyData'

const InvestmentPropertyCalculator = () => {
  // Form state
  const [formData, setFormData] = useState({
    // Property & Market
    propertyValue: 750000,
    settlementDate: new Date().toISOString().split('T')[0],
    state: 'NSW',
    propertyType: 'house',
    location: 'Sydney',
    propertyGrowth: 0.045,
    rentalYield: 0.035,
    rentGrowth: 0.035,
    vacancyRate: 0.02,
    
    // Loan Structure
    loanAmount: 600000,
    interestRate: 0.065,
    termYears: 30,
    ioYears: 2,
    offsetBalance: 50000,
    offsetContribution: 1000,
    extraRepayments: 0,
    
    // Costs
    managementFeeRate: 0.07,
    councilRates: 2500,
    insurance: 1200,
    strataFees: 0,
    maintenanceRate: 0.012,
    
    // Tax Settings
    marginalTaxRate: 0.325,
    depreciationEnabled: true,
    negativeGearingEnabled: true
  })

  // UI state
  const [activeTab, setActiveTab] = useState('overview')
  const [projectionYears, setProjectionYears] = useState(30)
  const [scenarios, setScenarios] = useState([])
  const [currentScenario, setCurrentScenario] = useState(0)
  const [isCalculating, setIsCalculating] = useState(false)

  // Calculate projections
  const projectionData = useMemo(() => {
    if (!formData.propertyValue || !formData.loanAmount) return []
    
    return calculatePropertyProjection(formData, projectionYears)
  }, [formData, projectionYears])

  // Calculate acquisition costs
  const acquisitionCosts = useMemo(() => {
    return calculateTotalAcquisitionCosts(
      formData.propertyValue, 
      formData.state, 
      formData.loanAmount
    )
  }, [formData.propertyValue, formData.state, formData.loanAmount])

  // Key metrics
  const keyMetrics = useMemo(() => {
    if (!projectionData.length) return null

    const year10 = projectionData[9] || {}
    const year20 = projectionData[19] || {}
    const year30 = projectionData[29] || {}

    const totalCashFlow = projectionData.reduce((sum, year) => sum + year.cashFlowAfterTax, 0)
    const totalEquityGrowth = year30.bookEquity - (formData.propertyValue - formData.loanAmount)
    
    // Calculate IRR (simplified)
    const initialInvestment = formData.propertyValue - formData.loanAmount + acquisitionCosts.total
    const finalValue = year30.netEquityIfSold + totalCashFlow
    const years = projectionData.length
    const irr = Math.pow(finalValue / initialInvestment, 1 / years) - 1

    return {
      year10,
      year20,
      year30,
      totalCashFlow,
      totalEquityGrowth,
      irr,
      initialInvestment,
      lvr: (formData.loanAmount / formData.propertyValue) * 100
    }
  }, [projectionData, formData, acquisitionCosts])

  // Handle form updates
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-update presets when location changes
    if (field === 'location' && PROPERTY_MARKET_PRESETS[value]) {
      const preset = PROPERTY_MARKET_PRESETS[value]
      setFormData(prev => ({
        ...prev,
        propertyValue: preset.medianPrice[prev.propertyType] || prev.propertyValue,
        rentalYield: preset.rentalYield[prev.propertyType] || prev.rentalYield,
        propertyGrowth: preset.growthRate,
        rentGrowth: preset.rentGrowth
      }))
    }
  }

  // Load market presets
  const loadPreset = (location, propertyType) => {
    const preset = PROPERTY_MARKET_PRESETS[location]
    if (!preset) return

    setFormData(prev => ({
      ...prev,
      location,
      propertyType,
      propertyValue: preset.medianPrice[propertyType],
      rentalYield: preset.rentalYield[propertyType],
      propertyGrowth: preset.growthRate,
      rentGrowth: preset.rentGrowth
    }))
  }

  // Export data
  const handleExport = () => {
    exportToCSV(projectionData, `investment-property-projection-${Date.now()}.csv`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl mb-4">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Investment Property Calculator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Project returns, equity, and cash flows for Australian investment properties over 30 years
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-white/20 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Home },
              { id: 'property', label: 'Property', icon: Building },
              { id: 'loan', label: 'Loan', icon: Banknote },
              { id: 'costs', label: 'Costs', icon: DollarSign },
              { id: 'projections', label: 'Projections', icon: TrendingUp },
              { id: 'scenarios', label: 'Scenarios', icon: Target }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Inputs */}
          <div className="lg:col-span-1 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'property' && <PropertyTab formData={formData} updateFormData={updateFormData} loadPreset={loadPreset} />}
              {activeTab === 'loan' && <LoanTab formData={formData} updateFormData={updateFormData} />}
              {activeTab === 'costs' && <CostsTab formData={formData} updateFormData={updateFormData} />}
              {activeTab === 'projections' && <ProjectionsTab projectionData={projectionData} />}
              {activeTab === 'scenarios' && <ScenariosTab />}
            </AnimatePresence>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Key Metrics Cards */}
            {keyMetrics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* 10 Year */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">10 Years</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Property Value</p>
                      <p className="text-xl font-bold text-gray-900">{formatAUD(keyMetrics.year10.propertyValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Equity</p>
                      <p className="text-lg font-semibold text-green-600">{formatAUD(keyMetrics.year10.bookEquity)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Annual Cash Flow</p>
                      <p className={`text-lg font-semibold ${keyMetrics.year10.cashFlowAfterTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAUD(keyMetrics.year10.cashFlowAfterTax)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 20 Year */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <Target className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">20 Years</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Property Value</p>
                      <p className="text-xl font-bold text-gray-900">{formatAUD(keyMetrics.year20.propertyValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Equity</p>
                      <p className="text-lg font-semibold text-green-600">{formatAUD(keyMetrics.year20.bookEquity)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Annual Cash Flow</p>
                      <p className={`text-lg font-semibold ${keyMetrics.year20.cashFlowAfterTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAUD(keyMetrics.year20.cashFlowAfterTax)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 30 Year */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">30 Years</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Property Value</p>
                      <p className="text-xl font-bold text-gray-900">{formatAUD(keyMetrics.year30.propertyValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Equity (if sold)</p>
                      <p className="text-lg font-semibold text-green-600">{formatAUD(keyMetrics.year30.netEquityIfSold)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Return (IRR)</p>
                      <p className="text-lg font-semibold text-blue-600">{formatPercent(keyMetrics.irr)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Acquisition Costs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <span>Acquisition Costs</span>
                </h3>
                <div className="text-2xl font-bold text-blue-600">
                  {formatAUD(acquisitionCosts.total)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg">{formatAUD(acquisitionCosts.stampDuty)}</div>
                  <div className="text-sm text-gray-600">Stamp Duty</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg">{formatAUD(acquisitionCosts.lmiCost)}</div>
                  <div className="text-sm text-gray-600">LMI</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg">{formatAUD(acquisitionCosts.legalFees)}</div>
                  <div className="text-sm text-gray-600">Legal Fees</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg">{formatAUD(acquisitionCosts.inspectionFees)}</div>
                  <div className="text-sm text-gray-600">Inspections</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg">{formatAUD(acquisitionCosts.lenderFees)}</div>
                  <div className="text-sm text-gray-600">Lender Fees</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg">{formatAUD(acquisitionCosts.transferFee)}</div>
                  <div className="text-sm text-gray-600">Transfer</div>
                </div>
              </div>

              {/* Cash Required */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Cash Required</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatAUD((formData.propertyValue - formData.loanAmount) + acquisitionCosts.total)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Deposit + Acquisition Costs
                </div>
              </div>
            </motion.div>

            {/* Charts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <LineChart className="h-5 w-5 text-gray-600" />
                  <span>Property Value vs Loan Balance</span>
                </h3>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              
              {/* Simple Line Chart */}
              <PropertyValueChart data={projectionData} />
            </motion.div>

            {/* Cash Flow Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <span>Annual Cash Flow Analysis</span>
              </h3>
              
              <CashFlowChart data={projectionData} />
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  )
}

// Overview Tab Component
const OverviewTab = () => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
  >
    <h2 className="text-xl font-semibold text-gray-900 mb-4">
      Investment Property Calculator
    </h2>
    
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-xl">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">How it works</h4>
            <p className="text-sm text-blue-800">
              This calculator projects property value, rental income, expenses, and equity growth over 30 years. 
              All calculations use Australian tax laws, stamp duty rates, and lending practices.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-green-50 rounded-xl">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-green-900 mb-1">Features included</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• State-specific stamp duty and land tax</li>
              <li>• Interest-only periods and offset accounts</li>
              <li>• Negative gearing and depreciation benefits</li>
              <li>• Capital gains tax estimates</li>
              <li>• Scenario analysis and stress testing</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-xl">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">Important disclaimer</h4>
            <p className="text-sm text-yellow-800">
              This is a general calculator for educational purposes only. Results are estimates based on 
              assumptions that may not reflect your actual situation. Seek professional financial advice.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">Ready to start? Choose a tab above to begin:</p>
        <div className="flex justify-center space-x-2 text-xs">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Property</span>
          <ArrowRight className="h-4 w-4 text-gray-400 mt-0.5" />
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Loan</span>
          <ArrowRight className="h-4 w-4 text-gray-400 mt-0.5" />
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Costs</span>
        </div>
      </div>
    </div>
  </motion.div>
)

// Property Tab Component
const PropertyTab = ({ formData, updateFormData, loadPreset }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
  >
    <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>
    
    <div className="space-y-6">
      {/* Location & Market Presets */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Location & Market Data
        </label>
        <div className="grid grid-cols-1 gap-3">
          <select
            value={formData.state}
            onChange={(e) => updateFormData('state', e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            {AUSTRALIAN_STATES.map(state => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          
          <select
            value={formData.location}
            onChange={(e) => updateFormData('location', e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            {Object.keys(PROPERTY_MARKET_PRESETS).map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Property Type & Price */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Type
          </label>
          <select
            value={formData.propertyType}
            onChange={(e) => {
              updateFormData('propertyType', e.target.value)
              loadPreset(formData.location, e.target.value)
            }}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            {PROPERTY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Purchase Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-lg text-gray-500">$</span>
            <input
              type="number"
              value={formData.propertyValue}
              onChange={(e) => updateFormData('propertyValue', Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
              placeholder="750,000"
            />
          </div>
        </div>
      </div>

      {/* Growth Assumptions */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Growth Assumptions</h3>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Growth (Annual): {formatPercent(formData.propertyGrowth)}
          </label>
          <input
            type="range"
            min="0.01"
            max="0.08"
            step="0.005"
            value={formData.propertyGrowth}
            onChange={(e) => updateFormData('propertyGrowth', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1%</span>
            <span>8%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rental Yield: {formatPercent(formData.rentalYield)}
          </label>
          <input
            type="range"
            min="0.02"
            max="0.08"
            step="0.0025"
            value={formData.rentalYield}
            onChange={(e) => updateFormData('rentalYield', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2%</span>
            <span>8%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rent Growth (Annual): {formatPercent(formData.rentGrowth)}
          </label>
          <input
            type="range"
            min="0.01"
            max="0.06"
            step="0.0025"
            value={formData.rentGrowth}
            onChange={(e) => updateFormData('rentGrowth', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1%</span>
            <span>6%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Vacancy Rate: {formatPercent(formData.vacancyRate)}
          </label>
          <input
            type="range"
            min="0"
            max="0.1"
            step="0.005"
            value={formData.vacancyRate}
            onChange={(e) => updateFormData('vacancyRate', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
)

// Loan Tab Component  
const LoanTab = ({ formData, updateFormData }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
  >
    <h2 className="text-xl font-semibold text-gray-900 mb-6">Loan Structure</h2>
    
    <div className="space-y-6">
      
      {/* Loan Amount & LVR */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Loan Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-lg text-gray-500">$</span>
          <input
            type="number"
            value={formData.loanAmount}
            onChange={(e) => updateFormData('loanAmount', Number(e.target.value))}
            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none"
            placeholder="600,000"
          />
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-gray-600">
            LVR: {formatPercent((formData.loanAmount / formData.propertyValue) || 0)}
          </span>
          <span className={`font-semibold ${
            (formData.loanAmount / formData.propertyValue) > 0.8 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {(formData.loanAmount / formData.propertyValue) > 0.8 ? 'LMI Required' : 'No LMI'}
          </span>
        </div>
      </div>

      {/* Interest Rate & Term */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Interest Rate: {formatPercent(formData.interestRate)}
          </label>
          <input
            type="range"
            min="0.02"
            max="0.10"
            step="0.0025"
            value={formData.interestRate}
            onChange={(e) => updateFormData('interestRate', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2%</span>
            <span>10%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Loan Term (Years)
          </label>
          <select
            value={formData.termYears}
            onChange={(e) => updateFormData('termYears', Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value={25}>25 years</option>
            <option value={30}>30 years</option>
            <option value={35}>35 years</option>
          </select>
        </div>
      </div>

      {/* Interest Only Period */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Interest Only Period (Years)
        </label>
        <select
          value={formData.ioYears}
          onChange={(e) => updateFormData('ioYears', Number(e.target.value))}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
        >
          <option value={0}>No Interest Only</option>
          <option value={1}>1 year</option>
          <option value={2}>2 years</option>
          <option value={3}>3 years</option>
          <option value={4}>4 years</option>
          <option value={5}>5 years</option>
        </select>
      </div>

      {/* Offset Account */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Offset Account</h3>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Starting Offset Balance
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-lg text-gray-500">$</span>
            <input
              type="number"
              value={formData.offsetBalance}
              onChange={(e) => updateFormData('offsetBalance', Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="50,000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Monthly Offset Contribution
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-lg text-gray-500">$</span>
            <input
              type="number"
              value={formData.offsetContribution}
              onChange={(e) => updateFormData('offsetContribution', Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="1,000"
            />
          </div>
        </div>
      </div>

    </div>
  </motion.div>
)

// Costs Tab Component
const CostsTab = ({ formData, updateFormData }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
  >
    <h2 className="text-xl font-semibold text-gray-900 mb-6">Ownership Costs</h2>
    
    <div className="space-y-6">
      
      {/* Property Management */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Property Management Fee: {formatPercent(formData.managementFeeRate)}
        </label>
        <input
          type="range"
          min="0.05"
          max="0.10"
          step="0.0025"
          value={formData.managementFeeRate}
          onChange={(e) => updateFormData('managementFeeRate', Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5%</span>
          <span>10%</span>
        </div>
      </div>

      {/* Fixed Annual Costs */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Annual Fixed Costs</h3>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Council Rates
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-lg text-gray-500">$</span>
            <input
              type="number"
              value={formData.councilRates}
              onChange={(e) => updateFormData('councilRates', Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="2,500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Landlord Insurance
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-lg text-gray-500">$</span>
            <input
              type="number"
              value={formData.insurance}
              onChange={(e) => updateFormData('insurance', Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="1,200"
            />
          </div>
        </div>

        {formData.propertyType === 'unit' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Strata Fees (Annual)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-lg text-gray-500">$</span>
              <input
                type="number"
                value={formData.strataFees}
                onChange={(e) => updateFormData('strataFees', Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                placeholder="3,000"
              />
            </div>
          </div>
        )}
      </div>

      {/* Maintenance Rate */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Maintenance (% of Property Value): {formatPercent(formData.maintenanceRate)}
        </label>
        <input
          type="range"
          min="0.005"
          max="0.020"
          step="0.001"
          value={formData.maintenanceRate}
          onChange={(e) => updateFormData('maintenanceRate', Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.5%</span>
          <span>2.0%</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Annual maintenance cost: {formatAUD(formData.propertyValue * formData.maintenanceRate)}
        </p>
      </div>

      {/* Tax Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Tax Settings</h3>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Marginal Tax Rate: {formatPercent(formData.marginalTaxRate)}
          </label>
          <select
            value={formData.marginalTaxRate}
            onChange={(e) => updateFormData('marginalTaxRate', Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value={0.19}>19% ($45,001 - $120,000)</option>
            <option value={0.325}>32.5% ($120,001 - $180,000)</option>
            <option value={0.37}>37% ($180,001+)</option>
            <option value={0.45}>45% (No TFN or foreign resident)</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="depreciation"
            checked={formData.depreciationEnabled}
            onChange={(e) => updateFormData('depreciationEnabled', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="depreciation" className="text-sm font-medium text-gray-700">
            Include depreciation benefits (Division 43/40)
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="negativegearing"
            checked={formData.negativeGearingEnabled}
            onChange={(e) => updateFormData('negativeGearingEnabled', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="negativegearing" className="text-sm font-medium text-gray-700">
            Apply negative gearing tax benefits
          </label>
        </div>
      </div>

    </div>
  </motion.div>
)

// Projections Tab Component
const ProjectionsTab = ({ projectionData }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
  >
    <h2 className="text-xl font-semibold text-gray-900 mb-6">Projection Data</h2>
    
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {projectionData.slice(0, 10).map((year, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-900">Year {year.year}</h3>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              year.cashFlowAfterTax >= 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {year.cashFlowAfterTax >= 0 ? 'Positive' : 'Negative'} Cash Flow
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Property Value:</span>
              <span className="ml-2 font-medium">{formatAUD(year.propertyValue)}</span>
            </div>
            <div>
              <span className="text-gray-600">Loan Balance:</span>
              <span className="ml-2 font-medium">{formatAUD(year.loanBalance)}</span>
            </div>
            <div>
              <span className="text-gray-600">Equity:</span>
              <span className="ml-2 font-medium">{formatAUD(year.bookEquity)}</span>
            </div>
            <div>
              <span className="text-gray-600">Cash Flow:</span>
              <span className={`ml-2 font-medium ${
                year.cashFlowAfterTax >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAUD(year.cashFlowAfterTax)}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {projectionData.length > 10 && (
        <div className="text-center text-sm text-gray-500 py-4">
          ... and {projectionData.length - 10} more years
        </div>
      )}
    </div>
  </motion.div>
)

// Scenarios Tab Component
const ScenariosTab = () => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
  >
    <h2 className="text-xl font-semibold text-gray-900 mb-6">Scenario Analysis</h2>
    
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 rounded-xl">
        <div className="flex items-start space-x-3">
          <Settings className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">Coming Soon</h4>
            <p className="text-sm text-yellow-800">
              Advanced scenario modeling including rate shocks, vacancy increases, and growth downturns will be available in the next update.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Planned Scenarios</h3>
        
        {[
          { name: 'Conservative', desc: 'Lower growth, higher vacancy' },
          { name: 'Optimistic', desc: 'Higher growth, lower costs' },
          { name: 'Rate Shock', desc: 'Interest rates +2% in year 3' },
          { name: 'Market Downturn', desc: 'Property values flat for 5 years' }
        ].map((scenario, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg opacity-50">
            <h4 className="font-medium text-gray-900">{scenario.name}</h4>
            <p className="text-sm text-gray-600">{scenario.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
)

// Professional Property Value Chart with Chart.js
const PropertyValueChart = ({ data }) => {
  if (!data || data.length === 0) return null

  const displayData = data.slice(0, 15) // Show first 15 years
  
  // Extract data arrays
  const years = displayData.map(d => `Year ${d.year}`)
  const propertyValues = displayData.map(d => d.propertyValue)
  const loanBalances = displayData.map(d => d.loanBalance)
  const equityValues = displayData.map(d => d.propertyValue - d.loanBalance)

  // Calculate proper y-axis domain with padding
  const allMainValues = [...propertyValues, ...loanBalances]
  const minValue = Math.min(...allMainValues)
  const maxValue = Math.max(...allMainValues)
  const range = maxValue - minValue
  const padding = Math.max(range * 0.08, maxValue * 0.01)
  const yMin = Math.max(0, minValue - padding)
  const yMax = maxValue + padding

  // Calculate equity domain for right y-axis
  const minEquity = Math.min(...equityValues)
  const maxEquity = Math.max(...equityValues)
  const equityRange = maxEquity - minEquity
  const equityPadding = Math.max(equityRange * 0.1, maxEquity * 0.02)
  const equityMin = Math.max(0, minEquity - equityPadding)
  const equityMax = maxEquity + equityPadding

  const chartData = {
    labels: years,
    datasets: [
      {
        label: 'Property Value',
        data: propertyValues,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        yAxisID: 'y'
      },
      {
        label: 'Loan Balance',
        data: loanBalances,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        yAxisID: 'y'
      },
      {
        label: 'Equity',
        data: equityValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        tension: 0.2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        yAxisID: 'y2'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      title: {
        display: false
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'system-ui, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrencyFull(context.raw)}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            family: 'system-ui, sans-serif',
            size: 11
          },
          color: '#6b7280'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: yMin,
        max: yMax,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        },
        ticks: {
          maxTicksLimit: 6,
          callback: function(value) {
            return formatCurrencyShort(value)
          },
          font: {
            family: 'system-ui, sans-serif',
            size: 11
          },
          color: '#6b7280'
        },
        title: {
          display: true,
          text: 'Property Value / Loan Balance',
          font: {
            family: 'system-ui, sans-serif',
            size: 12,
            weight: '600'
          },
          color: '#374151'
        }
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        min: equityMin,
        max: equityMax,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          maxTicksLimit: 6,
          callback: function(value) {
            return formatCurrencyShort(value)
          },
          font: {
            family: 'system-ui, sans-serif',
            size: 11
          },
          color: '#6b7280'
        },
        title: {
          display: true,
          text: 'Equity',
          font: {
            family: 'system-ui, sans-serif',
            size: 12,
            weight: '600'
          },
          color: '#374151'
        }
      }
    },
    elements: {
      line: {
        tension: 0.1
      }
    }
  }

  return (
    <div className="h-80 bg-white rounded-lg p-4 border border-gray-200">
      <Line data={chartData} options={options} />
      
      {/* Chart explanation */}
      <div className="text-center mt-3">
        <p className="text-xs text-gray-500">
          Property value (green) and loan balance (red) are shown on the left axis. 
          Equity growth (blue, filled area) uses the right axis scale.
        </p>
      </div>
    </div>
  )
}

// Improved Cash Flow Chart Component (Waterfall Style)
const CashFlowChart = ({ data }) => {
  if (!data || data.length === 0) return null

  const displayData = data.slice(0, 10) // Show first 10 years
  
  // Calculate max values for scaling
  const maxIncome = Math.max(...displayData.map(d => d.rentCollected))
  const maxOutgoing = Math.max(...displayData.map(d => d.totalExpenses + d.annualInterest))
  const maxTotal = Math.max(maxIncome, maxOutgoing)
  
  // Find the range for net cash flow
  const maxNetFlow = Math.max(...displayData.map(d => Math.abs(d.cashFlowAfterTax)))

  return (
    <div className="h-80">
      <div className="h-64 border border-gray-200 rounded-lg bg-gradient-to-t from-gray-50 to-white p-4">
        
        {/* Zero line */}
        <div className="absolute left-12 right-12 top-1/2 border-t border-gray-400 border-dashed">
          <span className="absolute -left-8 -top-2 text-xs text-gray-500">$0</span>
        </div>
        
        <div className="flex items-center justify-center space-x-2 h-full relative">
          {displayData.map((year, index) => {
            
            const rentHeight = (year.rentCollected / maxTotal) * 90 // 90% of container height
            const expenseHeight = (year.totalExpenses / maxTotal) * 90
            const interestHeight = (year.annualInterest / maxTotal) * 90
            const netFlow = year.cashFlowAfterTax
            const netFlowHeight = Math.abs(netFlow) / maxNetFlow * 40 // 40% max height for net
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center h-full justify-center relative">
                
                {/* Rental Income (Above zero line) */}
                <div className="absolute bottom-1/2 w-8 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm shadow-sm group relative transition-all duration-300 hover:shadow-lg"
                    style={{
                      height: `${rentHeight}px`,
                      minHeight: '8px'
                    }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      Year {year.year}<br/>
                      Rent: {formatAUD(year.rentCollected)}
                    </div>
                  </div>
                </div>
                
                {/* Total Expenses (Below zero line) */}
                <div className="absolute top-1/2 w-8 flex flex-col items-center">
                  <div className="flex flex-col w-full">
                    
                    {/* Property Expenses */}
                    <div 
                      className="w-full bg-gradient-to-b from-red-500 to-red-600 shadow-sm group relative transition-all duration-300 hover:shadow-lg"
                      style={{
                        height: `${expenseHeight}px`,
                        minHeight: '6px'
                      }}
                    >
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        Expenses: {formatAUD(year.totalExpenses)}
                      </div>
                    </div>
                    
                    {/* Interest Expenses */}
                    <div 
                      className="w-full bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-b-sm shadow-sm group relative transition-all duration-300 hover:shadow-lg"
                      style={{
                        height: `${interestHeight}px`,
                        minHeight: '6px'
                      }}
                    >
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        Interest: {formatAUD(year.annualInterest)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Net Cash Flow Indicator */}
                <div className="absolute right-0 top-1/2 transform translate-x-6 -translate-y-1/2">
                  <div 
                    className={`w-3 rounded-sm shadow-sm ${
                      netFlow >= 0 
                        ? 'bg-gradient-to-t from-blue-600 to-blue-400' 
                        : 'bg-gradient-to-b from-orange-600 to-orange-500'
                    }`}
                    style={{
                      height: `${netFlowHeight}px`,
                      minHeight: '4px',
                      marginTop: netFlow >= 0 ? `-${netFlowHeight}px` : '0'
                    }}
                  />
                  <div className={`text-xs font-semibold text-center mt-1 ${
                    netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {netFlow >= 0 ? '+' : ''}{formatAUD(netFlow).replace('$-', '-$')}
                  </div>
                </div>
                
                {/* Year label */}
                <div className="absolute -bottom-8 text-xs text-gray-500 text-center font-medium">
                  Y{year.year}
                </div>
                
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-t from-green-600 to-green-400 rounded-sm shadow-sm"></div>
          <span className="text-sm text-gray-600">Rental Income</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-b from-red-500 to-red-600 rounded-sm shadow-sm"></div>
          <span className="text-sm text-gray-600">Property Expenses</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-sm shadow-sm"></div>
          <span className="text-sm text-gray-600">Interest</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm shadow-sm"></div>
          <span className="text-sm text-gray-600">Net Cash Flow</span>
        </div>
      </div>
      
      {/* Chart explanation */}
      <div className="text-center mt-3">
        <p className="text-xs text-gray-500">
          Green bars (above line) show rental income. Red/yellow bars (below line) show expenses and interest. 
          Blue/orange arrows show net cash flow result.
        </p>
      </div>
    </div>
  )
}

export default InvestmentPropertyCalculator