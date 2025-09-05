import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Phone, Mail, Navigation } from 'lucide-react';
import { getAvailableFoodListings, claimFoodListing, type FoodListingWithRestaurant } from '../services/foodSharing';
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
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [listings, map]);

  return null;
}

export default function FoodMap({ className = '' }: FoodMapProps) {
  const [listings, setListings] = useState<FoodListingWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedListing, setSelectedListing] = useState<FoodListingWithRestaurant | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Default center (you can change this to your preferred location)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York City

  useEffect(() => {
    loadFoodListings();
    getUserLocation();
  }, []);

  const loadFoodListings = async () => {
    try {
      setLoading(true);
      const data = await getAvailableFoodListings();
      setListings(data);
    } catch (error) {
      console.error('Error loading food listings:', error);
      toast.error('Failed to load food listings');
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
        (error) => {
          console.log('Geolocation error:', error);
          // Don't show error toast as this is optional
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
      toast.loading('Claiming food...', { id: 'claiming' });
      await claimFoodListing(listingId, user.id);
      toast.success('Food claimed successfully!', { id: 'claiming' });
      loadFoodListings(); // Refresh the listings
      setSelectedListing(null);
    } catch (error) {
      console.error('Error claiming food:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim food';
      toast.error(errorMessage, { id: 'claiming' });
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString();
  };

  const getDistanceFromUser = (lat: number, lng: number): string => {
    if (!userLocation) return '';
    
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat - userLocation[0]) * Math.PI / 180;
    const dLon = (lng - userLocation[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
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
          
          {/* Fit bounds to show all markers */}
          <FitBounds listings={listings} />
          
          {/* User location marker */}
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
          
          {/* Food listing markers */}
          {listings.map((listing) => (
            <Marker
              key={listing.id}
              position={[
                Number(listing.restaurants.latitude),
                Number(listing.restaurants.longitude)
              ]}
              icon={listing.is_claimed ? claimedIcon : foodIcon}
              eventHandlers={{
                click: () => setSelectedListing(listing),
              }}
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
                          {getDistanceFromUser(
                            Number(listing.restaurants.latitude),
                            Number(listing.restaurants.longitude)
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg mb-3">
                    <h4 className="font-semibold text-green-800 mb-2">
                      {listing.food_item}
                    </h4>
                    {listing.description && (
                      <p className="text-sm text-green-700 mb-2">
                        {listing.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {listing.quantity}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(listing.pickup_start_time)} - {formatTime(listing.pickup_end_time)}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      {formatDate(listing.pickup_start_time)}
                    </p>
                  </div>
                  
                  {listing.dietary_info && listing.dietary_info.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Dietary Info:</p>
                      <div className="flex flex-wrap gap-1">
                        {listing.dietary_info.map((info, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {info}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    {listing.restaurants.contact_phone && (
                      <a
                        href={`tel:${listing.restaurants.contact_phone}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Phone className="w-4 h-4" />
                        {listing.restaurants.contact_phone}
                      </a>
                    )}
                    
                    {listing.restaurants.contact_email && (
                      <a
                        href={`mailto:${listing.restaurants.contact_email}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Mail className="w-4 h-4" />
                        {listing.restaurants.contact_email}
                      </a>
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
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[1000]">
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
      
      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {listings.filter(l => !l.is_claimed).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Available</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {listings.filter(l => l.is_claimed).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Claimed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(listings.map(l => l.restaurant_id)).size}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Restaurants</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {listings.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Total Listings</div>
        </div>
      </div>
    </div>
  );
}