# StudyBySelf - UPSC & PSC Preparation App

[![CI Pipeline](https://github.com/studybyself/app/workflows/CI%20Pipeline/badge.svg)](https://github.com/studybyself/app/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

AI-powered Progressive Web App for comprehensive UPSC and State PSC preparation with intelligent mentorship, disciplined study management, and behavioral reinforcement.

## Features

- 🤖 AI-powered subject tutors (History, Geography, Polity, Economics, Science & Tech, Ethics, Current Affairs)
- 📚 Smart study planning and timetable generation
- ⏱️ Focus mode with distraction blocking
- 📊 Performance analytics and progress tracking
- 📝 Topic-wise quizzes and full-length mock tests
- 🌐 PWA support for mobile-like experience
- 🌙 Dark theme optimized for extended study sessions
- 🔒 Secure authentication and data privacy

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with Inter font
- **Backend**: Supabase (Auth, PostgreSQL, Real-time, Storage)
- **AI**: Lovable AI Gateway (Google Gemini 2.5 Flash)
- **PWA**: Vite PWA Plugin with Workbox

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Lovable account (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id_here
```

**⚠️ SECURITY WARNING:** Never commit the `.env` file to version control. It's already in `.gitignore`.

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── layout/       # Layout components (Header, BottomNav)
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── integrations/     # External service integrations
│   └── supabase/    # Supabase client and types
├── lib/              # Utility functions and validations
├── pages/            # Application pages/routes
├── utils/            # Helper functions
└── index.css         # Global styles and design tokens

supabase/
├── functions/        # Edge functions
│   └── ai-chat/     # AI chatbot endpoint
├── migrations/       # Database migrations
└── config.toml      # Supabase configuration
```

## Development

### Running Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

## Security

This project follows security best practices:

- ✅ Row Level Security (RLS) on all database tables
- ✅ JWT authentication for API endpoints
- ✅ Input validation on client and server
- ✅ No hardcoded credentials
- ✅ Environment-based configuration

**See [SECURITY.md](./SECURITY.md) for detailed security guidelines.**

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Yes |

**Note:** The publishable key is safe for client-side use but should still be managed via environment variables.

## How to Edit This Code

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/60740f4f-0f2e-451e-a6f4-51a143c53bf1) and start prompting. Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

Clone this repo and push changes. Pushed changes will also be reflected in Lovable.

**Edit directly in GitHub**

Navigate to files, click "Edit" button, make changes and commit.

**Use GitHub Codespaces**

Click "Code" → "Codespaces" → "New codespace" to launch a cloud development environment.

## Deployment

**Frontend (via Lovable)**

Simply open [Lovable](https://lovable.dev/projects/60740f4f-0f2e-451e-a6f4-51a143c53bf1) and click Share → Publish.

**Custom Domain**

Navigate to Project > Settings > Domains and click Connect Domain. [Learn more](https://docs.lovable.dev/features/custom-domain)

**Backend (Supabase)**

Edge functions are automatically deployed via the Lovable platform.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
