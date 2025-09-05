import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Heart, Users, Utensils } from 'lucide-react';
import FoodMap from './FoodMap';
import { useStore } from '../store';

export default function FoodSharingSection() {
  const { isDarkMode } = useStore();

  return (
    <section className="w-full max-w-7xl mx-auto py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold mb-4 dark:text-white">
          Community Food Sharing
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Connect with local restaurants to rescue excess food and reduce waste. 
          Find available meals near you or help your restaurant share surplus food with the community.
        </p>
        
        {/* Feature highlights */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <MapPin className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2 dark:text-white">Find Nearby</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Discover restaurants with available food in your area
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2 dark:text-white">Reduce Waste</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Help prevent perfectly good food from going to waste
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2 dark:text-white">Build Community</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connect restaurants and community members for a good cause
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <Utensils className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2 dark:text-white">Easy Claiming</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Simple one-click claiming process for available food
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Map Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <FoodMap />
      </motion.div>

      {/* Call to action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center mt-12"
      >
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl border border-gray-200 dark:border-gray-600">
          <h3 className="text-2xl font-bold mb-4 dark:text-white">
            Join the Movement
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Whether you're a restaurant owner looking to share excess food or a community member 
            wanting to help reduce waste, you can make a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              I'm a Restaurant
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              I Want to Help
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}