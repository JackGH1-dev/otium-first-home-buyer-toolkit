import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Calculator, Target, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

const Header = () => {
  const location = useLocation()
  
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-blue-100/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/first-home-buyer" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg"
            >
              <Home className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Otium
              </h1>
              <p className="text-xs text-gray-500 -mt-1">First-Home Buyer Toolkit</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavLink 
              to="/first-home-buyer" 
              icon={Calculator}
              active={location.pathname.startsWith('/first-home-buyer')}
            >
              First Home Buyer
            </NavLink>
            <NavLink 
              to="/investment-property" 
              icon={TrendingUp}
              active={location.pathname === '/investment-property'}
            >
              Investment Property
            </NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

const NavLink = ({ to, icon: Icon, children, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      active 
        ? 'bg-blue-50 text-blue-700 shadow-sm' 
        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/50'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{children}</span>
  </Link>
)

export default Header