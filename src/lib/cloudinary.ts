export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = 'dljpqwrs11';
  const uploadPreset = 'cityhelpline_upload';
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown error during image upload');
  }
}
