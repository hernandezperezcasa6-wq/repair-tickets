export type UserRole = 'client' | 'admin';
export type AccountStatus = 'active' | 'inactive';
export type TicketStatus = 'Pendiente' | 'En proceso' | 'Completado' | 'Cerrado';
export type TicketUrgency = 'Normal' | 'Urgente';
export type PhotoChannel = 'WhatsApp' | 'Telegram' | 'Ambos';
export type EquipmentType = 'Aire acondicionado' | 'Electricidad' | 'Fontanería' | 'Otro';

export interface Profile {
  id: string;
  full_name: string;
  email?: string | null;
  role: UserRole;
  contact_phone?: string | null;
  preferred_photo_channel: PhotoChannel;
  account_status: AccountStatus;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
  ticket_count?: number; // Calculado para la vista admin
}

export interface Ticket {
  id: string;
  ticket_number: string;
  client_id: string;
  location: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  equipment_type: EquipmentType;
  description: string;
  urgency: TicketUrgency;
  status: TicketStatus;
  assigned_technician?: string | null;
  photo_available: boolean;
  preferred_photo_channel: PhotoChannel;
  client_feedback?: string | null;
  created_at: string;
  updated_at: string;
  // Campos enriquecidos mediante join
  client?: Profile | null;
}

export interface TicketStatusHistory {
  id: string;
  ticket_id: string;
  old_status?: string | null;
  new_status: TicketStatus;
  changed_by?: string | null;
  notes?: string | null;
  created_at: string;
  changer?: Profile | null;
}

export interface TicketNote {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author?: Profile | null;
}
