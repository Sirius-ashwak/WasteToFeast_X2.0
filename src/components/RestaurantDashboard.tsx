import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Clock, Users, Phone, Mail, Building2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  createRestaurant, 
  getRestaurantsByAdmin, 
  createFoodListing, 
  getFoodListingsByRestaurant,
  type FoodListingWithRestaurant 
} from '../services/foodSharing';
import { toast } from 'react-hot-toast';
import type { Database } from '../types/database';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function RestaurantDashboard() {
  const { user, profile, isRestaurantAdmin } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [foodListings, setFoodListings] = useState<FoodListingWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [showFoodForm, setShowFoodForm] = useState(false);

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
    }
  }, [user, isRestaurantAdmin]);

  useEffect(() => {
    if (selectedRestaurant) {
      loadFoodListings();
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
      toast.loading('Creating food listing...', { id: 'creating-food' });
      await createFoodListing({
        ...foodForm,
        restaurant_id: selectedRestaurant.id,
        dietary_info: foodForm.dietary_info.length > 0 ? foodForm.dietary_info : undefined,
        image_url: foodForm.image_url || undefined,
      });
      
      loadFoodListings();
      setShowFoodForm(false);
      setFoodForm({
        food_item: '',
        description: '',
        quantity: '',
        pickup_start_time: '',
        pickup_end_time: '',
        dietary_info: [],
        image_url: '',
      });
      toast.success('Food listing created successfully!', { id: 'creating-food' });
    } catch (error) {
      console.error('Error creating food listing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create food listing';
      toast.error(errorMessage, { id: 'creating-food' });
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

  if (!isRestaurantAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Restaurant Access Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            You need to have a restaurant admin account to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
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

      {/* Restaurant Selection */}
      <div className="grid md:grid-cols-3 gap-6">
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
        <div className="md:col-span-2">
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
              <h3 className="text-xl font-semibold dark:text-white mb-4">Add Food Listing</h3>
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
                    onClick={() => setShowFoodForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Create Listing
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}