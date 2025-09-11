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
  demoProfiles: {
    user: any;
    restaurant: any;
  };
  setRecipes: (recipes: Recipe[]) => void;
  setWasteData: (data: FoodWasteData[]) => void;
  addMealToHistory: (meal: Omit<MealHistory, 'id' | 'completedAt'>) => void;
  updateCookingStats: () => void;
  setCurrentAnalysis: (analysis: AIAnalysisResult | null) => void;
  setLoading: (loading: boolean) => void;
  toggleDarkMode: () => void;
  initializeSampleData: () => void;
  initializeDemoProfiles: () => void;
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
  demoProfiles: {
    user: null,
    restaurant: null,
  },
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
  initializeSampleData: () => {
    const sampleMeals: MealHistory[] = [
      {
        id: '1',
        recipeName: 'Spaghetti Carbonara',
        ingredients: ['pasta', 'eggs', 'bacon', 'parmesan'],
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        rating: 5,
        cookingMethod: 'One-Pot',
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        difficulty: 'medium',
      },
      {
        id: '2',
        recipeName: 'Chicken Stir Fry',
        ingredients: ['chicken', 'vegetables', 'soy sauce', 'ginger'],
        prepTime: 20,
        cookTime: 15,
        servings: 3,
        rating: 4,
        cookingMethod: 'Stir Fry',
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        difficulty: 'easy',
      },
      {
        id: '3',
        recipeName: 'Quinoa Salad Bowl',
        ingredients: ['quinoa', 'cucumber', 'tomatoes', 'feta'],
        prepTime: 10,
        cookTime: 0,
        servings: 2,
        rating: 4,
        cookingMethod: 'No Cook',
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        difficulty: 'easy',
      },
      {
        id: '4',
        recipeName: 'Vegetable Soup',
        ingredients: ['carrots', 'celery', 'onion', 'broth'],
        prepTime: 25,
        cookTime: 45,
        servings: 6,
        rating: 5,
        cookingMethod: 'Stovetop',
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        difficulty: 'medium',
      },
      {
        id: '5',
        recipeName: 'Sheet Pan Salmon',
        ingredients: ['salmon', 'broccoli', 'potatoes', 'olive oil'],
        prepTime: 12,
        cookTime: 25,
        servings: 4,
        rating: 5,
        cookingMethod: 'Sheet Pan',
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        difficulty: 'easy',
      },
      {
        id: '6',
        recipeName: 'Pasta Primavera',
        ingredients: ['pasta', 'zucchini', 'bell peppers', 'olive oil'],
        prepTime: 18,
        cookTime: 22,
        servings: 4,
        rating: 4,
        cookingMethod: 'One-Pot',
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        difficulty: 'medium',
      },
      {
        id: '7',
        recipeName: 'Mediterranean Wrap',
        ingredients: ['tortilla', 'hummus', 'vegetables', 'olives'],
        prepTime: 8,
        cookTime: 0,
        servings: 2,
        rating: 4,
        cookingMethod: 'No Cook',
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        difficulty: 'easy',
      },
      {
        id: '8',
        recipeName: 'Lentil Curry',
        ingredients: ['lentils', 'coconut milk', 'spices', 'onion'],
        prepTime: 15,
        cookTime: 35,
        servings: 5,
        rating: 5,
        cookingMethod: 'Stovetop',
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        difficulty: 'medium',
      },
      {
        id: '9',
        recipeName: 'Caesar Salad',
        ingredients: ['lettuce', 'croutons', 'parmesan', 'dressing'],
        prepTime: 12,
        cookTime: 0,
        servings: 3,
        rating: 4,
        cookingMethod: 'No Cook',
        completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        difficulty: 'easy',
      },
      {
        id: '10',
        recipeName: 'Mushroom Risotto',
        ingredients: ['rice', 'mushrooms', 'broth', 'parmesan'],
        prepTime: 20,
        cookTime: 40,
        servings: 4,
        rating: 5,
        cookingMethod: 'Stovetop',
        completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        difficulty: 'hard',
      },
      {
        id: '11',
        recipeName: 'Thai Green Curry',
        ingredients: ['coconut milk', 'curry paste', 'vegetables', 'basil'],
        prepTime: 25,
        cookTime: 30,
        servings: 4,
        rating: 5,
        cookingMethod: 'One-Pot',
        completedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        difficulty: 'medium',
      },
      {
        id: '12',
        recipeName: 'Caprese Sandwich',
        ingredients: ['bread', 'mozzarella', 'tomatoes', 'basil'],
        prepTime: 5,
        cookTime: 0,
        servings: 2,
        rating: 4,
        cookingMethod: 'No Cook',
        completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        difficulty: 'easy',
      },
      {
        id: '13',
        recipeName: 'Vegetable Stir Fry',
        ingredients: ['mixed vegetables', 'garlic', 'ginger', 'soy sauce'],
        prepTime: 15,
        cookTime: 12,
        servings: 3,
        rating: 4,
        cookingMethod: 'Stir Fry',
        completedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        difficulty: 'easy',
      },
      {
        id: '14',
        recipeName: 'Tomato Basil Pasta',
        ingredients: ['pasta', 'tomatoes', 'basil', 'garlic'],
        prepTime: 10,
        cookTime: 18,
        servings: 4,
        rating: 4,
        cookingMethod: 'One-Pot',
        completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        difficulty: 'easy',
      },
      {
        id: '15',
        recipeName: 'Greek Salad',
        ingredients: ['cucumber', 'tomatoes', 'olives', 'feta'],
        prepTime: 8,
        cookTime: 0,
        servings: 3,
        rating: 4,
        cookingMethod: 'No Cook',
        completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        difficulty: 'easy',
      }
    ];

    set((state) => ({
      mealHistory: [...state.mealHistory, ...sampleMeals.filter(meal => 
        !state.mealHistory.some(existing => existing.id === meal.id)
      )]
    }));
    
    // Update cooking stats after adding sample data
    get().updateCookingStats();
  },
  initializeDemoProfiles: () => {
    const demoUser = {
      id: 'demo-user-123',
      username: 'foodie_sarah',
      full_name: 'Sarah Johnson',
      role: 'user',
      phone: '+1 (555) 123-4567',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      email: 'sarah.johnson@example.com',
      bio: 'Passionate home cook and sustainability advocate. Love turning leftovers into gourmet meals!',
      location: 'San Francisco, CA',
      favorite_cuisines: ['Italian', 'Asian', 'Mediterranean'],
      cooking_level: 'Intermediate',
      dietary_preferences: ['Vegetarian-friendly', 'Organic when possible'],
    };

    const demoRestaurant = {
      id: 'demo-restaurant-456',
      username: 'greenbite_sf',
      full_name: 'Marcus Chen',
      role: 'restaurant_admin',
      phone: '+1 (555) 987-6543',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      email: 'marcus@greenbite.com',
      bio: 'Owner of Green Bite Café. Committed to reducing food waste and supporting our community.',
      restaurant_info: {
        name: 'Green Bite Café',
        address: '123 Mission Street, San Francisco, CA 94103',
        cuisine_type: 'Farm-to-Table American',
        established: '2019',
        specialties: ['Organic Salads', 'Artisan Sandwiches', 'Fresh Soups'],
        sustainability_practices: [
          'Zero-waste kitchen',
          'Local sourcing',
          'Compostable packaging',
          'Community food sharing'
        ],
        operating_hours: 'Mon-Fri: 7AM-8PM, Sat-Sun: 8AM-9PM',
        certifications: ['Organic Certified', 'Green Business Certified'],
      },
      impact_stats: {
        meals_shared: 1247,
        waste_prevented: '2,340 lbs',
        community_members_helped: 892,
        months_active: 18,
      }
    };

    set({
      demoProfiles: {
        user: demoUser,
        restaurant: demoRestaurant,
      }
    });
  },
    }),
    {
      name: 'greenbyte-storage',
      partialize: (state) => ({
        mealHistory: state.mealHistory,
        cookingStats: state.cookingStats,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);