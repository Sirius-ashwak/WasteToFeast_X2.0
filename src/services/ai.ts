import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysisResult } from '../types';

// Utility function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 5000, // 5 seconds base delay for rate limits
  maxDelay: 60000, // 60 seconds max delay
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not defined in environment variables');
} else {
  console.log('Gemini API key loaded:', API_KEY.substring(0, 10) + '...');
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error?.message || '';
    const isRetryableError =
      msg.includes('overloaded') ||
      msg.includes('503') ||
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('quota exceeded') ||
      msg.includes('Too Many Requests');

    if (retries > 0 && isRetryableError) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * (RETRY_CONFIG.maxRetries - retries + 1),
        RETRY_CONFIG.maxDelay
      );
      console.log(`API rate limited / overloaded, retrying in ${delay}ms... (${retries} retries left)`);
      await wait(delay);
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
}

export async function analyzeImage(imageFile: File): Promise<AIAnalysisResult> {
  try {
    // Validate image
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image.');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error('Image too large. Maximum size is 5MB.');
    }

    if (!API_KEY) {
      throw new Error('Missing Gemini API key. Please check your environment variables.');
    }

    // Convert image to base64 using FileReader for proper encoding
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(imageFile);
    });

    // Initialize Gemini model - Using 2.0-flash for better analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Enhanced prompt for better ingredient detection
    const prompt = `
      You are a professional food analysis expert. Analyze this food image carefully and:
      1. Identify ALL clearly visible food ingredients, items, and components
      2. Be specific (e.g., "red bell pepper" not just "pepper")
      3. Include herbs, spices, and seasonings if visible
      4. Suggest 3-5 realistic recipes using these ingredients
      
      IMPORTANT: Format your response EXACTLY like this:
      ingredients: ingredient1, ingredient2, ingredient3
      suggestions: recipe1, recipe2, recipe3, recipe4, recipe5
    `;

    // Wrap the full generateContent call in retryWithBackoff so rate-limit errors are retried
    const text = await retryWithBackoff(async () => {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: imageFile.type,
            data: base64Image
          }
        }
      ]);
      const response = await result.response;
      return response.text();
    });

    if (!text) {
      throw new Error('No analysis results received');
    }

    // Parse the response with improved error handling
    const ingredientsMatch = text.match(/ingredients:(.*?)(\n|$)/i);
    const suggestionsMatch = text.match(/suggestions:(.*?)(\n|$)/i);

    if (!ingredientsMatch) {
      console.warn('Non-standard response format:', text);
      throw new Error('Invalid response format: ingredients not found');
    }

    const ingredients = ingredientsMatch[1]
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);

    const suggestions = suggestionsMatch ? 
      suggestionsMatch[1]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean) :
      ['Simple stir-fry', 'Basic salad', 'Quick soup', 'One-pot meal'];

    if (ingredients.length === 0) {
      throw new Error('No food ingredients detected. Please upload a clearer image of food items.');
    }

    return {
      ingredients,
      confidence: Math.min(0.95, 0.7 + (ingredients.length * 0.05)),
      suggestions: suggestions.length > 0 ? suggestions : ['No suggestions available']
    };

  } catch (error) {
    console.error('Image analysis error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error,
      error: error
    });
    
    if (error instanceof Error) {
      if (error.message.includes('overloaded') || error.message.includes('503')) {
        throw new Error('Google\'s AI service is currently overloaded due to high demand. The app will automatically retry, or you can try again in 10-15 minutes.');
      }
      if (
        error.message.includes('rate limit') ||
        error.message.includes('429') ||
        error.message.includes('RESOURCE_EXHAUSTED') ||
        error.message.includes('Too Many Requests')
      ) {
        throw new Error('Rate limit exceeded. The free Gemini API allows 15 requests/minute. Please wait 1 minute and try again.');
      }
      if (error.message.includes('quota')) {
        throw new Error('Daily API quota exceeded. Please try again tomorrow or upgrade your Gemini API plan.');
      }
      if (error.message.includes('API key')) {
        throw new Error('AI service configuration issue. Please check the API key settings.');
      }
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('API access denied. Please verify your Gemini API key has the necessary permissions.');
      }
      if (error.message.includes('403')) {
        throw new Error('API access forbidden. Your API key may have insufficient permissions or quota exceeded.');
      }
      throw new Error(`Analysis failed: ${error.message}`);
    }
    throw new Error('Failed to analyze image. Please try again.');
  }
}

export async function generateRecipe(ingredients: string[]): Promise<string> {
  try {
    if (!ingredients || ingredients.length === 0) {
      throw new Error('No ingredients provided for recipe generation');
    }

    if (!API_KEY) {
      throw new Error('Missing Gemini API key. Please check your environment variables.');
    }

    // Check if there's a specific dish name request
    let specificDish = null;
    const filteredIngredients = ingredients.filter(ing => {
      if (ing.toLowerCase().startsWith('dish name:')) {
        specificDish = ing.substring('dish name:'.length).trim();
        return false;
      }
      return true;
    });

    // Use the more capable model for recipe generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Create a more targeted prompt based on whether a specific dish was requested
    const prompt = specificDish 
      ? `
        Create a detailed recipe for "${specificDish}" using these ingredients: ${filteredIngredients.join(', ')}
        
        You must follow this EXACT format in your response:
        
        Recipe Name: ${specificDish}
        Preparation Time: [time in minutes]
        Cooking Time: [time in minutes]
        Servings: [number]
        
        Ingredients:
        - [ingredient 1 with quantity]
        - [ingredient 2 with quantity]
        - [continue for all ingredients]
        
        Instructions:
        1. [first step]
        2. [second step]
        3. [continue for all steps]
        
        Tips:
        - [cooking tip 1]
        - [cooking tip 2]
        
        Nutrition Facts:
        - Calories: [amount]
        - Protein: [amount]
        - Carbs: [amount]
        - Fat: [amount]
      `
      : `
        Create a detailed recipe using these ingredients: ${ingredients.join(', ')}
        
        You must follow this EXACT format in your response:
        
        Recipe Name: [name of dish]
        Preparation Time: [time in minutes]
        Cooking Time: [time in minutes]
        Servings: [number]
        
        Ingredients:
        - [ingredient 1 with quantity]
        - [ingredient 2 with quantity]
        - [continue for all ingredients]
        
        Instructions:
        1. [first step]
        2. [second step]
        3. [continue numbering for all steps]
        
        Tips:
        - [cooking tip 1]
        - [cooking tip 2]
        
        Nutrition Facts:
        - Calories: [amount]
        - Protein: [amount]
        - Carbs: [amount]
        - Fat: [amount]
      `;

    // Add safety settings and temperature to control output
    const recipeFunction = async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    };

    const recipe = await retryWithBackoff(recipeFunction);

    if (!recipe) {
      throw new Error('No recipe generated');
    }

    return recipe;
  } catch (error) {
    console.error('Recipe generation error:', error);
    if (error instanceof Error) {
      if (error.message.includes('overloaded') || error.message.includes('503')) {
        throw new Error('The AI service is currently busy. Please try again in a few moments.');
      }
      if (
        error.message.includes('RESOURCE_EXHAUSTED') ||
        error.message.includes('429') ||
        error.message.includes('rate limit') ||
        error.message.includes('Too Many Requests')
      ) {
        throw new Error('Rate limit exceeded. The free Gemini API allows 15 requests/minute. Please wait 1 minute and try again.');
      }
      throw new Error(`Failed to generate recipe: ${error.message}`);
    }
    throw new Error('Failed to generate recipe. Please try again.');
  }
}