import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseAvailable } from '../lib/supabase';
import type { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      // If Supabase is not configured, skip auth entirely
      if (!supabaseAvailable) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      try {
        console.log('Starting auth initialization...');
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        console.log('Session retrieved:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile to get role information
          try {
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (mounted && profileData) {
              setProfile(profileData as UserProfile);
              setLoading(false);
              setInitialized(true);
              console.log('User profile loaded:', (profileData as UserProfile).role);
            } else if (mounted) {
              setProfile(null);
              setLoading(false);
              setInitialized(true);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            if (mounted) {
              setProfile(null);
              setLoading(false);
              setInitialized(true);
            }
          }
        } else {
          setProfile(null);
          setLoading(false);
          setInitialized(true); // Initialize immediately if no session
        }
        
        console.log('Auth initialization complete');
        if (session?.user) {
          setInitialized(true); // Only set after profile fetch if there's a user
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };
    
    // Add a timeout to ensure initialization completes
    const initTimeout = setTimeout(() => {
      if (!initialized) {
        console.log('Auth initialization timeout - completing initialization');
        setLoading(false);
        setInitialized(true);
      }
    }, 3000); // Increased to 3000ms for better reliability
    
    initializeAuth();

    // Listen for auth changes (only if Supabase is available)
    if (!supabaseAvailable) {
      return () => {
        mounted = false;
        clearTimeout(initTimeout);
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, session?.user?.id);
      
      // Only process if the session actually changed
      const currentUserId = user?.id;
      const newUserId = session?.user?.id;
      
      if (currentUserId === newUserId && initialized) {
        console.log('Ignoring duplicate auth state change');
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch profile to get role information
        const fetchProfile = async () => {
          try {
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (mounted && profileData) {
              setProfile(profileData as UserProfile);
              setLoading(false);
              setInitialized(true);
              console.log('User profile updated:', (profileData as UserProfile).role);
            } else if (mounted) {
              setProfile(null);
              setLoading(false);
              setInitialized(true);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            if (mounted) {
              setProfile(null);
              setLoading(false);
              setInitialized(true);
            }
          }
        };
        
        fetchProfile();
      } else {
        setProfile(null);
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Removed unused fetchUserProfile function

  const signUp = async (email: string, password: string, userData: {
    username: string;
    full_name?: string;
    role?: 'user' | 'restaurant_admin';
    phone?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message === 'User already registered') {
        throw new Error('An account with this email already exists. Please sign in instead or use a different email address.');
      }
      throw error;
    }

    if (data.user) {
      // Create user profile
      const userInsert = {
        id: data.user.id,
        username: userData.username,
        full_name: userData.full_name || null,
        role: (userData.role || 'user') as 'user' | 'restaurant_admin',
        phone: userData.phone || null,
      };
      
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('users')
        .insert([userInsert])
        .select()
        .single();

      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('Username is already taken. Please choose a different one.');
        }
        throw profileError;
      }
      
      // Set the profile immediately after creation
      setProfile(profileData);
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      throw error;
    }
    
    return data;
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    // Always clear local state
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await (supabase as any)
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  return {
    user,
    profile,
    session,
    loading,
    profileLoading,
    initialized,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    isRestaurantAdmin: profile?.role === 'restaurant_admin',
  };
}