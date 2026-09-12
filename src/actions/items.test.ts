import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createItem,
  deleteItem,
  toggleItemFavorite,
  toggleItemPin,
  updateItem,
} from "@/actions/items";

const {
  authMock,
  createItemRecordMock,
  updateItemRecordMock,
  deleteItemRecordMock,
  toggleItemFavoriteRecordMock,
  toggleItemPinRecordMock,
  r2KeyFromUrlMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  createItemRecordMock: vi.fn(),
  updateItemRecordMock: vi.fn(),
  deleteItemRecordMock: vi.fn(),
  toggleItemFavoriteRecordMock: vi.fn(),
  toggleItemPinRecordMock: vi.fn(),
  r2KeyFromUrlMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: createItemRecordMock,
  updateItem: updateItemRecordMock,
  deleteItem: deleteItemRecordMock,
  toggleItemFavorite: toggleItemFavoriteRecordMock,
  toggleItemPin: toggleItemPinRecordMock,
}));

vi.mock("@/lib/r2", () => ({
  r2KeyFromUrl: r2KeyFromUrlMock,
}));

const R2_BASE = "https://pub-test.r2.dev";

const validInput = {
  title: "Updated title",
  description: "desc",
  content: "body",
  url: null,
  language: "typescript",
  tags: ["a", "b"],
  collectionIds: ["col-1"],
};

beforeEach(() => {
  authMock.mockReset();
  createItemRecordMock.mockReset();
  updateItemRecordMock.mockReset();
  deleteItemRecordMock.mockReset();
  toggleItemFavoriteRecordMock.mockReset();
  toggleItemPinRecordMock.mockReset();
  r2KeyFromUrlMock.mockReset();
  authMock.mockResolvedValue({ user: { id: "user-1" } });
  r2KeyFromUrlMock.mockImplementation((url: string) =>
    url.startsWith(`${R2_BASE}/`) ? url.slice(R2_BASE.length + 1) : null,
  );
});

describe("createItem action", () => {
  const validCreateInput = {
    type: "snippet",
    title: "New snippet",
    description: "desc",
    content: "body",
    url: null,
    language: "typescript",
    tags: ["a", "b"],
    collectionIds: ["col-1"],
  };

  it("rejects an unauthenticated caller before touching the database", async () => {
    authMock.mockResolvedValue(null);

    const result = await createItem(validCreateInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns the Zod message when validation fails", async () => {
    const result = await createItem({ ...validCreateInput, title: "  " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown type", async () => {
    const result = await createItem({ ...validCreateInput, type: "banana" });

    expect(result.success).toBe(false);
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("rejects a file item with no uploaded file", async () => {
    const result = await createItem({
      ...validCreateInput,
      type: "image",
      content: null,
    });

    expect(result).toEqual({
      success: false,
      error: "Upload a file before saving",
    });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("passes uploaded file metadata through for a file item", async () => {
    const detail = { id: "item-file", title: "Runbook" };
    createItemRecordMock.mockResolvedValue(detail);

    const result = await createItem({
      type: "file",
      title: "Runbook",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      fileUrl: `${R2_BASE}/items/file/abc.pdf`,
      fileName: "runbook.pdf",
      fileSize: 4096,
    });

    expect(createItemRecordMock).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        type: "file",
        fileUrl: `${R2_BASE}/items/file/abc.pdf`,
        fileName: "runbook.pdf",
        fileSize: 4096,
      }),
    );
    expect(result).toEqual({ success: true, data: detail });
  });

  it("rejects a file item whose fileUrl is not under our R2 public URL", async () => {
    const result = await createItem({
      type: "image",
      title: "Hotlinked",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      fileUrl: "https://evil.example.com/tracking-pixel.png",
      fileName: "pixel.png",
      fileSize: 69,
    });

    expect(result).toEqual({ success: false, error: "Invalid file URL" });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("requires a URL for link items", async () => {
    const result = await createItem({
      ...validCreateInput,
      type: "link",
      url: "",
    });

    expect(result).toEqual({
      success: false,
      error: "URL is required for links",
    });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("passes normalized data to the query and returns the created detail", async () => {
    const detail = { id: "item-9", title: "New snippet" };
    createItemRecordMock.mockResolvedValue(detail);

    const result = await createItem({
      ...validCreateInput,
      tags: [" a ", "a", "b"],
    });

    expect(createItemRecordMock).toHaveBeenCalledWith("user-1", {
      type: "snippet",
      title: "New snippet",
      description: "desc",
      content: "body",
      url: null,
      language: "typescript",
      tags: ["a", "b"],
      collectionIds: ["col-1"],
      fileUrl: null,
      fileName: null,
      fileSize: null,
    });
    expect(result).toEqual({ success: true, data: detail });
  });

  it("surfaces a null from the query", async () => {
    createItemRecordMock.mockResolvedValue(null);

    const result = await createItem(validCreateInput);

    expect(result).toEqual({ success: false, error: "Couldn't create item" });
  });

  it("fails soft when the query throws", async () => {
    createItemRecordMock.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createItem(validCreateInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("updateItem action", () => {
  it("rejects an unauthenticated caller before touching the database", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("rejects a blank item id", async () => {
    const result = await updateItem("   ", validInput);

    expect(result).toEqual({ success: false, error: "Invalid item" });
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns the Zod message when validation fails", async () => {
    const result = await updateItem("item-1", { ...validInput, title: "  " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("passes normalized data to the query and returns the updated detail", async () => {
    const detail = { id: "item-1", title: "Updated title" };
    updateItemRecordMock.mockResolvedValue(detail);

    const result = await updateItem("item-1", {
      ...validInput,
      url: "",
      tags: [" a ", "a", "b"],
    });

    expect(updateItemRecordMock).toHaveBeenCalledWith("user-1", "item-1", {
      title: "Updated title",
      description: "desc",
      content: "body",
      url: null,
      language: "typescript",
      tags: ["a", "b"],
      collectionIds: ["col-1"],
    });
    expect(result).toEqual({ success: true, data: detail });
  });

  it("surfaces a not-found from the query", async () => {
    updateItemRecordMock.mockResolvedValue(null);

    const result = await updateItem("missing", validInput);

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("fails soft when the query throws", async () => {
    updateItemRecordMock.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("deleteItem action", () => {
  it("rejects an unauthenticated caller before touching the database", async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(deleteItemRecordMock).not.toHaveBeenCalled();
  });

  it("rejects a blank item id", async () => {
    const result = await deleteItem("   ");

    expect(result).toEqual({ success: false, error: "Invalid item" });
    expect(deleteItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns success once the query removes the row", async () => {
    deleteItemRecordMock.mockResolvedValue(true);

    const result = await deleteItem("item-1");

    expect(deleteItemRecordMock).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true });
  });

  it("surfaces a not-found when the query removes nothing", async () => {
    deleteItemRecordMock.mockResolvedValue(false);

    const result = await deleteItem("missing");

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("fails soft when the query throws", async () => {
    deleteItemRecordMock.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("toggleItemFavorite action", () => {
  it("rejects an unauthenticated caller before touching the database", async () => {
    authMock.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-1");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(toggleItemFavoriteRecordMock).not.toHaveBeenCalled();
  });

  it("rejects a blank item id", async () => {
    const result = await toggleItemFavorite("   ");

    expect(result).toEqual({ success: false, error: "Invalid item" });
    expect(toggleItemFavoriteRecordMock).not.toHaveBeenCalled();
  });

  it("returns the flipped detail from the query", async () => {
    const detail = { id: "item-1", isFavorite: true };
    toggleItemFavoriteRecordMock.mockResolvedValue(detail);

    const result = await toggleItemFavorite("item-1");

    expect(toggleItemFavoriteRecordMock).toHaveBeenCalledWith(
      "user-1",
      "item-1",
    );
    expect(result).toEqual({ success: true, data: detail });
  });

  it("surfaces a not-found from the query", async () => {
    toggleItemFavoriteRecordMock.mockResolvedValue(null);

    const result = await toggleItemFavorite("missing");

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("fails soft when the query throws", async () => {
    toggleItemFavoriteRecordMock.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await toggleItemFavorite("item-1");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("toggleItemPin action", () => {
  it("rejects an unauthenticated caller before touching the database", async () => {
    authMock.mockResolvedValue(null);

    const result = await toggleItemPin("item-1");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(toggleItemPinRecordMock).not.toHaveBeenCalled();
  });

  it("rejects a blank item id", async () => {
    const result = await toggleItemPin("   ");

    expect(result).toEqual({ success: false, error: "Invalid item" });
    expect(toggleItemPinRecordMock).not.toHaveBeenCalled();
  });

  it("returns the flipped detail from the query", async () => {
    const detail = { id: "item-1", isPinned: true };
    toggleItemPinRecordMock.mockResolvedValue(detail);

    const result = await toggleItemPin("item-1");

    expect(toggleItemPinRecordMock).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true, data: detail });
  });

  it("surfaces a not-found from the query", async () => {
    toggleItemPinRecordMock.mockResolvedValue(null);

    const result = await toggleItemPin("missing");

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("fails soft when the query throws", async () => {
    toggleItemPinRecordMock.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await toggleItemPin("item-1");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
