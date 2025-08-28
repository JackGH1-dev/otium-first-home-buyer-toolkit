import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Calculator, 
  DollarSign, 
  PieChart, 
  Target, 
  Search, 
  FileCheck,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react'
import { useToolkit } from './ToolkitContext'
import { formatCurrency } from '../../utils/financialCalculations'

const steps = [
  {
    id: 1,
    name: 'Borrowing Power',
    path: 'borrowing-power',
    icon: Calculator,
    description: 'Estimate how much lenders might lend based on your income, debts and expenses',
    time: '5 min',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 2,
    name: 'Max Purchase Price',
    path: 'purchase-price',
    icon: DollarSign,
    description: 'Calculate realistic price ceiling including stamp duty, legal fees and LMI',
    time: '3 min',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 3,
    name: 'Budget Fit',
    path: 'budget-fit',
    icon: PieChart,
    description: 'Check if mortgage repayments and ownership costs fit your budget',
    time: '4 min',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 4,
    name: 'Deposit Timeline',
    path: 'deposit-timeline',
    icon: Target,
    description: 'Build a savings plan to reach your target deposit faster',
    time: '3 min',
    color: 'from-pink-500 to-pink-600'
  },
  {
    id: 5,
    name: 'Property Search',
    path: 'property-search',
    icon: Search,
    description: 'Shortlist properties with budget guardrails and due diligence',
    time: '10 min',
    color: 'from-red-500 to-red-600'
  },
  {
    id: 6,
    name: 'Loan Selection',
    path: 'loan-selection',
    icon: FileCheck,
    description: 'Compare loan products and prepare for pre-approval',
    time: '8 min',
    color: 'from-orange-500 to-orange-600'
  }
]

const ToolkitOverview = () => {
  const navigate = useNavigate()
  const { progress, computed } = useToolkit()

  const handleStartStep = (stepPath) => {
    navigate(`/first-home-buyer/${stepPath}`)
  }

  const summary = computed.getSummary()

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-xl">
          <Calculator className="h-10 w-10 text-white" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            First-Home Buyer
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Toolkit
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A complete 6-step guide to navigate your first home purchase in Australia. 
            From borrowing capacity to pre-approval, we'll help you make informed decisions 
            with confidence.
          </p>
        </div>

        {/* Quick Stats */}
        {progress.completedSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {summary.borrowingPower && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.borrowingPower)}
                  </div>
                  <div className="text-sm text-gray-600">Borrowing Power</div>
                </div>
              )}
              
              {summary.maxPurchasePrice && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summary.maxPurchasePrice)}
                  </div>
                  <div className="text-sm text-gray-600">Max Purchase Price</div>
                </div>
              )}
              
              {summary.affordabilitySignal && (
                <div className="text-center">
                  <div className={`text-2xl font-bold capitalize ${
                    summary.affordabilitySignal === 'green' ? 'text-green-600' : 
                    summary.affordabilitySignal === 'amber' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {summary.affordabilitySignal}
                  </div>
                  <div className="text-sm text-gray-600">Budget Signal</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Progress Overview */}
      {progress.completedSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
            <div className="text-sm text-gray-600">
              {progress.completedSteps.length} of 6 steps completed
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          
          <div className="text-center">
            <span className="text-2xl font-bold text-blue-600">{progress.percentage}%</span>
            <span className="text-gray-600 ml-2">Complete</span>
          </div>
        </motion.div>
      )}

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step, index) => {
          const isCompleted = progress.completedSteps.includes(step.id)
          const canStart = step.id === 1 || progress.completedSteps.includes(step.id - 1)
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative group ${canStart ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => canStart && handleStartStep(step.path)}
            >
              <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 h-full transition-all duration-300 ${
                canStart 
                  ? 'hover:shadow-2xl hover:scale-105 hover:bg-white' 
                  : 'opacity-60'
              }`}>
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isCompleted ? (
                    <div className="bg-green-100 text-green-700 p-2 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  ) : canStart ? (
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                      Ready
                    </div>
                  ) : (
                    <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium">
                      Locked
                    </div>
                  )}
                </div>
                
                {/* Step Content */}
                <div className="space-y-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl shadow-lg`}>
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Step {step.id}: {step.name}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {step.time}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {canStart && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-blue-600 font-medium text-sm">
                        {isCompleted ? 'Review & Update' : 'Get Started'}
                      </span>
                      <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Key Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Why Use This Toolkit?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Australian Standards</h3>
            <p className="text-sm text-gray-600">
              Built with RBA guidelines, Australian lending standards, and current government schemes
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Accurate Calculations</h3>
            <p className="text-sm text-gray-600">
              Stress testing, HEM benchmarks, and real stamp duty calculations for all Australian states
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Save Time</h3>
            <p className="text-sm text-gray-600">
              Complete all calculations in under 30 minutes, with your progress saved automatically
            </p>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <button
          onClick={() => handleStartStep('borrowing-power')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 inline-flex items-center space-x-2"
        >
          <span>Start Your Journey</span>
          <ArrowRight className="h-5 w-5" />
        </button>
        
        <p className="text-sm text-gray-600 mt-4">
          Free to use • No registration required • Progress saved locally
        </p>
      </motion.div>
    </div>
  )
}

export default ToolkitOverview