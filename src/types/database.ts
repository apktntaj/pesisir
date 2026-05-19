export type ShipmentStatus = 
  | 'created'
  | 'sailing'
  | 'pre_arrival'
  | 'arrived'
  | 'clearing'
  | 'released'
  | 'delivered';

export type ShipmentVariant = 'FCL' | 'LCL';

export type DocumentCategory = 
  | 'bill_of_lading'
  | 'invoice'
  | 'packing_list'
  | 'coo'
  | 'msds'
  | 'other';

export interface Profile {
  id: string;
  name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  user_id: string;
  bl_number: string;
  ref?: string;
  shipper: string;
  shipper_address?: string;
  consignee: string;
  consignee_address?: string;
  third_party?: string;
  third_party_address?: string;
  voyage?: string;
  vessel?: string;
  pol?: string;
  pod: string;
  description?: string;
  variant: ShipmentVariant;
  volume?: string;
  notes?: string;
  status: ShipmentStatus;
  bl_file_path?: string;
  created_at: string;
  updated_at: string;
  // Relations
  status_histories?: StatusHistory[];
  documents?: Document[];
  wa_subscribers?: WASubscriber[];
}

export interface StatusHistory {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  notes?: string;
  changed_at: string;
  changed_by?: string;
}

export interface Document {
  id: string;
  shipment_id: string;
  category: DocumentCategory;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface WASubscriber {
  id: string;
  shipment_id: string;
  phone_number: string;
  label?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomWorkflow {
  id: string;
  user_id: string;
  statuses: any; // JSONB
  created_at: string;
  updated_at: string;
}

// Input types for API
export interface CreateShipmentInput {
  bl_number: string;
  ref?: string;
  shipper: string;
  shipper_address?: string;
  consignee: string;
  consignee_address?: string;
  third_party?: string;
  third_party_address?: string;
  voyage?: string;
  vessel?: string;
  pol?: string;
  pod: string;
  description?: string;
  variant: ShipmentVariant;
  volume?: string;
  notes?: string;
  bl_file_path?: string;
  subscribers?: Array<{
    phone_number: string;
    label?: string;
  }>;
}

export interface UpdateShipmentInput extends Partial<Omit<CreateShipmentInput, 'bl_number' | 'subscribers'>> {}

export interface UpdateStatusInput {
  status: ShipmentStatus;
  notes?: string;
}
