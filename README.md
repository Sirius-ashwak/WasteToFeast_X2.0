# WasteToFeast 

**Transform Food Waste into Culinary Feasts**

WasteToFeast is a comprehensive food waste reduction platform that connects restaurants, individuals, and communities through AI-powered recipe generation and real-time food sharing. Our mission is to reduce food waste while creating delicious meals and fostering community connections.

## Key Features

### AI Recipe Generator
- **Smart Image Analysis**: Upload photos of ingredients for automatic detection using Google Gemini AI
- **Custom Recipe Generation**: Get personalized recipes based on available ingredients
- **Multi-Language Support**: Translate recipes to 16+ languages including Tamil
- **Video Integration**: Watch cooking tutorials for generated recipes
- **Nutritional Information**: Get detailed nutrition facts for each recipe

### Real-Time Food Map
- **Interactive Map**: Discover available food donations in your area using Leaflet maps
- **Live Updates**: Real-time synchronization using Supabase realtime subscriptions
- **Location-Based Search**: Find food within your preferred radius
- **Claim System**: Secure food claiming with user verification

### Restaurant Dashboard
- **Food Listing Management**: Create, edit, and manage food donations
- **Analytics & Statistics**: Track donation impact and community engagement
- **Inventory Tracking**: Monitor food quantities and expiration dates
- **Notification System**: Real-time alerts for claims and updates
- **Profile Management**: Complete restaurant information and settings

### User Dashboard
- **Browse Available Food**: Filter and search through local food donations
- **Claim History**: Track your claimed items and pickup status
- **Favorites System**: Save preferred restaurants and food types
- **Community Impact**: View your contribution to waste reduction

### Role-Based Access Control
- **Guest Access**: Browse recipes and view-only food map
- **Individual Users**: Full access to claiming food and user features
- **Restaurant Admins**: Complete restaurant management capabilities
- **Seamless Role Switching**: Easy transition between user types

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Recipe    │  │  Food Map   │  │     Profile         │  │
│  │ Generator   │  │  (Leaflet)  │  │   Management        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    State Management (Zustand)               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Google    │  │  Supabase   │  │    HuggingFace      │  │
│  │  Gemini AI  │  │  Database   │  │   Translation       │  │
│  │   (Vision)  │  │ (Realtime)  │  │      API            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive, utility-first styling
- **Framer Motion** for smooth animations and transitions
- **React Leaflet** for interactive maps
- **Zustand** for lightweight state management

**Backend & Services:**
- **Supabase** for database, authentication, and real-time subscriptions
- **Google Gemini AI** for image analysis and recipe generation
- **HuggingFace API** for multi-language translation
- **PostgreSQL** with Row Level Security (RLS)

**Key Libraries:**
- `@supabase/supabase-js` - Database and auth integration
- `@google/generative-ai` - AI-powered content generation
- `react-leaflet` - Interactive mapping components
- `react-hot-toast` - User notifications
- `lucide-react` - Modern icon library
- `recharts` - Data visualization and analytics

## Database Schema

### Core Tables
- **`users`** - User profiles and authentication
- **`restaurants`** - Restaurant information and settings
- **`food_listings`** - Available food donations
- **`claims`** - Food claim records and status
- **`user_preferences`** - User settings and preferences

### Real-time Features
- **Supabase Realtime** enabled for live updates
- **Row Level Security (RLS)** for data protection
- **Automatic timestamps** and audit trails

## Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Supabase account
- Google AI Studio API key
- HuggingFace API key (optional, for translations)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd WasteToFeast_X2.0
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
# Required - Google AI for recipe generation and image analysis
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Required - Supabase configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - HuggingFace for multi-language translation
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
```

4. **Set up Supabase database**
```bash
# Run the SQL migration in your Supabase dashboard
# File: setup-realtime-tables.sql
```

5. **Start development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:5173`

### Environment Setup Details

#### Google Gemini AI Setup
1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Create a new API key
3. Add to your `.env` file as `VITE_GEMINI_API_KEY`

#### Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API to get your URL and anon key
4. Run the provided SQL migration script
5. Enable realtime for required tables

#### HuggingFace Setup (Optional)
1. Create account at [huggingface.co](https://huggingface.co)
2. Generate API token in settings
3. Add as `VITE_HUGGINGFACE_API_KEY` for translation features

## Usage Guide

### For Guests (No Account Required)
- **Recipe Generator**: Upload ingredient photos and get AI-generated recipes
- **Food Map**: Browse available food donations (view-only)
- **Multi-language**: Translate recipes to preferred language

### For Individual Users
- **Sign Up**: Create account and complete profile
- **Browse Food**: Search and filter available donations
- **Claim Food**: Reserve items for pickup
- **Track Claims**: Monitor pickup status and history
- **Generate Recipes**: Full access to AI recipe features

### For Restaurants
- **Restaurant Registration**: Set up business profile
- **List Food**: Add available donations with details
- **Manage Inventory**: Track quantities and expiration dates
- **View Analytics**: Monitor donation impact and engagement
- **Handle Claims**: Process and confirm food pickups

## Real-time Features

The application uses Supabase realtime subscriptions for:
- **Live food availability updates**
- **Instant claim notifications**
- **Real-time map updates**
- **Cross-device synchronization**

## Multi-language Support

Supported languages include:
- English (default)
- Tamil
- Spanish, French, German
- Hindi, Bengali, Telugu
- Chinese, Japanese, Korean
- Arabic, Portuguese, Russian
- Italian, Dutch, Swedish

## Security Features

- **Row Level Security (RLS)** on all database tables
- **JWT-based authentication** via Supabase Auth
- **Role-based access control** for different user types
- **Input validation** and sanitization
- **Secure API key management**

## Performance Optimizations

- **Code splitting** with React lazy loading
- **Image optimization** and lazy loading
- **Efficient state management** with Zustand
- **Optimized database queries** with proper indexing
- **Real-time subscription management**

## Deployment

### Netlify Deployment
```bash
# Build the project
npm run build

# Deploy to Netlify (auto-detected from netlify.toml)
# Add environment variables in Netlify dashboard
```

### Render Deployment
```bash
# Auto-deployment configured via render.yaml
# Add environment variables in Render dashboard
```

### Manual Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

## Testing

```bash
# Run tests
npm run test

# Run production test
npm run test-prod

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support & Troubleshooting

### Common Issues

**API Key Missing Error:**
- Ensure all required environment variables are set
- Check `.env` file format and variable names
- Restart development server after adding variables

**Supabase Connection Issues:**
- Verify Supabase URL and anon key
- Check if realtime tables are properly configured
- Run the provided SQL migration script

**Map Not Loading:**
- Check internet connection
- Verify Leaflet CSS is properly imported
- Ensure location permissions are granted

### Getting Help
- Check the issues section for known problems
- Review the troubleshooting guide
- Contact support for technical assistance

---

**Built with to reduce food waste and build stronger communities**