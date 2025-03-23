import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, LineChart, Clock, Utensils, Calendar, TrendingUp } from 'lucide-react';
import { useStore } from '../store';

const popularRecipeData = [
  { name: 'Pasta Dishes', popularity: 85 },
  { name: 'Stir Fry', popularity: 75 },
  { name: 'Salads', popularity: 65 },
  { name: 'Soups', popularity: 60 },
  { name: 'Baked Goods', popularity: 55 },
  { name: 'Desserts', popularity: 50 },
];

const timeEfficiencyData = [
  { category: 'Quick Meals', time: 15 },
  { category: 'One-Pot', time: 25 },
  { category: 'Meal Prep', time: 40 },
  { category: 'Sheet Pan', time: 30 },
  { category: 'Slow Cooker', time: 60 },
  { category: 'Instant Pot', time: 20 },
];

export default function Dashboard() {
  const { currentAnalysis, isDarkMode } = useStore();

  return (
    <section className="w-full max-w-7xl mx-auto py-16">
      <h2 className="text-3xl font-bold text-center mb-2">
        Recipe Efficiency Hub
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
        Optimize your cooking with data-driven insights on meal preparation and popular recipe trends
      </p>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 w-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-5 lg:p-6 rounded-xl shadow-md dark:bg-gray-800 dark:border dark:border-gray-700 w-full transition-colors duration-200"
        >
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold dark:text-gray-100">Popular Recipe Types</h3>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularRecipeData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke={isDarkMode ? "#374151" : "#d1d5db"} />
                <XAxis dataKey="name" stroke={isDarkMode ? "#9ca3af" : "#4b5563"} />
                <YAxis stroke={isDarkMode ? "#9ca3af" : "#4b5563"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                    border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                    color: isDarkMode ? "#e5e7eb" : "#111827"
                  }}
                />
                <Bar dataKey="popularity" fill={isDarkMode ? "#10b981" : "#059669"} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-5 lg:p-6 rounded-xl shadow-md dark:bg-gray-800 dark:border dark:border-gray-700 w-full transition-colors duration-200"
        >
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold dark:text-gray-100">Time-Efficient Cooking Methods</h3>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeEfficiencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke={isDarkMode ? "#374151" : "#d1d5db"} />
                <XAxis type="number" unit="min" stroke={isDarkMode ? "#9ca3af" : "#4b5563"} />
                <YAxis type="category" dataKey="category" width={80} stroke={isDarkMode ? "#9ca3af" : "#4b5563"} />
                <Tooltip 
                  formatter={(value) => [`${value} mins`, 'Avg. Time']} 
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                    border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                    color: isDarkMode ? "#e5e7eb" : "#111827"
                  }}
                />
                <Bar dataKey="time" fill={isDarkMode ? "#60a5fa" : "#3b82f6"} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Weekly Meal Planning Dashboard Section */}
      <div className="mt-10 grid md:grid-cols-3 gap-6 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-xl shadow-md col-span-full md:col-span-1 dark:bg-gray-800 dark:border dark:border-gray-700 h-full transition-colors duration-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold dark:text-gray-100">Meal Planning Tips</h3>
          </div>
          
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <p>Batch cook ingredients to save up to 40% of time during the week</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <p>Plan meals around versatile ingredients to minimize waste</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <p>Use similar ingredient sets across multiple recipes to simplify shopping</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <p>Quick recipes (under 30 mins) are 60% more likely to be made regularly</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <p>Prepare ingredients the night before to save 15 minutes per meal</p>
            </li>
          </ul>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-5 rounded-xl shadow-md col-span-full md:col-span-2 dark:bg-gray-800 dark:border dark:border-gray-700 h-full transition-colors duration-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold dark:text-gray-100">Kitchen Efficiency Dashboard</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900/20 dark:border dark:border-blue-900/30 transition-colors duration-200">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">Average Prep Time</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">23 min</p>
              <p className="text-xs text-blue-500 dark:text-blue-400">-12% from last month</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg dark:bg-green-900/20 dark:border dark:border-green-900/30 transition-colors duration-200">
              <p className="text-sm text-green-800 dark:text-green-200 mb-1">Recipe Completion Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-300">87%</p>
              <p className="text-xs text-green-500 dark:text-green-400">+5% from last month</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg dark:bg-purple-900/20 dark:border dark:border-purple-900/30 transition-colors duration-200">
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">Ingredient Utilization</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">92%</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">+8% from last month</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 lg:gap-3">
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">One-Pot Recipes</span>
            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">30-Minute Meals</span>
            <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900 dark:text-yellow-200">Meal Prep</span>
            <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900 dark:text-purple-200">Sheet Pan Dinners</span>
            <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200">Efficient Cooking</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}