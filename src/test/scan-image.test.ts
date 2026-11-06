import { describe, expect, it } from "vitest";
import { getScanImageError, MAX_SCAN_IMAGE_BYTES } from "@/utils/scanImage";

describe("Scan & Learn image selection", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s images up to 5 MB", (type) => {
    expect(getScanImageError({ type, size: MAX_SCAN_IMAGE_BYTES })).toBeNull();
  });

  it("rejects unsupported formats", () => {
    expect(getScanImageError({ type: "image/gif", size: 100 })).toMatch(/JPEG, PNG, or WebP/);
  });

  it("rejects images larger than 5 MB", () => {
    expect(getScanImageError({ type: "image/jpeg", size: MAX_SCAN_IMAGE_BYTES + 1 })).toMatch(/5 MB/);
  });

  it("rejects empty images", () => {
    expect(getScanImageError({ type: "image/png", size: 0 })).toMatch(/empty/i);
  });
});