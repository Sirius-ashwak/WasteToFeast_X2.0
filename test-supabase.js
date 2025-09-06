// Simple test to check Supabase connectivity
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lsdiwwnydtzizkvkcgot.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZGl3d255ZHR6aXprdmtjZ290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzIzNzMsImV4cCI6MjA3MjY0ODM3M30.zXTF0XeTeUzN7U4lV2rZXYTn-_NhRmdhU4imgsrbhF8';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey.length);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test basic connection
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('Connection error:', error);
    } else {
      console.log('Connection successful:', data);
    }
  })
  .catch(err => {
    console.error('Network error:', err);
  });
