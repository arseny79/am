/**
 * Client-side S3 storage utility
 * Note: This is a placeholder. Use trpc.storage.upload directly in components.
 */

export async function storagePut(
  key: string,
  data: Uint8Array,
  contentType: string
): Promise<{ url: string; key: string }> {
  // Convert Uint8Array to base64 for JSON transport
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(data)));

  // This function should be called via tRPC in components
  // For now, return a placeholder to avoid type errors
  throw new Error("Use trpc.storage.upload.mutate() instead of this function");
}
