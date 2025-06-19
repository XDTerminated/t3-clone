# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Database Connection Improvements

This app includes improved database connection handling to address intermittent connection issues with hosted databases like Neon:

- **Automatic retry mechanism**: Database operations automatically retry up to 3 times with exponential backoff
- **Connection pooling optimization**: Configured for better connection management
- **Health check endpoint**: Visit `/api/health` to check database connectivity
- **Enhanced error handling**: Better error messages and recovery for connection issues

### Environment Variables

For better database connection reliability with Neon, add these parameters to your `DATABASE_URL`:

```
DATABASE_URL="postgresql://username:password@host:5432/database?pgbouncer=true&connection_limit=1&pool_timeout=20&connect_timeout=60"
DIRECT_DATABASE_URL="postgresql://username:password@host:5432/database"
```

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
