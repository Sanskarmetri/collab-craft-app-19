export const MAX_SCAN_IMAGE_BYTES = 5 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function getScanImageError(file: Pick<File, "type" | "size">): string | null {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_SCAN_IMAGE_BYTES) {
    return "Images must be 5 MB or smaller.";
  }
  if (file.size === 0) {
    return "This image is empty. Choose another image.";
  }
  return null;
}

export function readScanImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read this image."));
    };
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
}