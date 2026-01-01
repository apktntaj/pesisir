-- Create custom types
CREATE TYPE shipment_variant AS ENUM ('FCL', 'LCL');
CREATE TYPE shipment_status AS ENUM (
    'created', 
    'sailing', 
    'pre_arrival', 
    'arrived', 
    'clearing', 
    'released', 
    'delivered'
);
CREATE TYPE document_category AS ENUM (
    'bill_of_lading',
    'invoice',
    'packing_list',
    'coo',
    'msds',
    'other'
);

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create shipments table
CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bl_number VARCHAR(100) NOT NULL,
    ref VARCHAR(100),
    shipper VARCHAR(255) NOT NULL,
    shipper_address TEXT,
    consignee VARCHAR(255) NOT NULL,
    consignee_address TEXT,
    third_party VARCHAR(255),
    third_party_address TEXT,
    voyage VARCHAR(100),
    vessel VARCHAR(255),
    pol VARCHAR(100),
    pod VARCHAR(100) NOT NULL,
    description TEXT,
    variant shipment_variant NOT NULL,
    volume VARCHAR(50),
    notes TEXT,
    status shipment_status DEFAULT 'created',
    bl_file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for shipments
CREATE INDEX idx_shipments_user_id ON public.shipments(user_id);
CREATE INDEX idx_shipments_bl_number ON public.shipments(bl_number);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_created_at ON public.shipments(created_at DESC);

-- Enable RLS on shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Policies for shipments
CREATE POLICY "Users can CRUD own shipments"
    ON public.shipments FOR ALL
    USING (auth.uid() = user_id);

-- Create status_histories table
CREATE TABLE public.status_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status shipment_status NOT NULL,
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id)
);

-- Index for status_histories
CREATE INDEX idx_status_histories_shipment ON public.status_histories(shipment_id);

-- Enable RLS on status_histories
ALTER TABLE public.status_histories ENABLE ROW LEVEL SECURITY;

-- Policy for status_histories
CREATE POLICY "Users can view status history of own shipments"
    ON public.status_histories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments 
            WHERE shipments.id = status_histories.shipment_id 
            AND shipments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert status history for own shipments"
    ON public.status_histories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shipments 
            WHERE shipments.id = status_histories.shipment_id 
            AND shipments.user_id = auth.uid()
        )
    );

-- Create documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    category document_category NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for documents
CREATE INDEX idx_documents_shipment ON public.documents(shipment_id);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy for documents
CREATE POLICY "Users can manage documents of own shipments"
    ON public.documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments 
            WHERE shipments.id = documents.shipment_id 
            AND shipments.user_id = auth.uid()
        )
    );

-- Create wa_subscribers table
CREATE TABLE public.wa_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    label VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for wa_subscribers
CREATE INDEX idx_wa_subscribers_shipment ON public.wa_subscribers(shipment_id);

-- Enable RLS on wa_subscribers
ALTER TABLE public.wa_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy for wa_subscribers
CREATE POLICY "Users can manage WA subscribers of own shipments"
    ON public.wa_subscribers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments 
            WHERE shipments.id = wa_subscribers.shipment_id 
            AND shipments.user_id = auth.uid()
        )
    );

-- Create custom_workflows table
CREATE TABLE public.custom_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    statuses JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on custom_workflows
ALTER TABLE public.custom_workflows ENABLE ROW LEVEL SECURITY;

-- Policy for custom_workflows
CREATE POLICY "Users can manage own workflow"
    ON public.custom_workflows FOR ALL
    USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wa_subscribers_updated_at
    BEFORE UPDATE ON public.wa_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_workflows_updated_at
    BEFORE UPDATE ON public.custom_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
