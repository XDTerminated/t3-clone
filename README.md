# AI Chat Application

A modern, theme-aware AI chat application built with the [T3 Stack](https://create.t3.gg/), featuring multiple AI model integrations, file upload capabilities, and a beautiful responsive UI.

## 🚀 Features

### 🤖 AI Model Integrations (Keys Required)

- **Google Gemini Models**: Direct Google SDK integration with latest models

  - Gemini 2.0 Flash (search capabilities)
  - Gemini 2.0 Flash Thinking (reasoning, thinking)
  - Gemini 2.0 Flash Image Generation (image creation)
  - Gemini 2.5 Flash (vision, search, PDF, files, thinking)
  - Gemini 2.5 Pro (vision, search, PDF, files, reasoning, thinking)

- **Groq Models**:

  - DeepSeek R1 Distill Llama 70B (reasoning, thinking)
  - Llama 4 Maverick 17B
  - Qwen 3 32B (reasoning, thinking)

- **OpenRouter Models**:
  - Claude 3.5 Sonnet & Claude 4 Sonnet (vision, files, reasoning)
  - DeepSeek Chat V3 & R1 (reasoning)
  - GPT-4o (vision, files, reasoning)

### 📁 File Upload & Vision

- **PDF Document Support**: Upload and analyze PDF files (Gemini models)
- **Image Analysis**: Upload and analyze images with vision-capable models
- **File History**: All uploaded files are preserved in conversation history
- **Smart File Handling**: Automatic file type detection and processing

### 🎨 Theme System

- **Rose Red Theme**: Elegant gradient-based design (default)
- **Midnight Black Theme**: Dark theme (under development)
- **Theme-aware Components**: All UI elements adapt to selected theme
- **Consistent Color System**: CSS variables ensure perfect color consistency

### 💬 Chat Features

- **Real-time Conversations**: Smooth, responsive chat interface
- **Message History**: Persistent chat storage with Prisma
- **Chat Sharing**: Share conversations with secure tokens
- **Markdown Support**: Rich text rendering with syntax highlighting
- **Code Blocks**: Syntax highlighting for multiple programming languages

### 🔐 Authentication & Security

- **Clerk Authentication**: Secure user management with multiple providers
- **Environment Validation**: Type-safe environment variable handling
- **Secure File Upload**: UploadThing integration for safe file handling

## 🛠 Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Database**: [Prisma](https://prisma.io) with PostgreSQL
- **Authentication**: [Clerk](https://clerk.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) with custom themes
- **File Upload**: [UploadThing](https://uploadthing.com)
- **AI SDKs**: Google Generative AI, OpenRouter API
- **Type Safety**: [TypeScript](https://typescriptlang.org) with [Zod](https://zod.dev)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (recommend [Neon](https://neon.tech) for hosting)
- Google AI API key for Gemini models
- Clerk account for authentication
- UploadThing account for file uploads
- (Optional) OpenRouter API key for additional models

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd t3-clone
pnpm install
```

### 2. Environment Setup

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env
```

Required environment variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database?pgbouncer=true&connection_limit=1&pool_timeout=20&connect_timeout=60"
DIRECT_DATABASE_URL="postgresql://username:password@host:5432/database"

# Authentication (Clerk)
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# AI Models
GEMINI_API_KEY="AIza..."

# File Upload (UploadThing)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_TOKEN="eyJ..."

# Optional - Additional AI Models
OPENROUTER_API_KEY="sk-or-..."
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate deploy

# (Optional) Open Prisma Studio to view data
pnpm prisma studio
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

For deployment guides on other platforms, see the [T3 Stack deployment documentation](https://create.t3.gg/en/deployment).

## 📝 Environment Variables Reference

| Variable                            | Required | Description                                          |
| ----------------------------------- | -------- | ---------------------------------------------------- |
| `DATABASE_URL`                      | ✅       | PostgreSQL connection string with pooling parameters |
| `DIRECT_DATABASE_URL`               | ✅       | Direct PostgreSQL URL (for migrations)               |
| `CLERK_SECRET_KEY`                  | ✅       | Clerk authentication secret key                      |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅       | Clerk publishable key (public)                       |
| `GEMINI_API_KEY`                    | ✅       | Google AI API key for Gemini models                  |
| `UPLOADTHING_SECRET`                | ✅       | UploadThing secret key for file uploads              |
| `UPLOADTHING_TOKEN`                 | ✅       | UploadThing authentication token                     |
| `OPENROUTER_API_KEY`                | ❌       | OpenRouter API key (for additional models)           |

## 🗄️ Database Connection Improvements

This app includes enhanced database connection handling for hosted databases like Neon:

- **Automatic retry mechanism**: Database operations retry up to 3 times with exponential backoff
- **Connection pooling optimization**: Configured for better connection management
- **Health check endpoint**: Visit `/api/health` to check database connectivity
- **Enhanced error handling**: Better error messages and recovery for connection issues

## 🧪 Development

### Available Scripts

- `pnpm dev` - Start development server with Turbo
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript compiler check
- `pnpm format:check` - Check code formatting
- `pnpm format:write` - Format code with Prettier

### Project Structure

```
src/
├── app/                 # Next.js app router pages and API routes
│   ├── api/            # API endpoints (chat, share, uploadthing, etc.)
│   └── share/          # Public chat sharing pages
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── lexical/       # Rich text editor components
├── contexts/          # React contexts (Theme, Chat, Model, etc.)
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries (openrouter, prisma, etc.)
└── styles/            # Global CSS and theme variables
```

### Adding New AI Models

1. Add model configuration to `src/lib/openrouter.ts`
2. Update the chat API route in `src/app/api/chat/route.ts`
3. Add any special handling for model capabilities

### Theme Customization

Theme variables are defined in `src/styles/globals.css`. To add new themes:

1. Define CSS variables in the `:root` selector
2. Update `src/contexts/ThemeContext.tsx`
3. Add theme option to theme selector component

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [T3 Stack Documentation](https://create.t3.gg/)
- [Prisma Documentation](https://prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Clerk Authentication](https://clerk.com/docs)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [GitHub Issues](https://github.com/your-repo/issues)
2. Join the [T3 Stack Discord](https://t3.gg/discord)
3. Review the documentation links above

---

Built with ❤️ using the T3 Stack
