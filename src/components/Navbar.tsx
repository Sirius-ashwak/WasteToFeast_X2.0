import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Menu, X, Sun, Moon } from 'lucide-react';
import { useStore } from '../store';

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { isDarkMode, toggleDarkMode } = useStore();

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
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#recipes">Recipes</NavLink>
            <NavLink href="#food-sharing">Food Sharing</NavLink>
            <NavLink href="#dashboard">Dashboard</NavLink>
            <NavLink href="#about">About</NavLink>
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