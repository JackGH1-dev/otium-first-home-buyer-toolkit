# First-Home Buyer Toolkit

A comprehensive 6-step interactive guide for first-home buyers in Australia, built with React 19 and the Otium framework.

## Features

- **Step 1: Borrowing Power Estimator** - Calculate lending capacity with Australian standards
- **Step 2: Max Purchase Price Calculator** - Include stamp duty, LMI, and first home buyer concessions  
- **Step 3: Budget Fit & Affordability Check** - Monthly budget analysis with stress testing
- **Step 4: Deposit Timeline Planner** - Savings planning tools
- **Step 5: Property Shortlist & Due Diligence** - Property management and inspection tools
- **Step 6: Loan Selection & Pre-Approval** - Loan comparison and pre-approval tracking

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React Icons
- Context-based State Management

## Development

```bash
npm install
npm run dev
```

## Deployment

### Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the build settings from `netlify.toml`
3. Deploy automatically on every push to main branch

### Manual Deployment

```bash
npm run build
# Upload the dist/ folder to your hosting provider
```

## Australian Compliance

- Uses RBA lending guidelines and stress testing
- Includes HEM (Household Expenditure Measure) benchmarks  
- Accurate stamp duty calculations for all Australian states
- First home buyer grants and concessions integrated
- All monetary calculations in AUD

## License

Built for educational and personal use. Not financial advice - seek professional guidance.