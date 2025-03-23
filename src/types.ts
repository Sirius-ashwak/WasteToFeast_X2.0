export interface AIAnalysisResult {
  ingredients: string[];
  confidence: number;
  suggestions: string[];
  generatedRecipe?: string;
  error?: string;
}

export interface ImageAnalysisError {
  message: string;
  code: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  rating?: number;
  createdAt: Date;
}

export interface FoodWasteData {
  id: string;
  date: Date;
  savedIngredients: string[];
  wasteReduction: number;
}