# Environment Variables

This document outlines the environment variables required for GreenByte to function properly.

## Required API Keys

### 1. Hugging Face API Key
For translation services and AI model access:
```bash
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

**How to get:**
1. Visit [Hugging Face](https://huggingface.co/)
2. Create an account or sign in
3. Go to your [profile settings](https://huggingface.co/settings/tokens)
4. Create a new API token with read permissions
5. Copy the token to your `.env` file

### 2. YouTube Data API Key
For cooking video integration:
```bash
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

**How to get:**
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Copy the API key to your `.env` file

### 3. Supabase Configuration
For database and authentication:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**How to get:**
1. Visit [Supabase](https://supabase.com/)
2. Create a new project
3. Find your project URL and anon key in Settings > API
4. Add both to your `.env` file

## Environment File Template

Create a `.env` file in your project root with:

```bash
# Hugging Face API for translation services
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# YouTube Data API for cooking videos
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here

# Supabase configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Development mode settings
VITE_NODE_ENV=development
```

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and rotate them regularly
- Use different API keys for development and production
- Consider using environment variable management services for production deployments

## Translation Service Features

The Hugging Face integration provides:
- **Model**: facebook/mbart-large-50-many-to-many-mmt
- **Supported Languages**: 12 languages including English, Spanish, French, German, Italian, Portuguese, Arabic, Chinese, Japanese, Korean, Hindi, and Russian
- **Translation Types**: Recipe translation, food listing translation, and general text translation
- **Features**: Automatic language detection, batch translation, and error handling

## Troubleshooting

### Common Issues:
1. **403 Forbidden**: Check if your API key is valid and has proper permissions
2. **Rate Limiting**: Hugging Face free tier has rate limits - consider upgrading for production use
3. **Network Errors**: Ensure your API endpoints are accessible and not blocked by firewalls
4. **Translation Failures**: The service includes fallback handling for failed translations

### Testing API Keys:
1. **Hugging Face**: Use the translation service test endpoint
2. **YouTube**: Search for a simple query like "cooking"
3. **Supabase**: Check database connectivity in your browser developer tools
