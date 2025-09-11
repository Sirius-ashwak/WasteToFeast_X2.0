/**
 * Hugging Face Translation Service for GreenByte
 * Uses facebook/mbart-large-50-many-to-many-mmt model
 */

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  hfCode: string; // Hugging Face language code for mBART
}

export const supportedLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', hfCode: 'en_XX' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', hfCode: 'es_XX' },
  { code: 'fr', name: 'French', flag: '🇫🇷', hfCode: 'fr_XX' },
  { code: 'de', name: 'German', flag: '🇩🇪', hfCode: 'de_DE' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', hfCode: 'it_IT' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', hfCode: 'pt_XX' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', hfCode: 'ar_AR' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', hfCode: 'zh_CN' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', hfCode: 'ja_XX' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', hfCode: 'ko_KR' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', hfCode: 'hi_IN' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', hfCode: 'ta_IN' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', hfCode: 'ru_RU' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', hfCode: 'nl_XX' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪', hfCode: 'sv_SE' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮', hfCode: 'fi_FI' },
];


class HuggingFaceTranslationService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private cache: Map<string, string>;
  private isReady: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.model = 'facebook/mbart-large-50-many-to-many-mmt';
    this.cache = new Map();
    this.isReady = !!this.apiKey;
    
    if (!this.isReady) {
      console.warn('HuggingFace API key not found. Translation features will be disabled.');
    }
  }

  /**
   * Check if translation service is available
   */
  isAvailable(): boolean {
    return this.isReady;
  }

  /**
   * Translate text from source language to target language with error handling
   */
  async translateText(
    text: string, 
    targetLanguage: string, 
    sourceLanguage: string = 'en'
  ): Promise<string> {
    // Validation checks
    if (!text.trim()) return text;
    if (sourceLanguage === targetLanguage) return text;
    if (!this.apiKey) {
      console.warn('Hugging Face API key not found, returning original text');
      return text;
    }

    // Check cache first
    const cacheKey = `${sourceLanguage}-${targetLanguage}-${text.substring(0, 50)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const sourceLang = this.getLanguageByCode(sourceLanguage);
      const targetLang = this.getLanguageByCode(targetLanguage);

      if (!sourceLang || !targetLang) {
        console.warn(`Unsupported language: ${sourceLanguage} -> ${targetLanguage}`);
        return text;
      }

      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            src_lang: sourceLang.hfCode,
            tgt_lang: targetLang.hfCode,
            max_length: 512,
            do_sample: false,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Translation model is loading, please try again in a moment');
        }
        throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      let translatedText = text; // fallback

      // Handle different response formats
      if (Array.isArray(result) && result[0]?.translation_text) {
        translatedText = result[0].translation_text;
      } else if (result.translation_text) {
        translatedText = result.translation_text;
      } else if (result.generated_text) {
        translatedText = result.generated_text;
      } else {
        console.warn('Unexpected translation response format:', result);
        return text;
      }

      // Cache the result
      this.cache.set(cacheKey, translatedText);
      
      return translatedText;

    } catch (error) {
      console.error('Translation error:', error);
      
      // Return original text on error
      return text;
    }
  }

  /**
   * Translate a recipe with proper formatting preservation
   */
  async translateRecipe(recipe: string, targetLanguage: string): Promise<string> {
    if (targetLanguage === 'en' || !recipe.trim()) {
      return recipe;
    }

    try {
      // Split recipe into smaller chunks to avoid API limits
      const lines = recipe.split('\n');
      const translatedLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.trim()) {
          // Don't translate markdown headers symbols, just the text
          if (line.startsWith('#')) {
            const headerLevel = line.match(/^#+/)?.[0] || '#';
            const headerText = line.replace(/^#+\s*/, '');
            const translatedHeader = await this.translateText(headerText, targetLanguage);
            translatedLines.push(`${headerLevel} ${translatedHeader}`);
          } 
          // Don't translate bullet points, just the text
          else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
            const indent = line.match(/^\s*/)?.[0] || '';
            const bullet = line.trim().startsWith('-') ? '-' : '*';
            const bulletText = line.replace(/^\s*[-*]\s*/, '');
            const translatedText = await this.translateText(bulletText, targetLanguage);
            translatedLines.push(`${indent}${bullet} ${translatedText}`);
          }
          // Don't translate numbered lists, just the text
          else if (line.trim().match(/^\d+\./)) {
            const match = line.match(/^(\s*)(\d+\.\s*)(.*)/);
            if (match) {
              const [, indent, number, text] = match;
              const translatedText = await this.translateText(text, targetLanguage);
              translatedLines.push(`${indent}${number}${translatedText}`);
            } else {
              translatedLines.push(line);
            }
          }
          // Translate regular text
          else {
            const translatedLine = await this.translateText(line.trim(), targetLanguage);
            translatedLines.push(translatedLine);
          }
        } else {
          // Preserve empty lines
          translatedLines.push(line);
        }

        // Add small delay to avoid rate limiting
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return translatedLines.join('\n');

    } catch (error) {
      console.error('Recipe translation error:', error);
      return recipe;
    }
  }

  /**
   * Translate food listing data
   */
  async translateFoodListing(listing: any, targetLanguage: string): Promise<any> {
    if (targetLanguage === 'en' || !listing) return listing;

    try {
      const translated = { ...listing };
      
      // Translate food item name
      if (listing.food_item) {
        translated.food_item = await this.translateText(listing.food_item, targetLanguage);
      }
      
      // Translate description
      if (listing.description) {
        translated.description = await this.translateText(listing.description, targetLanguage);
      }

      // Translate dietary info
      if (listing.dietary_info && Array.isArray(listing.dietary_info)) {
        translated.dietary_info = await Promise.all(
          listing.dietary_info.map((info: string) => 
            this.translateText(info, targetLanguage)
          )
        );
      }

      // Don't translate restaurant names, but translate descriptions
      if (listing.restaurants?.description) {
        translated.restaurants = {
          ...translated.restaurants,
          description: await this.translateText(listing.restaurants.description, targetLanguage)
        };
      }

      return translated;

    } catch (error) {
      console.error('Error translating food listing:', error);
      return listing;
    }
  }

  /**
   * Translate profile data
   */
  async translateProfile(profile: any, targetLanguage: string): Promise<any> {
    if (targetLanguage === 'en' || !profile) return profile;

    try {
      const translated = { ...profile };

      // Translate bio
      if (profile.bio) {
        translated.bio = await this.translateText(profile.bio, targetLanguage);
      }

      // Translate favorite cuisines
      if (profile.favorite_cuisines && Array.isArray(profile.favorite_cuisines)) {
        translated.favorite_cuisines = await Promise.all(
          profile.favorite_cuisines.map((cuisine: string) => 
            this.translateText(cuisine, targetLanguage)
          )
        );
      }

      // Translate cooking level
      if (profile.cooking_level) {
        translated.cooking_level = await this.translateText(profile.cooking_level, targetLanguage);
      }

      return translated;

    } catch (error) {
      console.error('Error translating profile:', error);
      return profile;
    }
  }

  /**
   * Translate common UI text
   */
  async translateUIText(text: string, targetLanguage: string): Promise<string> {
    const commonTranslations: Record<string, Record<string, string>> = {
      'Bio': {
        'es': 'Biografía',
        'fr': 'Biographie',
        'de': 'Biografie',
        'it': 'Biografia',
        'pt': 'Biografia',
        'ar': 'السيرة الذاتية',
        'zh': '简介',
        'ja': 'プロフィール',
        'ko': '프로필',
        'hi': 'जीवनी',
        'ru': 'Биография',
      },
      'Favorite Cuisines': {
        'es': 'Cocinas Favoritas',
        'fr': 'Cuisines Préférées',
        'de': 'Lieblings-Küchen',
        'it': 'Cucine Preferite',
        'pt': 'Cozinhas Favoritas',
        'ar': 'المأكولات المفضلة',
        'zh': '最喜欢的菜系',
        'ja': '好きな料理',
        'ko': '좋아하는 요리',
        'hi': 'पसंदीदा व्यंजन',
        'ru': 'Любимые Кухни',
      },
      'Cooking Level': {
        'es': 'Nivel de Cocina',
        'fr': 'Niveau de Cuisine',
        'de': 'Koch-Level',
        'it': 'Livello di Cucina',
        'pt': 'Nível de Cozinha',
        'ar': 'مستوى الطبخ',
        'zh': '烹饪水平',
        'ja': '料理レベル',
        'ko': '요리 수준',
        'hi': 'खाना बनाने का स्तर',
        'ru': 'Уровень Готовки',
      }
    };

    if (commonTranslations[text] && commonTranslations[text][targetLanguage]) {
      return commonTranslations[text][targetLanguage];
    }

    return this.translateText(text, targetLanguage);
  }

  /**
   * Get language by code
   */
  private getLanguageByCode(code: string): LanguageOption | undefined {
    return supportedLanguages.find(lang => lang.code === code);
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): LanguageOption[] {
    return supportedLanguages;
  }

  /**
   * Check if translation service is available
   */
  isSupported(): boolean {
    return !!this.apiKey;
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

export const translationService = new HuggingFaceTranslationService();
export type { LanguageOption };
