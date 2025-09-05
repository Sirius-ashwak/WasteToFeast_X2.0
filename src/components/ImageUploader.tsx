import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { analyzeImage } from '../services/ai';
import type { AIAnalysisResult } from '../types';
import { Upload, Camera, ImageIcon, Check, RefreshCcw, ArrowRight } from 'lucide-react';

interface Props {
  onAnalysisComplete: (result: AIAnalysisResult) => void;
}

const ImageUploader: React.FC<Props> = ({ onAnalysisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AIAnalysisResult | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      const result = await analyzeImage(file);
      setResults(result);
      onAnalysisComplete(result);
      toast.success('Image analyzed successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-5 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:border dark:border-gray-700 w-full transition-colors duration-200"
      >
        <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Upload Food Image</h2>
        
        <div className="space-y-6">
          {/* Upload area */}
          <label className="block w-full cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4 dark:text-gray-300" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Drop your food image here, or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Supports: PNG, JPG or WEBP (max. 5MB)
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={loading}
              className="hidden"
            />
          </label>

          {/* Preview image */}
          {preview && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Preview</h3>
              <div className="relative rounded-lg overflow-hidden shadow-md">
                <img
                  src={preview}
                  alt="Food preview"
                  className="w-full h-auto max-h-[300px] object-cover"
                />
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg dark:bg-red-900 dark:text-red-200">
              <p className="font-medium">Error: {error}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Analysis Results */}
      {results && results.ingredients && results.ingredients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-lg shadow-md p-5 dark:bg-gray-800 dark:border dark:border-gray-700 transition-colors duration-200"
        >
          <h3 className="text-xl font-bold mb-4 dark:text-gray-100">Image Analysis Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preview Image */}
            <div className="bg-gray-100 rounded-lg p-4 dark:bg-gray-700 transition-colors duration-200">
              <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Analyzed Image</h4>
              {preview && (
                <img
                  src={preview}
                  alt="Uploaded food"
                  className="w-full h-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                />
              )}
            </div>
            
            {/* Detected Ingredients */}
            <div className="bg-gray-100 rounded-lg p-4 dark:bg-gray-700 transition-colors duration-200">
              <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">Detected Ingredients</h4>
              {results.ingredients.length > 0 ? (
                <ul className="space-y-2">
                  {results.ingredients.map((ingredient, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm dark:bg-gray-600 transition-colors duration-200"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-gray-800 dark:text-gray-200">{ingredient}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No ingredients detected</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end">
            <button 
              onClick={() => {
                setResults(null);
                setPreview(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCcw className="w-4 h-4" />
              Clear Results
            </button>
            <button 
              onClick={() => {
                if (results) {
                  onAnalysisComplete(results);
                  toast.success('Ingredients added to recipe generator!');
                }
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors dark:bg-green-700 dark:hover:bg-green-800"
            >
              <ArrowRight className="w-4 h-4" />
              Use Ingredients
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImageUploader;