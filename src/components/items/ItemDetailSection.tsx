/**
 * Generic "labeled block" used throughout the item drawer — a small uppercase
 * heading over arbitrary content. Shared by the view-mode body
 * (ItemDrawerView.tsx) and the edit-mode read-only meta block
 * (ItemDrawerEditForm.tsx).
 */
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}
