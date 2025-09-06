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
  const { data, error } = await (supabase as any)
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
  console.log('🍽️ Creating food listing:', listingData);
  const { data, error } = await (supabase as any)
    .from('food_listings')
    .insert(listingData)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating food listing:', error);
    throw error;
  }
  console.log('✅ Food listing created successfully:', data);
  return data;
}

export async function getAvailableFoodListings() {
  try {
    console.log('🔍 Fetching available food listings...');
    const { data, error } = await supabase
      .from('food_listings')
      .select(`
        *,
        restaurants (*)
      `)
      .eq('is_claimed', false)
      .gte('pickup_end_time', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching food listings:', error);
      return [];
    }
    
    console.log('✅ Found food listings:', data?.length || 0);
    console.log('📋 Food listings data:', data);
    return (data || []) as FoodListingWithRestaurant[];
  } catch (error) {
    console.error('❌ Error in getAvailableFoodListings:', error);
    return [];
  }
}

export async function getFoodListingsByRestaurant(restaurantId: string) {
  try {
    console.log('🔍 Fetching food listings by restaurant...');
    const { data, error } = await supabase
      .from('food_listings')
      .select(`
        *,
        restaurants (*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching restaurant food listings:', error);
      return [];
    }
    return (data || []) as FoodListingWithRestaurant[];
  } catch (error) {
    console.error('Error in getFoodListingsByRestaurant:', error);
    return [];
  }
}

export async function claimFoodListing(listingId: string, userId: string) {
  try {
    // First check if the listing exists and is available
    const { data: listing, error: fetchError } = await (supabase as any)
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
    const { data: updatedListing, error: updateError } = await (supabase as any)
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
    const { data: claim, error: claimError } = await (supabase as any)
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
      await (supabase as any)
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
  try {
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
      return [];
    }
    
    // Return empty array if no data
    if (!data) {
      return [];
    }
    
    return data as ClaimWithDetails[];
  } catch (error) {
    console.error('Error in getUserClaims:', error);
    return [];
  }
}

export async function markPickupCompleted(claimId: string) {
  const { data, error } = await (supabase as any)
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
  const { data, error } = await (supabase as any)
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
  const filtered = data?.filter((listing: any) => {
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

// Statistics functions
export async function getFoodSharingStats() {
  try {
    const [listingsResult, claimsResult, restaurantsResult] = await Promise.all([
      (supabase as any).from('food_listings').select('id, is_claimed, created_at'),
      (supabase as any).from('claims').select('id, created_at'),
      (supabase as any).from('restaurants').select('id').eq('is_verified', true)
    ]);

    const totalListings = listingsResult.data?.length || 0;
    const claimedListings = listingsResult.data?.filter((l: any) => l.is_claimed).length || 0;
    const totalClaims = claimsResult.data?.length || 0;
    const activeRestaurants = restaurantsResult.data?.length || 0;

    // Calculate this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthClaims = claimsResult.data?.filter(
      (claim: any) => new Date(claim.created_at) >= startOfMonth
    ).length || 0;

    return {
      totalListings,
      availableListings: totalListings - claimedListings,
      claimedListings,
      totalClaims,
      thisMonthClaims,
      activeRestaurants
    };
  } catch (error) {
    console.error('Error fetching food sharing stats:', error);
    return {
      totalListings: 0,
      availableListings: 0,
      claimedListings: 0,
      totalClaims: 0,
      thisMonthClaims: 0,
      activeRestaurants: 0
    };
  }
}

export async function getRestaurantStats(restaurantAdminId: string) {
  try {
    const { data: restaurants } = await (supabase as any)
      .from('restaurants')
      .select('id')
      .eq('restaurant_admin_id', restaurantAdminId);

    const restaurantIds = restaurants?.map((r: any) => r.id) || [];
    
    if (restaurantIds.length === 0) {
      return {
        totalListings: 0,
        activeListings: 0,
        claimedListings: 0,
        totalRestaurants: 0
      };
    }

    const { data: listings } = await (supabase as any)
      .from('food_listings')
      .select('id, is_claimed, created_at')
      .in('restaurant_id', restaurantIds);

    const totalListings = listings?.length || 0;
    const claimedListings = listings?.filter((l: any) => l.is_claimed).length || 0;
    const activeListings = totalListings - claimedListings;

    return {
      totalListings,
      activeListings,
      claimedListings,
      totalRestaurants: restaurantIds.length
    };
  } catch (error) {
    console.error('Error fetching restaurant stats:', error);
    return {
      totalListings: 0,
      activeListings: 0,
      claimedListings: 0,
      totalRestaurants: 0
    };
  }
}