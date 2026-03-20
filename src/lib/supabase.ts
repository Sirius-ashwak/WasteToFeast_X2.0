import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const supabaseAvailable = !!(supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl));

if (!supabaseAvailable) {
  const reason = !supabaseUrl || !supabaseAnonKey ? 'missing' : 'invalid';
  console.warn(
    `Supabase environment variables are ${reason}. Auth and database features will be disabled. ` +
    'The AI recipe generator will still work.'
  );
}

export const supabase = supabaseAvailable
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null as any;

export { supabaseAvailable };