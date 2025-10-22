# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note down your:
   - Project URL
   - Anon/Public API key

## 2. Update Environment Variables

Edit `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Run Database Migrations

In Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents from `supabase/migrations/001_initial_schema.sql`
3. Run the SQL
4. Copy contents from `supabase/migrations/002_seed_data.sql`
5. Run the SQL

## 4. Set up Storage Buckets

In Supabase Dashboard → Storage:
1. Create bucket: `profile-pictures` (Public)
2. Create bucket: `vehicle-photos` (Public)
3. Create bucket: `course-certificates` (Public)

## Current Status

✅ Schema created (organizations, teams, technicians, etc.)
✅ Seed data ready (regions and 20 teams with colors)
🔄 Waiting for Supabase project setup
