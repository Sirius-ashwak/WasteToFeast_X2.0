import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Heart, Users, Utensils, Store, User } from 'lucide-react';
import FoodMap from './FoodMap';
import SearchInput from './SearchInput';
import StatsCard from './StatsCard';
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
        
        {/* Search Section for non-restaurant users */}
        {!isRestaurantAdmin && (
          <div className="mb-8">
            <SearchInput
              placeholder="Search for food by type, restaurant, or location..."
              onSearch={(query, filters) => {
                console.log('Search:', query, 'Filters:', filters);
                // TODO: Implement food search functionality
              }}
              filters={['Vegetarian', 'Vegan', 'Gluten-Free', 'Available Now', 'Nearby']}
              className="max-w-2xl mx-auto"
            />
          </div>
        )}
        
        {/* Feature highlights with StatsCards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <StatsCard
            icon={<MapPin />}
            label="Find Nearby"
            value="Location-based"
            description="Restaurants with available food"
            color="green"
          />
          
          <StatsCard
            icon={<Heart />}
            label="Reduce Waste"
            value="Zero Waste"
            description="Help prevent food waste"
            color="red"
          />
          
          <StatsCard
            icon={<Users />}
            label="Build Community"
            value="Together"
            description="Connect for a good cause"
            color="blue"
          />
          
          <StatsCard
            icon={<Utensils />}
            label="Easy Claiming"
            value="One-Click"
            description="Simple claiming process"
            color="purple"
          />
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

      {/* Stats with StatsCard components */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 grid md:grid-cols-3 gap-6"
      >
        <StatsCard
          icon={<Utensils />}
          label={isRestaurantAdmin ? 'Your Active Listings' : 'Active Listings'}
          value={stats.availableListings}
          description="Available right now"
          trend="+12%"
          trendDirection="up"
          color="green"
        />
        
        <StatsCard
          icon={<Users />}
          label={isRestaurantAdmin ? 'Total Shared' : 'Meals Saved'}
          value={isRestaurantAdmin ? stats.totalListings : stats.thisMonthClaims}
          description={isRestaurantAdmin ? 'All time' : 'This month'}
          trend="+8%"
          trendDirection="up"
          color="blue"
        />
        
        <StatsCard
          icon={<Store />}
          label={isRestaurantAdmin ? 'Your Restaurants' : 'Participating Restaurants'}
          value={stats.activeRestaurants}
          description={isRestaurantAdmin ? 'Registered' : 'In your area'}
          trend="+3%"
          trendDirection="up"
          color="purple"
        />
      </motion.div>
    </section>
  );
}