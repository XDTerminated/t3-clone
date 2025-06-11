"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SSOCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Preload the home page for faster navigation after authentication
    router.prefetch("/");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <div className="text-foreground">Completing sign-in...</div>
      </div>
      <AuthenticateWithRedirectCallback afterSignInUrl="/" afterSignUpUrl="/" />
    </div>
  );
}
