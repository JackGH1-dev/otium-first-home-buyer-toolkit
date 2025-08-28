import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  ArrowRight,
  ArrowLeft,
  Home,
  MapPin
} from 'lucide-react'
import { useToolkit } from '../ToolkitContext'

const PropertyShortlist = () => {
  const navigate = useNavigate()
  const { actions } = useToolkit()

  const handleNext = () => {
    actions.completeStep(5)
    navigate('/first-home-buyer/loan-selection')
  }

  const handleBack = () => {
    navigate('/first-home-buyer/deposit-timeline')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl mb-6">
          <Search className="h-8 w-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Property Shortlist & Due Diligence
        </h2>
        
        <p className="text-gray-600 mb-8">
          Keep your property choices aligned with your budget and reduce purchase risk with 
          comprehensive due diligence tools and checklists.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-blue-800 text-sm">
            🚧 <strong>Coming Soon:</strong> Property shortlist manager, inspection checklists, 
            suburb analysis, and automated budget compliance checks.
          </p>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back: Deposit Timeline</span>
          </button>
          
          <button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Next: Loan Selection</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default PropertyShortlist