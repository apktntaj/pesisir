/**
 * Shipment Validation Schema
 *
 * Following HtDP principles:
 * 1. Data Definition - using Zod schemas
 * 2. Examples - test cases for validation
 * 3. Template - consistent validation patterns
 */

import { z } from "zod";

// =============================================================================
// DATA DEFINITIONS (Schemas)
// =============================================================================

/**
 * ShipmentStatus - enum of valid shipment statuses
 * Workflow: created → sailing → pre_arrival → arrived → clearing → released → delivered
 */
export const ShipmentStatusSchema = z.enum([
  "created",
  "sailing",
  "pre_arrival",
  "arrived",
  "clearing",
  "released",
  "delivered",
]);
export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>;

/**
 * ShipmentVariant - FCL (Full Container Load) or LCL (Less than Container Load)
 */
export const ShipmentVariantSchema = z.enum(["FCL", "LCL"]);
export type ShipmentVariant = z.infer<typeof ShipmentVariantSchema>;

/**
 * Indonesian phone number format
 * Accepts: 08xxx, +628xxx, 628xxx
 * Normalizes to: 628xxx
 */
export const phoneNumberSchema = z
  .string()
  .regex(/^(\+?62|0)8[1-9][0-9]{7,10}$/, {
    message: "Nomor HP tidak valid. Contoh: 081234567890 atau +6281234567890",
  })
  .transform((val) => {
    // Normalize to 628xxx format
    if (val.startsWith("+62")) return val.slice(1);
    if (val.startsWith("0")) return "62" + val.slice(1);
    return val;
  });

/**
 * BL Number - Bill of Lading number
 * Format varies by carrier but typically alphanumeric, 10-20 chars
 */
export const blNumberSchema = z
  .string()
  .min(4, "BL Number minimal 4 karakter")
  .max(50, "BL Number maksimal 50 karakter")
  .regex(/^[A-Z0-9\-\/]+$/i, {
    message: "BL Number hanya boleh huruf, angka, strip, dan slash",
  });

/**
 * CreateShipmentInput - data untuk membuat shipment baru
 * Required: bl_number, shipper, consignee, pod, variant
 */
export const CreateShipmentSchema = z.object({
  bl_number: blNumberSchema,
  ref: z.string().max(100).optional(),
  shipper: z.string().min(1, "Shipper wajib diisi").max(255),
  shipper_address: z.string().max(500).optional(),
  consignee: z.string().min(1, "Consignee wajib diisi").max(255),
  consignee_address: z.string().max(500).optional(),
  third_party: z.string().max(255).optional(),
  third_party_address: z.string().max(500).optional(),
  voyage: z.string().max(100).optional(),
  vessel: z.string().max(255).optional(),
  pol: z.string().max(100).optional(),
  pod: z.string().min(1, "Port of Discharge wajib diisi").max(100),
  description: z.string().max(1000).optional(),
  variant: ShipmentVariantSchema,
  volume: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;

/**
 * UpdateShipmentInput - partial update, BL number cannot be changed
 */
export const UpdateShipmentSchema = CreateShipmentSchema.partial().omit({
  bl_number: true,
});
export type UpdateShipmentInput = z.infer<typeof UpdateShipmentSchema>;

/**
 * UpdateStatusInput - for status change with optional notes
 */
export const UpdateStatusSchema = z.object({
  status: ShipmentStatusSchema,
  notes: z.string().max(500).optional(),
});
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

/**
 * WASubscriber - WhatsApp notification recipient
 */
export const WASubscriberSchema = z.object({
  phone_number: phoneNumberSchema,
  label: z.string().max(100).optional(),
});
export type WASubscriberInput = z.infer<typeof WASubscriberSchema>;

// =============================================================================
// EXAMPLES / TEST CASES
// Following HtDP - examples before implementation
// =============================================================================

/** Valid shipment input example */
export const VALID_SHIPMENT_EXAMPLE: CreateShipmentInput = {
  bl_number: "OOLU1234567890",
  shipper: "PT ABC Export",
  consignee: "PT XYZ Import",
  pod: "IDJKT", // Jakarta
  variant: "FCL",
  vessel: "EVER GIVEN",
  voyage: "V001E",
  pol: "CNSHA", // Shanghai
};

/** Minimal valid shipment */
export const MINIMAL_SHIPMENT_EXAMPLE: CreateShipmentInput = {
  bl_number: "BL-001",
  shipper: "Shipper A",
  consignee: "Consignee B",
  pod: "IDJKT",
  variant: "LCL",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Status display names in Indonesian
 */
export const STATUS_DISPLAY_NAMES: Record<ShipmentStatus, string> = {
  created: "Dibuat",
  sailing: "Berlayar",
  pre_arrival: "Mendekati",
  arrived: "Tiba",
  clearing: "Proses Bea Cukai",
  released: "Selesai Customs",
  delivered: "Terkirim",
};

/**
 * Status workflow order
 */
export const STATUS_ORDER: ShipmentStatus[] = [
  "created",
  "sailing",
  "pre_arrival",
  "arrived",
  "clearing",
  "released",
  "delivered",
];

/**
 * Get next valid statuses from current status
 */
export function getNextValidStatuses(
  current: ShipmentStatus
): ShipmentStatus[] {
  const currentIndex = STATUS_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === STATUS_ORDER.length - 1) {
    return [];
  }
  // Allow moving to any subsequent status (skip statuses allowed in real world)
  return STATUS_ORDER.slice(currentIndex + 1);
}

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(
  from: ShipmentStatus,
  to: ShipmentStatus
): boolean {
  const fromIndex = STATUS_ORDER.indexOf(from);
  const toIndex = STATUS_ORDER.indexOf(to);
  // Only forward transitions allowed
  return toIndex > fromIndex;
}
