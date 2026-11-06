export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;

const INVALID_IMAGE = "Image must be a JPEG, PNG, or WebP file no larger than 5 MB.";

export function validateImageDataUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > MAX_BASE64_LENGTH + 40) {
    return INVALID_IMAGE;
  }

  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return INVALID_IMAGE;

  const [, mimeType, encoded] = match;
  if (encoded.length % 4 !== 0) return INVALID_IMAGE;

  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const byteLength = (encoded.length * 3) / 4 - padding;
  if (byteLength <= 0 || byteLength > MAX_IMAGE_BYTES) return INVALID_IMAGE;

  let bytes: string;
  try {
    bytes = atob(encoded);
  } catch {
    return INVALID_IMAGE;
  }

  const isJpeg = mimeType === "image/jpeg" &&
    bytes.length >= 3 && bytes.charCodeAt(0) === 0xff &&
    bytes.charCodeAt(1) === 0xd8 && bytes.charCodeAt(2) === 0xff;
  const isPng = mimeType === "image/png" &&
    bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((byte, index) => bytes.charCodeAt(index) === byte);
  const isWebp = mimeType === "image/webp" &&
    bytes.length >= 12 && bytes.slice(0, 4) === "RIFF" && bytes.slice(8, 12) === "WEBP";

  return isJpeg || isPng || isWebp ? null : INVALID_IMAGE;
}