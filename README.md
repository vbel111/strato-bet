# StratoBet - Sports Betting Analytics Platform

A sophisticated Next.js application that provides AI-powered sports betting analytics and bankroll management.

## Features

- 🤖 **AI-Powered Predictions**: Machine learning predictions using OpenAI GPT-4
- 📊 **Value Bet Detection**: Compare AI predictions vs bookmaker odds
- 💰 **Bankroll Management**: Track betting history, ROI, and performance
- 🏈 **Multi-Sport Support**: Traditional sports (Premier League, NFL, NBA) and esports (LoL, CS:GO)
- 📈 **Real-time Odds**: Integration with The Odds API and PandaScore
- 🔒 **Secure Authentication**: Supabase Auth with Row Level Security

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI**: OpenAI GPT-4 via AI SDK
- **UI Components**: Radix UI, shadcn/ui
- **Charts**: Recharts

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stratobet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.production.example .env.local
```

4. Update `.env.local` with your actual values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
OPENAI_API_KEY=your-openai-api-key-here  # Optional
ODDS_API_KEY=your-odds-api-key-here      # Optional
PANDASCORE_API_KEY=your-pandascore-key   # Optional
```

5. Set up Supabase database:
```bash
# Run the SQL scripts in scripts/ directory in your Supabase SQL editor
# or use the setup_database.sql file
```

6. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

### Optional (will use mock data if not provided)
- `OPENAI_API_KEY`: For AI-powered predictions
- `ODDS_API_KEY`: For real sports odds data
- `PANDASCORE_API_KEY`: For esports data

## Database Setup

The application uses Supabase (PostgreSQL) with the following main tables:
- `sports`, `leagues`, `teams`, `matches` - Sports data structure
- `predictions` - AI-generated match predictions
- `odds` - Bookmaker odds data
- `value_bets` - Calculated value betting opportunities
- `user_bankrolls` - User bankroll management
- `user_bets` - Betting history

Run the SQL scripts in the `scripts/` directory to set up your database.

## Production Deployment

### Using Docker

1. Build the Docker image:
```bash
docker build -t stratobet .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env.production stratobet
```

### Using Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Using other platforms

The app can be deployed to any platform that supports Node.js:
- Railway
- Render
- AWS/Google Cloud/Azure
- DigitalOcean App Platform

## API Integrations

### The Odds API
- Get API key from [The Odds API](https://the-odds-api.com/)
- Used for real-time sports odds data
- Falls back to mock data if not configured

### PandaScore
- Get API key from [PandaScore](https://pandascore.co/)
- Used for esports match data
- Falls back to mock data if not configured

### OpenAI
- Get API key from [OpenAI](https://platform.openai.com/)
- Used for AI-powered match predictions
- Falls back to mathematical model if not configured

## Development

### Project Structure
```
├── app/                 # Next.js App Router
├── components/          # React components
├── lib/
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Business logic services
│   ├── supabase/       # Supabase client configuration
│   └── types/          # TypeScript type definitions
├── scripts/            # Database setup scripts
└── public/             # Static assets
```

### Key Services
- `BankrollManager`: Handles user bankroll and betting operations
- `MLPredictionService`: AI-powered match predictions
- `SportsDataService`: External sports data integration
- `ValueBetCalculator`: Identifies profitable betting opportunities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
