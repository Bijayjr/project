import { motion } from 'framer-motion'

const Footer = ({ darkMode }) => {
  return (
    <footer className={`py-12 ${darkMode ? 'bg-gray-800/90' : 'bg-gray-100/90'} transition-colors duration-300`}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-emerald-400">Rento</h4>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Futuristic rentals in Bhutan.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h5 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
              Explore
            </h5>
            <ul className="space-y-2">
              {['Thimphu', 'Paro', 'Punakha'].map((item) => (
                <li key={item}>
                  <motion.a
                    href="#"
                    whileHover={{ x: 5, color: '#34d399' }}
                    className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {item}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h5 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
              Company
            </h5>
            <ul className="space-y-2">
              {['About', 'Careers', 'Press'].map((item) => (
                <li key={item}>
                  <motion.a
                    href="#"
                    whileHover={{ x: 5, color: '#34d399' }}
                    className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {item}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h5 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
              Contact
            </h5>
            <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Rinchending, Phuentsholing
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                </svg>
                info@rento.com
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                +975 17413091
              </li>
            </ul>
          </motion.div>
        </div>
        <div
          className={`border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} mt-6 pt-4 text-center text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          © 2025 Rento. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer