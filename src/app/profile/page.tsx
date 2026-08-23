import Link from "next/link";

import { UserAvatar } from "@/components/auth/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;
  const name = user?.name ?? user?.email ?? "Account";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">Your account details</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <UserAvatar name={name} image={user?.image} size="lg" />
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </CardContent>
      </Card>

      <Link href="/dashboard" className="text-sm text-primary underline-offset-4 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
