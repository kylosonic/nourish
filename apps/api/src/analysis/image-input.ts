import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';

/**
 * Uploaded-image validation (SCAN-03 / SAFE-05).
 *
 * The bytes are validated and then held in memory for the duration of one
 * request. Nothing is written to disk and the schema has no image column, so
 * "original imagery is not retained indefinitely" is satisfied by retaining
 * nothing at all (ADR-0007 D-S2-4). Metadata stripping is enforced on the client
 * (the app re-encodes the photo before upload); the server never trusts client
 * metadata and never re-publishes it.
 */
export interface ImageInspection {
  mimeType: string;
  bytes: Buffer;
  width: number;
  height: number;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Smallest edge we accept; below this there is nothing to identify. */
export const MIN_IMAGE_EDGE = 64;

/**
 * Sniff the real format from magic bytes. A client-declared content type is a
 * hint, never a fact.
 */
export function sniffImageMime(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/** Read intrinsic dimensions from the header — no decoding, no native deps. */
export function readImageSize(
  bytes: Buffer,
  mimeType: string,
): { width: number; height: number } | null {
  if (mimeType === 'image/png' && bytes.length >= 24) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (mimeType === 'image/jpeg') {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      // SOF0..SOF15, excluding DHT (c4), JPG (c8) and DAC (cc).
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return {
          height: bytes.readUInt16BE(offset + 5),
          width: bytes.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + length;
    }
    return null;
  }
  if (mimeType === 'image/webp' && bytes.length >= 30) {
    const format = bytes.subarray(12, 16).toString('ascii');
    if (format === 'VP8X') {
      const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
      const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
      return { width, height };
    }
    if (format === 'VP8 ') {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      };
    }
    if (format === 'VP8L') {
      const bits = bytes.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

/** Validate an uploaded image or throw the §5 error envelope. */
export function inspectImage(buffer: Buffer, maxBytes: number): ImageInspection {
  if (buffer.length === 0) {
    throw new NourishHttpException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.IMAGE_UNREADABLE,
      'The uploaded image is empty',
    );
  }
  if (buffer.length > maxBytes) {
    throw new NourishHttpException(
      HttpStatus.PAYLOAD_TOO_LARGE,
      ErrorCode.IMAGE_TOO_LARGE,
      `Image is larger than the ${Math.floor(maxBytes / 1024)} KiB limit`,
    );
  }
  const mimeType = sniffImageMime(buffer);
  if (!mimeType || !(ALLOWED_MIME as readonly string[]).includes(mimeType)) {
    throw new NourishHttpException(
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      ErrorCode.UNSUPPORTED_MEDIA_TYPE,
      'Only JPEG, PNG and WebP images are supported',
    );
  }
  const size = readImageSize(buffer, mimeType);
  if (!size || size.width < MIN_IMAGE_EDGE || size.height < MIN_IMAGE_EDGE) {
    throw new NourishHttpException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.IMAGE_UNREADABLE,
      `The image must be at least ${MIN_IMAGE_EDGE}x${MIN_IMAGE_EDGE} pixels`,
    );
  }
  return { mimeType, bytes: buffer, width: size.width, height: size.height };
}
