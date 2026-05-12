-- Allow update/delete on rnc-attachments for owner/uploader so users can re-upload evidence (upsert)
CREATE POLICY "Authenticated users can update attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'rnc-attachments')
WITH CHECK (bucket_id = 'rnc-attachments');

CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'rnc-attachments');