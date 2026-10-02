import sharp, { type Metadata } from "sharp";
import { IMAGE_RULES } from "./config";
import { IMAGE_NAME_BLOCK } from "./content-policy";

const MAGIC = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46],
} as const;

export type ImageCheck =
  | {
      ok: true;
      mime: "image/jpeg" | "image/png" | "image/webp";
      width: number;
      height: number;
      webp: Buffer;
    }
  | { ok: false; reason: string };

function hasPrefix(bytes: Buffer, prefix: readonly number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

function sniffMime(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (hasPrefix(bytes, MAGIC.jpeg)) return "image/jpeg";
  if (hasPrefix(bytes, MAGIC.png)) return "image/png";
  if (hasPrefix(bytes, MAGIC.webp) && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

function laplacianVariance(gray: Buffer, width: number, height: number): number {
  if (width < 3 || height < 3) return 0;
  const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
  const values: number[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let acc = 0;
      let k = 0;
      for (let j = -1; j <= 1; j += 1) {
        for (let i = -1; i <= 1; i += 1) {
          acc += gray[(y + j) * width + (x + i)] * kernel[k];
          k += 1;
        }
      }
      values.push(acc);
    }
  }
  const mean = values.reduce((sum, n) => sum + n, 0) / values.length;
  const variance =
    values.reduce((sum, n) => sum + (n - mean) * (n - mean), 0) / values.length;
  return variance;
}

function skinRatio(rgb: Buffer, width: number, height: number): number {
  let skin = 0;
  const total = width * height;
  for (let i = 0; i < rgb.length; i += 3) {
    const r = rgb[i];
    const g = rgb[i + 1];
    const b = rgb[i + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    const likely =
      y > 80 &&
      cb >= 85 &&
      cb <= 127 &&
      cr >= 137 &&
      cr <= 173 &&
      r > 60 &&
      g > 30 &&
      b > 20 &&
      r - b > 10;
    if (likely) skin += 1;
  }
  return skin / total;
}

export function filenameAllowed(name: string): boolean {
  const lower = name.toLowerCase();
  if (IMAGE_NAME_BLOCK.some((term) => lower.includes(term))) return false;
  return IMAGE_RULES.allowedExt.some((ext) => lower.endsWith(ext));
}

export async function inspectImage(
  bytes: Buffer,
  filename: string,
): Promise<ImageCheck> {
  if (!filenameAllowed(filename)) {
    return {
      ok: false,
      reason: "Use a JPEG, PNG, or WebP with an ordinary filename.",
    };
  }

  if (bytes.byteLength > IMAGE_RULES.maxBytes) {
    return { ok: false, reason: "Images must be 4 MB or smaller." };
  }
  if (bytes.byteLength < IMAGE_RULES.minBytes) {
    return {
      ok: false,
      reason: "That file is too small to print cleanly. Use a higher-quality photo.",
    };
  }

  const mime = sniffMime(bytes);
  if (!mime) {
    return {
      ok: false,
      reason: "The file is not a real JPEG, PNG, or WebP. SVG and GIF are not allowed.",
    };
  }

  let meta: Metadata;
  try {
    meta = await sharp(bytes, { failOn: "error", unlimited: false }).metadata();
  } catch {
    return { ok: false, reason: "We could not read that image." };
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < IMAGE_RULES.minWidth || height < IMAGE_RULES.minHeight) {
    return {
      ok: false,
      reason: `Photos need to be at least ${IMAGE_RULES.minWidth}×${IMAGE_RULES.minHeight}.`,
    };
  }
  if (width > IMAGE_RULES.maxWidth || height > IMAGE_RULES.maxHeight) {
    return {
      ok: false,
      reason: `Photos cannot be larger than ${IMAGE_RULES.maxWidth}×${IMAGE_RULES.maxHeight}.`,
    };
  }

  const sample = await sharp(bytes)
    .resize(96, 96, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const gray = await sharp(bytes)
    .greyscale()
    .resize(64, 64, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sharpness = laplacianVariance(gray.data, gray.info.width, gray.info.height);
  if (sharpness < IMAGE_RULES.minLaplacianVariance) {
    return {
      ok: false,
      reason: "That photo looks blurry or heavily compressed. Try a sharper original.",
    };
  }

  const skin = skinRatio(sample.data, sample.info.width, sample.info.height);
  const portrait = height > width * 1.15;
  if (skin > 0.88 || (portrait && skin > IMAGE_RULES.maxSkinRatio)) {
    return {
      ok: false,
      reason:
        "This photo does not meet our decency guidelines. Use a place, product, or brand image.",
    };
  }

  const webp = await sharp(bytes)
    .rotate()
    .resize({ width: IMAGE_RULES.outputMaxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const outMeta = await sharp(webp).metadata();

  return {
    ok: true,
    mime,
    width: outMeta.width ?? width,
    height: outMeta.height ?? height,
    webp,
  };
}
