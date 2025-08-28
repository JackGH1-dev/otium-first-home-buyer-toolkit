import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FileCheck, 
  ArrowRight,
  ArrowLeft,
  Award,
  CheckCircle
} from 'lucide-react'
import { useToolkit } from '../ToolkitContext'

const LoanSelection = () => {
  const navigate = useNavigate()
  const { actions } = useToolkit()

  const handleComplete = () => {
    actions.completeStep(6)
    // Could navigate to a completion page or back to overview
    navigate('/first-home-buyer')
  }

  const handleBack = () => {
    navigate('/first-home-buyer/property-search')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl mb-6">
          <FileCheck className="h-8 w-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Loan Selection & Pre-Approval
        </h2>
        
        <p className="text-gray-600 mb-8">
          Compare loan products, understand true costs, and prepare for pre-approval. 
          Get finance confidence before making your offer.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-blue-800 text-sm">
            🚧 <strong>Coming Soon:</strong> Loan comparison engine, pre-approval checklist, 
            documentation tracker, and lender recommendation system.
          </p>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back: Property Search</span>
          </button>
          
          <button
            onClick={handleComplete}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Complete Toolkit</span>
          </button>
        </div>
      </motion.div>

      {/* Congratulations Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 text-center"
      >
        <Award className="h-8 w-8 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-green-900 mb-2">
          🎉 Congratulations!
        </h3>
        <p className="text-green-800">
          You've completed the First-Home Buyer Toolkit! You now have a comprehensive 
          understanding of your borrowing power, budget fit, and next steps toward 
          home ownership.
        </p>
      </motion.div>
    </div>
  )
}

export default LoanSelection