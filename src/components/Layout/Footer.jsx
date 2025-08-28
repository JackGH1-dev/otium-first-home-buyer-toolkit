import React from 'react'
import { Heart, Shield, Info } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Otium</span>
            </div>
            <p className="text-gray-600 text-sm">
              Helping Australians navigate their first home purchase with confidence and clarity.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Important Notice</h3>
            </div>
            <div className="text-xs text-gray-600 space-y-2">
              <p>
                This toolkit provides estimates only. Actual lending criteria, interest rates, 
                and costs may vary between lenders and over time.
              </p>
              <p>
                Always seek professional advice from qualified mortgage brokers, 
                financial advisers, and conveyancers before making property purchase decisions.
              </p>
            </div>
          </div>

          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">About This Tool</h3>
            </div>
            <div className="text-xs text-gray-600 space-y-2">
              <p>
                Built with the latest Australian lending standards, government schemes, 
                and property market data as of 2025.
              </p>
              <p>
                Calculations use RBA guidelines, HEM benchmark expenses, and typical 
                lender stress testing parameters.
              </p>
            </div>
          </div>

        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Otium. Made with ❤️ for first-home buyers in Australia.
            <br />
            <span className="text-blue-600">Not financial advice. Seek professional guidance.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer