import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calculator, 
  DollarSign, 
  PieChart, 
  Target, 
  Search, 
  FileCheck,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Home
} from 'lucide-react'

// Import step components
import BorrowingPowerEstimator from './Steps/BorrowingPowerEstimator'
import MaxPurchasePriceCalculator from './Steps/MaxPurchasePriceCalculator'
import BudgetFitCheck from './Steps/BudgetFitCheck'
import DepositTimelinePlanner from './Steps/DepositTimelinePlanner'
import PropertyShortlist from './Steps/PropertyShortlist'
import LoanSelection from './Steps/LoanSelection'
import ToolkitOverview from './ToolkitOverview'

// Progress Context
import { ToolkitProvider, useToolkit } from './ToolkitContext'

const steps = [
  {
    id: 1,
    name: 'Borrowing Power',
    path: 'borrowing-power',
    icon: Calculator,
    description: 'Estimate how much lenders might lend you',
    component: BorrowingPowerEstimator
  },
  {
    id: 2,
    name: 'Max Purchase Price',
    path: 'purchase-price',
    icon: DollarSign,
    description: 'Calculate realistic price ceiling including costs',
    component: MaxPurchasePriceCalculator
  },
  {
    id: 3,
    name: 'Budget Fit',
    path: 'budget-fit',
    icon: PieChart,
    description: 'Check if repayments fit your budget',
    component: BudgetFitCheck
  },
  {
    id: 4,
    name: 'Deposit Timeline',
    path: 'deposit-timeline',
    icon: Target,
    description: 'Plan your path to a larger deposit',
    component: DepositTimelinePlanner
  },
  {
    id: 5,
    name: 'Property Search',
    path: 'property-search',
    icon: Search,
    description: 'Shortlist properties with due diligence',
    component: PropertyShortlist
  },
  {
    id: 6,
    name: 'Loan Selection',
    path: 'loan-selection',
    icon: FileCheck,
    description: 'Compare loans and get pre-approved',
    component: LoanSelection
  }
]

const FirstHomeBuyerToolkit = () => {
  return (
    <ToolkitProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<ToolkitOverview />} />
            {steps.map(step => (
              <Route
                key={step.id}
                path={step.path}
                element={
                  <StepWrapper step={step}>
                    <step.component />
                  </StepWrapper>
                }
              />
            ))}
          </Routes>
        </div>
      </div>
    </ToolkitProvider>
  )
}

const StepWrapper = ({ step, children }) => {
  const location = useLocation()
  const { progress } = useToolkit()
  
  return (
    <div className="space-y-6">
      {/* Progress Navigation */}
      <ProgressNavigation currentStep={step.id} />
      
      {/* Step Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl">
          <step.icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Step {step.id}: {step.name}
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            {step.description}
          </p>
        </div>
      </motion.div>

      {/* Step Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

const ProgressNavigation = ({ currentStep }) => {
  const navigate = useNavigate()
  const { progress } = useToolkit()
  
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
        <button
          onClick={() => navigate('/first-home-buyer')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
        >
          <Home className="h-4 w-4" />
          <span>Overview</span>
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {steps.map((step, index) => {
          const isCompleted = progress.completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep
          const isAccessible = step.id === 1 || progress.completedSteps.includes(step.id - 1)
          
          return (
            <motion.button
              key={step.id}
              onClick={() => isAccessible && navigate(`/first-home-buyer/${step.path}`)}
              disabled={!isAccessible}
              className={`p-4 rounded-xl transition-all duration-200 ${
                isCurrent 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105' 
                  : isCompleted
                  ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  : isAccessible
                  ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              whileHover={isAccessible ? { scale: 1.05 } : {}}
              whileTap={isAccessible ? { scale: 0.95 } : {}}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`relative ${isCurrent ? 'text-white' : ''}`}>
                  <step.icon className="h-5 w-5" />
                  {isCompleted && !isCurrent && (
                    <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-600 bg-white rounded-full" />
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">Step {step.id}</div>
                  <div className="text-xs opacity-90">{step.name}</div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round((progress.completedSteps.length / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(progress.completedSteps.length / steps.length) * 100}%` 
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  )
}

export default FirstHomeBuyerToolkit