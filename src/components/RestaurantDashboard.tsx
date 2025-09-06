import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Clock, Users, Phone, Mail, Building2, CheckCircle, XCircle, Edit3, Trash2, Settings, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createRestaurant, getRestaurantsByAdmin, createFoodListing, getFoodListingsByRestaurant } from '../services/foodSharing';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import type { FoodListingWithRestaurant } from '../services/foodSharing';
import type { Database } from '../types/database';
import { toast } from 'react-hot-toast';
import FoodMap from './FoodMap';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function RestaurantDashboard() {
  const { user, profile, isRestaurantAdmin } = useAuth();
  const { demoProfiles, initializeDemoProfiles } = useStore();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [foodListings, setFoodListings] = useState<FoodListingWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodListingWithRestaurant | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'analytics' | 'settings' | 'claims' | 'map'>('listings');
  const [analytics, setAnalytics] = useState({
    totalListings: 0,
    activeListing: 0,
    claimedListings: 0,
    totalViews: 0,
    wasteReduced: 0,
    peopleFed: 0
  });

  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    contact_phone: '',
    contact_email: '',
    description: '',
  });

  const [foodForm, setFoodForm] = useState({
    food_item: '',
    description: '',
    quantity: '',
    pickup_start_time: '',
    pickup_end_time: '',
    dietary_info: [] as string[],
    image_url: '',
  });

  useEffect(() => {
    if (user && isRestaurantAdmin) {
      loadRestaurants();
      // Initialize demo profiles if not already done
      if (!demoProfiles.restaurant) {
        initializeDemoProfiles();
      }
    }
  }, [user, isRestaurantAdmin]);

  useEffect(() => {
    if (selectedRestaurant) {
      loadFoodListings();
      
      // Set up real-time subscription for food listings
    const subscription = supabase
      .channel('restaurant_food_listings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'food_listings' },
        (payload) => {
          console.log('🔔 RestaurantDashboard: Real-time food listing change:', payload);
          console.log('🔄 RestaurantDashboard: Reloading food listings due to real-time update...');
          // Reload food listings when any change occurs
          loadFoodListings();
        }
      )
      .subscribe((status) => {
        console.log('📡 RestaurantDashboard: Food listings subscription status:', status);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedRestaurant]);

  const loadRestaurants = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getRestaurantsByAdmin(user.id);
      setRestaurants(data);
      if (data.length > 0 && !selectedRestaurant) {
        setSelectedRestaurant(data[0]);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const loadFoodListings = async () => {
    if (!selectedRestaurant) return;

    try {
      const data = await getFoodListingsByRestaurant(selectedRestaurant.id);
      setFoodListings(data);
      
      // Update analytics
      const totalListings = data.length;
      const activeListing = data.filter(item => !item.is_claimed).length;
      const claimedListings = data.filter(item => item.is_claimed).length;
      
      setAnalytics({
        totalListings,
        activeListing,
        claimedListings,
        totalViews: totalListings * 15, // Mock data
        wasteReduced: claimedListings * 2.5, // kg
        peopleFed: claimedListings * 3
      });
    } catch (error) {
      console.error('Error loading food listings:', error);
      toast.error('Failed to load food listings');
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form data
    if (!restaurantForm.name.trim()) {
      toast.error('Restaurant name is required');
      return;
    }

    if (!restaurantForm.address.trim()) {
      toast.error('Address is required');
      return;
    }

    if (!restaurantForm.latitude || !restaurantForm.longitude) {
      toast.error('Latitude and longitude are required');
      return;
    }

    const lat = parseFloat(restaurantForm.latitude);
    const lng = parseFloat(restaurantForm.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }

    try {
      const loadingToast = toast.loading('Creating restaurant...');
      const restaurant = await createRestaurant({
        ...restaurantForm,
        latitude: lat,
        longitude: lng,
        restaurant_admin_id: user.id,
      });
      
      setRestaurants([...restaurants, restaurant]);
      setSelectedRestaurant(restaurant);
      setShowRestaurantForm(false);
      setRestaurantForm({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        contact_phone: '',
        contact_email: '',
        description: '',
      });
      toast.success('Restaurant created successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Error creating restaurant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create restaurant';
      toast.error(errorMessage);
    }
  };

  const handleCreateFoodListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;

    // Validate form data
    if (!foodForm.food_item.trim()) {
      toast.error('Food item name is required');
      return;
    }

    if (!foodForm.quantity.trim()) {
      toast.error('Quantity is required');
      return;
    }

    if (!foodForm.pickup_start_time || !foodForm.pickup_end_time) {
      toast.error('Pickup times are required');
      return;
    }

    // Validate pickup times
    const startTime = new Date(foodForm.pickup_start_time);
    const endTime = new Date(foodForm.pickup_end_time);
    const now = new Date();

    if (startTime <= now) {
      toast.error('Pickup start time must be in the future');
      return;
    }

    if (endTime <= startTime) {
      toast.error('Pickup end time must be after start time');
      return;
    }

    try {
      const loadingId = editingFood ? 'updating-food' : 'creating-food';
      const loadingMessage = editingFood ? 'Updating food listing...' : 'Creating food listing...';
      const successMessage = editingFood ? 'Food listing updated successfully!' : 'Food listing created successfully!';
      
      toast.loading(loadingMessage, { id: loadingId });
      
      if (editingFood) {
        // Update existing listing (mock implementation)
        // In real app, you'd call updateFoodListing API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        await createFoodListing({
          ...foodForm,
          restaurant_id: selectedRestaurant.id,
          dietary_info: foodForm.dietary_info.length > 0 ? foodForm.dietary_info : undefined,
          image_url: foodForm.image_url || undefined,
        });
      }
      
      loadFoodListings();
      setShowFoodForm(false);
      setEditingFood(null);
      setFoodForm({
        food_item: '',
        description: '',
        quantity: '',
        pickup_start_time: '',
        pickup_end_time: '',
        dietary_info: [],
        image_url: '',
      });
      toast.success(successMessage, { id: loadingId });
    } catch (error) {
      console.error('Error with food listing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save food listing';
      const loadingId = editingFood ? 'updating-food' : 'creating-food';
      toast.error(errorMessage, { id: loadingId });
    }
  };

  const handleEditFood = (listing: FoodListingWithRestaurant) => {
    setEditingFood(listing);
    setFoodForm({
      food_item: listing.food_item,
      description: listing.description || '',
      quantity: listing.quantity,
      pickup_start_time: new Date(listing.pickup_start_time).toISOString().slice(0, 16),
      pickup_end_time: new Date(listing.pickup_end_time).toISOString().slice(0, 16),
      dietary_info: listing.dietary_info || [],
      image_url: listing.image_url || '',
    });
    setShowFoodForm(true);
  };


  const handleDeleteFood = async (listingId: string) => {
    console.log('Deleting listing:', listingId);
    if (!confirm('Are you sure you want to delete this food listing?')) return;
    
    try {
      toast.loading('Deleting food listing...', { id: 'deleting-food' });
      // Mock delete - in real app, call deleteFoodListing API
      await new Promise(resolve => setTimeout(resolve, 1000));
      loadFoodListings();
      toast.success('Food listing deleted successfully!', { id: 'deleting-food' });
    } catch (error) {
      console.error('Error deleting food listing:', error);
      toast.error('Failed to delete food listing', { id: 'deleting-food' });
    }
  };

  const handleDietaryInfoChange = (info: string) => {
    const current = foodForm.dietary_info;
    if (current.includes(info)) {
      setFoodForm({
        ...foodForm,
        dietary_info: current.filter(item => item !== info)
      });
    } else {
      setFoodForm({
        ...foodForm,
        dietary_info: [...current, info]
      });
    }
  };

  // Use demo profile data if available
  const displayProfile = profile || (user && isRestaurantAdmin ? demoProfiles.restaurant : null);
  const isDemo = !profile && !!demoProfiles.restaurant;

  if (!isRestaurantAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6 pt-20">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Restaurant Access Required
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            You need to be a restaurant admin to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 pt-20">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pt-20">
      {/* Restaurant Owner Profile Header */}
      {displayProfile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-6">
            {displayProfile.avatar_url ? (
              <img
                src={displayProfile.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-4 border-green-100 dark:border-green-900/30"
              />
            ) : (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayProfile.full_name}
                </h1>
                {isDemo && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    Demo Profile
                  </span>
                )}
              </div>
　　 　 　 　 {displayProfile.restaurant_info && (
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {displayProfile.restaurant_info.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {displayProfile.restaurant_info.cuisine_type} • Est. {displayProfile.restaurant_info.established}
                  </p>
                </div>
              )}
　　 　 　 　 {displayProfile.bio && (
                <p className="text-gray-600 dark:text-gray-300 text-sm italic mb-3">
                  "{displayProfile.bio}"
                </p>
              )}
　　 　 　 　 {displayProfile.impact_stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {displayProfile.impact_stats.meals_shared}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Meals Shared</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {displayProfile.impact_stats.waste_prevented}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Waste Prevented</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {displayProfile.impact_stats.community_members_helped}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">People Helped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {displayProfile.impact_stats.months_active}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Months Active</div>
                  </div>
                </div>
              )}
            </div>
          </div>
　　　 　 {/* Restaurant Details */}
          {displayProfile.restaurant_info && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Restaurant Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{displayProfile.restaurant_info.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{displayProfile.restaurant_info.operating_hours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{displayProfile.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{displayProfile.email}</span>
                    </div>
                  </div>
                </div>
　　　　　　 　 <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Specialties & Sustainability</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialties</h4>
                      <div className="flex flex-wrap gap-1">
                        {displayProfile.restaurant_info.specialties.map((specialty: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
　　　 　 　 　 　 <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sustainability Practices</h4>
                      <div className="flex flex-wrap gap-1">
                        {displayProfile.restaurant_info.sustainability_practices.map((practice: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                          >
                            {practice}
                          </span>
                        ))}
                      </div>
                    </div>
　　　 　 　 　 　 <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certifications</h4>
                      <div className="flex flex-wrap gap-1">
                        {displayProfile.restaurant_info.certifications.map((cert: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded-full"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Restaurant Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your restaurants and food listings
        </p>
      </div>

      {!isRestaurantAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-800 dark:text-yellow-200">
              <strong>Restaurant Admin Access Required:</strong> You need to have a restaurant admin account to manage restaurants and food listings. 
              Please sign up with a restaurant admin account or contact support.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'listings'
                  ? 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400 border-b-2 border-green-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Food Listings
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-orange-50 dark:bg-orange-900 text-orange-600 dark:text-orange-400 border-b-2 border-orange-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'claims'
                  ? 'bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Claims
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'map'
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Map View
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-4 text-sm font-medium rounded-tr-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-b-2 border-gray-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'analytics' && selectedRestaurant && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Restaurant Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Track your food sharing impact and performance metrics
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Listings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalListings}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">+12% from last month</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Listings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activeListing}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">{analytics.wasteReduced}kg waste reduced</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">People Fed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.peopleFed}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">Community impact</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'claims' && selectedRestaurant && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Claims Management
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Track and manage food pickup requests from community members
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No claims yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Claims will appear here when community members request your food
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Restaurant Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Manage your restaurant preferences and notification settings
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Settings Panel
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Restaurant settings and preferences will be available here
              </p>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400">{analytics.wasteReduced}kg waste reduced</span>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Selection */}
      <div className={`grid gap-6 ${activeTab === 'listings' ? 'md:grid-cols-3' : 'grid-cols-1'}`}>
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-white">My Restaurants</h2>
              <button
                onClick={() => setShowRestaurantForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {restaurants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No restaurants yet</p>
                <button
                  onClick={() => setShowRestaurantForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add Restaurant
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    onClick={() => setSelectedRestaurant(restaurant)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedRestaurant?.id === restaurant.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                    }`}
                  >
                    <h3 className="font-semibold dark:text-white">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {restaurant.address}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {restaurant.is_verified ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                          <XCircle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Food Listings */}
        <div className={`${activeTab === 'listings' ? 'md:col-span-2' : 'col-span-1'}`}>
          {selectedRestaurant ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold dark:text-white">
                    Food Listings - {selectedRestaurant.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {foodListings.length} listings
                  </p>
                </div>
                <button
                  onClick={() => setShowFoodForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Food
                </button>
              </div>

              {foodListings.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No food listings yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Start sharing your excess food with the community
                  </p>
                  <button
                    onClick={() => setShowFoodForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Create First Listing
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {foodListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg dark:text-white">
                            {listing.food_item}
                          </h3>
                          {listing.description && (
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              {listing.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {listing.quantity}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(listing.pickup_start_time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} - {new Date(listing.pickup_end_time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          {listing.dietary_info && listing.dietary_info.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {listing.dietary_info.map((info, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                                >
                                  {info}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditFood(listing)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit listing"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFood(listing.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {listing.is_claimed ? (
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full">
                              Claimed
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm rounded-full">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select a Restaurant
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose a restaurant from the left to manage its food listings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Form Modal */}
      {showRestaurantForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold dark:text-white mb-4">Add Restaurant</h3>
              <form onSubmit={handleCreateRestaurant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={restaurantForm.name}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter restaurant name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={restaurantForm.address}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter full address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={restaurantForm.latitude}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, latitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="40.7128"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={restaurantForm.longitude}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, longitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="-74.0060"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={restaurantForm.contact_phone}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={restaurantForm.contact_email}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="contact@restaurant.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={restaurantForm.description}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Brief description of your restaurant"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRestaurantForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Create Restaurant
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Food Form Modal */}
      {showFoodForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold dark:text-white mb-4">{editingFood ? 'Edit Food Listing' : 'Add Food Listing'}</h3>
              <form onSubmit={handleCreateFoodListing} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Food Item *
                  </label>
                  <input
                    type="text"
                    required
                    value={foodForm.food_item}
                    onChange={(e) => setFoodForm({ ...foodForm, food_item: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Fresh sandwiches, Pasta salad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={foodForm.description}
                    onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Describe the food item"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="text"
                    required
                    value={foodForm.quantity}
                    onChange={(e) => setFoodForm({ ...foodForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 10 portions, 5 kg, Serves 20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pickup Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={foodForm.pickup_start_time}
                      onChange={(e) => setFoodForm({ ...foodForm, pickup_start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pickup End Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={foodForm.pickup_end_time}
                      onChange={(e) => setFoodForm({ ...foodForm, pickup_end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dietary Information
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal'].map((info) => (
                      <label key={info} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={foodForm.dietary_info.includes(info)}
                          onChange={() => handleDietaryInfoChange(info)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm dark:text-gray-300">{info}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={foodForm.image_url}
                    onChange={(e) => setFoodForm({ ...foodForm, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="https://example.com/food-image.jpg"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFoodForm(false);
                      setEditingFood(null);
                      setFoodForm({
                        food_item: '',
                        description: '',
                        quantity: '',
                        pickup_start_time: '',
                        pickup_end_time: '',
                        dietary_info: [],
                        image_url: '',
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    {editingFood ? 'Update Listing' : 'Create Listing'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Restaurant Location & Food Map
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              View your restaurant location and nearby food listings
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <FoodMap />
          </div>
        </div>
      )}
    </div>
  );
}