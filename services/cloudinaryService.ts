// Mock Cloudinary Service
// In a real app, this would use formData and POST to cloudinary endpoint.
// Here, we convert file to Base64 to simulate a hosted URL and satisfy functionality without external keys.

export const uploadImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('File too large. Max 2MB.'));
      return;
    }

    // Validate type
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      reject(new Error('Invalid format. Use JPG, PNG, or WebP.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // In real scenario: return cloudinary response URL
      // In mock: return base64 string
      setTimeout(() => {
        resolve(reader.result as string);
      }, 1000);
    };
    reader.onerror = error => reject(error);
  });
};
