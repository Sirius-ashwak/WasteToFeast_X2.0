import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type FoodListing = Database['public']['Tables']['food_listings']['Row'];
type Claim = Database['public']['Tables']['claims']['Row'];

export interface FoodListingWithRestaurant extends FoodListing {
  restaurants: Restaurant;
}

export interface ClaimWithDetails extends Claim {
  food_listings: FoodListingWithRestaurant;
}

// Restaurant functions
export async function createRestaurant(restaurantData: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  contact_email?: string;
  description?: string;
  restaurant_admin_id: string;
}) {
  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurantData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRestaurantsByAdmin(adminId: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('restaurant_admin_id', adminId);

  if (error) throw error;
  return data;
}

export async function getAllRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('is_verified', true);

  if (error) throw error;
  return data;
}

// Food listing functions
export async function createFoodListing(listingData: {
  restaurant_id: string;
  food_item: string;
  description?: string;
  quantity: string;
  pickup_start_time: string;
  pickup_end_time: string;
  dietary_info?: string[];
  image_url?: string;
}) {
  const { data, error } = await supabase
    .from('food_listings')
    .insert(listingData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAvailableFoodListings() {
  const { data, error } = await supabase
    .from('food_listings')
    .select(`
      *,
      restaurants (*)
    `)
    .eq('is_claimed', false)
    .gte('pickup_end_time', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FoodListingWithRestaurant[];
}

export async function getFoodListingsByRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from('food_listings')
    .select(`
      *,
      restaurants (*)
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FoodListingWithRestaurant[];
}

export async function claimFoodListing(listingId: string, userId: string) {
  try {
    // First check if the listing exists and is available
    const { data: listing, error: fetchError } = await supabase
      .from('food_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (fetchError) {
      console.error('Error fetching listing:', fetchError);
      throw new Error('Food listing not found');
    }

    if (!listing) {
      throw new Error('Food listing not found');
    }

    if (listing.is_claimed) {
      throw new Error('This food has already been claimed');
    }

    // Update the listing to mark as claimed
    const { data: updatedListing, error: updateError } = await supabase
      .from('food_listings')
      .update({
        is_claimed: true,
        claimed_by_user_id: userId,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('is_claimed', false) // Ensure it's still available
      .select()
      .single();

    if (updateError) {
      console.error('Error updating listing:', updateError);
      throw new Error('Failed to claim food listing');
    }

    if (!updatedListing) {
      throw new Error('Food listing was claimed by someone else');
    }

    // Create a claim record
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert({
        food_listing_id: listingId,
        user_id: userId,
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error creating claim:', claimError);
      // Try to rollback the listing update
      await supabase
        .from('food_listings')
        .update({
          is_claimed: false,
          claimed_by_user_id: null,
          claimed_at: null,
        })
        .eq('id', listingId);
      
      throw new Error('Failed to create claim record');
    }

    return { listing: updatedListing, claim };
  } catch (error) {
    console.error('Error in claimFoodListing:', error);
    throw error;
  }
}

export async function getUserClaims(userId: string) {
  const { data, error } = await supabase
    .from('claims')
    .select(`
      *,
      food_listings (
        *,
        restaurants (*)
      )
    `)
    .eq('user_id', userId)
    .order('claimed_at', { ascending: false });

  if (error) {
    console.error('Error fetching user claims:', error);
    throw error;
  }
  
  // Return empty array if no data
  if (!data) {
    return [];
  }
  
  return data as ClaimWithDetails[];
}

export async function markPickupCompleted(claimId: string) {
  const { data, error } = await supabase
    .from('claims')
    .update({
      pickup_completed: true,
      pickup_completed_at: new Date().toISOString(),
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Search and filter functions
export async function searchFoodListings(query: string) {
  const { data, error } = await supabase
    .from('food_listings')
    .select(`
      *,
      restaurants (*)
    `)
    .eq('is_claimed', false)
    .gte('pickup_end_time', new Date().toISOString())
    .or(`food_item.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FoodListingWithRestaurant[];
}

export async function getFoodListingsNearLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
) {
  // This is a simplified distance calculation
  // For production, you might want to use PostGIS or a more accurate calculation
  const { data, error } = await supabase
    .from('food_listings')
    .select(`
      *,
      restaurants (*)
    `)
    .eq('is_claimed', false)
    .gte('pickup_end_time', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter by distance on the client side (for simplicity)
  const filtered = data?.filter((listing) => {
    const restaurant = listing.restaurants;
    if (!restaurant) return false;

    const distance = calculateDistance(
      latitude,
      longitude,
      restaurant.latitude,
      restaurant.longitude
    );
    return distance <= radiusKm;
  });

  return filtered as FoodListingWithRestaurant[];
}

// Helper function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}