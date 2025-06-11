"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GoogleSignInPage() {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // If user is already signed in, redirect immediately
    if (isSignedIn) {
      router.replace("/");
      return;
    }

    const initiateGoogleSignIn = async () => {
      if (!isLoaded || !signIn) return;

      try {
        // Start the OAuth flow with Google - use replace for faster navigation
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sign-in/sso-callback",
          redirectUrlComplete: "/",
        });
      } catch (error) {
        console.error("Google sign-in error:", error);
        setError(
          "Failed to start Google sign-in. Redirecting to sign-in page...",
        );
        // Fallback to regular sign-in page after a delay
        setTimeout(() => {
          window.location.replace("/sign-in");
        }, 1500); // Reduced delay
      }
    };

    // Reduce delay before initiating sign-in
    const timer = setTimeout(() => {
      void initiateGoogleSignIn();
    }, 50);

    return () => clearTimeout(timer);
  }, [isLoaded, signIn, isSignedIn, router]);

  if (isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-foreground">Already signed in. Redirecting...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-destructive text-center">
          <div className="mb-4">{error}</div>
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-foreground">
        <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
        Redirecting to Google...
      </div>
    </div>
  );
}
