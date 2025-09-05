import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { generateRecipe } from '../services/ai';
import { ChefHat, Clock, ArrowRight, Check, X, Utensils, Users, AlarmClock, Timer, Flame, LucideInfo, BarChart3, Dumbbell, Banana, CircleDashed, Save } from 'lucide-react';
import { useStore } from '../store';
import { StarIcon } from '@heroicons/react/24/solid';

interface Props {
  ingredients: string[];
}

interface ParsedRecipe {
  name: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
  tips: string[];
  nutrition: string[];
}

const RecipeGenerator: React.FC<Props> = ({ ingredients }) => {
  const [recipe, setRecipe] = useState<string>('');
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const { currentAnalysis, setCurrentAnalysis, addMealToHistory } = useStore();

  // Update selected ingredients when ingredients prop changes
  useEffect(() => {
    if (ingredients && ingredients.length > 0) {
      setSelectedIngredients([...ingredients]);
    }
  }, [ingredients]);

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

  const toggleIngredient = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  const handleGenerateRecipe = async (specificDish?: string) => {
    if (!selectedIngredients || selectedIngredients.length === 0) {
      toast.error('Please select at least one ingredient');
      return;
    }

    setLoading(true);
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
      
      toast.success('Recipe generated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipe';
      toast.error(errorMessage);
      console.error('Recipe generation error:', error);
    } finally {
      setLoading(false);
      setGeneratingFor(null);
    }
  };

  const handleRating = (stars: number) => {
    setRating(stars);
    toast.success(`Rated ${stars} stars!`);
  };

  const handleSaveRecipe = () => {
    if (!parsedRecipe) return;

    // Determine cooking method based on recipe name and ingredients
    const recipeName = parsedRecipe.name.toLowerCase();
    let cookingMethod = 'Other';
    
    if (recipeName.includes('one-pot') || recipeName.includes('one pot')) {
      cookingMethod = 'One-Pot';
    } else if (recipeName.includes('stir') || recipeName.includes('fry')) {
      cookingMethod = 'Stir Fry';
    } else if (recipeName.includes('bake') || recipeName.includes('oven')) {
      cookingMethod = 'Baked';
    } else if (recipeName.includes('grill')) {
      cookingMethod = 'Grilled';
    } else if (recipeName.includes('slow') || recipeName.includes('crockpot')) {
      cookingMethod = 'Slow Cooker';
    } else if (recipeName.includes('instant') || recipeName.includes('pressure')) {
      cookingMethod = 'Instant Pot';
    } else if (recipeName.includes('sheet') || recipeName.includes('pan')) {
      cookingMethod = 'Sheet Pan';
    } else if (recipeName.includes('salad') || recipeName.includes('raw')) {
      cookingMethod = 'No Cook';
    } else {
      cookingMethod = 'Stovetop';
    }

    // Parse time strings to numbers
    const parseTime = (timeStr: string): number => {
      const match = timeStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : 30;
    };

    const meal = {
      recipeName: parsedRecipe.name,
      ingredients: selectedIngredients,
      prepTime: parseTime(parsedRecipe.prepTime),
      cookTime: parseTime(parsedRecipe.cookTime),
      servings: parseTime(parsedRecipe.servings),
      rating: rating || 4,
      cookingMethod,
      difficulty: 'medium' as const,
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
          <h3 className="text-xl font-bold mb-4 dark:text-gray-100">Select Ingredients</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {ingredients.map((ingredient, index) => (
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
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow dark:bg-gray-700 dark:border-gray-600 transition-colors duration-200"
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
                      onClick={() => handleGenerateRecipe(suggestion)}
                      disabled={loading && generatingFor === suggestion}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800"
                    >
                      {loading && generatingFor === suggestion ? (
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
            onClick={() => handleGenerateRecipe()}
            disabled={loading || selectedIngredients.length === 0}
          className="w-full mb-4 px-6 py-3 bg-green-500 text-white rounded-lg 
                  hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed
                    transition-colors duration-200 font-semibold text-lg flex items-center justify-center gap-2"
          >
            {loading && !generatingFor ? (
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
              <div className="bg-white rounded-xl shadow-md overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                {/* Recipe Header */}
                <div className="bg-green-600 px-6 py-4 text-white dark:bg-green-700 transition-colors duration-200">
                  <h3 className="text-2xl font-bold">{parsedRecipe.name}</h3>
                </div>
                
                {/* Recipe Info */}
                <div className="p-6">
                  {/* Recipe Quick Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 dark:bg-gray-700/50 transition-colors duration-200">
                      <AlarmClock className="h-6 w-6 text-green-600 mb-1 dark:text-green-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Prep Time</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{parsedRecipe.prepTime}</span>
                    </div>
                    <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 dark:bg-gray-700/50 transition-colors duration-200">
                      <Flame className="h-6 w-6 text-green-600 mb-1 dark:text-green-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Cook Time</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{parsedRecipe.cookTime}</span>
                    </div>
                    <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 dark:bg-gray-700/50 transition-colors duration-200">
                      <Users className="h-6 w-6 text-green-600 mb-1 dark:text-green-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Servings</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{parsedRecipe.servings}</span>
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
                      {parsedRecipe.ingredients.map((ingredient, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-md dark:bg-gray-700 transition-colors duration-200"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-800 dark:text-gray-200">{ingredient}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="mb-8">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                      <Timer className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Instructions
                    </h4>
                    <div className="space-y-4">
                      {parsedRecipe.instructions.map((instruction, index) => {
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
                      })}
                    </div>
                  </div>
                  
                  {/* Tips */}
                  {parsedRecipe.tips.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <LucideInfo className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Chef Tips
                      </h4>
                      <div className="bg-yellow-50 p-4 rounded-lg dark:bg-yellow-900/20 dark:border dark:border-yellow-900/30 transition-colors duration-200">
                        <ul className="space-y-2">
                          {parsedRecipe.tips.map((tip, index) => (
                            <li 
                              key={index} 
                              className="flex items-start gap-2 text-gray-800 dark:text-gray-200"
                            >
                              <span className="text-yellow-500">•</span>
                              {tip}
                            </li>
              ))}
            </ul>
                      </div>
          </div>
        )}

                  {/* Nutrition */}
                  {parsedRecipe.nutrition.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Nutrition Facts
                      </h4>
                      <div className="bg-blue-50 p-5 rounded-lg dark:bg-blue-900/20 dark:border dark:border-blue-900/30 transition-colors duration-200">
                        <div className="space-y-4">
                          {parsedRecipe.nutrition.map((item, index) => {
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
                                  <Banana className="h-5 w-5 text-yellow-500" />
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
                <div className="mt-2 bg-gray-50 p-4 rounded-lg dark:bg-gray-700 dark:border dark:border-gray-600 overflow-auto max-h-[300px] transition-colors duration-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{recipe}</pre>
                </div>
              </details>
            </motion.div>
        )}
      </motion.div>
      </div>
    </section>
  );
};

export default RecipeGenerator;