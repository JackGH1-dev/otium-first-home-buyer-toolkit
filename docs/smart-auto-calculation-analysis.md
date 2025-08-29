# Smart Auto-Calculation System Analysis
## Otium Property Toolkit - Complete Permutation Documentation

### Overview
The Smart Auto-Calculation system handles property purchase calculations by automatically determining which 2 fields are locked (inputs) and calculating the remaining 2 fields. This creates a flexible interface where users can "lock" any combination of 2 fields and have the system intelligently calculate the rest.

---

## Mathematical Relationships

The four core fields are interconnected by these relationships:

```
Loan Amount = Property Value × (LVR ÷ 100)
Deposit = Property Value - Loan Amount  
Funds Available = Deposit + Transaction Costs
LVR = (Loan Amount ÷ Property Value) × 100
```

**Key Dependencies:**
- Transaction costs are calculated based on property value and loan amount
- LMI (Lenders Mortgage Insurance) applies when LVR > 80%
- Home Guarantee Scheme affects calculations for first home buyers
- State-specific stamp duty variations

---

## Current Permutations Analysis

### 1. PROPERTY_FUNDS Strategy
**Locked Fields:** Property Value + Funds Available  
**Calculated Fields:** LVR + Loan Amount  
**Formula Path:**
```javascript
costs = calculateUpfrontCosts(propertyValue, estimatedLoan, {state, isFirstHomeBuyer})
availableForDeposit = fundsAvailable - costs.total
loanAmount = propertyValue - availableForDeposit  
lvr = (loanAmount / propertyValue) × 100
```

**Use Case:** "I want this $750,000 house and have $150,000 cash available"  
**Real Example:**
- Property Value: $750,000 (locked)
- Funds Available: $150,000 (locked)
- → LVR: ~84% (calculated)
- → Loan Amount: ~$628,000 (calculated)

**Potential Issues:**
- ✅ Transaction costs calculated accurately
- ⚠️ Initial cost estimation could create circular dependency
- ✅ Validation catches negative deposits

---

### 2. PROPERTY_LVR Strategy  
**Locked Fields:** Property Value + LVR  
**Calculated Fields:** Loan Amount + Funds Available  
**Formula Path:**
```javascript
loanAmount = propertyValue × (lvr / 100)
depositAmount = propertyValue - loanAmount
costs = calculateUpfrontCosts(propertyValue, loanAmount, {includeLMI: lvr > 80})
fundsAvailable = depositAmount + costs.total
```

**Use Case:** "I want this $750,000 house with exactly 80% LVR"  
**Real Example:**
- Property Value: $750,000 (locked)
- LVR: 80% (locked)
- → Loan Amount: $600,000 (calculated)
- → Funds Available: $182,000 (calculated, including costs)

**Potential Issues:**
- ✅ Clean mathematical progression
- ✅ LMI correctly included when LVR > 80%
- ✅ Most reliable calculation path

---

### 3. FUNDS_LVR Strategy
**Locked Fields:** Funds Available + LVR  
**Calculated Fields:** Property Value + Loan Amount  
**Formula Path:**
```javascript
// Iterative approach due to cost dependency
estimatedCostRate = 0.05 // 5% estimate
availableForDeposit = fundsAvailable / (1 + estimatedCostRate)
depositRate = (100 - lvr) / 100
propertyValue = availableForDeposit / depositRate
loanAmount = min(propertyValue × (lvr / 100), borrowingPower)

// Recalculate with actual costs
costs = calculateUpfrontCosts(propertyValue, loanAmount, {includeLMI: lvr > 80})
actualFundsNeeded = propertyValue - loanAmount + costs.total
```

**Use Case:** "I have $150,000 cash and want 80% LVR"  
**Real Example:**
- Funds Available: $150,000 (locked)
- LVR: 80% (locked)
- → Property Value: ~$600,000 (calculated)
- → Loan Amount: ~$480,000 (calculated)

**Potential Issues:**
- ⚠️ **CRITICAL**: Uses 5% cost estimation that may be inaccurate
- ⚠️ Circular dependency between property value and transaction costs
- ⚠️ May require multiple iterations for accuracy
- ⚠️ Borrowing power constraint may override calculated loan amount

---

### 4. LOAN_PROPERTY Strategy
**Locked Fields:** Loan Amount + Property Value  
**Calculated Fields:** LVR + Funds Available  
**Formula Path:**
```javascript
lvr = (loanAmount / propertyValue) × 100
depositAmount = propertyValue - loanAmount
costs = calculateUpfrontCosts(propertyValue, loanAmount, {includeLMI: lvr > 80})
fundsAvailable = depositAmount + costs.total
```

**Use Case:** "I can borrow $600,000 for this $750,000 house"  
**Real Example:**
- Loan Amount: $600,000 (locked)
- Property Value: $750,000 (locked)
- → LVR: 80% (calculated)
- → Funds Available: $182,000 (calculated)

**Potential Issues:**
- ✅ Straightforward calculation
- ✅ No circular dependencies
- ✅ Reliable cost calculation

---

### 5. LOAN_LVR Strategy
**Locked Fields:** Loan Amount + LVR  
**Calculated Fields:** Property Value + Funds Available  
**Formula Path:**
```javascript
propertyValue = loanAmount / (lvr / 100)
depositAmount = propertyValue - loanAmount  
costs = calculateUpfrontCosts(propertyValue, loanAmount, {includeLMI: lvr > 80})
fundsAvailable = depositAmount + costs.total
```

**Use Case:** "I can borrow $600,000 and want 80% LVR"  
**Real Example:**
- Loan Amount: $600,000 (locked)
- LVR: 80% (locked)  
- → Property Value: $750,000 (calculated)
- → Funds Available: $182,000 (calculated)

**Potential Issues:**
- ✅ Clean reverse calculation
- ✅ No circular dependencies
- ✅ LMI correctly applied

---

### 6. LOAN_FUNDS Strategy
**Locked Fields:** Loan Amount + Funds Available  
**Calculated Fields:** Property Value + LVR  
**Formula Path:**
```javascript
// Iterative approach - most complex
propertyValue = loanAmount × 1.25 // Start with 80% LVR estimate

while (iteration < 10) {
  costs = calculateUpfrontCosts(propertyValue, loanAmount, {includeLMI: calculateLVR(loanAmount, propertyValue) > 80})
  depositAmount = propertyValue - loanAmount
  totalFundsNeeded = depositAmount + costs.total
  
  if (abs(totalFundsNeeded - fundsAvailable) < 1000) break // Close enough
  
  propertyValue = propertyValue × (fundsAvailable / totalFundsNeeded) // Adjust
  iteration++
}

lvr = (loanAmount / propertyValue) × 100
```

**Use Case:** "I can borrow $600,000 and have $150,000 cash"  
**Real Example:**
- Loan Amount: $600,000 (locked)
- Funds Available: $150,000 (locked)
- → Property Value: ~$730,000 (calculated via iteration)
- → LVR: ~82% (calculated)

**Potential Issues:**
- ⚠️ **MOST COMPLEX**: Requires iterative solving
- ⚠️ May not converge in all cases  
- ⚠️ 10-iteration limit could be insufficient for edge cases
- ⚠️ Starting assumption (80% LVR) may be poor for some scenarios

---

## Missing Permutations Analysis

**All mathematically valid 2-field combinations:**
1. ✅ Property Value + Funds Available → PROPERTY_FUNDS
2. ✅ Property Value + LVR → PROPERTY_LVR  
3. ✅ Property Value + Loan Amount → LOAN_PROPERTY
4. ✅ Funds Available + LVR → FUNDS_LVR
5. ✅ Funds Available + Loan Amount → LOAN_FUNDS
6. ✅ LVR + Loan Amount → LOAN_LVR

**Result:** ✅ **All 6 possible permutations are handled**

The system correctly identifies that with 4 interdependent fields, there are exactly C(4,2) = 6 ways to choose 2 input fields, and all are implemented.

---

## Mathematical Consistency Check

### Formula Verification

**✅ Core Relationships Correct:**
- `loanAmount = propertyValue × (lvr / 100)` ← Used in PROPERTY_LVR
- `propertyValue = loanAmount / (lvr / 100)` ← Used in LOAN_LVR  
- `lvr = (loanAmount / propertyValue) × 100` ← Used in LOAN_PROPERTY
- `fundsAvailable = depositAmount + costs.total` ← Used consistently

**⚠️ Potential Inconsistencies:**

1. **Transaction Cost Estimation (FUNDS_LVR):**
   ```javascript
   const estimatedCostRate = 0.05 // 5% estimate for costs
   ```
   - This is a **rough approximation**
   - Actual costs vary significantly by property value and state
   - Should be **more sophisticated** for accuracy

2. **Iterative Convergence (LOAN_FUNDS):**
   ```javascript
   if (Math.abs(totalFundsNeeded - fundsAvailable) < 1000) break // Close enough
   ```
   - $1,000 tolerance may be too loose for some scenarios
   - Could result in **small mismatches** in final values

3. **LMI Calculation Consistency:**
   - Some strategies calculate LMI before knowing final LVR
   - Could lead to **circular dependency issues**

---

## Potential Mismatch Sources

### 1. **Transaction Cost Approximations**
**Issue:** FUNDS_LVR uses 5% cost estimate, then recalculates  
**Impact:** Initial property value calculation may be significantly off  
**Solution:** Use iterative approach like LOAN_FUNDS, or better cost estimation

### 2. **Borrowing Power Constraints**  
**Issue:** FUNDS_LVR caps loan at borrowing power, potentially changing LVR  
**Impact:** User locks LVR but system changes it due to borrowing constraints  
**Solution:** Clear validation warnings when constraints override locked fields

### 3. **Rounding and Precision**
**Issue:** Iterative calculations use different precision thresholds  
**Impact:** Small mismatches between calculated values  
**Solution:** Consistent rounding and precision handling

### 4. **Home Guarantee Scheme Integration**
**Issue:** Some strategies don't account for HGS 5% deposit option  
**Impact:** May calculate incorrect LMI costs for first home buyers  
**Solution:** Integrate HGS eligibility checking in all strategies

---

## Recommendations

### 1. **Improve FUNDS_LVR Strategy**
```javascript
// Instead of 5% estimate, use iterative approach
const calculateFromFundsAndLVRImproved = (fundsAvailable, lvr, borrowingPower, state) => {
  let propertyValue = fundsAvailable * 5 // Better starting estimate
  let iteration = 0
  
  while (iteration < 15) { // Increase iteration limit
    const loanAmount = Math.min(propertyValue * (lvr / 100), borrowingPower)
    const costs = calculateUpfrontCosts(propertyValue, loanAmount, {state, includeLMI: lvr > 80})
    const requiredFunds = (propertyValue - loanAmount) + costs.total
    
    if (Math.abs(requiredFunds - fundsAvailable) < 100) break // Tighter tolerance
    
    propertyValue = propertyValue * (fundsAvailable / requiredFunds)
    iteration++
  }
  
  return { propertyValue, loanAmount, /* ... */ }
}
```

### 2. **Add Validation Warnings**
```javascript
const validatePropertyCalculation = (inputs) => {
  const warnings = []
  
  // Warn when borrowing power overrides locked LVR
  if (inputs.loanAmount > inputs.borrowingPower && inputs.lockedFields.includes('lvr')) {
    warnings.push({
      field: 'loanAmount',
      message: `Borrowing capacity limits loan to ${formatCurrency(inputs.borrowingPower)}, actual LVR will be ${calculateLVR(inputs.borrowingPower, inputs.propertyValue).toFixed(1)}%`,
      severity: 'warning'
    })
  }
  
  return { warnings, /* ... */ }
}
```

### 3. **Consistent Cost Calculation**
```javascript
// Create standardized cost calculation wrapper
const calculateCostsWithHGS = (propertyValue, loanAmount, params) => {
  const lvr = calculateLVR(loanAmount, propertyValue)
  const isHGSEligible = isEligibleForHomeGuaranteeScheme(propertyValue, params.state, params.isFirstHomeBuyer)
  
  return calculateUpfrontCosts(propertyValue, loanAmount, {
    ...params,
    includeLMI: isHGSEligible ? false : lvr > 80 // No LMI under HGS
  })
}
```

### 4. **Enhanced Error Recovery**
```javascript
const handleCalculationEdgeCases = (inputs, errors) => {
  const solutions = []
  
  for (const error of errors) {
    switch (error.code) {
      case 'CONVERGENCE_FAILED':
        solutions.push({
          action: 'ADJUST_TOLERANCE',
          message: 'Calculation didn\'t converge - try adjusting input values slightly',
          suggestedChange: 5000 // Suggest $5K adjustment
        })
        break
    }
  }
  
  return solutions
}
```

---

## Summary

Your Smart Auto-Calculation system is **mathematically sound** and covers all possible 2-field input combinations. The main areas for improvement are:

1. **FUNDS_LVR Strategy** - Replace 5% cost estimate with iterative approach
2. **LOAN_FUNDS Strategy** - Increase iteration limit and tighten tolerance  
3. **Validation System** - Add warnings when constraints override locked fields
4. **Home Guarantee Scheme** - Ensure all strategies account for HGS eligibility
5. **Error Handling** - Better convergence failure detection and recovery

The system handles the core property calculation relationships correctly but could benefit from more sophisticated transaction cost estimation and constraint handling.