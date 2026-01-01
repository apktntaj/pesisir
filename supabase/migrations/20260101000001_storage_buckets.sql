-- Create storage buckets for BL documents and shipment documents

-- Insert buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('bl-documents', 'bl-documents', false, 10485760, ARRAY['application/pdf']::text[]),
    ('shipment-documents', 'shipment-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for bl-documents bucket
CREATE POLICY "Users can upload BL documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'bl-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own BL documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'bl-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own BL documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'bl-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- RLS Policies for shipment-documents bucket
CREATE POLICY "Users can upload shipment documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'shipment-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own shipment documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'shipment-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own shipment documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'shipment-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
