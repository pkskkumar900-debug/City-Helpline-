export async function uploadImage(file: File): Promise<string | null> {
  // Placeholder for future storage integration (e.g., Firebase Storage, Supabase)
  // Currently returns a temporary local preview URL
  console.log('Image upload is temporarily disabled. Returning local preview URL.');
  return URL.createObjectURL(file);
}
