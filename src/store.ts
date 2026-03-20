import { create } from 'zustand';
import type { AIAnalysisResult } from './types';

interface DemoProfile {
  id: string;
  name: string;
  role: 'user' | 'restaurant_admin';
  avatar: string;
  stats?: {
    foodSaved?: number;
    recipesGenerated?: number;
    donationsReceived?: number;
    donationsMade?: number;
  };
}

interface MealHistoryItem {
  id: string;
  date: string;
  ingredients: string[];
  recipes: string[];
  wasteReduced: number;
}

interface Store {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // AI Analysis
  currentAnalysis: AIAnalysisResult | null;
  setCurrentAnalysis: (analysis: AIAnalysisResult | null) => void;
  
  // Demo profiles
  demoProfiles: DemoProfile[];
  initializeDemoProfiles: () => void;
  
  // Meal history
  mealHistory: MealHistoryItem[];
  addMealToHistory: (meal: MealHistoryItem) => void;
  initializeSampleData: () => void;
}

export const useStore = create<Store>((set, get) => ({
  // Theme
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  // AI Analysis
  currentAnalysis: null,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  
  // Demo profiles
  demoProfiles: [],
  initializeDemoProfiles: () => {
    const profiles: DemoProfile[] = [
      {
        id: '1',
        name: 'Sarah Chen',
        role: 'user',
        avatar: '👩‍🍳',
        stats: {
          foodSaved: 12.5,
          recipesGenerated: 45,
          donationsReceived: 8
        }
      },
      {
        id: '2',
        name: 'Green Garden Cafe',
        role: 'restaurant_admin',
        avatar: '🌱',
        stats: {
          donationsMade: 23,
          foodSaved: 156.7
        }
      },
      {
        id: '3',
        name: 'Mike Johnson',
        role: 'user',
        avatar: '👨‍💼',
        stats: {
          foodSaved: 8.2,
          recipesGenerated: 32,
          donationsReceived: 5
        }
      }
    ];
    set({ demoProfiles: profiles });
  },
  
  // Meal history
  mealHistory: [],
  addMealToHistory: (meal) => {
    set((state) => ({
      mealHistory: [meal, ...state.mealHistory.slice(0, 9)] // Keep last 10 meals
    }));
  },
  
  initializeSampleData: () => {
    const sampleMeals: MealHistoryItem[] = [
      {
        id: '1',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        ingredients: ['tomatoes', 'onions', 'garlic'],
        recipes: ['Tomato Pasta', 'Vegetable Stir Fry'],
        wasteReduced: 0.5
      },
      {
        id: '2',
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        ingredients: ['carrots', 'potatoes', 'herbs'],
        recipes: ['Roasted Vegetables', 'Herb Soup'],
        wasteReduced: 0.8
      },
      {
        id: '3',
        date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        ingredients: ['bread', 'eggs', 'milk'],
        recipes: ['French Toast', 'Bread Pudding'],
        wasteReduced: 0.3
      }
    ];
    
    set({ mealHistory: sampleMeals });
  }
}));
