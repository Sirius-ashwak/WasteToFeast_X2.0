import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { generateRecipe } from '../services/ai';
import { youtubeService, type YouTubeVideo } from '../services/youtube';
import { ChefHat, Clock, ArrowRight, Check, X, Utensils, Users, Timer, CircleDashed, Play, AlarmClock, Flame, Info as LucideInfo, BarChart3, Save, Dumbbell, Apple } from 'lucide-react';
import { useStore } from '../store';
import { StarIcon } from '@heroicons/react/24/solid';
import VideoCard from './VideoCard';
// import LanguageSelector from './LanguageSelector';
// import { HuggingFaceTranslationService } from '../services/translationService';

interface Props {
  ingredients?: string[];
}

interface ParsedRecipe {
  name: string;
  description?: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
  tips: string[];
  nutrition: string[];
}

export default function RecipeGenerator({ ingredients = [] }: Props) {
  const [recipe, setRecipe] = useState<string>('');
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  // const [translationService] = useState(() => new HuggingFaceTranslationService());
  // const [selectedLanguage, setSelectedLanguage] = useState('en');
  // const [isTranslating, setIsTranslating] = useState(false);
  // const [translatedRecipe, setTranslatedRecipe] = useState<ParsedRecipe | null>(null);
  const { currentAnalysis, setCurrentAnalysis, addMealToHistory } = useStore();

  // Update selected ingredients when currentAnalysis changes
  useEffect(() => {
    if (currentAnalysis?.ingredients && currentAnalysis.ingredients.length > 0) {
      setSelectedIngredients([...currentAnalysis.ingredients]);
    }
  }, [currentAnalysis]);

  // Parse recipe text into structured format whenever recipe changes
  useEffect(() => {
    if (!recipe) {
      setParsedRecipe(null);
      return;
    }

    const parseRecipeText = (text: string): ParsedRecipe => {
      // Initialize default structure
      const parsed: ParsedRecipe = {
        name: 'Custom Recipe',
        prepTime: 'N/A',
        cookTime: 'N/A',
        servings: '2-4',
        ingredients: [],
        instructions: [],
        tips: [],
        nutrition: []
      };

      try {
        // Extract recipe name
        const nameMatch = text.match(/Recipe Name:?\s*([^\n]+)/i);
        if (nameMatch && nameMatch[1]) parsed.name = nameMatch[1].trim();

        // Extract prep time
        const prepMatch = text.match(/Preparation Time:?\s*([^\n]+)/i);
        if (prepMatch && prepMatch[1]) parsed.prepTime = prepMatch[1].trim();

        // Extract cook time
        const cookMatch = text.match(/Cooking Time:?\s*([^\n]+)/i);
        if (cookMatch && cookMatch[1]) parsed.cookTime = cookMatch[1].trim();

        // Extract servings
        const servingsMatch = text.match(/Servings:?\s*([^\n]+)/i);
        if (servingsMatch && servingsMatch[1]) parsed.servings = servingsMatch[1].trim();

        // Extract ingredients section
        const ingredientsSection = text.match(/Ingredients:?\s*([\s\S]*?)(?=Instructions:|$)/i);
        if (ingredientsSection && ingredientsSection[1]) {
          parsed.ingredients = ingredientsSection[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-') || line.match(/^\d+\./))
            .map(line => line.replace(/^-|\d+\.\s*/, '').trim())
            .filter(Boolean);
        }

        // Extract instructions section
        const instructionsSection = text.match(/Instructions:?\s*([\s\S]*?)(?=Tips:|Nutrition Facts:|$)/i);
        if (instructionsSection && instructionsSection[1]) {
          parsed.instructions = instructionsSection[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.match(/^\d+\./))
            .map(line => {
              // Remove the leading number and period
              let cleanLine = line.replace(/^\d+\.\s*/, '').trim();
              
              // Remove any markdown ** markers that may be present
              // This will be handled during rendering
              return cleanLine;
            })
            .filter(Boolean);
        }

        // Extract tips section
        const tipsSection = text.match(/Tips:?\s*([\s\S]*?)(?=Nutrition Facts:|$)/i);
        if (tipsSection && tipsSection[1]) {
          parsed.tips = tipsSection[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
            .filter(Boolean);
        }

        // Extract nutrition section
        const nutritionSection = text.match(/Nutrition Facts:?\s*([\s\S]*?)(?=$)/i);
        if (nutritionSection && nutritionSection[1]) {
          parsed.nutrition = nutritionSection[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-') || line.match(/^\d+\./) || line.includes(':'))
            .map(line => {
              // Remove leading dash or bullet if present
              let cleanLine = line.replace(/^[-•*\d+\.]\s*/, '').trim();
              
              // Make sure items with colons are formatted consistently
              if (cleanLine.includes(':')) {
                const parts = cleanLine.split(':', 2);
                return `${parts[0].trim()}: ${parts[1].trim()}`;
              }
              
              return cleanLine;
            })
            .filter(Boolean);
        }
      } catch (error) {
        console.error('Error parsing recipe:', error);
        // If parsing fails, provide at least the raw text
        parsed.instructions = [recipe];
      }

      return parsed;
    };

    setParsedRecipe(parseRecipeText(recipe));
  }, [recipe]);

  // Translation functionality - TEMPORARILY DISABLED
  // const handleLanguageChange = async (languageCode: string) => { ... };

  // Get current recipe to display - TEMPORARILY DISABLED
  const getCurrentRecipe = () => {
    return parsedRecipe;
  };

  const toggleIngredient = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter((i: string) => i !== ingredient));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  // Function to search for cooking videos
  const searchCookingVideos = async (recipeText: string, dishName?: string) => {
    try {
      setLoadingVideos(true);
      
      // Extract recipe name from the generated text or use dish name
      let recipeName = dishName || 'recipe';
      if (recipeText) {
        const nameMatch = recipeText.match(/Recipe Name:?\s*([^\n]+)/i);
        if (nameMatch && nameMatch[1]) {
          recipeName = nameMatch[1].trim();
        }
      }

      // Search for cooking videos
      const videoResults = await youtubeService.searchCookingVideos(
        recipeName, 
        selectedIngredients.slice(0, 3), // Use first 3 ingredients for better search
        6 // Get 6 videos
      );

      setVideos(videoResults.videos);
    } catch (error) {
      console.error('Error searching cooking videos:', error);
      // Don't show error toast as videos are supplementary content
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleGenerateRecipe = async (specificDish?: string) => {
    if (!selectedIngredients || selectedIngredients.length === 0) {
      toast.error('Please select at least one ingredient');
      return;
    }

    setIsLoading(true);
    if (specificDish) {
      setGeneratingFor(specificDish);
    } else {
      setGeneratingFor(null);
    }

    try {
      // If generating for a specific dish, include it in the prompt
      const promptIngredients = specificDish 
        ? [...selectedIngredients, `dish name: ${specificDish}`]
        : selectedIngredients;
        
      const generatedRecipe = await generateRecipe(promptIngredients);
      setRecipe(generatedRecipe);
      
      // Store the generated recipe in state
      if (currentAnalysis) {
        setCurrentAnalysis({
          ...currentAnalysis,
          generatedRecipe: generatedRecipe
        });
      }
      
      // Search for cooking videos after recipe generation
      searchCookingVideos(generatedRecipe, specificDish);
      
      toast.success('Recipe generated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipe';
      toast.error(errorMessage);
      console.error('Recipe generation error:', error);
    } finally {
      setIsLoading(false);
      setGeneratingFor(null);
    }
  };

  const handleRating = (stars: number) => {
    setRating(stars);
    toast.success(`Rated ${stars} stars!`);
  };

  const handleSaveRecipe = () => {
    if (!parsedRecipe) return;

    const meal = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ingredients: selectedIngredients,
      recipes: [parsedRecipe.name],
      wasteReduced: selectedIngredients.length * 0.1, // Estimate based on ingredients used
    };

    addMealToHistory(meal);
    toast.success('Recipe saved to your cooking history!');
  };

  // If no analysis, show an empty state
  if (!currentAnalysis || !currentAnalysis.ingredients?.length) {
    return (
      <section className="w-full">
        <h2 className="text-3xl font-bold text-center mb-8">
          No Ingredients Found
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          Upload a food image to get recipe suggestions based on the ingredients.
        </p>
        <div className="flex justify-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-6 bg-gray-50 rounded-lg text-center w-full max-w-md dark:bg-gray-700"
          >
            <ChefHat className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-300">
              Upload an image to get started with recipe generation.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="space-y-6">
        {/* Ingredient Selection Section */}
        <div className="bg-white rounded-lg shadow-md p-5 dark:bg-gray-800 dark:border dark:border-gray-700 w-full transition-colors duration-200">
          <h3 className="text-xl font-bold mb-4 dark:text-white">Select Ingredients</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {currentAnalysis?.ingredients?.map((ingredient, index) => (
              <button
                key={index}
                onClick={() => toggleIngredient(ingredient)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${selectedIngredients.includes(ingredient)
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
              >
                {selectedIngredients.includes(ingredient) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                {ingredient}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedIngredients.length} of {ingredients.length} ingredients selected
          </p>
        </div>

        {/* Recipe Suggestions Section */}
        <div className="bg-white rounded-lg shadow-md p-5 dark:bg-gray-800 dark:border dark:border-gray-700 w-full transition-colors duration-200">
          <h2 className="text-2xl font-bold mb-5 dark:text-gray-100">
            Recipe Suggestions
          </h2>

          {currentAnalysis.suggestions && currentAnalysis.suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentAnalysis.suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 dark:bg-gray-700 dark:border-gray-600"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <ChefHat className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="text-lg font-semibold dark:text-white">{suggestion}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 mb-4 dark:text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>~30 mins</span>
                    </div>

                    <p className="text-gray-600 mb-4 text-sm dark:text-gray-300">
                      A delicious dish using {selectedIngredients.length} selected ingredients.
                    </p>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleGenerateRecipe(suggestion);
                      }}
                      disabled={isLoading && generatingFor === suggestion}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800"
                    >
                      {isLoading && generatingFor === suggestion ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          Generate Recipe
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No recipe suggestions available. Try uploading a different image.
            </p>
          )}
        </div>

        {/* Custom Recipe Generator Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-md p-5 dark:bg-gray-800 dark:border dark:border-gray-700 w-full transition-colors duration-200"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold dark:text-white">Custom Recipe Generator</h2>
            
            {/* Language Selector - TEMPORARILY DISABLED */}
            {/* {parsedRecipe && translationService.isAvailable() && (
              <LanguageSelector
                currentLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                disabled={isTranslating}
                className="flex-shrink-0"
              />
            )} */}
          
            {/* Star Rating */}
            {recipe && (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      className={`focus:outline-none ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <StarIcon className="h-6 w-6" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSaveRecipe}
                  className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Recipe
                </button>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              handleGenerateRecipe();
            }}
            disabled={isLoading || selectedIngredients.length === 0}
            className="w-full mb-4 px-6 py-3 bg-green-500 text-white rounded-lg 
                    hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed
                      transition-colors duration-200 font-semibold text-lg flex items-center justify-center gap-2"
          >
            {isLoading && !generatingFor ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Generating Recipe...
              </>
            ) : (
              'Generate Custom Recipe with Selected Ingredients'
            )}
          </button>

          {/* Ingredients List */}
          {selectedIngredients.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg dark:text-white">Selected Ingredients:</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedIngredients.map((ingredient, index) => (
                  <span 
                    key={index}
                    className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm dark:bg-green-900 dark:text-green-100"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Styled Recipe Display */}
          {parsedRecipe && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              {/* Translation Loading - TEMPORARILY DISABLED */}
              {/* {isTranslating && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">Translating recipe...</span>
                  </div>
                </div>
              )} */}
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                {/* Recipe Header */}
                <div className="bg-green-600 px-6 py-4 text-white dark:bg-green-700 transition-colors duration-200">
                  <h3 className="text-2xl font-bold">{getCurrentRecipe()?.name}</h3>
                </div>
                
                {/* Recipe Info */}
                <div className="p-6">
                  {/* Recipe Quick Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 dark:bg-gray-700/50 transition-colors duration-200">
                      <AlarmClock className="h-6 w-6 text-green-600 mb-1 dark:text-green-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Prep Time</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{getCurrentRecipe()?.prepTime}</span>
                    </div>
                    <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 dark:bg-gray-700/50 transition-colors duration-200">
                      <Flame className="h-6 w-6 text-green-600 mb-1 dark:text-green-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Cook Time</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{getCurrentRecipe()?.cookTime}</span>
                    </div>
                    <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 dark:bg-gray-700/50 transition-colors duration-200">
                      <Users className="h-6 w-6 text-green-600 mb-1 dark:text-green-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Servings</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{getCurrentRecipe()?.servings}</span>
                    </div>
                    <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 dark:bg-gray-700/50 transition-colors duration-200">
                      <Utensils className="h-6 w-6 text-green-600 mb-1 dark:text-green-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Difficulty</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">Medium</span>
                    </div>
                  </div>
                  
                  {/* Ingredients */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                      <Utensils className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Ingredients
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getCurrentRecipe()?.ingredients.map((ingredient, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-md dark:bg-gray-700 transition-colors duration-200"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-800 dark:text-gray-200">{ingredient}</span>
                        </div>
                      )) || []}
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                      <Timer className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Instructions
                    </h4>
                    <div className="space-y-4">
                      {getCurrentRecipe()?.instructions.map((instruction, index) => {
                        // Clean up the instruction text by removing markdown formatting
                        let cleanInstruction = instruction.replace(/\*\*/g, '');
                        
                        // Check for a title/summary at the beginning
                        let title = '';
                        let details = cleanInstruction;
                        
                        // Look for a colon to separate title from details
                        const colonPos = cleanInstruction.indexOf(':');
                        if (colonPos > 0) {
                          title = cleanInstruction.substring(0, colonPos).trim();
                          details = cleanInstruction.substring(colonPos + 1).trim();
                        }
                        
                        return (
                          <div 
                            key={index} 
                            className="flex gap-3 items-start"
                          >
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm dark:bg-green-900 dark:text-green-200">
                              {index + 1}
                            </div>
                            <div className="text-gray-800 dark:text-gray-200">
                              {title ? (
                                <>
                                  <span className="font-semibold">{title}:</span>{' '}
                                  <span>{details}</span>
                                </>
                              ) : (
                                <span>{cleanInstruction}</span>
                              )}
                            </div>
                          </div>
                        );
                      }) || []}
                    </div>
                  </div>
                  
                  {/* Tips */}
                  {getCurrentRecipe()?.tips && getCurrentRecipe()?.tips.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <LucideInfo className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Chef Tips
                      </h4>
                      <div className="bg-yellow-50 p-4 rounded-lg dark:bg-yellow-900/20 dark:border dark:border-yellow-900/30 transition-colors duration-200">
                        <ul className="space-y-2">
                          {getCurrentRecipe()?.tips.map((tip, index) => (
                            <li 
                              key={index} 
                              className="flex items-start gap-2 text-gray-800 dark:text-gray-200"
                            >
                              <span className="text-yellow-500">•</span>
                              {tip}
                            </li>
                          )) || []}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Nutrition */}
                  {getCurrentRecipe()?.nutrition && getCurrentRecipe()?.nutrition.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Nutrition Facts
                      </h4>
                      <div className="bg-blue-50 p-5 rounded-lg dark:bg-blue-900/20 dark:border dark:border-blue-900/30 transition-colors duration-200">
                        <div className="space-y-4">
                          {getCurrentRecipe()?.nutrition.map((item, index) => {
                            // Clean up the item from any markdown formatting
                            const cleanItem = item.replace(/\*\*/g, '');
                            
                            // Check if this is a note (starts with * or contains "note")
                            const isNote = cleanItem.startsWith('*') || 
                                          /note|disclaimer/i.test(cleanItem);
                            
                            if (isNote) {
                              return (
                                <div 
                                  key={index}
                                  className="text-sm text-gray-600 dark:text-gray-300 border-t border-blue-200 dark:border-blue-700 pt-3 mt-2 italic"
                                >
                                  <div className="flex items-start gap-2">
                                    <LucideInfo className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span>{cleanItem.replace(/^\*+/, '')}</span>
                                  </div>
                                </div>
                              );
                            }
                            
                            // Extract the label and value if there's a colon
                            let label = cleanItem;
                            let value = '';
                            
                            if (cleanItem.includes(':')) {
                              const parts = cleanItem.split(':', 2);
                              label = parts[0].trim();
                              value = parts[1].trim();
                            }
                            
                            // Determine which icon to show based on the label
                            let icon = null;
                            
                            if (/calorie/i.test(label)) {
                              icon = (
                                <motion.div
                                  animate={{ rotate: [0, 10, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                  <Flame className="h-5 w-5 text-orange-500" />
                                </motion.div>
                              );
                            } else if (/protein/i.test(label)) {
                              icon = (
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                  <Dumbbell className="h-5 w-5 text-purple-500" />
                                </motion.div>
                              );
                            } else if (/carb/i.test(label)) {
                              icon = (
                                <motion.div
                                  animate={{ y: [0, -3, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                  <Apple className="h-5 w-5 text-yellow-500" />
                                </motion.div>
                              );
                            } else if (/fat/i.test(label)) {
                              icon = (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                >
                                  <CircleDashed className="h-5 w-5 text-blue-500" />
                                </motion.div>
                              );
                            } else {
                              icon = <div className="w-5 h-5 bg-blue-100 rounded-full flex-shrink-0 dark:bg-blue-800"></div>;
                            }
                            
                            return (
                              <div 
                                key={index}
                                className="flex items-center gap-3"
                              >
                                <div className="flex-shrink-0">
                                  {icon}
                                </div>
                                <div className="flex-grow">
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
                                  {value && (
                                    <span className="text-gray-600 dark:text-gray-300">: {value}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Recipe Display Toggle */}
              <details className="mt-6">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Show raw recipe text
                </summary>
                <div className="mt-2 bg-gray-50 p-4 rounded-lg dark:bg-slate-700/50 dark:border dark:border-slate-600 overflow-auto max-h-[300px] transition-colors duration-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{recipe}</pre>
                </div>
              </details>
            </motion.div>
          )}

          {/* YouTube Cooking Videos Section */}
          {(videos.length > 0 || loadingVideos) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Play className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Cooking Videos
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Learn how to make this recipe
                </div>
              </div>

              {loadingVideos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
                      <div className="aspect-video bg-gray-300 dark:bg-gray-600 rounded-t-lg"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <VideoCard video={video} />
                    </motion.div>
                  ))}
                </div>
              )}

              {videos.length === 0 && !loadingVideos && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No cooking videos found for this recipe</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}