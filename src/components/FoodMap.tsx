import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { MapPin, Clock, Users } from 'lucide-react';
import { getAvailableFoodListings, claimFoodListing } from '../services/foodSharing';
import { supabase } from '../lib/supabase';
import type { FoodListingWithRestaurant } from '../services/foodSharing';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different types of food
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="7" fill="white"/>
      <text x="12.5" y="17" text-anchor="middle" font-family="Arial" font-size="12" fill="${color}">🍽️</text>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const foodIcon = createCustomIcon('#10b981');
const claimedIcon = createCustomIcon('#6b7280');

interface FoodMapProps {
  className?: string;
  userRole?: 'user' | 'restaurant';
  viewMode?: 'map' | 'list';
  maxDistance?: number;
}

// Component to fit map bounds to markers
function FitBounds({ listings }: { listings: FoodListingWithRestaurant[] }) {
  const map = useMap();

  useEffect(() => {
    if (listings.length > 0) {
      const bounds = new LatLngBounds(
        listings.map(listing => [
          Number(listing.restaurants.latitude),
          Number(listing.restaurants.longitude)
        ])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [listings, map]);

  return null;
}

export default function FoodMap({ 
  className = '', 
  userRole = 'user', 
  viewMode = 'map',
  maxDistance = 10 
}: FoodMapProps) {
  const [listings, setListings] = useState<FoodListingWithRestaurant[]>([]);
  const [filteredListings, setFilteredListings] = useState<FoodListingWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [distanceFilter, setDistanceFilter] = useState(maxDistance);
  const { user, isAuthenticated } = useAuth();

  // Default center (you can change this to your preferred location)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York City

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    loadFoodListings();
    getUserLocation();
    
    // Set up real-time subscription for food listings
    const subscription = supabase
      .channel('food_map_listings')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'food_listings' },
        (payload) => {
          console.log('Real-time food listing change on map:', payload);
          loadFoodListings();
        }
      )
      .subscribe();

    // Also subscribe to restaurant changes
    const restaurantSubscription = supabase
      .channel('food_map_restaurants')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants' },
        (payload) => {
          console.log('Real-time restaurant change on map:', payload);
          loadFoodListings();
        }
      )
      .subscribe();

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.warn('Food map loading timeout - continuing with empty data');
      }
    }, 2000);
    
    return () => {
      subscription.unsubscribe();
      restaurantSubscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Filter listings based on distance and user role
  useEffect(() => {
    if (!listings.length) {
      setFilteredListings([]);
      return;
    }

    let filtered = [...listings];

    // Filter by distance if user location is available
    if (userLocation && userRole === 'user') {
      filtered = filtered.filter(listing => {
        const distance = calculateDistance(
          userLocation[0], 
          userLocation[1],
          Number(listing.restaurants.latitude),
          Number(listing.restaurants.longitude)
        );
        return distance <= distanceFilter;
      });

      // Sort by distance for users
      filtered.sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation[0], 
          userLocation[1],
          Number(a.restaurants.latitude),
          Number(a.restaurants.longitude)
        );
        const distanceB = calculateDistance(
          userLocation[0], 
          userLocation[1],
          Number(b.restaurants.latitude),
          Number(b.restaurants.longitude)
        );
        return distanceA - distanceB;
      });
    }

    // For restaurant owners, show only their listings
    if (userRole === 'restaurant' && user) {
      filtered = filtered.filter(listing => 
        listing.restaurants.restaurant_admin_id === user.id
      );
    }

    setFilteredListings(filtered);
  }, [listings, userLocation, distanceFilter, userRole, user]);

  const loadFoodListings = async () => {
    try {
      setLoading(true);
      const data = await getAvailableFoodListings();
      setListings(data || []);
    } catch (error) {
      console.error('Error loading food listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          console.log('Geolocation not available or denied - using default location');
          // Silently handle geolocation errors - this is expected behavior
        },
        {
          timeout: 5000,
          enableHighAccuracy: false,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  };

  const handleClaimFood = async (listingId: string) => {
    if (!isAuthenticated || !user) {
      toast.error('Please log in to claim food');
      return;
    }

    try {
      const loadingToast = toast.loading('Claiming food...');
      await claimFoodListing(listingId, user.id);
      toast.success('Food claimed successfully! Check your profile to see details.', { id: loadingToast });
      loadFoodListings();
    } catch (error) {
      console.error('Error claiming food:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim food';
      toast.error(errorMessage);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg dark:bg-gray-800 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading food map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          {userRole === 'user' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium dark:text-white">Distance:</label>
              <select 
                value={distanceFilter} 
                onChange={(e) => setDistanceFilter(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value={2}>2km</option>
                <option value={5}>5km</option>
                <option value={10}>10km</option>
                <option value={25}>25km</option>
                <option value={50}>50km</option>
              </select>
            </div>
          )}
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {userRole === 'restaurant' 
              ? `Showing ${filteredListings.length} of your listings`
              : `Found ${filteredListings.length} nearby listings`
            }
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="h-96 lg:h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
          <MapContainer
            center={userLocation || defaultCenter}
            zoom={userLocation ? 13 : 10}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <FitBounds listings={filteredListings} />
            
            {userLocation && (
              <Marker 
                position={userLocation}
                icon={new Icon({
                  iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
                    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
                      <circle cx="10" cy="10" r="3" fill="white"/>
                    </svg>
                  `)}`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-medium">Your Location</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {filteredListings.map((listing) => (
              <Marker
                key={listing.id}
                position={[
                  Number(listing.restaurants.latitude),
                  Number(listing.restaurants.longitude)
                ]}
                icon={listing.is_claimed ? claimedIcon : foodIcon}
              >
                <Popup>
                  <div className="min-w-[250px] max-w-[300px]">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {listing.restaurants.name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {listing.restaurants.address}
                        {userLocation && (
                          <span className="ml-2 text-blue-600 font-medium">
                            {calculateDistance(
                              userLocation[0], 
                              userLocation[1],
                              Number(listing.restaurants.latitude),
                              Number(listing.restaurants.longitude)
                            ).toFixed(1)}km
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Food:</span> {listing.food_item}
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span> {listing.quantity}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Available: {formatTime(listing.pickup_start_time)} - {formatTime(listing.pickup_end_time)}</span>
                      </div>
                      {listing.description && (
                        <div>
                          <span className="font-medium">Description:</span> {listing.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {listing.is_claimed ? (
                        <div className="text-center py-2">
                          <span className="text-gray-500 font-medium">Already Claimed</span>
                        </div>
                      ) : isAuthenticated ? (
                        <button
                          onClick={() => handleClaimFood(listing.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          Claim This Food
                        </button>
                      ) : (
                        <div className="text-center py-2">
                          <span className="text-gray-500 text-sm">Login to claim food</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <div className="h-96 lg:h-[500px] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 space-y-4">
            {filteredListings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {userRole === 'restaurant' 
                    ? "No food listings found. Create your first listing!"
                    : "No food available in your area right now."
                  }
                </p>
              </div>
            ) : (
              filteredListings.map((listing) => (
                <div key={listing.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg dark:text-white">{listing.restaurants.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      listing.is_claimed 
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' 
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {listing.is_claimed ? 'Claimed' : 'Available'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {listing.restaurants.address}
                      {userLocation && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                          {calculateDistance(
                            userLocation[0], 
                            userLocation[1],
                            Number(listing.restaurants.latitude),
                            Number(listing.restaurants.longitude)
                          ).toFixed(1)}km away
                        </span>
                      )}
                    </p>
                    <p><strong>Food:</strong> {listing.food_item}</p>
                    <p><strong>Quantity:</strong> {listing.quantity}</p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Available: {formatTime(listing.pickup_start_time)} - {formatTime(listing.pickup_end_time)}
                    </p>
                  </div>
                  
                  {listing.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{listing.description}</p>
                  )}
                  
                  {!listing.is_claimed && isAuthenticated && userRole === 'user' && (
                    <button
                      onClick={() => handleClaimFood(listing.id)}
                      className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Claim This Food
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {viewMode === 'map' && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[1000]">
          <h4 className="font-medium text-sm mb-2 dark:text-white">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">🍽️</div>
              <span className="dark:text-gray-300">Available Food</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">🍽️</div>
              <span className="dark:text-gray-300">Claimed Food</span>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                <span className="dark:text-gray-300">Your Location</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}