import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ImageUploader from './components/ImageUploader';
import RecipeGenerator from './components/RecipeGenerator';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import { useStore } from './store';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import type { AIAnalysisResult } from './types';
import { toast } from 'react-hot-toast';

function App() {
  const { isDarkMode, setCurrentAnalysis } = useStore();
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  // Verify environment variables are set
  useEffect(() => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.error('VITE_GEMINI_API_KEY is not defined in environment variables');
      toast.error('API key is missing. Please check your .env file.', {
        duration: 5000,
        id: 'api-key-missing'
      });
    }
  }, []);

  const handleAnalysisComplete = (result: AIAnalysisResult) => {
    setAnalysisResult(result);
    setCurrentAnalysis(result);
    
    if (result.ingredients.length > 0) {
      toast.success(`Found ${result.ingredients.length} ingredients!`);
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
        }}
      />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Hero />
            
            <div id="features" className="mt-12 mb-16">
              <h2 className="text-3xl font-bold text-center mb-2">
                Smart Kitchen Assistant
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Scan your ingredients and instantly discover delicious recipes tailored to what you have on hand
              </p>
              <div className="flex flex-col items-center gap-10 w-full max-w-4xl mx-auto">
                <div className="w-full">
                  <ImageUploader onAnalysisComplete={handleAnalysisComplete} />
                </div>
                <div id="recipes" className="w-full">
                  <RecipeGenerator ingredients={analysisResult?.ingredients || []} />
                </div>
              </div>
            </div>
            
            <div id="dashboard">
              <Dashboard />
            </div>
            
            <div id="about" className="py-16 w-full max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-2">
                About Waste to Feast
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                Transforming leftover ingredients into delicious meals with AI-powered recipes
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 dark:border dark:border-gray-700 transition-colors duration-200">
                  <h3 className="text-xl font-bold mb-4 dark:text-gray-100">Our Mission</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    At Waste to Feast, we're on a mission to reduce food waste by helping people transform leftover ingredients into delicious, nutritious meals. Our AI-powered platform suggests creative recipes based on the ingredients you already have.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    By making it easier to use what you have on hand, we aim to help households save money, reduce their environmental footprint, and discover exciting new recipes they might never have tried otherwise.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 dark:border dark:border-gray-700 transition-colors duration-200">
                  <h3 className="text-xl font-bold mb-4 dark:text-gray-100">How It Works</h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                      <p><span className="font-medium">Snap a photo</span> of your leftovers or ingredients</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                      <p><span className="font-medium">Our AI identifies</span> the ingredients in your image</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                      <p><span className="font-medium">Browse recipe suggestions</span> tailored to your ingredients</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
                      <p><span className="font-medium">Generate a complete recipe</span> with detailed instructions and nutrition facts</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">5</div>
                      <p><span className="font-medium">Cook and enjoy</span> your creative, waste-reducing meal!</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default App;