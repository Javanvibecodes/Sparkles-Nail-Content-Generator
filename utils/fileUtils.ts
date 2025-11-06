
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // result is "data:image/jpeg;base64,..."
        // we need to strip the prefix for the Gemini API
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const base64ToMime = async (base64: string): Promise<string | null> => {
    const dataUrl = `data:;base64,${base64}`;
    try {
        const result = await fetch(dataUrl);
        const blob = await result.blob();
        return blob.type || null; // Return blob's MIME type, or null if not determined
    } catch (error) {
        console.error("Error determining MIME type from base64:", error);
        return null; // Fallback
    }
}
