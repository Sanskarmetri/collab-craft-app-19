import { assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { MAX_IMAGE_BYTES, validateImageDataUrl } from "./image.ts";

Deno.test("accepts correctly typed JPEG, PNG, and WebP image data", () => {
  assert(validateImageDataUrl("data:image/jpeg;base64,/9j/") === null);
  assert(validateImageDataUrl("data:image/png;base64,iVBORw0KGgo=") === null);
  assert(validateImageDataUrl("data:image/webp;base64,UklGRgAAAABXRUJQ") === null);
});

Deno.test("rejects malformed, mismatched, and oversized image data", () => {
  assert(validateImageDataUrl("not-an-image") !== null);
  assert(validateImageDataUrl("data:image/png;base64,/9j/") !== null);

  const tooLarge = "data:image/png;base64," + "A".repeat(Math.ceil((MAX_IMAGE_BYTES + 1) / 3) * 4);
  assert(validateImageDataUrl(tooLarge) !== null);
});