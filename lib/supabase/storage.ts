import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_EXT = /^(jpg|jpeg|png|webp|gif|avif|heic|heif)$/;

export async function uploadImage(
  supabase: SupabaseClient,
  bucket: string,
  photo: File | null,
): Promise<string | null> {
  if (!photo || photo.size === 0) return null;
  const rawExt = (photo.name.split(".").pop() ?? "jpg").toLowerCase();
  const ext = ALLOWED_EXT.test(rawExt) ? rawExt : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, photo, {
      contentType: photo.type || undefined,
      upsert: false,
    });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function extractPath(
  bucket: string,
  publicUrl: string | null,
): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export async function deleteImage(
  supabase: SupabaseClient,
  bucket: string,
  publicUrl: string | null,
): Promise<void> {
  const path = extractPath(bucket, publicUrl);
  if (!path) return;
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch {
    // best effort; a stale object is preferable to blocking the DB op
  }
}
