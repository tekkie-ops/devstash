import Link from "next/link";

import { BillingSection } from "@/components/settings/BillingSection";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { EditorPreferencesForm } from "@/components/settings/EditorPreferencesForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/auth";
import { getBillingAccount } from "@/lib/db/billing";
import { getProfileAccount } from "@/lib/db/profile";

export default async function SettingsPage({
  searchParams,
}: PageProps<"/settings">) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return null;
  }

  const { checkout } = await searchParams;
  const [account, billing] = await Promise.all([
    getProfileAccount(user.id),
    getBillingAccount(user.id),
  ]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </header>

      {checkout === "success" ? (
        <p className="rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
          You&apos;re on Pro! It may take a moment to reflect everywhere.
        </p>
      ) : null}
      {checkout === "canceled" ? (
        <p className="rounded-md border bg-muted px-4 py-2 text-sm text-muted-foreground">
          Checkout was canceled. You&apos;re still on the Free plan.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Editor preferences</CardTitle>
          <CardDescription>
            Customize the code editor used for snippets and commands. Changes save
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditorPreferencesForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your DevStash plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <BillingSection isPro={billing?.isPro ?? false} />
        </CardContent>
      </Card>

      {account?.hasPassword ? (
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Update the password used to sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all of its data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog />
        </CardContent>
      </Card>

      <Link href="/dashboard" className="text-sm text-primary underline-offset-4 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
