# Waste to Feast

A modern web application that transforms leftover ingredients into delicious meals using AI-powered recipe generation.

## Features

- **Image Analysis**: Upload images of ingredients for automatic detection
- **Recipe Generation**: Get custom recipes based on available ingredients
- **Interactive Dashboard**: View cooking statistics and efficiency metrics
- **Dark Mode**: Enjoy a comfortable viewing experience day or night

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

The application requires the following environment variables:

- `VITE_GEMINI_API_KEY`: API key for Google's Gemini AI (for image analysis and recipe generation)

## Deployment

### Render

This project is configured for deployment on Render as a static site.

1. Create a new Static Site on Render
2. Link your GitHub repository
3. Render will automatically detect the configuration from `render.yaml`
4. Add your environment variables in the Render dashboard
5. Deploy!

### Netlify

You can also deploy to Netlify:

1. Create a new site on Netlify
2. Link your GitHub repository
3. Netlify will automatically detect the configuration from `netlify.toml`
4. Add your environment variables in the Netlify dashboard
5. Deploy!

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- Google Gemini AI 