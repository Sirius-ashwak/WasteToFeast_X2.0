import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, RecycleIcon } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden mb-12 py-16">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1490818387583-1baba5e638af"
          alt="Fresh vegetables background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            className="flex justify-center items-center mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sprout className="w-16 h-16 text-green-600" />
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Waste to Feast
          </h1>
          
          <p className="text-xl text-gray-700 dark:text-slate-200 mb-8 max-w-2xl mx-auto font-light">
            Transform your leftover ingredients into delicious meals with AI-powered recipe suggestions
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const featuresSection = document.getElementById('features');
              if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold 
                     shadow-lg hover:bg-green-700 transition-colors duration-200"
          >
            <span className="flex items-center gap-2">
              <RecycleIcon className="w-5 h-5" />
              Start Reducing Waste
            </span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}