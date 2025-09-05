import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Github, Twitter, Linkedin } from 'lucide-react';
import { useStore } from '../store';

export default function Footer() {
  const { isDarkMode } = useStore();
  
  const handleScrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
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
    <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-t`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <motion.div
              className="flex items-center gap-2 mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <Sprout className="w-8 h-8 text-green-600" />
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Waste to Feast
              </span>
            </motion.div>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Transforming food waste into delicious meals with AI-powered recipes.
            </p>
          </div>

          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#features" 
                  onClick={(e) => handleScrollToSection(e, 'features')}
                  className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`}
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#recipes" 
                  onClick={(e) => handleScrollToSection(e, 'recipes')}
                  className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`}
                >
                  Recipes
                </a>
              </li>
              <li>
                <a 
                  href="#dashboard" 
                  onClick={(e) => handleScrollToSection(e, 'dashboard')}
                  className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`}
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#about" 
                  onClick={(e) => handleScrollToSection(e, 'about')}
                  className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`}
                >
                  About Us
                </a>
              </li>
              <li>
                <a href="#blog" className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`}>
                  Blog
                </a>
              </li>
              <li>
                <a href="#contact" className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Follow Us</h3>
            <div className="flex gap-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`}
              >
                <Github className="w-6 h-6" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`}
              >
                <Twitter className="w-6 h-6" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className={`${isDarkMode ? 'text-gray-300 hover:text-green-400' : 'text-gray-600 hover:text-green-600'}`}
              >
                <Linkedin className="w-6 h-6" />
              </motion.a>
            </div>
          </div>
        </div>

        <div className={`border-t ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'} mt-12 pt-8 text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
          <p>© {new Date().getFullYear()} Waste to Feast. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}