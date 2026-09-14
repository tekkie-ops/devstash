import { BRAND_GRADIENT, ITEM_TYPE_COLORS } from "@/components/homepage/item-colors";

const SIDEBAR_COLORS = [
  ITEM_TYPE_COLORS.snippet,
  ITEM_TYPE_COLORS.prompt,
  ITEM_TYPE_COLORS.command,
  ITEM_TYPE_COLORS.note,
  ITEM_TYPE_COLORS.link,
];

const CARD_COLORS = [
  ITEM_TYPE_COLORS.snippet,
  ITEM_TYPE_COLORS.prompt,
  ITEM_TYPE_COLORS.command,
  ITEM_TYPE_COLORS.note,
  ITEM_TYPE_COLORS.image,
  ITEM_TYPE_COLORS.link,
];

export function DashboardPreview() {
  return (
    <div className="w-full lg:max-w-[420px] lg:flex-1">
      <p className="mb-2.5 text-center text-sm font-medium text-muted-foreground/70">
        ...with DevStash
      </p>
      <div className="flex h-80 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex w-19 shrink-0 flex-col gap-2.5 border-r border-border bg-secondary/60 p-3.5">
          <div
            className="mb-2 size-5.5 rounded-md"
            style={{ background: BRAND_GRADIENT }}
          />
          {SIDEBAR_COLORS.map((color, i) => (
            <div
              key={i}
              className="h-2 w-full rounded-full opacity-55"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-3.5 flex-1 rounded border border-border bg-secondary/60" />
            <div
              className="size-4 shrink-0 rounded-full"
              style={{ background: BRAND_GRADIENT }}
            />
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2.5">
            {CARD_COLORS.map((color, i) => (
              <div
                key={i}
                className="flex flex-col justify-center gap-1.5 rounded-lg border border-border bg-secondary/60 p-2.5"
                style={{ borderTopColor: color, borderTopWidth: 3 }}
              >
                <div
                  className="h-1.5 w-2/3 rounded-sm opacity-75"
                  style={{ backgroundColor: color }}
                />
                <div className="h-1 w-11/12 rounded-sm bg-border" />
                <div className="h-1 w-1/2 rounded-sm bg-border" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
