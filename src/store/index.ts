import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recipe, FoodWasteData, AIAnalysisResult } from '../types';

interface MealHistory {
  id: string;
  recipeName: string;
  ingredients: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  rating: number;
  cookingMethod: string;
  completedAt: Date;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CookingStats {
  totalMealsCooked: number;
  averagePrepTime: number;
  averageCookTime: number;
  completionRate: number;
  ingredientUtilization: number;
  favoriteMethod: string;
  totalTimeSpent: number;
}

interface AppState {
  recipes: Recipe[];
  wasteData: FoodWasteData[];
  mealHistory: MealHistory[];
  cookingStats: CookingStats;
  currentAnalysis: AIAnalysisResult | null;
  isLoading: boolean;
  isDarkMode: boolean;
  setRecipes: (recipes: Recipe[]) => void;
  setWasteData: (data: FoodWasteData[]) => void;
  addMealToHistory: (meal: Omit<MealHistory, 'id' | 'completedAt'>) => void;
  updateCookingStats: () => void;
  setCurrentAnalysis: (analysis: AIAnalysisResult | null) => void;
  setLoading: (loading: boolean) => void;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  recipes: [],
  wasteData: [],
  mealHistory: [],
  cookingStats: {
    totalMealsCooked: 0,
    averagePrepTime: 25,
    averageCookTime: 30,
    completionRate: 85,
    ingredientUtilization: 78,
    favoriteMethod: 'One-Pot',
    totalTimeSpent: 0,
  },
  currentAnalysis: null,
  isLoading: false,
  isDarkMode: JSON.parse(localStorage.getItem('isDarkMode') || 'false'),
  setRecipes: (recipes) => set({ recipes }),
  setWasteData: (data) => set({ wasteData: data }),
  addMealToHistory: (meal) => {
    const newMeal: MealHistory = {
      ...meal,
      id: Date.now().toString(),
      completedAt: new Date(),
    };
    set((state) => ({
      mealHistory: [...state.mealHistory, newMeal],
    }));
    get().updateCookingStats();
  },
  updateCookingStats: () => {
    const { mealHistory } = get();
    if (mealHistory.length === 0) return;

    const totalMeals = mealHistory.length;
    const avgPrep = Math.round(
      mealHistory.reduce((sum, meal) => sum + meal.prepTime, 0) / totalMeals
    );
    const avgCook = Math.round(
      mealHistory.reduce((sum, meal) => sum + meal.cookTime, 0) / totalMeals
    );
    const totalTime = mealHistory.reduce(
      (sum, meal) => sum + meal.prepTime + meal.cookTime,
      0
    );
    
    // Calculate completion rate (assuming some meals might be abandoned)
    const completionRate = Math.min(95, 75 + (totalMeals * 2));
    
    // Calculate ingredient utilization based on unique ingredients used
    const allIngredients = mealHistory.flatMap(meal => meal.ingredients);
    const uniqueIngredients = new Set(allIngredients);
    const utilizationRate = Math.min(95, 60 + (uniqueIngredients.size * 1.5));
    
    // Find most common cooking method
    const methodCounts = mealHistory.reduce((acc, meal) => {
      acc[meal.cookingMethod] = (acc[meal.cookingMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteMethod = Object.entries(methodCounts).reduce((a, b) =>
      methodCounts[a[0]] > methodCounts[b[0]] ? a : b
    )[0] || 'One-Pot';
    set({
      cookingStats: {
        totalMealsCooked: totalMeals,
        averagePrepTime: avgPrep,
        averageCookTime: avgCook,
        completionRate: Math.round(completionRate),
        ingredientUtilization: Math.round(utilizationRate),
        favoriteMethod,
        totalTimeSpent: totalTime,
      },
    });
  },
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setLoading: (loading) => set({ isLoading: loading }),
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.isDarkMode;
      localStorage.setItem('isDarkMode', JSON.stringify(newMode));
      return { isDarkMode: newMode };
    }),
    }),
    {
      name: 'waste-to-feast-storage',
      partialize: (state) => ({
        mealHistory: state.mealHistory,
        cookingStats: state.cookingStats,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);