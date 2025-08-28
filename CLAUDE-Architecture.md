# CLAUDE-ARCHITECTURE.md

Application architecture, tech stack, and system design documentation.

## Current Tech Stack (Aug 2025) - User Dashboard Complete

### Core Framework & Build
- **Vite 7.1** - Ultra-fast build tool with HMR and modern bundling
- **React 19** - Latest with concurrent features and improved hooks
- **React Router 7** - Client-side routing for multi-page experience
- **JavaScript (JSX)** - Modern ES6+ with functional components

### Backend & Services
- **Firebase Auth** - Google SSO and email/password authentication with production error handling
- **Cloud Firestore** - NoSQL database with comprehensive user profiles, savings data, and retirement scenarios
- **Firebase Analytics** - User behavior tracking with 20+ custom events and conversion monitoring
- **Firestore Security Rules** - Production-grade data protection with user-specific access controls
- **Netlify** - Frontend hosting with automatic deployments

### UI & Design System  
- **Tailwind CSS v4** - Modern utility-first styling with gradient support
    We're using Tailwind CSS v4.1.11, which is indeed the new version. The problem is that Tailwind CSS v4 has a completely different way of handling custom colors. Instead of extending the theme in the config file, we need to define custom properties in CSS. 
- **Blue/Indigo Design System** - Professional gradients and micro-interactions
- **Radix UI** - Accessible, unstyled UI primitives (Dialog, Progress, Tooltip)
- **Framer Motion** - Advanced animations and smooth transitions
- **Lucide React** - Professional icon library with consistent styling

### Development & Quality
- **ESLint** - Code quality and best practices with React hooks validation
- **Custom React Hooks** - Centralized state management with useDashboardData
- **PostCSS + Autoprefixer** - CSS processing and browser compatibility
- **Hot Module Replacement** - Instant development updates
- **Component-based Architecture** - Modular React components with proper separation of concerns

## Current Application Features

### User Dashboard System
- **Real-time Dashboard** - Comprehensive retirement progress overview with live Firebase data sync
- **Interactive Progress Visualization** - Animated progress circles with detailed metrics and projections  
- **Smart Insights Engine** - Personalized recommendations based on user behavior patterns
- **Activity Timeline** - Recent calculations and retirement scenarios with filtering and search
- **Quick Navigation** - Action cards for seamless access to all app features
- **Professional Loading States** - Skeleton animations with gradient effects for optimal UX
- **Responsive Layout** - Mobile-first design with adaptive grid systems for all device sizes

### Core Calculator
- **Opportunity Cost Calculator** - Compare spending vs investing with compound interest
- **Progressive Authentication** - Optional Google SSO after 2 calculations  
- **Dashboard Integration** - Calculator results automatically sync with dashboard progress
- **Real-time Validation** - Soft validation with helpful Australian messaging
- **Responsive Forms** - Enhanced input styling with focus states and error handling

### Modern UI Implementation
- **Premium Design System** - Blue/indigo gradients with sophisticated shadows
- **Micro-interactions** - Hover scales, smooth transitions, and loading states
- **Glass Morphism Effects** - Backdrop blur with transparency layers
- **Sticky Navigation** - Professional header with gradient branding
- **Mobile-first Responsive** - Optimized for all device sizes

### User Experience
- **Progressive Disclosure** - Simple calculator → advanced features as needed
- **Contextual Authentication** - Sign-up prompts after engagement
- **Australian Tone** - Professional but approachable messaging
- **Retirement Planning** - Bali destination cost analysis and progress tracking

### Technical Implementation
- **Tailwind CSS v4** - Modern utility-first styling with enhanced gradient support
- **Complete Firebase Backend** - Authentication, Firestore database, Analytics, and Security Rules
- **Real-time Data Synchronization** - Live updates for user profiles and retirement progress
- **Comprehensive Analytics** - User journey tracking from calculator usage to conversions
- **Financial Data Precision** - All monetary amounts stored in cents to avoid floating-point errors
- **Framer Motion Animations** - Smooth page transitions and component animations
- **Component Composition** - Reusable UI components with consistent styling

---

## 🚀 Firebase Backend Implementation Complete

### **Production-Ready Services:**
- **Authentication System** (`src/firebase/auth.js`) - Google SSO, email/password, profile creation
- **User Profile Management** (`src/firebase/userProfile.js`) - Financial data, savings tracking, scenarios
- **Analytics Tracking** (`src/firebase/analytics.js`) - 20+ custom events for user behavior insights
- **Security Implementation** (`firestore.rules`) - Production-grade data protection rules

### **Data Architecture:**
```
Firestore Collections:
├── users/{uid}                     # Basic profile and preferences
├── userProfiles/{uid}              # Financial data (stored in cents)
├── users/{uid}/retirementScenarios # User's retirement planning
├── users/{uid}/opportunityCosts    # Purchase decision tracking
├── users/{uid}/savingsTracking     # Historical balance data
└── retirementDestinations/         # Public destination information
```

## 🎯 **Frontend Architecture Strategy**

### **Hybrid Architecture Approach**
- **Marketing Site** - Static pages (Astro) for SEO optimization
- **Authenticated App** - React SPA for premium user experience  
- **Shared Components** - Design system consistency across both platforms

### **User Journey Optimization**
```
🌐 SEO Discovery: Landing → Destinations → Calculators
🔐 App Experience: Dashboard → Calculator → Scenarios → Profile
📱 Mobile-First: Touch-optimized responsive design
```

### **Performance & SEO Strategy**
- **Route-based Code Splitting** - <300KB initial bundle target
- **Progressive Loading** - Critical resources prioritized
- **SEO-Optimized Pages** - High-value Australian retirement content
- **Real-time Updates** - Firebase listeners for live dashboard data

### **Migration Path**
- **Current Phase** - Hybrid Static + SPA implementation
- **Future Evolution** - Next.js App Router when scale requires
- **Architecture Benefits** - Clear upgrade path with minimal refactoring

*See [CLAUDE_frontend_design.md](./CLAUDE_frontend_design.md) for comprehensive frontend architecture documentation*

### **Implementation Roadmap**
1. **Phase 1** - Hybrid foundation with Astro + React SPA
2. **Phase 2** - User dashboard with real-time Firebase integration  
3. **Phase 3** - Enhanced calculators with super vs non-super analysis
4. **Phase 4** - SEO content strategy and organic growth optimization

---

**Last Updated:** 10 Aug 2025  
**Status:** Production Ready with Complete User Dashboard Implementation