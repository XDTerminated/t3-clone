"use client";

import { ClerkLoaded, ClerkLoading, SignIn, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // User is already signed in, redirect to home
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  // Don't render SignIn if user is already signed in
  if (isLoaded && isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-foreground">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <ClerkLoading>
        <div className="text-foreground">Loading...</div>
      </ClerkLoading>{" "}
      <ClerkLoaded>
        <SignIn
          forceRedirectUrl="/"
          signUpUrl="/sign-in"
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-primary-foreground",
              card: "bg-card text-card-foreground",
            },
          }}
        />
      </ClerkLoaded>
    </div>
  );
}
