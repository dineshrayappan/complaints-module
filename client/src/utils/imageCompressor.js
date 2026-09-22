/**
 * Client-Side HTML5 Canvas Image Compression Utility
 * Resizes photos from high-resolution phone/tablet cameras (5-15MB)
 * down to crisp WebP/JPEG images (~200-400KB) in milliseconds before uploading.
 */

export const compressImage = (
  file,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}
) => {
  return new Promise((resolve) => {
    if (!file) {
      return resolve({
        file: null,
        previewUrl: null,
        dataUrl: null,
        originalSize: 0,
        compressedSize: 0,
      });
    }

    // If not an image or File API unavailable, fallback gracefully to raw file
    if (!file.type || !file.type.startsWith('image/')) {
      let previewUrl = null;
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (e) {
        // ignore
      }
      return resolve({
        file,
        previewUrl,
        dataUrl: null,
        originalSize: file.size || 0,
        compressedSize: file.size || 0,
      });
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const base64Data = event.target.result;
      const img = new Image();
      img.src = base64Data;

      img.onload = () => {
        try {
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
            let previewUrl = null;
            try {
              previewUrl = URL.createObjectURL(file);
            } catch (e) {}
            return resolve({
              file,
              previewUrl: previewUrl || base64Data,
              dataUrl: base64Data,
              originalSize: file.size,
              compressedSize: file.size,
            });
          }

          // Apply smooth resampling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = null;
          try {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          } catch (e) {
            dataUrl = base64Data;
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                let previewUrl = null;
                try {
                  previewUrl = URL.createObjectURL(file);
                } catch (e) {}
                return resolve({
                  file,
                  previewUrl: previewUrl || dataUrl || base64Data,
                  dataUrl: dataUrl || base64Data,
                  originalSize: file.size,
                  compressedSize: file.size,
                });
              }

              const compressedFile = new File(
                [blob],
                (file.name || 'audit-defect-photo').replace(/\.[^/.]+$/, '.jpg'),
                { type: 'image/jpeg', lastModified: Date.now() }
              );

              const previewUrl = URL.createObjectURL(blob);
              resolve({
                file: compressedFile,
                previewUrl,
                dataUrl: dataUrl || base64Data,
                originalSize: file.size,
                compressedSize: blob.size,
              });
            },
            'image/jpeg',
            quality
          );
        } catch (canvasErr) {
          let previewUrl = null;
          try {
            previewUrl = URL.createObjectURL(file);
          } catch (e) {}
          resolve({
            file,
            previewUrl: previewUrl || base64Data,
            dataUrl: base64Data,
            originalSize: file.size,
            compressedSize: file.size,
          });
        }
      };

      img.onerror = () => {
        let previewUrl = null;
        try {
          previewUrl = URL.createObjectURL(file);
        } catch (e) {}
        resolve({
          file,
          previewUrl: previewUrl || base64Data,
          dataUrl: base64Data,
          originalSize: file.size,
          compressedSize: file.size,
        });
      };
    };

    reader.onerror = () => {
      let previewUrl = null;
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (e) {}
      resolve({
        file,
        previewUrl,
        dataUrl: null,
        originalSize: file.size,
        compressedSize: file.size,
      });
    };
  });
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
