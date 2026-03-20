/**
 * YouTube Video Search Service
 * Provides cooking videos related to recipes and ingredients
 */

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
}

interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
  totalResults: number;
}

class YouTubeService {
  private readonly API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

  /**
   * Search for cooking videos based on recipe name and ingredients
   */
  async searchCookingVideos(
    recipeName: string, 
    ingredients: string[] = [], 
    maxResults: number = 6
  ): Promise<YouTubeSearchResponse> {
    try {
      // If no API key, return mock data for development
      if (!this.API_KEY) {
        console.warn('YouTube API key not found, returning mock data');
        return this.getMockVideos(recipeName, ingredients);
      }

      // Build search query
      const searchTerms = [recipeName, ...ingredients.slice(0, 2), 'recipe', 'cooking'].join(' ');
      
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: searchTerms,
        type: 'video',
        maxResults: maxResults.toString(),
        videoDuration: 'medium', // 4-20 minutes
        videoDefinition: 'high',
        relevanceLanguage: 'en',
        safeSearch: 'strict',
        key: this.API_KEY,
        // Focus on cooking content
        videoCategoryId: '26' // Howto & Style category
      });

      const response = await fetch(`${this.BASE_URL}/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();

      const videos: YouTubeVideo[] = data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      })) || [];

      return {
        videos,
        totalResults: data.pageInfo?.totalResults || 0
      };

    } catch (error) {
      console.error('Error searching YouTube videos:', error);
      // Fallback to mock data on error
      return this.getMockVideos(recipeName, ingredients);
    }
  }

  /**
   * Get video statistics (views, likes, duration)
   */
  async getVideoStats(videoIds: string[]): Promise<Record<string, any>> {
    if (!this.API_KEY || videoIds.length === 0) return {};

    try {
      const params = new URLSearchParams({
        part: 'statistics,contentDetails',
        id: videoIds.join(','),
        key: this.API_KEY
      });

      const response = await fetch(`${this.BASE_URL}/videos?${params}`);
      const data = await response.json();

      const stats: Record<string, any> = {};
      data.items?.forEach((item: any) => {
        stats[item.id] = {
          viewCount: item.statistics?.viewCount,
          likeCount: item.statistics?.likeCount,
          duration: item.contentDetails?.duration,
        };
      });

      return stats;
    } catch (error) {
      console.error('Error fetching video stats:', error);
      return {};
    }
  }

  /**
   * Generate YouTube watch URL
   */
  getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  /**
   * Generate YouTube embed URL
   */
  getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0`;
  }

  /**
   * Mock data for development when API key is not available
   */
  private getMockVideos(recipeName: string, ingredients: string[]): YouTubeSearchResponse {
    const mockVideos: YouTubeVideo[] = [
      {
        id: 'dQw4w9WgXcQ',
        title: `How to Make ${recipeName} - Easy Recipe Tutorial`,
        description: `Learn how to cook ${recipeName} using ${ingredients.slice(0, 3).join(', ')} and more ingredients. Perfect for beginners!`,
        thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=320&h=180&fit=crop',
        channelTitle: 'GreenByte Cooking',
        publishedAt: new Date().toISOString(),
      },
      {
        id: 'mock-video-2',
        title: `${recipeName} Recipe - Chef's Special`,
        description: `Professional chef shows you the best way to prepare ${recipeName} with fresh ingredients.`,
        thumbnail: 'https://images.unsplash.com/photo-1556909510-50c888ff-a0ee?w=320&h=180&fit=crop',
        channelTitle: 'Professional Kitchen',
        publishedAt: new Date().toISOString(),
      },
      {
        id: 'mock-video-3',
        title: `Quick & Easy ${recipeName} in 15 Minutes`,
        description: `Fast recipe tutorial for busy weeknights using common ingredients like ${ingredients[0] || 'pantry staples'}.`,
        thumbnail: 'https://images.unsplash.com/photo-1556909065-6c3cb02cd57c?w=320&h=180&fit=crop',
        channelTitle: 'Quick Meals',
        publishedAt: new Date().toISOString(),
      },
    ];

    return {
      videos: mockVideos,
      totalResults: mockVideos.length
    };
  }
}

export const youtubeService = new YouTubeService();
export type { YouTubeVideo, YouTubeSearchResponse };
