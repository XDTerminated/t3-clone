import { clerkMiddleware } from "@clerk/nextjs/server";

// For now, we're not protecting any routes - keeping the main page public
// When you need to protect routes in the future, you can use createRouteMatcher
const middleware = clerkMiddleware();

export default middleware;

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
