# Supabase Configuration

Project URL: [Your Supabase Project URL]
Anon Key: [Your Supabase Anon Key]
Service Role Key: [Your Supabase Service Role Key]

## Setup Instructions

1. **Create Supabase Project**
   - Go to https://supabase.com/dashboard
   - Create a new project
   - Copy the Project URL and API Keys

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in the Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

3. **Run Migrations**
   - Option 1: Using Supabase CLI
     ```bash
     npx supabase db push
     ```
   
   - Option 2: Manual via Dashboard
     - Go to SQL Editor in Supabase Dashboard
     - Copy and run the SQL from migration files in order:
       1. `20260101000000_initial_schema.sql`
       2. `20260101000001_storage_buckets.sql`

4. **Verify Setup**
   - Check Tables in Database section
   - Verify RLS policies are enabled
   - Check Storage buckets are created

## Database Schema Overview

### Tables
- `profiles` - User profile data
- `shipments` - Main shipment data
- `status_histories` - Status change history
- `documents` - Uploaded documents
- `wa_subscribers` - WhatsApp notification subscribers
- `custom_workflows` - User custom status workflows

### Storage Buckets
- `bl-documents` - Bill of Lading PDFs
- `shipment-documents` - Supporting documents (PDF, JPG, PNG)

## Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Storage files scoped to user folders
