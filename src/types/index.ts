export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FoodWasteData {
  date: string;
  amount: number;
  category: string;
}

export interface AIAnalysisResult {
  ingredients: string[];
  confidence: number;
  suggestions: string[];
}