"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Profile } from "@/types/database";

// =============================================================================
// TYPES
// =============================================================================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// =============================================================================
// VALIDATION
// =============================================================================

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(255),
  phone: z
    .string()
    .regex(/^(\+?62|0)?8[1-9][0-9]{7,10}$/, {
      message: "Nomor HP tidak valid",
    })
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<ActionResult<Profile>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      // Profile might not exist yet, create one
      if (error.code === "PGRST116") {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({ id: user.id })
          .select()
          .single();

        if (createError) {
          console.error("Create profile error:", createError);
          return { success: false, error: createError.message };
        }

        return { success: true, data: newProfile as Profile };
      }

      console.error("getProfile error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Profile };
  } catch (e) {
    console.error("getProfile exception:", e);
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

/**
 * Update user's profile
 */
export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult<Profile>> {
  try {
    // Validate input
    const validated = UpdateProfileSchema.safeParse(input);
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

    // Normalize phone number
    let phone = validated.data.phone;
    if (phone) {
      if (phone.startsWith("+62")) {
        phone = phone.slice(1); // Remove +
      } else if (phone.startsWith("0")) {
        phone = "62" + phone.slice(1);
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: validated.data.name,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("updateProfile error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/settings/profile");

    return { success: true, data: data as Profile };
  } catch (e) {
    console.error("updateProfile exception:", e);
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}
