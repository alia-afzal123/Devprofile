# DevProfile

DevProfile is an AI-powered developer profile analysis platform that helps developers evaluate and improve their professional presence across their Resume, GitHub, and Portfolio.

The platform analyzes each profile independently, identifies weaknesses, provides actionable improvements, and includes AI-powered copilots for contextual guidance.

## Features

- Resume Analyzer — analyzes uploaded resumes and provides structured scoring, weaknesses, and improvement suggestions.
- GitHub Analyzer — evaluates GitHub profiles and repositories using real GitHub data.
- Portfolio Analyzer — analyzes live developer portfolio websites and provides improvement recommendations.
- AI Copilot — provides contextual guidance based on analysis results.
- Analysis History — stores previous analyses for each authenticated user.
- User Authentication — secure signup, login, password recovery, and protected routes.
- Personal Dashboard — displays the latest Resume, GitHub, and Portfolio analysis results.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- React Router
- CSS
- Axios

### Backend & Database
- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Edge Functions
- Row Level Security (RLS)

### AI & External Services
- Groq
- Google Gemini
- GitHub REST API
- Browserless

## How It Works

1. Create an account or log in.
2. Choose Resume, GitHub, or Portfolio Analyzer.
3. Submit the required profile information.
4. DevProfile processes the data using backend services and AI models.
5. Receive category scores, weaknesses, and actionable recommendations.
6. Ask the AI Copilot follow-up questions about the analysis.
7. Previous analyses are securely stored in History.

## Security

DevProfile uses Supabase Authentication and PostgreSQL Row Level Security to isolate user data.

Sensitive API keys and service credentials are stored server-side and are never exposed through the frontend repository.

## Local Development

Clone the repository:

```bash
git clone https://github.com/alia-afzal123/Devprofile.git
cd devprofile