import React, { createContext, useContext, useReducer, useEffect } from 'react'

const ToolkitContext = createContext()

// Action types
const ACTIONS = {
  SET_STEP_DATA: 'SET_STEP_DATA',
  COMPLETE_STEP: 'COMPLETE_STEP',
  RESET_TOOLKIT: 'RESET_TOOLKIT',
  LOAD_SAVED_DATA: 'LOAD_SAVED_DATA',
  UPDATE_CALCULATIONS: 'UPDATE_CALCULATIONS'
}

// Initial state
const initialState = {
  // Progress tracking
  completedSteps: [],
  currentStep: 1,
  
  // Step 1: Borrowing Power data
  borrowingPower: {
    primaryIncome: '',
    secondaryIncome: '',
    existingDebts: '',
    livingExpenses: '',
    interestRate: 5.5, // Default current rate (updated 2025)
    termYears: 30,
    loanType: 'principal-interest', // Default to P&I
    scenarioType: 'single', // single, couple, dependents
    hecsDepartment: 0, // HECS/HELP debt balance
    manualExpenseOverride: false, // Use HEM vs manual
    dependents: 0,
    // Results
    maxLoan: null,
    surplus: null,
    dti: null,
    assessedExpenses: null
  },
  
  // Step 2: Max Purchase Price data
  purchasePrice: {
    deposit: '',
    state: 'NSW',
    isFirstHomeBuyer: false,
    targetLVR: 80,
    // Results
    maxPrice: null,
    costs: null,
    cashRequired: null
  },
  
  // Step 3: Budget Fit data
  budgetFit: {
    monthlyIncome: '',
    monthlyExpenses: '',
    ownershipCosts: 0.01,
    // Results
    affordability: null,
    signal: null
  },
  
  // Step 4: Deposit Timeline data
  depositTimeline: {
    targetDeposit: '',
    currentSavings: '',
    monthlyContribution: '',
    returnRate: 0.02,
    emergencyFund: '',
    // Results
    timeline: null
  },
  
  // Step 5: Property Shortlist data
  propertyShortlist: {
    criteria: {
      priceRange: { min: '', max: '' },
      suburbs: [],
      propertyType: '',
      bedrooms: '',
      commute: ''
    },
    properties: [],
    filters: {
      maxStratafees: '',
      maxAge: '',
      inspectionRequired: true
    }
  },
  
  // Step 6: Loan Selection data
  loanSelection: {
    preferences: {
      loanType: 'variable',
      features: [],
      repaymentType: 'principal-interest'
    },
    quotes: [],
    preApproval: {
      documentsReady: false,
      applicationSubmitted: false,
      approvalReceived: false
    }
  },
  
  // Global settings
  settings: {
    saveProgress: true,
    showAdvanced: false,
    emailReminders: false
  }
}

// Reducer function
const toolkitReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_STEP_DATA:
      return {
        ...state,
        [action.stepKey]: {
          ...state[action.stepKey],
          ...action.data
        }
      }
    
    case ACTIONS.COMPLETE_STEP:
      const completedSteps = [...state.completedSteps]
      if (!completedSteps.includes(action.stepId)) {
        completedSteps.push(action.stepId)
        completedSteps.sort((a, b) => a - b)
      }
      return {
        ...state,
        completedSteps,
        currentStep: Math.max(state.currentStep, action.stepId + 1)
      }
    
    case ACTIONS.UPDATE_CALCULATIONS:
      return {
        ...state,
        [action.stepKey]: {
          ...state[action.stepKey],
          ...action.calculations
        }
      }
    
    case ACTIONS.LOAD_SAVED_DATA:
      return {
        ...state,
        ...action.data
      }
    
    case ACTIONS.RESET_TOOLKIT:
      return {
        ...initialState,
        settings: state.settings // Preserve settings
      }
    
    default:
      return state
  }
}

// Hook for localStorage persistence
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

// Provider component
export const ToolkitProvider = ({ children }) => {
  const [savedState, setSavedState] = useLocalStorage('firstHomeBuyerToolkit', initialState)
  const [state, dispatch] = useReducer(toolkitReducer, savedState)

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (state.settings.saveProgress) {
      setSavedState(state)
    }
  }, [state, setSavedState])

  // Action creators
  const actions = {
    setStepData: (stepKey, data) => {
      dispatch({
        type: ACTIONS.SET_STEP_DATA,
        stepKey,
        data
      })
    },
    
    completeStep: (stepId) => {
      dispatch({
        type: ACTIONS.COMPLETE_STEP,
        stepId
      })
    },
    
    updateCalculations: (stepKey, calculations) => {
      dispatch({
        type: ACTIONS.UPDATE_CALCULATIONS,
        stepKey,
        calculations
      })
    },
    
    resetToolkit: () => {
      dispatch({ type: ACTIONS.RESET_TOOLKIT })
      // Clear localStorage
      window.localStorage.removeItem('firstHomeBuyerToolkit')
    },
    
    loadSavedData: (data) => {
      dispatch({
        type: ACTIONS.LOAD_SAVED_DATA,
        data
      })
    }
  }

  // Computed values
  const computed = {
    // Check if user can proceed to next step based on current data
    canProceedToStep: (stepId) => {
      if (stepId === 1) return true
      return state.completedSteps.includes(stepId - 1)
    },
    
    // Get overall progress percentage
    getProgressPercentage: () => {
      return Math.round((state.completedSteps.length / 6) * 100)
    },
    
    // Check if step has required data
    isStepComplete: (stepId) => {
      return state.completedSteps.includes(stepId)
    },
    
    // Get summary of all calculations
    getSummary: () => {
      return {
        borrowingPower: state.borrowingPower.maxLoan,
        maxPurchasePrice: state.purchasePrice.maxPrice,
        monthlyRepayment: state.budgetFit.affordability?.monthlyRepayment,
        depositRequired: state.purchasePrice.costs?.depositRequired,
        timelineMonths: state.depositTimeline.timeline?.monthsToTarget,
        affordabilitySignal: state.budgetFit.signal
      }
    }
  }

  const value = {
    state,
    progress: {
      completedSteps: state.completedSteps,
      currentStep: state.currentStep,
      percentage: computed.getProgressPercentage()
    },
    actions,
    computed
  }

  return (
    <ToolkitContext.Provider value={value}>
      {children}
    </ToolkitContext.Provider>
  )
}

// Custom hook to use the toolkit context
export const useToolkit = () => {
  const context = useContext(ToolkitContext)
  if (!context) {
    throw new Error('useToolkit must be used within a ToolkitProvider')
  }
  return context
}

// Custom hook for specific step data
export const useStepData = (stepKey) => {
  const { state, actions } = useToolkit()
  
  return {
    data: state[stepKey],
    setData: (data) => actions.setStepData(stepKey, data),
    updateCalculations: (calculations) => actions.updateCalculations(stepKey, calculations)
  }
}

// Export action types for use in components
export { ACTIONS }