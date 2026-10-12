-- ==============================================================================
-- PLATAFORMA DE TICKETS DE REPARACIÓN TÉCNICA
-- ESQUEMA MAESTRO DE BASE DE DATOS SUPABASE (POSTGRESQL + RLS)
-- ==============================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLA: profiles (Extiende auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  contact_phone TEXT DEFAULT '',
  preferred_photo_channel TEXT DEFAULT 'WhatsApp' CHECK (preferred_photo_channel IN ('WhatsApp', 'Telegram', 'Ambos')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. SECUENCIA Y TABLA: tickets
-- ==============================================================================
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('Aire acondicionado', 'Electricidad', 'Fontanería', 'Otro')),
  description TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'Normal' CHECK (urgency IN ('Normal', 'Urgente')),
  status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En proceso', 'Completado', 'Cerrado')),
  assigned_technician TEXT,
  photo_available BOOLEAN DEFAULT false,
  preferred_photo_channel TEXT DEFAULT 'WhatsApp' CHECK (preferred_photo_channel IN ('WhatsApp', 'Telegram', 'Ambos')),
  client_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para generar ticket_number automático (ej. TK-2026-0001)
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT := to_char(CURRENT_DATE, 'YYYY');
  next_val BIGINT;
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    SELECT nextval('ticket_number_seq') INTO next_val;
    NEW.ticket_number := 'TK-' || year_str || '-' || LPAD(next_val::TEXT, 4, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_ticket_number ON public.tickets;
CREATE TRIGGER trg_generate_ticket_number
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- ==============================================================================
-- 4. TABLA: ticket_status_history (Auditoría de estados)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger automático para registrar historial de estado
CREATE OR REPLACE FUNCTION log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.ticket_status_history (ticket_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, NULL, NEW.status, NEW.client_id, 'Ticket creado en plataforma');
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.ticket_status_history (ticket_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), COALESCE(NEW.client_feedback, 'Cambio de estado a ' || NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_ticket_status_change ON public.tickets;
CREATE TRIGGER trg_log_ticket_status_change
AFTER INSERT OR UPDATE OF status ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION log_ticket_status_change();

-- ==============================================================================
-- 5. TABLA: ticket_notes (Comentarios internos y visibles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 6. TRIGGER PARA CREAR PROFILE AUTOMÁTICAMENTE AL CREAR USUARIO EN AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, contact_phone, preferred_photo_channel, account_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'contact_phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_photo_channel', 'WhatsApp'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 7. FUNCIÓN HELPER: is_admin() PARA POLÍTICAS RLS SEGURAS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND account_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 8. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_notes ENABLE ROW LEVEL SECURITY;

-- 8.1 PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR public.is_admin()
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR public.is_admin()
);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (
  auth.uid() = id OR public.is_admin()
);

-- 8.2 TICKETS POLICIES
DROP POLICY IF EXISTS "tickets_select_policy" ON public.tickets;
CREATE POLICY "tickets_select_policy" ON public.tickets
FOR SELECT USING (
  client_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "tickets_insert_policy" ON public.tickets;
CREATE POLICY "tickets_insert_policy" ON public.tickets
FOR INSERT WITH CHECK (
  (client_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_status = 'active'))
  OR public.is_admin()
);

DROP POLICY IF EXISTS "tickets_update_policy" ON public.tickets;
CREATE POLICY "tickets_update_policy" ON public.tickets
FOR UPDATE USING (
  client_id = auth.uid() OR public.is_admin()
);

-- 8.3 TICKET STATUS HISTORY POLICIES
DROP POLICY IF EXISTS "history_select_policy" ON public.ticket_status_history;
CREATE POLICY "history_select_policy" ON public.ticket_status_history
FOR SELECT USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.tickets
    WHERE tickets.id = ticket_status_history.ticket_id
      AND tickets.client_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "history_insert_policy" ON public.ticket_status_history;
CREATE POLICY "history_insert_policy" ON public.ticket_status_history
FOR INSERT WITH CHECK (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.tickets
    WHERE tickets.id = ticket_status_history.ticket_id
      AND tickets.client_id = auth.uid()
  )
);

-- 8.4 TICKET NOTES POLICIES
DROP POLICY IF EXISTS "notes_select_policy" ON public.ticket_notes;
CREATE POLICY "notes_select_policy" ON public.ticket_notes
FOR SELECT USING (
  public.is_admin() OR (
    is_internal = false AND EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_notes.ticket_id
        AND tickets.client_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "notes_insert_policy" ON public.ticket_notes;
CREATE POLICY "notes_insert_policy" ON public.ticket_notes
FOR INSERT WITH CHECK (
  public.is_admin() OR (
    is_internal = false AND author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_notes.ticket_id
        AND tickets.client_id = auth.uid()
    )
  )
);

-- ==============================================================================
-- 9. ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_ticket_id ON public.ticket_status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket_id ON public.ticket_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 10. GUÍA RÁPIDA: CÓMO ASIGNAR EL PRIMER ADMINISTRADOR
-- ==============================================================================
-- Una vez registrado el primer usuario administrador en la plataforma o vía Supabase Auth,
-- ejecuta la siguiente sentencia en el SQL Editor para otorgarle rol de administrador:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'tu_correo_admin@empresa.com';
