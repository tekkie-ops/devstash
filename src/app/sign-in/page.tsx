import { AuthCard } from "@/components/auth/AuthCard";
import { SignInForm } from "@/components/auth/SignInForm";

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    registered?: string;
    verified?: string;
    verifyError?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/dashboard";

  return (
    <AuthCard title="Sign in to DevStash" description="Welcome back — sign in to continue.">
      {params.registered === "1" ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Account created. Check your email for a verification link before signing in.
        </p>
      ) : null}
      {params.verified === "1" ? (
        <p className="mb-4 text-sm text-muted-foreground">Email verified. Sign in below.</p>
      ) : null}
      {params.verifyError === "1" ? (
        <p className="mb-4 text-sm text-destructive">
          That verification link is invalid or has expired.
        </p>
      ) : null}
      <SignInForm callbackUrl={callbackUrl} />
    </AuthCard>
  );
}
