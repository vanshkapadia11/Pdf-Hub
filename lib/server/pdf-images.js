import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef } from "pdf-lib";
import sharp from "sharp";
import zlib from "node:zlib";

/**
 * Vector-preserving PDF image recompression.
 *
 * Walks every indirect object in the document, finds image XObjects whose
 * pixels are JPEG (DCTDecode) or Flate-encoded RGB/gray bitmaps, re-encodes
 * them with sharp at the requested quality (optionally capping resolution),
 * and rewrites the stream in place. Text, fonts and vector art are never
 * touched, so pages stay sharp and searchable — unlike full-page
 * rasterization, which is only used as a fallback in the compress route.
 *
 * Conservative by design: anything unusual (CMYK/ICC/indexed colour, colour
 * masks, non-8-bit samples, exotic filters) is left exactly as it was, and a
 * failure on one image never fails the whole document.
 */

const NAME = (n) => PDFName.of(n);
const MASK_KEYS = ["SMask", "Mask"];
/** Transport-encoding filters that can be peeled off before the core filter. */
const PEELABLE = new Set(["/ASCII85Decode", "/ASCIIHexDecode"]);

/**
 * Returns the filter chain as an array of names ("/DCTDecode",
 * ["/ASCII85Decode","/DCTDecode"], ...) or null when unusable.
 */
function filterList(dict) {
  const filter = dict.get(NAME("Filter"));
  if (filter instanceof PDFName) return [filter.toString()];
  if (filter && typeof filter.size === "function" && filter.size() > 0) {
    const names = [];
    for (let i = 0; i < filter.size(); i++) {
      const entry = filter.get(i);
      if (!(entry instanceof PDFName)) return null;
      names.push(entry.toString());
    }
    return names;
  }
  return null;
}

/** Adobe ASCII85 decoder ('z' zero groups, '~>' EOD, 'u'-padded tail). */
function ascii85Decode(bytes) {
  const out = [];
  let group = [];
  const flushGroup = (truncate) => {
    if (group.length === 0) return;
    while (group.length < 5) group.push(117); // pad with 'u'
    let n = 0;
    for (const b of group) n = n * 85 + (b - 33);
    const full = [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    out.push(...(truncate ? full.slice(0, group.length - 1) : full));
    group = [];
  };
  for (const byte of bytes) {
    if (byte === 0x7e) break; // '~' marks the end
    if (byte === 0x7a && group.length === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }
    if (/\s/.test(String.fromCharCode(byte))) continue;
    if (byte < 0x21 || byte > 0x75) throw new Error("bad ASCII85 byte");
    group.push(byte);
    if (group.length === 5) flushGroup(false);
  }
  flushGroup(true);
  return Buffer.from(out);
}

/** ASCIIHex decoder (hex digits, '>' EOD, odd tail zero-padded). */
function asciiHexDecode(bytes) {
  let hex = "";
  for (const byte of bytes) {
    if (byte === 0x3e) break;
    const c = String.fromCharCode(byte);
    if (/[0-9a-fA-F]/.test(c)) hex += c;
  }
  if (hex.length % 2 === 1) hex += "0";
  return Buffer.from(hex, "hex");
}

function numberEntry(dict, key) {
  const value = dict.get(NAME(key));
  return value instanceof PDFNumber ? value.asNumber() : null;
}

function hasEntry(dict, key) {
  return dict.get(NAME(key)) !== undefined;
}

/**
 * Eligibility check for one image stream. Returns null when the image should
 * be left untouched, otherwise how to decode its pixels.
 */
function classifyImage(dict) {
  if (dict.get(NAME("Subtype"))?.toString() !== "/Image") return null;
  if (hasEntry(dict, "ImageMask")) return null; // 1-bpp stencils
  if (hasEntry(dict, "Decode")) return null; // inverted / ranged samples
  const filters = filterList(dict);
  if (!filters || filters.length === 0) return null;
  // The core filter must encode pixels; everything before it may only be
  // ASCII transport armor (reportlab and friends wrap images this way).
  const core = filters[filters.length - 1];
  if (core !== "/DCTDecode" && core !== "/FlateDecode") return null;
  if (filters.slice(0, -1).some((f) => !PEELABLE.has(f))) return null;
  const colorSpace = dict.get(NAME("ColorSpace"));
  const cs = colorSpace instanceof PDFName ? colorSpace.toString() : null;
  // CMYK/ICC/indexed profiles cannot survive a sharp round-trip faithfully.
  if (cs !== "/DeviceRGB" && cs !== "/DeviceGray") return null;
  if (numberEntry(dict, "BitsPerComponent") !== 8) return null;
  return {
    kind: core === "/DCTDecode" ? "jpeg" : "flate",
    filters,
    channels: cs === "/DeviceGray" ? 1 : 3,
    hasMask: MASK_KEYS.some((key) => hasEntry(dict, key)),
  };
}

/**
 * Decodes the pixel data and re-encodes it as JPEG. Returns null when the
 * result would be unsafe or useless, so the caller keeps the original.
 */
async function reencodeJpeg(pixels, { raw, quality, maxDimension, hasMask }) {
  const pipeline = raw
    ? sharp(Buffer.from(pixels), { raw })
    : sharp(Buffer.from(pixels), { failOn: "none" });
  const meta = await pipeline.metadata();
  if (!meta.width || !meta.height) return null;
  if (meta.channels !== 1 && meta.channels !== 3) return null; // CMYK etc.
  // Soft/stencil masks must keep the image's exact dimensions, so images that
  // carry one skip downsampling and are only re-encoded at lower quality.
  if (maxDimension && !hasMask && Math.max(meta.width, meta.height) > maxDimension) {
    pipeline.resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const { data, info } = await pipeline
    .jpeg({ quality, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  if (!data.length) return null;
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/**
 * Recompresses embedded images and returns { bytes, touched, saved }.
 * `bytes` is the full re-saved PDF (object streams enabled), which also
 * shrinks slightly when the original file was not structure-optimized.
 */
export async function recompressPdfImages(buffer, { quality = 75, maxDimension = null } = {}) {
  const doc = await PDFDocument.load(buffer, { updateMetadata: false });
  const context = doc.context;
  const objects = context.enumerateIndirectObjects();

  // Never recompress soft/stencil mask streams themselves (lossy alpha would
  // fringe text edges); collect their refs so the main loop can skip them.
  const maskRefs = new Set();
  for (const [, obj] of objects) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    if (dict.get(NAME("Subtype"))?.toString() !== "/Image") continue;
    for (const key of MASK_KEYS) {
      const value = dict.get(NAME(key));
      if (value instanceof PDFRef) maskRefs.add(value.toString());
    }
  }

  let touched = 0;
  let saved = 0;
  for (const [ref, obj] of objects) {
    if (!(obj instanceof PDFRawStream)) continue;
    if (maskRefs.has(ref.toString())) continue;
    const info = classifyImage(obj.dict);
    if (!info) continue;
    try {
      let pixels = obj.contents;
      let raw = null;
      // Peel ASCII transport armor (outermost filter first).
      for (const f of info.filters.slice(0, -1)) {
        pixels = f === "/ASCII85Decode" ? ascii85Decode(pixels) : asciiHexDecode(pixels);
      }
      if (info.kind === "flate") {
        const width = numberEntry(obj.dict, "Width");
        const height = numberEntry(obj.dict, "Height");
        if (!width || !height) continue;
        const inflated = zlib.inflateSync(Buffer.from(pixels));
        if (inflated.length !== width * height * info.channels) continue;
        pixels = inflated;
        raw = { width, height, channels: info.channels };
      }
      const oldSize = obj.contents.length;
      const result = await reencodeJpeg(pixels, {
        raw,
        quality,
        maxDimension,
        hasMask: info.hasMask,
      });
      // Only replace the stream when it actually gets smaller.
      if (!result || result.data.length >= oldSize) continue;

      obj.contents = result.data;
      const dict = obj.dict;
      dict.set(NAME("Filter"), NAME("DCTDecode"));
      dict.set(NAME("Width"), PDFNumber.of(result.width));
      dict.set(NAME("Height"), PDFNumber.of(result.height));
      dict.set(NAME("BitsPerComponent"), PDFNumber.of(8));
      dict.set(
        NAME("ColorSpace"),
        result.channels === 1 ? NAME("DeviceGray") : NAME("DeviceRGB")
      );
      dict.set(NAME("Length"), PDFNumber.of(result.data.length));
      touched += 1;
      saved += oldSize - result.data.length;
    } catch {
      // One bad image must never fail the whole document.
    }
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, touched, saved };
}
