import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, LineChart, Clock, Utensils, Calendar, TrendingUp, ChefHat, Timer, Target } from 'lucide-react';
import { useStore } from '../store';

export default function Dashboard() {
  const { currentAnalysis, isDarkMode, mealHistory, cookingStats } = useStore();

  // Generate dynamic data based on meal history
  const generatePopularRecipeData = () => {
    if (mealHistory.length === 0) {
      return [
        { name: 'No Data Yet', popularity: 0 },
      ];
    }

    // Count recipe types from meal history
    const recipeCounts = mealHistory.reduce((acc, meal) => {
      // Categorize recipes based on name/ingredients
      let category = 'Other';
      const recipeName = meal.recipeName.toLowerCase();
      
      if (recipeName.includes('pasta') || recipeName.includes('noodle')) {
        category = 'Pasta Dishes';
      } else if (recipeName.includes('stir') || recipeName.includes('fry')) {
        category = 'Stir Fry';
      } else if (recipeName.includes('salad')) {
        category = 'Salads';
      } else if (recipeName.includes('soup') || recipeName.includes('broth')) {
        category = 'Soups';
      } else if (recipeName.includes('bake') || recipeName.includes('bread')) {
        category = 'Baked Goods';
      } else if (recipeName.includes('dessert') || recipeName.includes('cake')) {
        category = 'Desserts';
      }
      
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(recipeCounts)
      .map(([name, count]) => ({
        name,
        popularity: Math.round((count / mealHistory.length) * 100),
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 6);
  };

  const generateTimeEfficiencyData = () => {
    if (mealHistory.length === 0) {
      return [
        { category: 'No Data Yet', time: 0 },
      ];
    }

    // Group meals by cooking method and calculate average times
    const methodTimes = mealHistory.reduce((acc, meal) => {
      if (!acc[meal.cookingMethod]) {
        acc[meal.cookingMethod] = [];
      }
      acc[meal.cookingMethod].push(meal.prepTime + meal.cookTime);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(methodTimes)
      .map(([category, times]) => ({
        category,
        time: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
      }))
      .sort((a, b) => a.time - b.time);
  };

  const popularRecipeData = generatePopularRecipeData();
  const timeEfficiencyData = generateTimeEfficiencyData();

  // Calculate trends
  const getStatTrend = (current: number, baseline: number) => {
    const change = ((current - baseline) / baseline) * 100;
    return {
      value: Math.round(Math.abs(change)),
      isPositive: change >= 0,
    };
  };

  const prepTimeTrend = getStatTrend(cookingStats.averagePrepTime, 25);
  const completionTrend = getStatTrend(cookingStats.completionRate, 80);
  const utilizationTrend = getStatTrend(cookingStats.ingredientUtilization, 70);

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
            <h3 className="text-xl font-semibold dark:text-gray-100">
              {mealHistory.length > 0 ? 'Your Recipe Preferences' : 'Popular Recipe Types'}
            </h3>
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
            <h3 className="text-xl font-semibold dark:text-gray-100">
              {mealHistory.length > 0 ? 'Your Cooking Method Efficiency' : 'Time-Efficient Cooking Methods'}
            </h3>
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
            <h3 className="text-lg font-semibold dark:text-gray-100">
              {mealHistory.length > 0 ? 'Your Cooking Insights' : 'Meal Planning Tips'}
            </h3>
          </div>
          
          {mealHistory.length > 0 ? (
            <ul className="space-y-3 text-gray-700 dark:text-gray-100">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <p>You've cooked {cookingStats.totalMealsCooked} meals, saving approximately {Math.round(cookingStats.totalMealsCooked * 12)} minutes compared to ordering out</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <p>Your favorite cooking method is {cookingStats.favoriteMethod} - great choice for efficiency!</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <p>You've spent {Math.round(cookingStats.totalTimeSpent / 60)} hours cooking, developing valuable culinary skills</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <p>Your ingredient utilization rate of {cookingStats.ingredientUtilization}% shows excellent waste reduction</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <p>Keep experimenting with new recipes to expand your culinary repertoire!</p>
              </li>
            </ul>
          ) : (
            <ul className="space-y-3 text-gray-700 dark:text-gray-100">
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
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-5 rounded-xl shadow-md col-span-full md:col-span-2 dark:bg-gray-800 dark:border dark:border-gray-700 h-full transition-colors duration-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold dark:text-gray-100">
              {mealHistory.length > 0 ? 'Your Kitchen Performance' : 'Kitchen Efficiency Dashboard'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900/20 dark:border dark:border-blue-900/30 transition-colors duration-200">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">Average Prep Time</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{cookingStats.averagePrepTime} min</p>
              <p className="text-xs text-blue-500 dark:text-blue-400">
                {prepTimeTrend.isPositive ? '+' : '-'}{prepTimeTrend.value}% from baseline
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg dark:bg-green-900/20 dark:border dark:border-green-900/30 transition-colors duration-200">
              <p className="text-sm text-green-800 dark:text-green-200 mb-1">Recipe Completion Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-300">{cookingStats.completionRate}%</p>
              <p className="text-xs text-green-500 dark:text-green-400">
                {completionTrend.isPositive ? '+' : '-'}{completionTrend.value}% from baseline
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg dark:bg-purple-900/20 dark:border dark:border-purple-900/30 transition-colors duration-200">
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-1">Ingredient Utilization</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">{cookingStats.ingredientUtilization}%</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">
                {utilizationTrend.isPositive ? '+' : '-'}{utilizationTrend.value}% from baseline
              </p>
            </div>
          </div>

          {mealHistory.length > 0 ? (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2 lg:gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
                  {cookingStats.totalMealsCooked} Meals Cooked
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                  {Math.round(cookingStats.totalTimeSpent / 60)}h Total Time
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900 dark:text-yellow-200">
                  Favorite: {cookingStats.favoriteMethod}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="w-4 h-4 text-green-500" />
                  <span className="dark:text-gray-200">Recent cooking activity shows consistent improvement in efficiency</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="dark:text-gray-200">Keep up the great work! Your skills are developing nicely.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-2 lg:gap-3">
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">One-Pot Recipes</span>
            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">30-Minute Meals</span>
            <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900 dark:text-yellow-200">Meal Prep</span>
            <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900 dark:text-purple-200">Sheet Pan Dinners</span>
            <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200">Efficient Cooking</span>
          </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}