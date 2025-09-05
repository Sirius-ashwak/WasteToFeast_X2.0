import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Menu, X, Sun, Moon, User, Building2, LogOut } from 'lucide-react';
import { useStore } from '../store';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  currentView: 'home' | 'restaurant' | 'profile';
  onViewChange: (view: 'home' | 'restaurant' | 'profile') => void;
  onAuthClick: () => void;
}

export default function Navbar({ currentView, onViewChange, onAuthClick }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { isDarkMode, toggleDarkMode } = useStore();
  const { isAuthenticated, isRestaurantAdmin, signOut, profile } = useAuth();

  const handleScrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100, // Offset to account for fixed navbar
        behavior: 'smooth'
      });
    }
    // Close mobile menu if open
    if (isOpen) {
      setIsOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsOpen(false);
      await signOut();
      onViewChange('home');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
      // Still navigate to home even if sign out failed
      onViewChange('home');
    }
  };

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
              Waste to Feast
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {currentView === 'home' ? (
              <>
                <NavLink href="#features">Features</NavLink>
                <NavLink href="#recipes">Recipes</NavLink>
                <NavLink href="#food-sharing">Food Sharing</NavLink>
                <NavLink href="#dashboard">Dashboard</NavLink>
                <NavLink href="#about">About</NavLink>
              </>
            ) : (
              <button
                onClick={() => onViewChange('home')}
                className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'} transition-colors`}
              >
                Home
              </button>
            )}
            
            {isAuthenticated && (
              <>
                <button
                  onClick={() => onViewChange('profile')}
                  className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'} transition-colors ${currentView === 'profile' ? 'text-green-600 dark:text-green-400' : ''}`}
                >
                  <User className="w-4 h-4" />
                  {isRestaurantAdmin ? 'My Account' : 'My Profile'}
                </button>
                {isRestaurantAdmin && (
                  <button
                    onClick={() => onViewChange('restaurant')}
                    className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'} transition-colors ${currentView === 'restaurant' ? 'text-green-600 dark:text-green-400' : ''}`}
                  >
                    <Building2 className="w-4 h-4" />
                    My Restaurants
                  </button>
                )}
              </>
            )}
            
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
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
              {currentView === 'home' ? (
                <>
                  <MobileNavLink href="#features" onClick={() => setIsOpen(false)}>
                    Features
                  </MobileNavLink>
                  <MobileNavLink href="#recipes" onClick={() => setIsOpen(false)}>
                    Recipes
                  </MobileNavLink>
                  <MobileNavLink href="#food-sharing" onClick={() => setIsOpen(false)}>
                    Food Sharing
                  </MobileNavLink>
                  <MobileNavLink href="#dashboard" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink href="#about" onClick={() => setIsOpen(false)}>
                    About
                  </MobileNavLink>
                </>
              ) : (
                <button
                  onClick={() => {
                    onViewChange('home');
                    setIsOpen(false);
                  }}
                  className={`${isDarkMode ? 'text-slate-300 hover:text-emerald-400' : 'text-gray-600 hover:text-green-600'} transition-colors px-4 py-2 font-medium text-left`}
                >
                  Home
                </button>
              )}
              
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      onViewChange('profile');
                      setIsOpen(false);
                    }}
                    className={`${isDarkMode ? 'text-slate-300 hover:text-emerald-400' : 'text-gray-600 hover:text-green-600'} transition-colors px-4 py-2 font-medium text-left flex items-center gap-2`}
                  >
                    <User className="w-4 h-4" />
                    {isRestaurantAdmin ? 'My Account' : 'My Profile'}
                  </button>
                  {isRestaurantAdmin && (
                    <button
                      onClick={() => {
                        onViewChange('restaurant');
                        setIsOpen(false);
                      }}
                      className={`${isDarkMode ? 'text-slate-300 hover:text-emerald-400' : 'text-gray-600 hover:text-green-600'} transition-colors px-4 py-2 font-medium text-left flex items-center gap-2`}
                    >
                      <Building2 className="w-4 h-4" />
                      My Restaurants
                    </button>
                  )}
                </>
              )}
              
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className={`${isDarkMode ? 'text-slate-300 hover:text-emerald-400' : 'text-gray-600 hover:text-green-600'} transition-colors px-4 py-2 font-medium text-left flex items-center gap-2`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { isDarkMode } = useStore();
  const sectionId = href.replace('#', '');

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100, // Offset to account for fixed navbar
        behavior: 'smooth'
      });
    }
  };

  return (
    <motion.a
      href={href}
      onClick={handleClick}
      className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'} transition-colors`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.a>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  const { isDarkMode } = useStore();
  const sectionId = href.replace('#', '');

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100, // Offset to account for fixed navbar
        behavior: 'smooth'
      });
    }
    onClick();
  };

  return (
    <motion.a
      href={href}
      onClick={handleClick}
      className={`${isDarkMode ? 'text-slate-300 hover:text-emerald-400' : 'text-gray-600 hover:text-green-600'} transition-colors px-4 py-2 font-medium`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.a>
  );
}