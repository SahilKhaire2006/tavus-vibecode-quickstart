# Tavus Interview Chat Application

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Tavus API account with credits

### Local Development Setup

1. **Clone/Download the project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Tavus API credentials

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   - Go to `http://localhost:5173`

## 🔧 Environment Variables

Create a `.env` file with:
```
VITE_TAVUS_API_TOKEN=your_api_token_here
VITE_PERSONA_ID=p25e042a1eb6
VITE_REPLICA_ID=rf4703150052
```

## 📦 Deployment on Vercel

### Step 1: Prepare GitHub Repository
1. Create new repository on GitHub
2. Upload all project files
3. Commit and push changes

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variables in Vercel dashboard
7. Click "Deploy"

## 🛠️ Troubleshooting

### Common Issues:
- **Invalid persona_id**: Check your Tavus account for correct persona ID
- **Out of credits**: Top up your Tavus account
- **Video not loading**: Check browser permissions for camera/microphone

### Build Errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building
npm run build
```

## 📋 API Credentials

Current configuration:
- Persona ID: `p25e042a1eb6`
- Replica ID: `rf4703150052`
- API Token: Enter your own token in the app

## 🎯 Features

- Real-time AI video interviews
- Dynamic conversation guidelines
- Interview performance tracking
- PDF transcript export
- Professional interview interface