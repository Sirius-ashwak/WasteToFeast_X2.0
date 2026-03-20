/*
  # Food Sharing Community Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `role` (enum: user, restaurant_admin)
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `phone` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `restaurants`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `contact_phone` (text, nullable)
      - `contact_email` (text, nullable)
      - `description` (text, nullable)
      - `restaurant_admin_id` (uuid, foreign key)
      - `is_verified` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `food_listings`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `food_item` (text)
      - `description` (text, nullable)
      - `quantity` (text)
      - `pickup_start_time` (timestamp)
      - `pickup_end_time` (timestamp)
      - `is_claimed` (boolean)
      - `claimed_by_user_id` (uuid, foreign key, nullable)
      - `claimed_at` (timestamp, nullable)
      - `dietary_info` (text array, nullable)
      - `image_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `claims`
      - `id` (uuid, primary key)
      - `food_listing_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `claimed_at` (timestamp)
      - `pickup_completed` (boolean)
      - `pickup_completed_at` (timestamp, nullable)
      - `notes` (text, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Users can only see and modify their own data
    - Restaurant admins can manage their restaurant's data
    - Public can view available food listings
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'restaurant_admin');

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  contact_phone text,
  contact_email text,
  description text,
  restaurant_admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create food_listings table
CREATE TABLE IF NOT EXISTS food_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  food_item text NOT NULL,
  description text,
  quantity text NOT NULL,
  pickup_start_time timestamptz NOT NULL,
  pickup_end_time timestamptz NOT NULL,
  is_claimed boolean DEFAULT false,
  claimed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  dietary_info text[],
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_listing_id uuid NOT NULL REFERENCES food_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claimed_at timestamptz DEFAULT now(),
  pickup_completed boolean DEFAULT false,
  pickup_completed_at timestamptz,
  notes text
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for restaurants table
CREATE POLICY "Anyone can view restaurants"
  ON restaurants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Restaurant admins can manage their restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (restaurant_admin_id = auth.uid());

-- Create policies for food_listings table
CREATE POLICY "Anyone can view available food listings"
  ON food_listings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Restaurant admins can manage their food listings"
  ON food_listings
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE restaurant_admin_id = auth.uid()
    )
  );

CREATE POLICY "Users can claim food listings"
  ON food_listings
  FOR UPDATE
  TO authenticated
  USING (
    NOT is_claimed OR claimed_by_user_id = auth.uid()
  );

-- Create policies for claims table
CREATE POLICY "Users can view their own claims"
  ON claims
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create claims"
  ON claims
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Restaurant admins can view claims for their listings"
  ON claims
  FOR SELECT
  TO authenticated
  USING (
    food_listing_id IN (
      SELECT fl.id 
      FROM food_listings fl
      JOIN restaurants r ON fl.restaurant_id = r.id
      WHERE r.restaurant_admin_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_food_listings_restaurant ON food_listings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_food_listings_claimed ON food_listings(is_claimed);
CREATE INDEX IF NOT EXISTS idx_food_listings_pickup_time ON food_listings(pickup_start_time, pickup_end_time);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_listing ON claims(food_listing_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_listings_updated_at
  BEFORE UPDATE ON food_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();