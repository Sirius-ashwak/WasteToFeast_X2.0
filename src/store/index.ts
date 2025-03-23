import { create } from 'zustand';
import type { Recipe, FoodWasteData, AIAnalysisResult } from '../types';

interface AppState {
  recipes: Recipe[];
  wasteData: FoodWasteData[];
  currentAnalysis: AIAnalysisResult | null;
  isLoading: boolean;
  isDarkMode: boolean;
  setRecipes: (recipes: Recipe[]) => void;
  setWasteData: (data: FoodWasteData[]) => void;
  setCurrentAnalysis: (analysis: AIAnalysisResult | null) => void;
  setLoading: (loading: boolean) => void;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  recipes: [],
  wasteData: [],
  currentAnalysis: null,
  isLoading: false,
  isDarkMode: JSON.parse(localStorage.getItem('isDarkMode') || 'false'),
  setRecipes: (recipes) => set({ recipes }),
  setWasteData: (data) => set({ wasteData: data }),
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setLoading: (loading) => set({ isLoading: loading }),
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.isDarkMode;
      localStorage.setItem('isDarkMode', JSON.stringify(newMode));
      return { isDarkMode: newMode };
    }),
}));