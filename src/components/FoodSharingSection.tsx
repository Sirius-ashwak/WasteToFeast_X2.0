import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Heart, Users, Utensils, Store, User } from 'lucide-react';
import FoodMap from './FoodMap';
import { useStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import { getFoodSharingStats, getRestaurantStats } from '../services/foodSharing';

interface FoodStats {
  totalListings: number;
  availableListings: number;
  claimedListings: number;
  totalClaims: number;
  thisMonthClaims: number;
  activeRestaurants: number;
}

export default function FoodSharingSection() {
  const { } = useStore();
  const { user, isRestaurantAdmin } = useAuth();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [stats, setStats] = useState<FoodStats>({
    totalListings: 0,
    availableListings: 0,
    claimedListings: 0,
    totalClaims: 0,
    thisMonthClaims: 0,
    activeRestaurants: 0
  });

  useEffect(() => {
    loadStats();
  }, [user, isRestaurantAdmin]);

  const loadStats = async () => {
    try {
      if (isRestaurantAdmin && user) {
        const restaurantStats = await getRestaurantStats(user.id);
        setStats(prev => ({
          ...prev,
          totalListings: restaurantStats.totalListings,
          availableListings: restaurantStats.activeListings,
          claimedListings: restaurantStats.claimedListings,
          activeRestaurants: restaurantStats.totalRestaurants
        }));
      } else {
        const globalStats = await getFoodSharingStats();
        setStats(globalStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

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
          {isRestaurantAdmin 
            ? "Share your excess food with the community and help reduce waste while helping those in need."
            : "Discover available meals from local restaurants near you and help reduce food waste."
          }
        </p>

        {/* Role-specific action buttons */}
        {user && (
          <div className="flex justify-center gap-4 mb-8">
            {isRestaurantAdmin ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const restaurantSection = document.getElementById('restaurant-dashboard');
                  restaurantSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Store className="w-5 h-5" />
                Manage Food Listings
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <User className="w-5 h-5" />
                {viewMode === 'map' ? 'Switch to List View' : 'Switch to Map View'}
              </motion.button>
            )}
          </div>
        )}
        
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
        className="w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              {isRestaurantAdmin 
                ? "Your Food Listings on Map" 
                : "Available Food Near You"
              }
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {isRestaurantAdmin 
                ? "See where your shared food is available for pickup"
                : "Find and claim available food from nearby restaurants"
              }
            </p>
          </div>
          <div className="h-[500px]">
            <FoodMap 
              className="w-full h-full" 
              userRole={isRestaurantAdmin ? 'restaurant' : 'user'}
              viewMode={viewMode}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 grid md:grid-cols-3 gap-6"
      >
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">
            {isRestaurantAdmin ? 'Your Active Listings' : 'Active Listings'}
          </h4>
          <p className="text-2xl font-bold">{stats.availableListings}</p>
          <p className="text-sm opacity-90">Available right now</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">
            {isRestaurantAdmin ? 'Total Shared' : 'Meals Saved'}
          </h4>
          <p className="text-2xl font-bold">
            {isRestaurantAdmin ? stats.totalListings : stats.thisMonthClaims}
          </p>
          <p className="text-sm opacity-90">
            {isRestaurantAdmin ? 'All time' : 'This month'}
          </p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">
            {isRestaurantAdmin ? 'Your Restaurants' : 'Participating Restaurants'}
          </h4>
          <p className="text-2xl font-bold">{stats.activeRestaurants}</p>
          <p className="text-sm opacity-90">
            {isRestaurantAdmin ? 'Registered' : 'In your area'}
          </p>
        </div>
      </motion.div>
    </section>
  );
}