import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import ImageUploader from './components/ImageUploader';
import RecipeGenerator from './components/RecipeGenerator';
import FoodSharingSection from './components/FoodSharingSection';
import RestaurantDashboard from './components/RestaurantDashboard';
import UserDashboard from './components/UserDashboard';
import UserProfile from './components/UserProfile';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import { useStore } from './store';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import type { AIAnalysisResult } from './types';
import { toast } from 'react-hot-toast';

function App() {
  const { isDarkMode, setCurrentAnalysis, initializeSampleData, mealHistory } = useStore();
  const { isAuthenticated, isRestaurantAdmin, user, initialized } = useAuth();
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [currentView, setCurrentView] = useState<'recipe-generator' | 'food-map' | 'profile'>('recipe-generator');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Verify environment variables are set
  useEffect(() => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.error('VITE_GEMINI_API_KEY is not defined in environment variables');
      toast.error('API key is missing. Please check your .env file.', {
        duration: 5000,
        id: 'api-key-missing'
      });
    }
    
    // Check Supabase configuration
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('Supabase configuration is missing');
      toast.error('Database configuration is missing. Please check your .env file.', {
        duration: 5000,
        id: 'supabase-missing'
      });
    }
    
    // Initialize sample data if no meal history exists
    if (mealHistory.length === 0) {
      initializeSampleData();
    }
  }, []);

  const handleAnalysisComplete = (result: AIAnalysisResult) => {
    setAnalysisResult(result);
    setCurrentAnalysis(result);
    
    if (result.ingredients.length > 0) {
      toast.success(`Found ${result.ingredients.length} ingredients!`);
      
      // Scroll to recipe section after successful analysis
      setTimeout(() => {
        const recipesSection = document.getElementById('recipes');
        if (recipesSection) {
          recipesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  };

  const handleViewChange = (view: 'recipe-generator' | 'food-map' | 'profile') => {
    // Allow navigation to recipe-generator and food-map for everyone
    // Only profile requires authentication check for full access
    if (view === 'profile' && !isAuthenticated && initialized) {
      // Profile will show auth modal, but allow navigation
    }
    
    setCurrentView(view);
  };

  // Set default view based on user role after authentication
  useEffect(() => {
    if (isAuthenticated && initialized) {
      // Auto-navigate to appropriate view based on role
      if (currentView === 'profile' && user) {
        // Stay on profile after login
      } else if (currentView === 'food-map') {
        // Stay on food-map, will show role-appropriate dashboard
      }
    }
  }, [isAuthenticated, isRestaurantAdmin, initialized, currentView, user]);

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    toast.success('Successfully signed in!');
    // Don't auto-navigate, let user stay where they are
  };

  // Show loading screen while initializing
  if (!initialized) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white' 
          : 'bg-gradient-to-b from-green-50 to-white'
      }`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Initializing Waste to Feast...
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              If this takes too long, please refresh the page
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'recipe-generator':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                AI Recipe Generator
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Transform your leftover ingredients into delicious meals with AI-powered recipe suggestions
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <ImageUploader onAnalysisComplete={handleAnalysisComplete} />
              </div>
              
              {analysisResult && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <RecipeGenerator ingredients={analysisResult.ingredients} />
                </div>
              )}
            </div>
          </div>
        );
        
      case 'food-map':
        if (isAuthenticated && initialized) {
          if (isRestaurantAdmin) {
            return <RestaurantDashboard />;
          } else {
            return <UserDashboard />;
          }
        } else {
          // Guest view-only food map
          return (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Food Map
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4">
                  Discover available food near you in real-time
                </p>
                <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Sign in to claim food and access full features
                  </p>
                </div>
              </div>
              
              <div className="max-w-6xl mx-auto">
                <FoodSharingSection />
              </div>
            </div>
          );
        }
        
      case 'profile':
        if (isAuthenticated && initialized) {
          return <UserProfile />;
        } else {
          // Guest profile - show auth modal
          setShowAuthModal(true);
          return (
            <div className="text-center py-16">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Waste to Feast
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Sign in or create an account to access your profile
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Sign In / Sign Up
              </button>
            </div>
          );
        }
        
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white' 
        : 'bg-gradient-to-b from-green-50 to-white'
    }`}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: isDarkMode ? '#2d3748' : '#fff',
            color: isDarkMode ? '#e2e8f0' : '#1a202c',
            border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
          },
          duration: 4000,
        }}
      />
      <Navbar 
        currentView={currentView}
        onViewChange={handleViewChange}
        onAuthClick={() => setShowAuthModal(true)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      
      <Footer />
    </div>
  );
}

export default App;