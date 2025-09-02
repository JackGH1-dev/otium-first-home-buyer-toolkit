# Borrowing Power Calculator Enhancement Specification

**Version:** 2.0  
**Date:** September 1, 2025  
**Target Users:** First home buyers and first-time investors  
**Core Principle:** Simple but accurate - progressive complexity only when needed

## 🎯 Overview

This specification outlines the enhancement of the existing Borrowing Power Calculator to support more accurate lending assessments while maintaining user-friendly interfaces for first-time property buyers.

## 📋 Current vs Enhanced Structure

### Current Structure
```
- Income (Primary/Secondary)
- Dependencies & Expenses
- HECS/HELP (in expenses section)
- Loan Preferences (collapsible)
- Investment Property (collapsible)
- Liabilities (dynamic list)
```

### Enhanced Structure
```
Basic Info (Always Visible)
├── Income & Other Income Sources
├── Dependencies & Post-Purchase Living
├── Liabilities & Commitments (including HECS/HELP)
└── [Show Advanced Options]
    ├── Assets & Savings
    ├── Loan Preferences
    └── Future Considerations
```

## 🏗️ Detailed Implementation Specifications

### 1. Property Type Tabs (Top Level)

#### Component: `PropertyTypeTabs`
```jsx
const PropertyTypeTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'owner-occupied', label: 'Owner-Occupied', icon: '🏠' },
    { id: 'investment', label: 'Investment Property', icon: '🏢' }
  ]
  
  return (
    <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
            activeTab === tab.id 
              ? 'bg-white shadow-sm text-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

#### State Management
```javascript
const [propertyType, setPropertyType] = useState('owner-occupied')

// Affects:
// - Post-purchase living options
// - Available income types (rental income for investment)
// - Default assumptions in calculations
```

### 2. Enhanced Income Section

#### Component: `IncomeSection`
```jsx
const IncomeSection = ({ formData, setFormData, scenario }) => {
  const [otherIncomes, setOtherIncomes] = useState([])
  
  const addOtherIncome = (type) => {
    const newIncome = {
      id: Date.now(),
      type,
      amount: '',
      frequency: 'annual',
      shadingRate: getDefaultShading(type)
    }
    setOtherIncomes(prev => [...prev, newIncome])
  }
  
  return (
    <div className="space-y-4">
      {/* Primary Income */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Primary Income (Annual)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={formData.primaryIncome}
              onChange={(e) => setFormData({...formData, primaryIncome: e.target.value})}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
              placeholder="80000"
            />
          </div>
        </div>
        
        {/* Secondary Income (if couple) */}
        {scenario === 'couple' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Secondary Income (Annual)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={formData.secondaryIncome}
                onChange={(e) => setFormData({...formData, secondaryIncome: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                placeholder="60000"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Other Income Sources */}
      <div className="space-y-3">
        {otherIncomes.map(income => (
          <OtherIncomeItem
            key={income.id}
            income={income}
            onUpdate={(updated) => updateOtherIncome(income.id, updated)}
            onRemove={() => removeOtherIncome(income.id)}
          />
        ))}
        
        {/* Add Other Income Button */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowIncomeDropdown(!showIncomeDropdown)}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" />
            Add Other Income
          </button>
          
          {showIncomeDropdown && (
            <div className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2">
              {INCOME_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    addOtherIncome(type.id)
                    setShowIncomeDropdown(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                  disabled={type.comingSoon}
                >
                  {type.label}
                  {type.comingSoon && <span className="text-gray-400 ml-2">(Coming Soon)</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### Income Types Configuration
```javascript
const INCOME_TYPES = [
  // Implemented
  { id: 'bonus', label: 'Bonus', shadingRate: 0.8, comingSoon: false },
  { id: 'commission', label: 'Commission', shadingRate: 0.8, comingSoon: false },
  { id: 'overtime', label: 'Overtime', shadingRate: 0.8, comingSoon: false },
  { id: 'allowances', label: 'Allowances', shadingRate: 0.8, comingSoon: false },
  { id: 'rental', label: 'Rental Income', shadingRate: 0.8, comingSoon: false },
  
  // Future Implementation
  { id: 'self-employed', label: 'Self-Employment', shadingRate: 0.7, comingSoon: true },
  { id: 'government-benefits', label: 'Government Benefits', shadingRate: 1.0, comingSoon: true },
  { id: 'investment-income', label: 'Investment Income', shadingRate: 1.0, comingSoon: true }
]
```

### 3. Post-Purchase Living Situation

#### Component: `PostPurchaseLiving`
```jsx
const PostPurchaseLiving = ({ propertyType, formData, setFormData }) => {
  const livingOptions = propertyType === 'owner-occupied' 
    ? [
        { value: 'own-property', label: 'Living in the purchased property' },
        { value: 'renting', label: 'Renting elsewhere' },
        { value: 'parents', label: 'Living with parents/family' },
        { value: 'other', label: 'Other arrangement' }
      ]
    : [
        { value: 'renting', label: 'Renting elsewhere' },
        { value: 'parents', label: 'Living with parents/family' },
        { value: 'other', label: 'Other arrangement' }
      ]
  
  const requiresRentInput = formData.postPurchaseLiving !== 'own-property'
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          After this purchase, you will be:
        </label>
        <select
          value={formData.postPurchaseLiving || livingOptions[0].value}
          onChange={(e) => setFormData({
            ...formData, 
            postPurchaseLiving: e.target.value,
            weeklyRentBoard: e.target.value === 'own-property' ? 0 : formData.weeklyRentBoard
          })}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          {livingOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {requiresRentInput && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Weekly rent/board payment:
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={formData.weeklyRentBoard || ''}
              onChange={(e) => setFormData({...formData, weeklyRentBoard: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              placeholder="350"
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Lenders use minimum $150/week for assessment purposes
          </p>
        </div>
      )}
    </div>
  )
}
```

#### Calculation Logic
```javascript
const calculateRentalExpense = (postPurchaseLiving, weeklyRentBoard) => {
  if (postPurchaseLiving === 'own-property') return 0
  
  const NOTIONAL_RENT_WEEKLY = 150 // Minimum lender assessment
  const userWeeklyAmount = parseFloat(weeklyRentBoard) || 0
  const weeklyRent = Math.max(userWeeklyAmount, NOTIONAL_RENT_WEEKLY)
  
  return weeklyRent * 52 / 12 // Convert to monthly
}
```

### 4. Enhanced HEM with Postcode

#### Component: `LivingExpensesSection`
```jsx
const LivingExpensesSection = ({ formData, setFormData }) => {
  const [useHEM, setUseHEM] = useState(true)
  const [hemAmount, setHemAmount] = useState(0)
  
  useEffect(() => {
    if (useHEM && formData.postcode && formData.primaryIncome) {
      const calculatedHEM = calculateHEMByLocation({
        postcode: formData.postcode,
        income: parseFloat(formData.primaryIncome) + parseFloat(formData.secondaryIncome || 0),
        dependents: formData.dependents || 0,
        scenario: formData.scenario
      })
      setHemAmount(calculatedHEM)
    }
  }, [useHEM, formData.postcode, formData.primaryIncome, formData.secondaryIncome, formData.dependents])
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">
        Monthly Living Expenses
      </label>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="radio"
            name="expenseMethod"
            checked={useHEM}
            onChange={() => setUseHEM(true)}
            className="mr-3"
          />
          <span className="text-sm">Use HEM (Household Expenditure Measure)</span>
        </label>
        
        {useHEM && (
          <div className="ml-6 space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                📍 Postcode (for location-based expenses):
              </label>
              <input
                type="text"
                value={formData.postcode || ''}
                onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                className="w-32 p-2 border border-gray-300 rounded-lg"
                placeholder="2000"
                maxLength="4"
              />
            </div>
            {hemAmount > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  HEM calculated: <strong>{formatCurrency(hemAmount)}/month</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Based on your location, income, and {formData.dependents || 0} dependents
                </p>
              </div>
            )}
          </div>
        )}
        
        <label className="flex items-center">
          <input
            type="radio"
            name="expenseMethod"
            checked={!useHEM}
            onChange={() => setUseHEM(false)}
            className="mr-3"
          />
          <span className="text-sm">Enter manually</span>
        </label>
        
        {!useHEM && (
          <div className="ml-6">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={formData.monthlyLivingExpenses || ''}
                onChange={(e) => setFormData({...formData, monthlyLivingExpenses: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                placeholder="3000"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Include all expenses: rent, groceries, utilities, insurance, etc.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

#### HEM Calculation Function
```javascript
const calculateHEMByLocation = ({ postcode, income, dependents, scenario }) => {
  // Location multipliers based on ABS data
  const locationMultipliers = {
    // Major cities
    '2000-2099': 1.15, // Sydney CBD
    '3000-3099': 1.08, // Melbourne CBD
    '4000-4099': 1.03, // Brisbane
    '6000-6099': 1.05, // Perth
    '5000-5099': 0.98, // Adelaide
    '7000-7099': 0.92, // Hobart
    
    // Regional areas
    'default': 0.85
  }
  
  const baseHEM = calculateHEMExpenses(income, dependents, scenario)
  const locationMultiplier = getLocationMultiplier(postcode, locationMultipliers)
  
  return baseHEM * locationMultiplier
}

const getLocationMultiplier = (postcode, multipliers) => {
  if (!postcode || postcode.length !== 4) return multipliers.default
  
  const postcodeNum = parseInt(postcode)
  for (const [range, multiplier] of Object.entries(multipliers)) {
    if (range === 'default') continue
    
    const [start, end] = range.split('-').map(n => parseInt(n))
    if (postcodeNum >= start && postcodeNum <= end) {
      return multiplier
    }
  }
  
  return multipliers.default
}
```

### 5. Enhanced Liabilities Section

#### Component: `LiabilitiesSection`
```jsx
const LiabilitiesSection = ({ formData, setFormData, liabilities, setLiabilities }) => {
  const [showLiabilityDropdown, setShowLiabilityDropdown] = useState(false)
  
  // Calculate total HECS repayments
  const primaryHECS = calculateHECSRepayment(formData.primaryIncome || 0, formData.primaryHECSBalance || 0)
  const secondaryHECS = formData.scenario === 'couple' 
    ? calculateHECSRepayment(formData.secondaryIncome || 0, formData.secondaryHECSBalance || 0)
    : 0
  
  const totalMonthlyLiabilities = liabilities.reduce((sum, liability) => 
    sum + calculateLiabilityPayment(liability), 0
  ) + (primaryHECS + secondaryHECS) / 12
  
  return (
    <div className="space-y-6">
      {/* HECS/HELP Section */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">HECS/HELP Debt</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Primary Applicant Balance
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={formData.primaryHECSBalance || ''}
                onChange={(e) => setFormData({...formData, primaryHECSBalance: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                placeholder="0"
              />
            </div>
            {primaryHECS > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Annual repayment: {formatCurrency(primaryHECS)}
              </p>
            )}
          </div>
          
          {formData.scenario === 'couple' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Secondary Applicant Balance
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.secondaryHECSBalance || ''}
                  onChange={(e) => setFormData({...formData, secondaryHECSBalance: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              {secondaryHECS > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Annual repayment: {formatCurrency(secondaryHECS)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Other Liabilities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Other Commitments</h4>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{formatCurrency(totalMonthlyLiabilities)}/month</span>
          </div>
        </div>
        
        {liabilities.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No commitments added yet
          </div>
        ) : (
          <div className="space-y-3">
            {liabilities.map(liability => (
              <LiabilityItem
                key={liability.id}
                liability={liability}
                onUpdate={(updated) => updateLiability(liability.id, updated)}
                onRemove={() => removeLiability(liability.id)}
              />
            ))}
          </div>
        )}
        
        {/* Add Liability Dropdown */}
        <div className="relative mt-4">
          <button
            type="button"
            onClick={() => setShowLiabilityDropdown(!showLiabilityDropdown)}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" />
            Add Commitment
          </button>
          
          {showLiabilityDropdown && (
            <div className="absolute left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2 min-w-48">
              {LIABILITY_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    addLiability(type.id)
                    setShowLiabilityDropdown(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### Liability Types Configuration
```javascript
const LIABILITY_TYPES = [
  { id: 'credit_card', label: 'Credit Card', icon: '💳' },
  { id: 'personal_loan', label: 'Personal Loan', icon: '💰' },
  { id: 'car_loan', label: 'Car Loan', icon: '🚗' },
  { id: 'bnpl', label: 'Buy Now Pay Later (BNPL)', icon: '📱' },
  { id: 'other_mortgage', label: 'Other Mortgage', icon: '🏠' },
  { id: 'other_commitment', label: 'Other Commitment', icon: '📋' }
]
```

#### Liability Calculation Function
```javascript
const calculateLiabilityPayment = (liability) => {
  switch (liability.type) {
    case 'credit_card':
      // Use 3.5% of credit limit as minimum payment
      return (liability.creditLimit || 0) * 0.035
      
    case 'bnpl':
      // Use actual monthly payment
      return liability.monthlyPayment || 0
      
    case 'personal_loan':
    case 'car_loan':
    case 'other_mortgage':
    case 'other_commitment':
      return liability.monthlyPayment || 0
      
    default:
      return 0
  }
}
```

## 🧮 Calculation Updates

### Enhanced Borrowing Power Formula
```javascript
const calculateEnhancedBorrowingPower = (formData, otherIncomes, liabilities) => {
  // 1. Calculate total income (with shading)
  const primaryIncome = parseFloat(formData.primaryIncome) || 0
  const secondaryIncome = parseFloat(formData.secondaryIncome) || 0
  
  const otherIncomeTotal = otherIncomes.reduce((sum, income) => {
    const amount = parseFloat(income.amount) || 0
    const annualAmount = income.frequency === 'monthly' ? amount * 12 : amount
    return sum + (annualAmount * income.shadingRate)
  }, 0)
  
  const totalAnnualIncome = primaryIncome + secondaryIncome + otherIncomeTotal
  
  // 2. Calculate living expenses
  const monthlyExpenses = formData.useHEM 
    ? calculateHEMByLocation({
        postcode: formData.postcode,
        income: totalAnnualIncome,
        dependents: formData.dependents || 0,
        scenario: formData.scenario
      })
    : parseFloat(formData.monthlyLivingExpenses) || 0
  
  // 3. Add post-purchase rental costs
  const rentalExpense = calculateRentalExpense(
    formData.postPurchaseLiving, 
    formData.weeklyRentBoard
  )
  
  const totalMonthlyExpenses = monthlyExpenses + rentalExpense
  
  // 4. Calculate HECS repayments
  const primaryHECS = calculateHECSRepayment(primaryIncome, formData.primaryHECSBalance || 0)
  const secondaryHECS = formData.scenario === 'couple' 
    ? calculateHECSRepayment(secondaryIncome, formData.secondaryHECSBalance || 0) 
    : 0
  const annualHECS = primaryHECS + secondaryHECS
  
  // 5. Calculate other liabilities
  const monthlyLiabilities = liabilities.reduce((sum, liability) => 
    sum + calculateLiabilityPayment(liability), 0
  )
  
  // 6. Apply borrowing power formula
  const netMonthlyIncome = (totalAnnualIncome - annualHECS) / 12
  const availableServiceCapacity = netMonthlyIncome - totalMonthlyExpenses - monthlyLiabilities
  
  const serviceabilityRate = parseFloat(formData.interestRate) + 2.5 // Buffer rate
  const termYears = parseFloat(formData.termYears) || 30
  
  const maxBorrowingPower = calculateLoanFromPayment(
    availableServiceCapacity * 0.8, // Conservative 80% of capacity
    serviceabilityRate / 100,
    termYears
  )
  
  return {
    maxBorrowingPower: Math.max(0, maxBorrowingPower),
    totalAnnualIncome,
    netMonthlyIncome,
    totalMonthlyExpenses,
    monthlyLiabilities: monthlyLiabilities + (annualHECS / 12),
    availableServiceCapacity,
    details: {
      primaryIncome,
      secondaryIncome,
      otherIncomeTotal,
      monthlyExpenses,
      rentalExpense,
      hecsRepayment: annualHECS,
      liabilityBreakdown: liabilities.map(l => ({
        ...l,
        monthlyPayment: calculateLiabilityPayment(l)
      }))
    }
  }
}
```

## 📱 Responsive Design Considerations

### Mobile Layout
```css
/* Stack columns on mobile */
@media (max-width: 768px) {
  .two-column-layout {
    grid-template-columns: 1fr;
  }
  
  .sticky-results {
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
    border-bottom: 1px solid #e5e7eb;
  }
}
```

### Progressive Enhancement
- Start with essential fields visible
- "Show Advanced Options" reveals detailed settings
- Collapsible sections save vertical space
- Smart defaults reduce initial cognitive load

## 🧪 Testing Scenarios

### Test Cases
1. **Single First Home Buyer**
   - Primary income: $80,000
   - Living in purchased property
   - Basic expenses only
   - Expected result: ~$400,000 borrowing power

2. **Couple with Other Income**
   - Primary: $90,000, Secondary: $60,000
   - Bonus: $10,000 (shaded to $8,000)
   - 2 dependents
   - Will be renting after investment purchase
   - Expected result: Accurate calculation with rental costs

3. **Complex Liability Scenario**
   - Multiple credit cards
   - Car loan
   - BNPL commitments
   - HECS debt for both applicants
   - Expected result: All liabilities properly calculated

## 🚀 Implementation Phases

### Phase 1: Core Structure (2-3 days)
- [ ] Property type tabs
- [ ] Enhanced income section with "Add Other Income"
- [ ] Post-purchase living situation
- [ ] HECS/HELP integration in liabilities

### Phase 2: Advanced Features (3-4 days)
- [ ] HEM with postcode calculation
- [ ] Expanded liability types (BNPL, other mortgages)
- [ ] Enhanced calculations
- [ ] Responsive design improvements

### Phase 3: Polish & Testing (1-2 days)
- [ ] User testing
- [ ] Error handling
- [ ] Performance optimization
- [ ] Documentation

## 📊 Success Metrics

### User Experience
- [ ] Form completion time < 4 minutes
- [ ] 95% field completion rate
- [ ] Zero calculation errors in testing
- [ ] Mobile usability score > 90%

### Technical
- [ ] Component render time < 100ms
- [ ] Form state properly managed
- [ ] Calculations match manual verification
- [ ] Accessible design (WCAG 2.1 AA)

---

**Document Version:** 2.0  
**Last Updated:** September 1, 2025  
**Next Review:** After Phase 1 completion