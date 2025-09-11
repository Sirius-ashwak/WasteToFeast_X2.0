import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Menu, X, Sun, Moon, User, LogOut, Camera, MapPin } from 'lucide-react';
import { useStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface NavbarProps {
  currentView: 'recipe-generator' | 'food-map' | 'profile';
  onViewChange: (view: 'recipe-generator' | 'food-map' | 'profile') => void;
  onAuthClick: () => void;
}

export default function Navbar({ currentView, onViewChange, onAuthClick }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { isDarkMode, toggleDarkMode } = useStore();
  const { isAuthenticated, signOut, loading: authLoading, initialized } = useAuth();


  const handleSignOut = async () => {
    try {
      setIsOpen(false);
      await signOut();
      toast.success('Signed out successfully');
      onViewChange('recipe-generator');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.success('Signed out successfully');
      onViewChange('recipe-generator');
    }
  };

  // Don't render auth-dependent UI until initialized
  if (!initialized) {
    return (
      <nav className={`fixed w-full z-50 ${isDarkMode ? 'bg-slate-900/90 border-b border-slate-700/50' : 'bg-white/80'} backdrop-blur-md shadow-sm`}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <Sprout className="w-8 h-8 text-green-600" />
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                GreenByte
              </span>
            </motion.div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`fixed w-full z-50 ${isDarkMode ? 'bg-slate-900/90 border-b border-slate-700/50' : 'bg-white/80'} backdrop-blur-md shadow-sm`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Sprout className="w-8 h-8 text-green-600" />
            <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              GreenByte
            </span>
          </motion.div>

          {/* Global Navigation Tabs */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onViewChange('recipe-generator')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'recipe-generator'
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <Camera className="w-4 h-4" />
              Recipe Generator
            </button>
            
            <button
              onClick={() => onViewChange('food-map')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'food-map'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Food Map
            </button>
            
            <button
              onClick={() => onViewChange('profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'profile'
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                  : isDarkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                disabled={authLoading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
              >
                <LogOut className="w-4 h-4" />
                {authLoading ? 'Signing Out...' : 'Sign Out'}
              </button>
            ) : (
              <button onClick={onAuthClick} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-600'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-600'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden py-4"
          >
            <div className="flex flex-col gap-4">
              {/* Global Navigation Tabs - Mobile */}
              <button
                onClick={() => {
                  onViewChange('recipe-generator');
                  setIsOpen(false);
                }}
                className={`${isDarkMode ? 'text-slate-300 hover:text-emerald-400' : 'text-gray-600 hover:text-green-600'} transition-colors px-4 py-2 font-medium text-left flex items-center gap-2 ${
                  currentView === 'recipe-generator' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : ''
                }`}
              >
                <Camera className="w-4 h-4" />
                Recipe Generator
              </button>
              
              <button
                onClick={() => {
                  onViewChange('food-map');
                  setIsOpen(false);
                }}
                className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors px-4 py-2 font-medium text-left flex items-center gap-2 ${
                  currentView === 'food-map' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                <MapPin className="w-4 h-4" />
                Food Map
              </button>
              
              <button
                onClick={() => {
                  onViewChange('profile');
                  setIsOpen(false);
                }}
                className={`${isDarkMode ? 'text-slate-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'} transition-colors px-4 py-2 font-medium text-left flex items-center gap-2 ${
                  currentView === 'profile' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' : ''
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  disabled={authLoading}
                  className={`${isDarkMode ? 'text-slate-300 hover:text-emerald-400' : 'text-gray-600 hover:text-green-600'} transition-colors px-4 py-2 font-medium text-left flex items-center gap-2`}
                >
                  <LogOut className="w-4 h-4" />
                  {authLoading ? 'Signing Out...' : 'Sign Out'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    onAuthClick();
                    setIsOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors mx-4"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
