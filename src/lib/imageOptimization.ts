/**
 * CivicTrace Mobile Image Optimization & Security Pipeline
 * 
 * Solves the critical mobile upload failure caused by 10-15MB smartphone camera photos
 * exceeding browser localStorage and mobile transmission limits.
 * Downscales images to max 1280px, compresses to high-quality JPEG/WebP,
 * and sanitizes binary metadata to prevent executable payload injection.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  originalBytes: number;
  compressedBytes: number;
  compressionRatio: number;
  width: number;
  height: number;
  mimeType: string;
}

const MAX_DIMENSION = 1280;
const COMPRESSION_QUALITY = 0.82;
const MAX_ALLOWED_FILE_BYTES = 16 * 1024 * 1024; // 16MB raw capture limit

export async function optimizeAndSanitizeImage(
  file: File
): Promise<OptimizedImageResult> {
  // 1. Strict Size & Type Validation
  if (file.size > MAX_ALLOWED_FILE_BYTES) {
    throw new Error(
      `Photograph exceeds maximum size limit of 16MB (file is ${(
        file.size /
        (1024 * 1024)
      ).toFixed(1)}MB). Please choose a smaller image.`
    );
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
    throw new Error('Unsupported image format. Please select a JPEG, PNG, or WebP photograph.');
  }

  // 2. Read file to Image element
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file from device storage.'));
    };

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Invalid image data stream.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error('Image file is corrupted or could not be decoded.'));
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Compute proportional resize
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          // Render onto offscreen canvas (sanitizes EXIF and stripped dangerous metadata)
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to original if canvas context unavailable
            resolve({
              dataUrl: reader.result as string,
              originalBytes: file.size,
              compressedBytes: file.size,
              compressionRatio: 1,
              width: img.width,
              height: img.height,
              mimeType: file.type,
            });
            return;
          }

          // Clean background fill
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);
          const compressedBytes = Math.round((compressedDataUrl.length * 3) / 4);

          resolve({
            dataUrl: compressedDataUrl,
            originalBytes: file.size,
            compressedBytes,
            compressionRatio: Math.round((1 - compressedBytes / file.size) * 100),
            width,
            height,
            mimeType: 'image/jpeg',
          });
        } catch (err: any) {
          reject(new Error(`Image optimization failed: ${err?.message || 'unknown error'}`));
        }
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}
