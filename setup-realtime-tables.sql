-- Enable realtime for food_listings table
ALTER PUBLICATION supabase_realtime ADD TABLE food_listings;

-- Enable realtime for restaurants table  
ALTER PUBLICATION supabase_realtime ADD TABLE restaurants;

-- Enable realtime for claims table (optional, for future use)
ALTER PUBLICATION supabase_realtime ADD TABLE claims;

-- Verify publications
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
