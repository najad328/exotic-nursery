-- Create storage bucket for plant images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plant-images',
  'plant-images',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read plant images (public bucket)
CREATE POLICY "Public read access for plant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-images');

-- Only admins can upload plant images
CREATE POLICY "Admin upload access for plant images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'plant-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update plant images
CREATE POLICY "Admin update access for plant images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'plant-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete plant images
CREATE POLICY "Admin delete access for plant images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'plant-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
