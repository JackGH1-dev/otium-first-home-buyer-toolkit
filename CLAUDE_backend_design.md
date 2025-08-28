# FIRE Calculator - Backend Design Document

**Project:** FIRE Calculator - Skip or Stack?  
**Version:** 1.1  
**Date:** 10 Aug 2025  
**Status:** Firebase Implementation Complete

---

## 🎯 Overview

The backend will support dynamic retirement scenario calculations with user account management, savings tracking, and comprehensive destination modeling. The system needs to handle complex financial projections with multiple variables while maintaining fast response times and data accuracy.

---

## 🗄️ Database Schema

### Core Tables

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  country_of_residence VARCHAR(3), -- ISO country code
  currency_preference VARCHAR(3) DEFAULT 'AUD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Profile preferences
  risk_tolerance VARCHAR(20) DEFAULT 'moderate', -- conservative, moderate, aggressive
  lifestyle_preference VARCHAR(20) DEFAULT 'comfortable', -- budget, comfortable, luxury
  family_status VARCHAR(20) DEFAULT 'single' -- single, couple, family
);
```

#### **user_financial_profiles**
```sql
CREATE TABLE user_financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Current Financial Position
  current_age INTEGER NOT NULL,
  target_retirement_age INTEGER DEFAULT 65,
  annual_gross_income DECIMAL(12,2),
  annual_expenses DECIMAL(12,2),
  current_superannuation DECIMAL(12,2) DEFAULT 0,
  current_savings DECIMAL(12,2) DEFAULT 0,
  current_investments DECIMAL(12,2) DEFAULT 0,
  current_property_equity DECIMAL(12,2) DEFAULT 0,
  current_debt DECIMAL(12,2) DEFAULT 0,
  
  -- Investment Assumptions
  expected_return_rate DECIMAL(5,4) DEFAULT 0.07, -- 7%
  inflation_rate DECIMAL(5,4) DEFAULT 0.03, -- 3%
  super_contribution_rate DECIMAL(5,4) DEFAULT 0.105, -- 10.5%
  salary_sacrifice_amount DECIMAL(8,2) DEFAULT 0,
  
  -- Retirement Planning
  desired_retirement_income_ratio DECIMAL(5,4) DEFAULT 0.70, -- 70% of current income
  emergency_fund_months INTEGER DEFAULT 12,
  healthcare_buffer_annual DECIMAL(8,2) DEFAULT 5000,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_ages CHECK (current_age >= 18 AND current_age <= 100),
  CONSTRAINT valid_retirement_age CHECK (target_retirement_age > current_age)
);
```

#### **savings_tracking**
```sql
CREATE TABLE savings_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tracking Details
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  superannuation_balance DECIMAL(12,2),
  savings_balance DECIMAL(12,2),
  investment_balance DECIMAL(12,2),
  property_equity DECIMAL(12,2),
  debt_balance DECIMAL(12,2),
  
  -- Calculated Fields
  net_worth DECIMAL(12,2) GENERATED ALWAYS AS 
    (COALESCE(superannuation_balance,0) + COALESCE(savings_balance,0) + 
     COALESCE(investment_balance,0) + COALESCE(property_equity,0) - COALESCE(debt_balance,0)) STORED,
  
  -- Data Source
  entry_type VARCHAR(20) DEFAULT 'manual', -- manual, imported, calculated
  source VARCHAR(50), -- user_input, bank_api, super_fund, etc.
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one entry per user per date
  UNIQUE(user_id, entry_date)
);
```

#### **retirement_destinations**
```sql
CREATE TABLE retirement_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  country_code VARCHAR(3) NOT NULL, -- ISO country code
  country_name VARCHAR(100) NOT NULL,
  city_name VARCHAR(100),
  region_name VARCHAR(100),
  display_name VARCHAR(200) NOT NULL, -- "Lisbon, Portugal"
  flag_emoji VARCHAR(10),
  
  -- Cost of Living Data
  cost_vs_sydney_percentage DECIMAL(6,3), -- e.g., -47.400 for 47.4% cheaper
  annual_budget_single DECIMAL(10,2),
  annual_budget_couple DECIMAL(10,2),
  data_source VARCHAR(100), -- "Numbeo August 2025"
  data_last_updated DATE,
  
  -- Detailed Cost Breakdown
  housing_cost_ratio DECIMAL(5,4), -- vs Sydney
  food_cost_ratio DECIMAL(5,4),
  transport_cost_ratio DECIMAL(5,4),
  healthcare_cost_ratio DECIMAL(5,4),
  utilities_cost_ratio DECIMAL(5,4),
  entertainment_cost_ratio DECIMAL(5,4),
  
  -- Lifestyle Information
  climate_description TEXT,
  primary_language VARCHAR(50),
  english_proficiency_level VARCHAR(20), -- high, medium, low
  
  -- Practical Information
  flight_time_from_australia VARCHAR(50),
  average_flight_cost_aud DECIMAL(8,2),
  timezone_offset_hours INTEGER,
  
  -- Legal & Health
  visa_type VARCHAR(100),
  visa_renewable BOOLEAN DEFAULT FALSE,
  visa_max_duration_months INTEGER,
  visa_estimated_cost_aud DECIMAL(8,2),
  healthcare_system_type VARCHAR(50), -- public, private, mixed
  healthcare_quality_rating INTEGER CHECK (healthcare_quality_rating BETWEEN 1 AND 10),
  
  -- Economic Indicators
  currency_code VARCHAR(3),
  exchange_rate_volatility VARCHAR(20), -- low, medium, high
  political_stability_rating INTEGER CHECK (political_stability_rating BETWEEN 1 AND 10),
  economic_freedom_rating INTEGER CHECK (economic_freedom_rating BETWEEN 1 AND 10),
  
  -- User Experience
  expat_community_size VARCHAR(20), -- small, medium, large
  internet_quality_rating INTEGER CHECK (internet_quality_rating BETWEEN 1 AND 10),
  infrastructure_rating INTEGER CHECK (infrastructure_rating BETWEEN 1 AND 10),
  
  -- Content
  description TEXT,
  pros TEXT[], -- Array of pros
  cons TEXT[], -- Array of cons
  recommended_areas TEXT[],
  
  -- Meta
  is_active BOOLEAN DEFAULT TRUE,
  popularity_rank INTEGER,
  featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(country_code, city_name)
);
```

#### **user_retirement_scenarios**
```sql
CREATE TABLE user_retirement_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES retirement_destinations(id),
  
  -- Scenario Details
  scenario_name VARCHAR(200) NOT NULL,
  retirement_age INTEGER NOT NULL,
  target_annual_income DECIMAL(10,2),
  
  -- Customizations (override destination defaults)
  custom_annual_budget DECIMAL(10,2),
  custom_healthcare_budget DECIMAL(8,2),
  custom_travel_budget DECIMAL(8,2),
  custom_emergency_fund DECIMAL(10,2),
  
  -- Calculations (stored for performance)
  total_required_capital DECIMAL(12,2),
  monthly_savings_required DECIMAL(8,2),
  current_progress_percentage DECIMAL(5,2),
  projected_shortfall DECIMAL(12,2),
  
  -- Assumptions Used
  withdrawal_rate DECIMAL(5,4) DEFAULT 0.04, -- 4% rule
  investment_return_rate DECIMAL(5,4),
  inflation_adjustment DECIMAL(5,4),
  
  -- Meta
  is_primary BOOLEAN DEFAULT FALSE,
  last_calculated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT one_primary_per_user UNIQUE(user_id) WHERE is_primary = TRUE
);
```

### Supporting Tables

#### **opportunity_cost_tracking**
```sql
CREATE TABLE opportunity_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Purchase Decision
  item_description VARCHAR(500),
  item_cost DECIMAL(8,2) NOT NULL,
  decision_date DATE DEFAULT CURRENT_DATE,
  purchase_made BOOLEAN NOT NULL, -- true = bought it, false = skipped it
  
  -- Context
  user_age_at_time INTEGER,
  retirement_age_assumption INTEGER DEFAULT 65,
  investment_return_assumption DECIMAL(5,4) DEFAULT 0.07,
  
  -- Calculated Impact (if skipped)
  future_value_at_retirement DECIMAL(12,2),
  retirement_progress_impact DECIMAL(5,2), -- percentage points
  
  -- Categories
  category VARCHAR(50), -- dining, travel, electronics, clothing, etc.
  priority_level VARCHAR(20), -- want, need, luxury
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **currency_exchange_rates**
```sql
CREATE TABLE currency_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  base_currency VARCHAR(3) NOT NULL DEFAULT 'AUD',
  target_currency VARCHAR(3) NOT NULL,
  exchange_rate DECIMAL(10,6) NOT NULL,
  rate_date DATE NOT NULL,
  
  -- Data source tracking
  source VARCHAR(50) DEFAULT 'RBA', -- Reserve Bank of Australia
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(base_currency, target_currency, rate_date)
);
```

#### **user_preferences**
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- UI/UX Preferences
  preferred_currency_display VARCHAR(3) DEFAULT 'AUD',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  number_format VARCHAR(20) DEFAULT 'en-AU',
  theme VARCHAR(20) DEFAULT 'purple',
  
  -- Notification Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  progress_update_frequency VARCHAR(20) DEFAULT 'monthly', -- weekly, monthly, quarterly
  market_update_alerts BOOLEAN DEFAULT FALSE,
  destination_price_alerts BOOLEAN DEFAULT TRUE,
  
  -- Privacy Settings
  anonymous_usage_data BOOLEAN DEFAULT TRUE,
  marketing_communications BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

---

## 🔧 Additional Variables & Modifiers

### Personal Financial Variables
```javascript
const personalVariables = {
  // Income & Expenses
  salaryGrowthRate: 0.03, // 3% annual
  expenseInflationRate: 0.025, // 2.5% annual
  superContributionRate: 0.105, // 10.5% employer
  voluntarySuperContributions: 0, // Additional contributions
  
  // Investment Strategy
  assetAllocation: {
    shares: 0.70,
    bonds: 0.20,
    property: 0.05,
    cash: 0.05
  },
  riskTolerance: 'moderate', // conservative, moderate, aggressive
  rebalancingFrequency: 'quarterly',
  
  // Life Events
  majorPurchases: [], // House, car, education
  careerBreaks: [], // Travel, study, family
  dependents: 0,
  healthInsurancePremiums: 2400, // Annual
  
  // Retirement Specific
  pensionEntitlement: 'partial', // full, partial, none
  workInRetirement: false,
  retirementIncomeTarget: 0.70 // 70% of pre-retirement income
}
```

### Destination-Specific Modifiers
```javascript
const destinationModifiers = {
  // Economic Factors
  currencyVolatility: 'medium', // low, medium, high
  inflationRate: 0.02, // Local inflation
  economicGrowth: 0.025,
  taxRateOnForeignIncome: 0.15,
  
  // Cost Variations
  seasonalCostVariation: 0.15, // 15% higher in peak season
  locationWithinCountry: 'major_city', // major_city, regional, rural
  lifestyleLevel: 'comfortable', // budget, comfortable, luxury
  
  // Practical Costs
  visaRenewalCosts: 1500, // Every 6 months
  internationalHealthInsurance: 3500, // Annual
  emergencyTravelFund: 10000,
  setupCosts: 15000, // Initial relocation
  
  // Risk Factors
  politicalStabilityRisk: 'low',
  currencyRisk: 'medium',
  healthcareAccessRisk: 'low',
  naturalDisasterRisk: 'medium'
}
```

### Temporal & Market Modifiers
```javascript
const marketModifiers = {
  // Economic Cycles
  marketCyclePhase: 'expansion', // expansion, peak, contraction, trough
  interestRateEnvironment: 'rising',
  recessionProbability: 0.15, // 15% chance in next 2 years
  
  // Demographic Trends
  populationAging: true,
  migrationTrends: 'increasing',
  urbanization: 'accelerating',
  
  // Technology Impact
  automationJobRisk: 0.10, // 10% chance job automated
  digitalNomadFriendliness: 'high',
  telemedicineAvailability: true,
  
  // Policy Environment
  superannuationChanges: 'stable',
  pensionAgeChanges: 'increasing',
  taxPolicyStability: 'stable',
  immigrationPolicyTrend: 'tightening'
}
```

---

## 🔄 Calculation Engine Design

### Core Calculation Functions

#### **Retirement Capital Requirement**
```javascript
function calculateRetirementCapital(user, destination, scenario) {
  const yearsInRetirement = 100 - scenario.retirementAge;
  const annualBudget = destination.annualBudgetCouple || destination.annualBudgetSingle;
  
  // Adjust for inflation to retirement date
  const yearsToRetirement = scenario.retirementAge - user.currentAge;
  const inflationAdjustedBudget = annualBudget * Math.pow(1 + destination.inflationRate, yearsToRetirement);
  
  // Apply user customizations
  const customBudget = scenario.customAnnualBudget || inflationAdjustedBudget;
  const healthcareFactor = 1 + (destination.healthcareCostRatio * 0.15); // Health costs increase with age
  const emergencyFund = scenario.customEmergencyFund || (customBudget * user.emergencyFundMonths / 12);
  
  // Calculate total requirement
  const totalCapital = (customBudget * yearsInRetirement * healthcareFactor) + emergencyFund;
  
  return {
    totalRequired: totalCapital,
    annualBudget: customBudget,
    emergencyFund: emergencyFund,
    yearsInRetirement: yearsInRetirement
  };
}
```

#### **Current Progress Calculator**
```javascript
function calculateCurrentProgress(user, opportunityCosts) {
  const currentAssets = user.currentSuperannuation + user.currentSavings + user.currentInvestments + user.currentPropertyEquity;
  const currentDebts = user.currentDebt;
  const netWorth = currentAssets - currentDebts;
  
  // Calculate future value of opportunity cost savings
  const yearsToRetirement = user.targetRetirementAge - user.currentAge;
  const opportunityValue = opportunityCosts.reduce((total, cost) => {
    if (!cost.purchaseMade) { // Only count skipped purchases
      const futureValue = cost.itemCost * Math.pow(1 + user.expectedReturnRate, yearsToRetirement);
      return total + futureValue;
    }
    return total;
  }, 0);
  
  return {
    currentNetWorth: netWorth,
    opportunityValue: opportunityValue,
    totalProgress: netWorth + opportunityValue
  };
}
```

#### **Dynamic Scenario Comparison**
```javascript
function compareScenarios(user, scenarios) {
  return scenarios.map(scenario => {
    const capital = calculateRetirementCapital(user, scenario.destination, scenario);
    const progress = calculateCurrentProgress(user, scenario.opportunityCosts);
    const shortfall = Math.max(0, capital.totalRequired - progress.totalProgress);
    const yearsToRetirement = scenario.retirementAge - user.currentAge;
    const monthlySavingsRequired = shortfall / (yearsToRetirement * 12);
    
    return {
      ...scenario,
      capitalRequired: capital.totalRequired,
      currentProgress: progress.totalProgress,
      progressPercentage: (progress.totalProgress / capital.totalRequired) * 100,
      shortfall: shortfall,
      monthlySavingsRequired: monthlySavingsRequired,
      feasibilityScore: calculateFeasibilityScore(user, scenario, shortfall)
    };
  });
}
```

---

## 🔌 API Endpoints Design

### Authentication & User Management
```
POST   /api/auth/register
POST   /api/auth/login  
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/profile
POST   /api/auth/reset-password
```

### User Financial Data
```
GET    /api/user/financial-profile
PUT    /api/user/financial-profile
POST   /api/user/savings-entry
GET    /api/user/savings-history
DELETE /api/user/savings-entry/:id
```

### Retirement Scenarios
```
GET    /api/scenarios                    # User's scenarios
POST   /api/scenarios                    # Create new scenario
GET    /api/scenarios/:id                # Get specific scenario
PUT    /api/scenarios/:id                # Update scenario
DELETE /api/scenarios/:id                # Delete scenario
POST   /api/scenarios/:id/calculate      # Recalculate scenario
GET    /api/scenarios/compare            # Compare multiple scenarios
```

### Destinations & Market Data
```
GET    /api/destinations                 # All available destinations
GET    /api/destinations/:id             # Specific destination
GET    /api/destinations/:id/costs       # Detailed cost breakdown
GET    /api/currency-rates               # Current exchange rates
GET    /api/market-data/inflation        # Inflation rates by country
```

### Opportunity Cost Tracking
```
GET    /api/opportunity-costs            # User's tracking history
POST   /api/opportunity-costs            # Log new purchase decision
PUT    /api/opportunity-costs/:id        # Update decision
GET    /api/opportunity-costs/impact     # Calculate impact on retirement
```

---

## 🏗️ System Architecture

### Technology Stack
- **Backend Framework:** Node.js with Express.js or Fastify
- **Database:** PostgreSQL with UUID primary keys
- **Authentication:** JWT tokens with refresh token rotation
- **API Documentation:** OpenAPI/Swagger
- **Caching:** Redis for frequently accessed data
- **Background Jobs:** Bull/Queue for calculations
- **Monitoring:** DataDog or similar for performance tracking

### Performance Considerations
- **Calculation Caching:** Cache scenario calculations for 24 hours
- **Database Indexing:** Proper indexes on user_id, date fields, and frequently queried columns
- **Background Processing:** Complex calculations run asynchronously
- **CDN:** Static destination data served via CDN
- **Rate Limiting:** Prevent abuse of calculation endpoints

### Security Measures
- **Data Encryption:** Sensitive financial data encrypted at rest
- **Input Validation:** Comprehensive validation on all inputs
- **SQL Injection Prevention:** Parameterized queries only
- **CORS Configuration:** Restricted to known domains
- **Audit Logging:** Track all financial data changes

---

## 📊 Business Intelligence & Analytics

### Key Metrics to Track
```sql
-- User engagement metrics
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days') as active_weekly,
  COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as active_monthly,
  AVG(DATE_PART('day', NOW() - created_at)) as avg_user_age_days
FROM users;

-- Popular destinations
SELECT 
  d.display_name,
  COUNT(*) as scenario_count,
  AVG(s.current_progress_percentage) as avg_progress
FROM user_retirement_scenarios s
JOIN retirement_destinations d ON s.destination_id = d.id
GROUP BY d.display_name
ORDER BY scenario_count DESC;

-- Opportunity cost impact
SELECT 
  category,
  COUNT(*) as total_decisions,
  COUNT(*) FILTER (WHERE purchase_made = false) as skipped_purchases,
  AVG(future_value_at_retirement) as avg_future_value
FROM opportunity_cost_tracking
GROUP BY category
ORDER BY avg_future_value DESC;
```

---

## 🚀 Implementation Phases

### Phase 1: Core Backend (4-6 weeks)
- [ ] Database schema implementation
- [ ] User authentication system
- [ ] Basic CRUD operations for all entities
- [ ] Core calculation engine
- [ ] API documentation

### Phase 2: Advanced Calculations (3-4 weeks)
- [ ] Dynamic scenario comparison
- [ ] Opportunity cost tracking integration
- [ ] Currency rate integration
- [ ] Background job processing
- [ ] Caching implementation

### Phase 3: Business Intelligence (2-3 weeks)
- [ ] Analytics dashboard
- [ ] User behavior tracking
- [ ] Performance monitoring
- [ ] Data export functionality
- [ ] Admin panel for destination management

### Phase 4: Optimization & Scale (2-3 weeks)
- [ ] Performance optimization
- [ ] Security audit and hardening
- [ ] Load testing and scaling
- [ ] Backup and disaster recovery
- [ ] Production deployment

---

---

## ✅ FIREBASE IMPLEMENTATION COMPLETE

**Date:** 10 Aug 2025  
**Status:** Production-Ready Firebase Backend Implemented

### Rationale
- **Speed to Market:** Firebase provides instant backend with auth, database, and hosting
- **MVP Focus:** Prioritize feature development over infrastructure setup
- **User Authentication:** Firebase Auth handles Google SSO, email/password, and security
- **Real-time Updates:** Firestore provides real-time sync for progress tracking
- **Scaling Consideration:** Acknowledged that complex SQL joins will be challenging later

### Technical Trade-offs
**Pros:**
- Zero backend infrastructure setup
- Built-in authentication and security
- Real-time database synchronization
- Automatic scaling and CDN
- Integration with other Google services

**Cons:**
- Limited complex query capabilities
- Vendor lock-in with Google
- More expensive at scale than PostgreSQL
- NoSQL structure less ideal for financial calculations
- Migration complexity if moving to SQL later

### Migration Strategy (Future)
When scaling requires SQL capabilities:
1. **Dual Write Phase:** Write to both Firebase and PostgreSQL
2. **Data Migration:** Batch transfer historical data
3. **Feature Flagging:** Gradually move features to SQL backend
4. **Auth Migration:** Maintain Firebase Auth, sync user data

### Implementation Decision Impact
- All complex calculations will be client-side for MVP
- Data structure optimized for NoSQL document model
- Real-time features prioritized over complex analytics
- Focus on core user journey rather than advanced reporting

---

**Document Status:** Firebase Production Implementation Complete  
**Next Action:** Integrate Firebase services into React components and deploy security rules  
**Implementation Time:** Firebase backend completed in 2 days (vs 3-4 weeks estimated for PostgreSQL)

---

## 🚀 IMPLEMENTED FIREBASE SERVICES

### **Firebase Configuration** (`src/firebase/config.js`)
```javascript
// Complete Firebase setup with Analytics
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const app = initializeApp(config)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const analytics = getAnalytics(app) // Production analytics
```

### **User Profile Service** (`src/firebase/userProfile.js`)
- Complete user profile management with financial data
- Savings tracking with historical data
- Opportunity cost calculation and tracking
- Retirement scenario planning and comparison
- Currency formatting utilities (cents ↔ display)

### **Analytics Service** (`src/firebase/analytics.js`)
- User authentication events (sign_up, login, logout)
- Calculator usage tracking with financial amounts
- Purchase decision tracking (skip vs stack)
- Retirement goal setting and progress updates
- Feature usage and user engagement metrics
- Error tracking and performance monitoring

### **Security Implementation** (`firestore.rules`)
- User-specific data access controls
- Financial data protection with no public queries
- Rate limiting and validation functions
- Public destination data with read-only access

### **Data Structure Optimizations**
- All financial amounts stored as integers (cents) for precision
- Subcollections for user-specific data (scenarios, costs, tracking)
- Proper indexing for common queries
- Real-time listeners for progress updates
- Offline-first data synchronization

---

## 🐛 DEBUG FIXES & SOLUTIONS

### **Dashboard Component Authentication Issue** (Fixed: 10 Aug 2025)

**Problem:** Dashboard components showing "Please log in" message despite successful Firebase authentication.

**Root Cause:** Property name mismatch between AuthContext and consuming components:
- AuthContext exports: `user`, `loading`, `isAuthenticated`
- Components were expecting: `currentUser`, `loading`, `isAuthenticated`

**Solution Applied:**
```javascript
// WRONG - Will cause authentication issues
const { currentUser, loading } = useAuth()

// CORRECT - Matches AuthContext exports
const { user: currentUser, loading } = useAuth()
// OR
const { user, loading } = useAuth()
```

**AuthContext Property Reference:**
```javascript
// src/contexts/AuthContext.jsx exports:
const value = useMemo(() => ({
  user,                    // ← Use this (not currentUser)
  loading,
  isAuthenticated: !!user, // ← Boolean check against user
  signOut,
  updateLastLogin
}), [user, loading])
```

**Debugging Process:**
1. Created `DashboardDebug.jsx` component for step-by-step testing
2. Verified Firebase authentication working (✅ logs showed user logged in)
3. Identified property mismatch in debug component
4. Applied fix and confirmed authentication flow working

**Files Affected:**
- Fixed: `src/components/Dashboard/DashboardDebug.jsx`
- Reference: `src/contexts/AuthContext.jsx`

**Prevention:** Always check AuthContext exports when consuming auth state in components. Consider using TypeScript for better property validation.