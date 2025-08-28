import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import FirstHomeBuyerToolkit from './components/FirstHomeBuyerToolkit/FirstHomeBuyerToolkit'
import InvestmentPropertyCalculator from './pages/InvestmentPropertyCalculator'
import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Navigate to="/first-home-buyer" replace />} />
          <Route 
            path="/first-home-buyer/*" 
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <FirstHomeBuyerToolkit />
              </motion.div>
            } 
          />
          <Route 
            path="/investment-property" 
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <InvestmentPropertyCalculator />
              </motion.div>
            } 
          />
          <Route path="*" element={<Navigate to="/first-home-buyer" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App