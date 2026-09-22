/**
 * Client-Side HTML5 Canvas Image Compression Utility
 * Resizes photos from high-resolution phone/tablet cameras (5-15MB)
 * down to crisp WebP/JPEG images (~200-400KB) in milliseconds before uploading.
 */

export const compressImage = (
  file,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}
) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let { width, height } = img;

        // Calculate scaled dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context unavailable.'));
        }

        // Apply smooth resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer modern image/webp, fallback gracefully to image/jpeg
        const outputFormat = 'image/webp';
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to jpeg if WebP conversion fails
              canvas.toBlob(
                (fallbackBlob) => {
                  if (!fallbackBlob) {
                    return reject(new Error('Canvas image compression failed.'));
                  }
                  const compressedFile = new File(
                    [fallbackBlob],
                    file.name.replace(/\.[^/.]+$/, '.jpg'),
                    { type: 'image/jpeg', lastModified: Date.now() }
                  );
                  const previewUrl = URL.createObjectURL(fallbackBlob);
                  resolve({
                    file: compressedFile,
                    previewUrl,
                    originalSize: file.size,
                    compressedSize: fallbackBlob.size,
                  });
                },
                'image/jpeg',
                quality
              );
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.webp'),
              { type: outputFormat, lastModified: Date.now() }
            );

            const previewUrl = URL.createObjectURL(blob);
            resolve({
              file: compressedFile,
              previewUrl,
              originalSize: file.size,
              compressedSize: blob.size,
            });
          },
          outputFormat,
          quality
        );
      };

      img.onerror = (err) => reject(new Error('Failed to load image for compression.'));
    };

    reader.onerror = (err) => reject(new Error('Failed to read image file.'));
  });
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
