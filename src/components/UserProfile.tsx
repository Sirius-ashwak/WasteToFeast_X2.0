import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Clock, CheckCircle, Phone, Mail, Calendar, Utensils, Award, TrendingUp } from 'lucide-react';
import { ChefHat } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUserClaims, markPickupCompleted, ClaimWithDetails } from '../services/foodSharing';
import { toast } from 'react-hot-toast';
import { useStore } from '../store';
import ProfileCard from './ProfileCard';
// import LanguageSelector from './LanguageSelector';
// import { HuggingFaceTranslationService } from '../services/translationService';

export default function UserProfile() {
  const { user, profile, updateProfile, loading: authLoading, profileLoading, isRestaurantAdmin, initialized } = useAuth();
  const { demoProfiles, initializeDemoProfiles } = useStore();
  const [claims, setClaims] = useState<ClaimWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });
  
  // Translation state - TEMPORARILY DISABLED
  // const [selectedLanguage, setSelectedLanguage] = useState('en');
  // const [isTranslating, setIsTranslating] = useState(false);
  // const [translatedContent, setTranslatedContent] = useState<{
  //   fullName?: string;
  //   cuisines?: string;
  //   cookingLevel?: string;
  //   heroTitle?: string;
  //   heroSubtitle?: string;
  //   profileTitle?: string;
  //   statsTitle?: string;
  //   activityTitle?: string;
  // }>({});
  
  // Initialize translation service - TEMPORARILY DISABLED
  // const [translationService] = useState(() => {
  //   try {
  //     return new HuggingFaceTranslationService();
  //   } catch (error) {
  //     console.error('Failed to initialize translation service:', error);
  //     return null;
  //   }
  // });

  // Translation functionality - TEMPORARILY DISABLED
  // const handleLanguageChange = async (languageCode: string) => { ... };

  // Get display text - TEMPORARILY DISABLED
  const getDisplayText = (originalText: string): string => {
    return originalText; // Always return original text when translation is disabled
  };

  // Safe accessor functions for profile properties
  const getProfileProperty = (property: string) => {
    if (!displayProfile) return null;
    if (property in displayProfile) return (displayProfile as any)[property];
    return null;
  };

  const getProfileAvatar = () => getProfileProperty('avatar_url') || getProfileProperty('avatar');
  const getProfileName = () => getProfileProperty('full_name') || getProfileProperty('name') || getProfileProperty('username');
  const getProfileUsername = () => getProfileProperty('username') || 'user';
  const getProfileEmail = () => getProfileProperty('email');
  const getProfilePhone = () => getProfileProperty('phone');
  const getProfileLocation = () => getProfileProperty('location');
  const getProfileCreatedAt = () => getProfileProperty('created_at');
  const getProfileBio = () => getProfileProperty('bio');
  const getProfileFavoriteCuisines = () => getProfileProperty('favorite_cuisines');
  const getProfileCookingLevel = () => getProfileProperty('cooking_level');

  useEffect(() => {
    if (user) {
      loadUserClaims();
      // Initialize demo profiles if not already done
      if (!demoProfiles.find(p => p.role === 'user')) {
        initializeDemoProfiles();
      }
    } else {
      setLoading(false);
    }
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.warn('User profile loading timeout - continuing with empty data');
      }
    }, 8000); // 8 second timeout
    
    return () => clearTimeout(timeout);
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const loadUserClaims = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserClaims(user.id);
      setClaims(data || []);
    } catch (error) {
      console.error('Error loading claims:', error);
      // Don't show error toast for empty claims, it's normal
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (claimId: string) => {
    try {
      toast.loading('Marking pickup as completed...', { id: 'completing' });
      await markPickupCompleted(claimId);
      toast.success('Pickup marked as completed!', { id: 'completing' });
      loadUserClaims(); // Refresh the claims
    } catch (error) {
      console.error('Error marking pickup completed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark pickup as completed';
      toast.error(errorMessage, { id: 'completing' });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!profileForm.full_name.trim()) {
      toast.error('Full name cannot be empty');
      return;
    }

    try {
      toast.loading('Updating profile...', { id: 'updating-profile' });
      await updateProfile(profileForm);
      setEditingProfile(false);
      toast.success('Profile updated successfully!', { id: 'updating-profile' });
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage, { id: 'updating-profile' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Calculate statistics
  const completedClaims = claims.filter(claim => claim.pickup_completed);
  const totalMealsRescued = claims.length;
  const completionRate = claims.length > 0 ? Math.round((completedClaims.length / claims.length) * 100) : 0;

  // Use demo profile data if available
  const userDemoProfile = demoProfiles.find(p => p.role === 'user');
  const displayProfile = profile || (user ? userDemoProfile : null);
  const isDemo = !profile && !!userDemoProfile;

  // Show loading if not initialized or still loading
  if (!initialized || authLoading || profileLoading || (loading && user)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              {!initialized ? 'Initializing...' : authLoading ? 'Loading account...' : profileLoading ? 'Loading profile...' : 'Loading claims...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated and initialized, show sign-in message
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Please Sign In
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            You need to be signed in to view your profile.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getDisplayText('My Profile')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {getDisplayText('Manage your account and view your food rescue activity')}
          </p>
        </div>
        
        {/* Language Selector - TEMPORARILY DISABLED */}
        {/* {translationService?.isAvailable() && (
          <LanguageSelector
            currentLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            disabled={isTranslating}
            className="flex-shrink-0"
          />
        )} */}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <ProfileCard
            avatarUrl={getProfileAvatar() || `https://ui-avatars.com/api/?name=${encodeURIComponent(getProfileName() || 'User')}&background=10b981&color=fff&size=400`}
            name={getDisplayText(getProfileName() || 'User')}
            title={`${displayProfile?.role === 'restaurant_admin' ? 'Restaurant Admin' : 'Community Member'}${isDemo ? ' (Demo)' : ''}`}
            handle={getProfileUsername()}
            status={`${totalMealsRescued} meals rescued`}
            contactText="Edit Profile"
            showUserInfo={true}
            enableTilt={true}
            enableMobileTilt={false}
            onContactClick={() => !isDemo && setEditingProfile(true)}
          />

          {/* Edit Profile Modal */}
          {editingProfile && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold dark:text-white mb-4">Edit Profile</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Profile Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold dark:text-white mb-4">
              {getDisplayText('Profile Details')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Mail className="w-5 h-5" />
                <span>{user?.email || getProfileEmail()}</span>
              </div>
              {getProfilePhone() && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Phone className="w-5 h-5" />
                  <span>{getProfilePhone()}</span>
                </div>
              )}
              {getProfileLocation() && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <MapPin className="w-5 h-5" />
                  <span>{getProfileLocation()}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Calendar className="w-5 h-5" />
                <span>Joined {formatDate(getProfileCreatedAt() || '')}</span>
              </div>
              
              {/* Bio */}
              {getProfileBio() && (
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                    "{getDisplayText(getProfileBio())}"
                  </p>
                </div>
              )}
              
              {getProfileCookingLevel() && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <ChefHat className="w-5 h-5" />
                  <span>Cooking Level: {getDisplayText(getProfileCookingLevel())}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold dark:text-white mb-4">
              {getDisplayText('Impact Statistics')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-300">Meals Rescued</span>
                </div>
                <span className="font-semibold text-lg dark:text-white">{totalMealsRescued}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-600 dark:text-gray-300">Completed</span>
                </div>
                <span className="font-semibold text-lg dark:text-white">{completedClaims.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-600 dark:text-gray-300">Success Rate</span>
                </div>
                <span className="font-semibold text-lg dark:text-white">{completionRate}%</span>
              </div>
            </div>
            
            {totalMealsRescued > 0 && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Food Rescue Hero!
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You've helped prevent food waste and supported your community. Keep up the great work!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Claims History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold dark:text-white mb-6">
              {isRestaurantAdmin ? 'Community Impact' : getDisplayText('My Food Claims')}
            </h3>
            
            {claims.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {isRestaurantAdmin ? 'No community activity yet' : 'No claims yet'}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {isRestaurantAdmin 
                    ? 'Start posting food listings to help your community and see your impact here'
                    : 'Start rescuing food from local restaurants to see your activity here'
                  }
                </p>
                {!isRestaurantAdmin && (
                  <button
                    onClick={() => {
                      const foodSharingSection = document.getElementById('food-sharing');
                      if (foodSharingSection) {
                        foodSharingSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Find Food to Rescue
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <motion.div
                    key={claim.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg dark:text-white">
                            {claim.food_listings.food_item}
                          </h4>
                          {claim.pickup_completed ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                              Pending Pickup
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{claim.food_listings.restaurants.name}</span>
                          <span>•</span>
                          <span>{claim.food_listings.restaurants.address}</span>
                        </div>
                        
                        {claim.food_listings.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            {claim.food_listings.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Pickup: {formatTime(claim.food_listings.pickup_start_time)} - {formatTime(claim.food_listings.pickup_end_time)}
                          </span>
                          <span>
                            Quantity: {claim.food_listings.quantity}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <span>Claimed: {formatDate(claim.claimed_at)}</span>
                          {claim.pickup_completed && claim.pickup_completed_at && (
                            <span>Completed: {formatDate(claim.pickup_completed_at)}</span>
                          )}
                        </div>
                        
                        {claim.food_listings.dietary_info && claim.food_listings.dietary_info.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {claim.food_listings.dietary_info.map((info, index) => (
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
                      
                      <div className="ml-4">
                        {!claim.pickup_completed && (
                          <button
                            onClick={() => handleMarkCompleted(claim.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Contact Information */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4 text-sm">
                        {claim.food_listings.restaurants.contact_phone && (
                          <a
                            href={`tel:${claim.food_listings.restaurants.contact_phone}`}
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <Phone className="w-4 h-4" />
                            {claim.food_listings.restaurants.contact_phone}
                          </a>
                        )}
                        {claim.food_listings.restaurants.contact_email && (
                          <a
                            href={`mailto:${claim.food_listings.restaurants.contact_email}`}
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <Mail className="w-4 h-4" />
                            {claim.food_listings.restaurants.contact_email}
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}