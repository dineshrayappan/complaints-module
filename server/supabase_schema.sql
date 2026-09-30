-- ==============================================================================
-- GARMENT MANUFACTURING QMS - SUPABASE DATABASE SCHEMA & SETUP SCRIPT
-- ==============================================================================
-- This script creates the complete database schema for the Garment Quality
-- Management System (QMS), including Users, Complaints, Auditing, RLS policies,
-- performance indexes, and seed accounts.
-- 
-- Safe to run repeatedly in the Supabase SQL Editor (Idempotent).
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. USERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT ('usr-' || substr(md5(random()::text), 1, 8)),
    "employeeId" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'AUDITOR', 'ACTION_PERSON', 'SUPERVISOR')),
    department TEXT NOT NULL DEFAULT 'Central Quality Audit',
    designation TEXT DEFAULT 'Staff',
    "mobileNumber" TEXT DEFAULT '',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all required columns exist in users table (for existing installations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='employeeId') THEN
        ALTER TABLE public.users ADD COLUMN "employeeId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='designation') THEN
        ALTER TABLE public.users ADD COLUMN designation TEXT DEFAULT 'Staff';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mobileNumber') THEN
        ALTER TABLE public.users ADD COLUMN "mobileNumber" TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='isActive') THEN
        ALTER TABLE public.users ADD COLUMN "isActive" BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_employeeId ON public.users ("employeeId");
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- ==============================================================================
-- 3. COMPLAINTS TABLE (DEFECT LOGS & AUDIT LIFECYCLE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY DEFAULT ('cmp-' || floor(extract(epoch from now()) * 1000)::text),
    "complaintId" TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Stitching Fault',
    department TEXT NOT NULL DEFAULT 'Sewing Line 1',
    location TEXT NOT NULL DEFAULT 'Production Floor',
    priority TEXT NOT NULL DEFAULT 'HIGH',
    description TEXT DEFAULT '',
    "beforePhoto" TEXT NOT NULL,
    "afterPhoto" TEXT DEFAULT NULL,
    "assignedTo" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdBy" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "deadlineHours" NUMERIC DEFAULT 16,
    "deadlineTimestamp" TIMESTAMPTZ,
    "actualCompletedAt" TIMESTAMPTZ DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'Assigned',
    "actionNotes" TEXT DEFAULT '',
    "feedbackRemarks" TEXT DEFAULT '',
    "rejectionReason" TEXT DEFAULT '',
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all required columns exist in complaints table (for existing installations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='complaintId') THEN
        ALTER TABLE public.complaints ADD COLUMN "complaintId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='beforePhoto') THEN
        ALTER TABLE public.complaints ADD COLUMN "beforePhoto" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='afterPhoto') THEN
        ALTER TABLE public.complaints ADD COLUMN "afterPhoto" TEXT DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='assignedTo') THEN
        ALTER TABLE public.complaints ADD COLUMN "assignedTo" JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='createdBy') THEN
        ALTER TABLE public.complaints ADD COLUMN "createdBy" JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='deadlineHours') THEN
        ALTER TABLE public.complaints ADD COLUMN "deadlineHours" NUMERIC DEFAULT 16;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='deadlineTimestamp') THEN
        ALTER TABLE public.complaints ADD COLUMN "deadlineTimestamp" TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '16 hours');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='actualCompletedAt') THEN
        ALTER TABLE public.complaints ADD COLUMN "actualCompletedAt" TIMESTAMPTZ DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='actionNotes') THEN
        ALTER TABLE public.complaints ADD COLUMN "actionNotes" TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='feedbackRemarks') THEN
        ALTER TABLE public.complaints ADD COLUMN "feedbackRemarks" TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='rejectionReason') THEN
        ALTER TABLE public.complaints ADD COLUMN "rejectionReason" TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='timeline') THEN
        ALTER TABLE public.complaints ADD COLUMN "timeline" JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='requirement') THEN
        ALTER TABLE public.complaints ADD COLUMN "requirement" TEXT DEFAULT 'AQL 1.5 Workmanship Standard';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='riskSeverity') THEN
        ALTER TABLE public.complaints ADD COLUMN "riskSeverity" TEXT DEFAULT 'HIGH';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='capRequired') THEN
        ALTER TABLE public.complaints ADD COLUMN "capRequired" BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='verificationMethod') THEN
        ALTER TABLE public.complaints ADD COLUMN "verificationMethod" TEXT DEFAULT 'Physical Floor Re-inspection';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='createdAt') THEN
        ALTER TABLE public.complaints ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaints' AND column_name='updatedAt') THEN
        ALTER TABLE public.complaints ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ensure robust defaults on existing columns to prevent NOT NULL constraint errors
    ALTER TABLE public.complaints ALTER COLUMN "deadlineHours" SET DEFAULT 16;
    ALTER TABLE public.complaints ALTER COLUMN "deadlineTimestamp" SET DEFAULT (NOW() + INTERVAL '16 hours');
    ALTER TABLE public.complaints ALTER COLUMN "assignedTo" SET DEFAULT '{}'::jsonb;
    ALTER TABLE public.complaints ALTER COLUMN "createdBy" SET DEFAULT '{}'::jsonb;
    ALTER TABLE public.complaints ALTER COLUMN "timeline" SET DEFAULT '[]'::jsonb;
    ALTER TABLE public.complaints ALTER COLUMN "category" SET DEFAULT 'Stitching Fault';
    ALTER TABLE public.complaints ALTER COLUMN "department" SET DEFAULT 'Sewing Line 1';
    ALTER TABLE public.complaints ALTER COLUMN "location" SET DEFAULT 'Production Floor';
    ALTER TABLE public.complaints ALTER COLUMN "priority" SET DEFAULT 'HIGH';
    ALTER TABLE public.complaints ALTER COLUMN "description" SET DEFAULT '';
    ALTER TABLE public.complaints ALTER COLUMN "status" SET DEFAULT 'Assigned';
    ALTER TABLE public.complaints ALTER COLUMN "actionNotes" SET DEFAULT '';
    ALTER TABLE public.complaints ALTER COLUMN "feedbackRemarks" SET DEFAULT '';
    ALTER TABLE public.complaints ALTER COLUMN "rejectionReason" SET DEFAULT '';
END $$;

-- Performance Indexes for Complaints Queries
CREATE INDEX IF NOT EXISTS idx_complaints_complaintId ON public.complaints ("complaintId");
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints (category);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints (priority);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON public.complaints (department);
CREATE INDEX IF NOT EXISTS idx_complaints_createdAt ON public.complaints ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_assignedTo ON public.complaints USING gin ("assignedTo");
CREATE INDEX IF NOT EXISTS idx_complaints_timeline ON public.complaints USING gin (timeline);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Ensure Row Level Security is configured with open access for anonymous & authenticated roles
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Drop old conflicting policies if they exist
DROP POLICY IF EXISTS "Allow anon and auth read users" ON public.users;
DROP POLICY IF EXISTS "Allow anon and auth insert users" ON public.users;
DROP POLICY IF EXISTS "Allow anon and auth update users" ON public.users;
DROP POLICY IF EXISTS "Allow anon and auth delete users" ON public.users;
DROP POLICY IF EXISTS "Allow all for users" ON public.users;

CREATE POLICY "Allow all for users"
ON public.users
FOR ALL
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth read complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow anon and auth insert complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow anon and auth update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow anon and auth delete complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow all for complaints" ON public.complaints;

CREATE POLICY "Allow all for complaints"
ON public.complaints
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 5. SEED USERS (ADMIN, AUDITORS, SUPERVISORS)
-- ==============================================================================
INSERT INTO public.users (id, "employeeId", name, email, password, role, department, designation, "mobileNumber", "isActive")
VALUES
    ('usr-adm-001', 'ADM-001', 'Anil Mehta', 'admin@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ADMIN', 'Plant Operations & Executive Oversight', 'General Operations Director', '+91 98000 11223', true),
    ('usr-aud-001', 'AUD-001', 'Rajesh Kumar', 'auditor@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'AUDITOR', 'Central Quality Audit', 'Lead Quality Assurance Inspector', '+91 98222 33445', true),
    ('usr-aud-002', 'AUD-002', 'Dinesh Rayappan', 'dinesh@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'AUDITOR', 'Central Quality Audit', 'Senior QC Technical Auditor', '+91 98333 44556', true),
    ('usr-sup-101', 'SUP-101', 'Mohammad Arif', 'arif@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'Sewing Line 1', 'Line 1 In-Charge', '+91 98111 22334', true),
    ('usr-sup-102', 'SUP-102', 'Priya Sharma', 'priya@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'Sewing Line 2', 'Line 2 In-Charge', '+91 98222 33445', true),
    ('usr-sup-103', 'SUP-103', 'Kamal Hasan', 'kamal@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'Spreading & Cutting', 'Cutting Section Master', '+91 98333 44556', true),
    ('usr-sup-104', 'SUP-104', 'Sunita Roy', 'sunita@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'Finishing & Packing', 'Finishing Floor Manager', '+91 98444 55667', true),
    ('usr-sup-105', 'SUP-105', 'Ramesh Patel', 'ramesh@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'Sewing Line 3', 'Line 3 Supervisor', '+91 98555 66778', true),
    ('usr-sup-106', 'SUP-106', 'Kavita Deshmukh', 'kavita@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'Sewing Line 4', 'Line 4 Supervisor', '+91 98666 77889', true),
    ('usr-sup-107', 'SUP-107', 'Anthony D''Souza', 'anthony@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'Embroidery & Printing', 'Embroidery Unit Master', '+91 98777 88990', true),
    ('usr-sup-108', 'SUP-108', 'Meera Nambiar', 'meera@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'Wet Processing & Washing', 'Washing Lab In-Charge', '+91 98888 99001', true),
    ('usr-sup-109', 'SUP-109', 'Gurpreet Singh', 'gurpreet@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'Trims & Special Machinery', 'Buttoning & Snap Rivet Master', '+91 98999 00112', true),
    ('usr-sup-110', 'SUP-110', 'Lakshmi Narayanan', 'lakshmi@factory.com', '$2a$10$EpCbPd6QfM1lgb7YTq5FCeCtq/b55A.FBuzEMdvV.LdbifGqERKXq', 'ACTION_PERSON', 'End-Line Inspection', 'Final QC & Audit Coordinator', '+91 98012 34567', true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    "employeeId" = EXCLUDED."employeeId",
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    designation = EXCLUDED.designation,
    "mobileNumber" = EXCLUDED."mobileNumber",
    "updatedAt" = NOW();

-- ==============================================================================
-- 5. COMPLIANCE TASKS TABLE (SCHEDULED INSPECTIONS)
-- ==============================================================================
-- Recurring, per-user compliance work (fire safety, PPE, payroll review).
-- Distinct from `complaints`: a task is work to perform, an NC is a defect found.
CREATE TABLE IF NOT EXISTS public.compliance_tasks (
    id TEXT PRIMARY KEY DEFAULT ('tsk-' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Central Quality Audit',
    description TEXT DEFAULT '',
    "assignedTo" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "dueDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
    "completedAt" TIMESTAMPTZ DEFAULT NULL,
    "completedBy" JSONB DEFAULT NULL,
    recurrence TEXT NOT NULL DEFAULT 'NONE'
        CHECK (recurrence IN ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill columns for existing installations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='compliance_tasks' AND column_name='assignedTo') THEN
        ALTER TABLE public.compliance_tasks ADD COLUMN "assignedTo" JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='compliance_tasks' AND column_name='dueDate') THEN
        ALTER TABLE public.compliance_tasks ADD COLUMN "dueDate" TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='compliance_tasks' AND column_name='recurrence') THEN
        ALTER TABLE public.compliance_tasks ADD COLUMN recurrence TEXT DEFAULT 'NONE';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON public.compliance_tasks ("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.compliance_tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.compliance_tasks (department);
CREATE INDEX IF NOT EXISTS idx_tasks_assignedTo ON public.compliance_tasks USING gin ("assignedTo");

-- RLS: owner sees own tasks, ADMIN/AUDITOR see all.
-- NOTE: this is intentionally NOT the wide-open `USING (true)` policy that
-- guards users/complaints. anon access is revoked; the API talks to this table
-- with the service-role key, which bypasses RLS entirely.
ALTER TABLE public.compliance_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for compliance_tasks" ON public.compliance_tasks;

CREATE POLICY "Assigned user reads own tasks" ON public.compliance_tasks
    FOR SELECT TO authenticated
    USING (("assignedTo"->>'employeeId') = auth.jwt()::text);

-- ==============================================================================
-- 6. SEED COMPLIANCE TASKS (idempotent via ON CONFLICT)
-- ==============================================================================
INSERT INTO public.compliance_tasks (id, title, department, description, "assignedTo", "dueDate", status, recurrence, priority)
VALUES
    ('tsk-fire-001', 'Fire Safety Inspection', 'Environmental Health & Safety', 'Hose reels, extinguishers, gangways, emergency exits.', '{"userId":"usr-aud-001","employeeId":"AUD-001","name":"Pooja Sharma","department":"Central Quality Audit"}'::jsonb, NOW() - INTERVAL '2 days', 'Pending', 'MONTHLY', 'HIGH'),
    ('tsk-hr-002',    'Employee File Review',  'Human Resources',              'Verify personal records, attendance and overtime logs.', '{"userId":"usr-adm-001","employeeId":"ADM-001","name":"Anil Mehta","department":"Plant Operations & Executive Oversight"}'::jsonb, NOW(), 'Pending', 'WEEKLY', 'MEDIUM'),
    ('tsk-ppe-003',   'PPE Inspection',        'Production',                   'Needle guards, eye protection and aprons in place.', '{"userId":"usr-aud-001","employeeId":"AUD-001","name":"Pooja Sharma","department":"Central Quality Audit"}'::jsonb, NOW() - INTERVAL '1 day', 'Completed', 'NONE', 'MEDIUM'),
    ('tsk-pay-004',   'Payroll Compliance Review', 'Human Resources',           'Pay slips distributed on schedule; minimum wage adherence.', '{"userId":"usr-adm-001","employeeId":"ADM-001","name":"Anil Mehta","department":"Plant Operations & Executive Oversight"}'::jsonb, NOW() + INTERVAL '3 days', 'Pending', 'MONTHLY', 'HIGH'),
    ('tsk-chem-005',  'Chemical Storage Inspection', 'Environmental Health & Safety', 'MSDS availability, container labelling, ventilation.', '{"userId":"usr-aud-001","employeeId":"AUD-001","name":"Pooja Sharma","department":"Central Quality Audit"}'::jsonb, NOW() + INTERVAL '4 days', 'Pending', 'MONTHLY', 'HIGH'),
    ('tsk-mach-006',  'Machine Safety Inspection',  'Maintenance',               'Guarding, lockout/tagout, emergency stops.', '{"userId":"usr-sup-001","employeeId":"SUP-001","name":"Rajesh Kumar","department":"Production"}'::jsonb, NOW() + INTERVAL '5 days', 'Pending', 'QUARTERLY', 'MEDIUM')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    department = EXCLUDED.department,
    description = EXCLUDED.description,
    "assignedTo" = EXCLUDED."assignedTo",
    recurrence = EXCLUDED.recurrence,
    priority = EXCLUDED.priority,
    "updatedAt" = NOW();

-- ==============================================================================
-- Verification Output
-- ==============================================================================
SELECT 'Users count: ' || count(*)::text FROM public.users;
SELECT 'Complaints count: ' || count(*)::text FROM public.complaints;
SELECT 'Compliance tasks count: ' || count(*)::text FROM public.compliance_tasks;
