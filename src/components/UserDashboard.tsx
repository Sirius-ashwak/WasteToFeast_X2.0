import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Filter, Clock, Users, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getAvailableFoodListings } from '../services/foodSharing';
import { supabase } from '../lib/supabase';
import type { FoodListingWithRestaurant } from '../services/foodSharing';
import FoodMap from './FoodMap';
import { toast } from 'react-hot-toast';

export default function UserDashboard() {
  const { user } = useAuth();
  const [foodListings, setFoodListings] = useState<FoodListingWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistance, setFilterDistance] = useState<number>(10);

  useEffect(() => {
    loadFoodListings();
    
    // Set up real-time subscription for food listings
    const subscription = supabase
      .channel('food_listings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'food_listings' },
        (payload) => {
          console.log('Real-time food listing change:', payload);
          // Reload food listings when any change occurs
          loadFoodListings();
        }
      )
      .subscribe();

    // Also subscribe to restaurant changes (in case restaurant info updates)
    const restaurantSubscription = supabase
      .channel('restaurant_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants' },
        (payload) => {
          console.log('Real-time restaurant change:', payload);
          // Reload food listings to get updated restaurant info
          loadFoodListings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      restaurantSubscription.unsubscribe();
    };
  }, []);

  const loadFoodListings = async () => {
    try {
      setLoading(true);
      console.log('🔄 UserDashboard: Loading food listings...');
      // Get user location first, then fetch nearby listings
      const listings = await getAvailableFoodListings();
      console.log('📊 UserDashboard: Received listings:', listings.length);
      setFoodListings(listings);
    } catch (error) {
      console.error('❌ UserDashboard: Error loading food listings:', error);
      toast.error('Failed to load food listings');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = foodListings.filter(listing => {
    if (searchQuery) {
      return listing.food_item.toLowerCase().includes(searchQuery.toLowerCase()) ||
             listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             listing.restaurants.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const stats = {
    availableListings: foodListings.filter(l => !l.is_claimed).length,
    nearbyRestaurants: new Set(foodListings.map(l => l.restaurants.id)).size,
    totalSaved: foodListings.length * 2.5, // Estimated kg saved
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-6 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'Food Seeker'}! 🍽️
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find delicious food near you and help reduce waste in your community
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available Food</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableListings}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nearby Restaurants</p>
                <p className="text-2xl font-bold text-blue-600">{stats.nearbyRestaurants}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Waste Saved</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSaved.toFixed(1)}kg</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Food Discovery */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Find Food Near Me
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Discover available food from local restaurants and help reduce waste
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search for food items or restaurants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filterDistance}
                      onChange={(e) => setFilterDistance(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value={5}>Within 5km</option>
                      <option value={10}>Within 10km</option>
                      <option value={25}>Within 25km</option>
                      <option value={50}>Within 50km</option>
                    </select>
                  </div>
                </div>

                {/* Food Map */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Available Food Near You
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click on markers to view details and claim food
                    </p>
                  </div>
                  <div className="h-96">
                    <FoodMap />
                  </div>
                </div>

                {/* Food Listings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    ))
                  ) : filteredListings.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No food listings found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search or distance filter
                      </p>
                    </div>
                  ) : (
                    filteredListings.map((listing) => (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {listing.image_url && (
                          <img
                            src={listing.image_url}
                            alt={listing.food_item}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {listing.food_item}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              listing.is_claimed
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {listing.is_claimed ? 'Claimed' : 'Available'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {listing.restaurants.name}
                          </p>
                          {listing.description && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              {listing.description}
                            </p>
                          )}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <Clock className="w-3 h-3 mr-1" />
                            Pickup: {new Date(listing.pickup_start_time).toLocaleDateString()}
                          </div>
                          {listing.dietary_info && listing.dietary_info.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {listing.dietary_info.map((diet) => (
                                <span
                                  key={diet}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                                >
                                  {diet}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
