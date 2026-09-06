import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token;

  return (
    <AuthCard title="Reset your password" description="Choose a new password for your account.">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-destructive">
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            Request a new one
          </Link>
        </p>
      )}
    </AuthCard>
  );
}
