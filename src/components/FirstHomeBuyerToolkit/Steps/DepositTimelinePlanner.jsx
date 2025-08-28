import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  ArrowLeft,
  PiggyBank,
  DollarSign
} from 'lucide-react'
import { useStepData, useToolkit } from '../ToolkitContext'
import { 
  calculateDepositTimeline, 
  formatCurrency 
} from '../../../utils/financialCalculations'

const DepositTimelinePlanner = () => {
  const navigate = useNavigate()
  const { data, setData, updateCalculations } = useStepData('depositTimeline')
  const { actions } = useToolkit()
  
  const [formData, setFormData] = useState({
    targetDeposit: data.targetDeposit || '',
    currentSavings: data.currentSavings || '',
    monthlyContribution: data.monthlyContribution || '',
    returnRate: data.returnRate || 0.02,
    emergencyFund: data.emergencyFund || ''
  })

  const [results, setResults] = useState(null)

  const calculateResults = () => {
    if (!formData.targetDeposit || !formData.monthlyContribution) return

    const timeline = calculateDepositTimeline(formData)
    setResults(timeline)

    setData({
      ...formData,
      timeline
    })

    updateCalculations({ timeline })
  }

  useEffect(() => {
    if (formData.targetDeposit && formData.monthlyContribution) {
      const timer = setTimeout(calculateResults, 500)
      return () => clearTimeout(timer)
    }
  }, [formData])

  const handleNext = () => {
    actions.completeStep(4)
    navigate('/first-home-buyer/property-search')
  }

  const handleBack = () => {
    navigate('/first-home-buyer/budget-fit')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl mb-6">
          <Target className="h-8 w-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Deposit Timeline Planner
        </h2>
        
        <p className="text-gray-600 mb-8">
          Create a savings plan to reach your target deposit faster. Set goals, track progress, 
          and see how different scenarios affect your timeline.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-blue-800 text-sm">
            🚧 <strong>Coming Soon:</strong> Interactive deposit timeline calculator with scenario modeling, 
            automatic savings goals, and progress tracking integration.
          </p>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back: Budget Check</span>
          </button>
          
          <button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Skip to Property Search</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default DepositTimelinePlanner