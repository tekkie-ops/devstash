import Link from "next/link";

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
import { getProfileAccount } from "@/lib/db/profile";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return null;
  }

  const account = await getProfileAccount(user.id);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </header>

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
