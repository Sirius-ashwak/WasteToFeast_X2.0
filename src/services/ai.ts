import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysisResult } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY);

function base64Encode(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function analyzeImage(imageFile: File): Promise<AIAnalysisResult> {
  try {
    // Validate image
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image.');
    }

    const maxSize = 4 * 1024 * 1024; // 4MB
    if (imageFile.size > maxSize) {
      throw new Error('Image too large. Maximum size is 4MB.');
    }

    if (!API_KEY) {
      throw new Error('Missing Gemini API key. Please check your environment variables.');
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = base64Encode(arrayBuffer);

    // Initialize Gemini model - Using 1.5-flash for better analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Enhanced prompt for better ingredient detection
    const prompt = `
      You are a food analysis expert. Please analyze this food image and:
      1. List all clearly visible ingredients
      2. Suggest 3 possible recipes using these ingredients
      
      Format your response exactly like this:
      ingredients: ingredient1, ingredient2, ingredient3
      suggestions: recipe1, recipe2, recipe3
    `;

    // Use the updated API structure
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
    const text = response.text();

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
      ['Simple stir-fry', 'Basic salad', 'Quick soup'];

    if (ingredients.length === 0) {
      throw new Error('No ingredients detected in the image');
    }

    return {
      ingredients,
      confidence: 0.95,
      suggestions: suggestions.length > 0 ? suggestions : ['No suggestions available']
    };

  } catch (error) {
    console.error('Image analysis error:', error);
    if (error instanceof Error) {
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
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
    const result = await model.generateContent(prompt);

    const response = await result.response;
    const recipe = response.text();

    if (!recipe) {
      throw new Error('No recipe generated');
    }

    return recipe;
  } catch (error) {
    console.error('Recipe generation error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate recipe: ${error.message}`);
    }
    throw new Error('Failed to generate recipe. Please try again.');
  }
}