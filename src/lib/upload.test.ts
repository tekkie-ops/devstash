import { describe, expect, it } from "vitest";

import {
  acceptAttr,
  buildObjectKey,
  fileExtension,
  formatFileSize,
  UPLOAD_CONSTRAINTS,
  validateUploadFile,
} from "@/lib/upload";

describe("fileExtension", () => {
  it("returns the lowercased extension including the dot", () => {
    expect(fileExtension("Report.PDF")).toBe(".pdf");
    expect(fileExtension("archive.tar.gz")).toBe(".gz");
  });

  it("returns an empty string when there is no usable extension", () => {
    expect(fileExtension("README")).toBe("");
    expect(fileExtension(".gitignore")).toBe("");
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(20 * 1024)).toBe("20 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10 MB");
  });
});

describe("validateUploadFile", () => {
  it("accepts an in-spec image", () => {
    expect(
      validateUploadFile("image", {
        name: "diagram.png",
        size: 1024,
        type: "image/png",
      }),
    ).toEqual({ ok: true });
  });

  it("accepts a text file whose browser MIME type is blank or generic", () => {
    for (const type of ["", "application/octet-stream"]) {
      expect(
        validateUploadFile("file", { name: "notes.md", size: 10, type }),
      ).toEqual({ ok: true });
    }
  });

  it("rejects a disallowed extension", () => {
    const result = validateUploadFile("file", {
      name: "malware.exe",
      size: 10,
      type: "application/octet-stream",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an extension that is valid for the other kind", () => {
    const result = validateUploadFile("image", {
      name: "data.csv",
      size: 10,
      type: "text/csv",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a mismatched, non-generic MIME type", () => {
    const result = validateUploadFile("image", {
      name: "diagram.png",
      size: 10,
      type: "application/zip",
    });
    expect(result).toEqual({
      ok: false,
      error: "Unsupported file type: application/zip",
    });
  });

  it("rejects an empty file", () => {
    expect(
      validateUploadFile("file", {
        name: "empty.txt",
        size: 0,
        type: "text/plain",
      }).ok,
    ).toBe(false);
  });

  it("rejects a file over the size limit", () => {
    const result = validateUploadFile("image", {
      name: "huge.jpg",
      size: UPLOAD_CONSTRAINTS.image.maxBytes + 1,
      type: "image/jpeg",
    });
    expect(result).toEqual({
      ok: false,
      error: "Images must be 5.0 MB or smaller",
    });
  });

  it("accepts a file exactly at the size limit", () => {
    expect(
      validateUploadFile("file", {
        name: "big.pdf",
        size: UPLOAD_CONSTRAINTS.file.maxBytes,
        type: "application/pdf",
      }),
    ).toEqual({ ok: true });
  });
});

describe("acceptAttr", () => {
  it("joins the kind's extensions for a file input", () => {
    expect(acceptAttr("image")).toBe(".png,.jpg,.jpeg,.gif,.webp,.svg");
  });
});

describe("buildObjectKey", () => {
  it("namespaces by kind and keeps the original extension", () => {
    const key = buildObjectKey("image", "My Photo.JPEG");
    expect(key).toMatch(
      /^items\/image\/[0-9a-f-]{36}\.jpeg$/,
    );
  });

  it("produces a unique key per call", () => {
    expect(buildObjectKey("file", "a.pdf")).not.toBe(
      buildObjectKey("file", "a.pdf"),
    );
  });
});
