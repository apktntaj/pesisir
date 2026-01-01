"use server";

/**
 * Shipment Server Actions
 *
 * Following HtDP:
 * 1. Purpose - each function has clear purpose
 * 2. Contract - input/output types defined
 * 3. Examples - validation schemas include examples
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CreateShipmentSchema,
  UpdateShipmentSchema,
  UpdateStatusSchema,
  type CreateShipmentInput,
  type UpdateShipmentInput,
  type UpdateStatusInput,
  isValidStatusTransition,
} from "@/lib/validations/shipment";
import type { Shipment, ShipmentStatus } from "@/types/database";

// =============================================================================
// TYPES
// =============================================================================

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// =============================================================================
// READ OPERATIONS
// =============================================================================

export interface ShipmentsFilter {
  search?: string;
  status?: string;
  variant?: string;
}

/**
 * Get all shipments for current user with optional filters
 * Sorted by created_at DESC (newest first)
 */
export async function getShipments(
  filters?: ShipmentsFilter
): Promise<ActionResult<Shipment[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    let query = supabase
      .from("shipments")
      .select("*")
      .eq("user_id", user.id);

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.variant) {
      query = query.eq("variant", filters.variant);
    }

    if (filters?.search) {
      // Search in multiple columns using OR
      query = query.or(
        `bl_number.ilike.%${filters.search}%,shipper.ilike.%${filters.search}%,consignee.ilike.%${filters.search}%,ref.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("getShipments error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Shipment[] };
  } catch (e) {
    console.error("getShipments exception:", e);
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

/**
 * Get single shipment by ID with related data
 */
export async function getShipmentById(
  id: string
): Promise<ActionResult<Shipment>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("shipments")
      .select(
        `
        *,
        status_histories (
          id,
          status,
          notes,
          changed_at,
          changed_by
        ),
        documents (
          id,
          category,
          file_name,
          file_path,
          file_size,
          mime_type,
          created_at
        ),
        wa_subscribers (
          id,
          phone_number,
          label,
          is_active,
          created_at
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Shipment tidak ditemukan" };
      }
      console.error("getShipmentById error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Shipment };
  } catch (e) {
    console.error("getShipmentById exception:", e);
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

// =============================================================================
// WRITE OPERATIONS
// =============================================================================

/**
 * Create new shipment
 * Auto-creates initial status history entry
 */
export async function createShipment(
  input: CreateShipmentInput
): Promise<ActionResult<Shipment>> {
  try {
    // Validate input
    const validated = CreateShipmentSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Data tidak valid",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check for duplicate BL number
    const { data: existing } = await supabase
      .from("shipments")
      .select("id")
      .eq("user_id", user.id)
      .eq("bl_number", validated.data.bl_number)
      .single();

    if (existing) {
      return { success: false, error: "BL Number sudah terdaftar" };
    }

    // Create shipment
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        ...validated.data,
        user_id: user.id,
        status: "created",
      })
      .select()
      .single();

    if (error) {
      console.error("createShipment error:", error);
      return { success: false, error: error.message };
    }

    // Create initial status history
    await supabase.from("status_histories").insert({
      shipment_id: data.id,
      status: "created",
      changed_by: user.id,
      notes: "Shipment dibuat",
    });

    revalidatePath("/shipments");

    return { success: true, data: data as Shipment };
  } catch (e) {
    console.error("createShipment exception:", e);
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

/**
 * Update shipment data (not status)
 */
export async function updateShipment(
  id: string,
  input: UpdateShipmentInput
): Promise<ActionResult<Shipment>> {
  try {
    // Validate input
    const validated = UpdateShipmentSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Data tidak valid",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("shipments")
      .update({
        ...validated.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Shipment tidak ditemukan" };
      }
      console.error("updateShipment error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/shipments");
    revalidatePath(`/shipments/${id}`);

    return { success: true, data: data as Shipment };
  } catch (e) {
    console.error("updateShipment exception:", e);
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

/**
 * Update shipment status
 * Validates status transition and creates history entry
 */
export async function updateShipmentStatus(
  id: string,
  input: UpdateStatusInput
): Promise<ActionResult<Shipment>> {
  try {
    // Validate input
    const validated = UpdateStatusSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Data tidak valid",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get current shipment
    const { data: current, error: fetchError } = await supabase
      .from("shipments")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !current) {
      return { success: false, error: "Shipment tidak ditemukan" };
    }

    // Validate status transition
    const currentStatus = current.status as ShipmentStatus;
    if (!isValidStatusTransition(currentStatus, validated.data.status)) {
      return {
        success: false,
        error: `Tidak dapat mengubah status dari ${currentStatus} ke ${validated.data.status}`,
      };
    }

    // Update status
    const { data, error } = await supabase
      .from("shipments")
      .update({
        status: validated.data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("updateShipmentStatus error:", error);
      return { success: false, error: error.message };
    }

    // Create status history entry
    await supabase.from("status_histories").insert({
      shipment_id: id,
      status: validated.data.status,
      notes: validated.data.notes,
      changed_by: user.id,
    });

    revalidatePath("/shipments");
    revalidatePath(`/shipments/${id}`);

    return { success: true, data: data as Shipment };
  } catch (e) {
    console.error("updateShipmentStatus exception:", e);
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

/**
 * Delete shipment
 * Cascades to status_histories, documents, wa_subscribers
 */
export async function deleteShipment(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("shipments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("deleteShipment error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/shipments");

    return { success: true, data: undefined };
  } catch (e) {
    console.error("deleteShipment exception:", e);
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}
