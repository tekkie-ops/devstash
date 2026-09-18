import Link from "next/link";

import { UserAvatar } from "@/components/auth/UserAvatar";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { getProfileAccount, getProfileStats } from "@/lib/db/profile";

/** Fixed to UTC so the server and client render the same string. */
const joinDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return null;
  }

  const name = user.name ?? user.email ?? "Account";
  const [account, stats] = await Promise.all([
    getProfileAccount(user.id),
    getProfileStats(user.id),
  ]);

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
          <UserAvatar name={name} image={user.image} size="lg" />
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            {account ? (
              <span className="text-xs text-muted-foreground">
                Member since {joinDateFormatter.format(account.createdAt)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ProfileStats stats={stats} />

      <Link href="/dashboard" className="text-sm text-primary underline-offset-4 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
