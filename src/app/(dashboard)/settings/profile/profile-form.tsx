"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile, updateProfile, type UpdateProfileInput } from "../actions";
import type { Profile } from "@/types/database";

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const result = await getProfile();
      if (result.success) {
        setProfile(result.data);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data: UpdateProfileInput = {
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || undefined,
    };

    const result = await updateProfile(data);

    if (!result.success) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    setProfile(result.data);
    setSuccess(true);
    setIsSaving(false);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-muted-foreground">Memuat data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Informasi dasar profil Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              Profile berhasil diupdate!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nama *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nama lengkap"
              defaultValue={profile?.name || ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nomor WhatsApp</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="08123456789"
              defaultValue={profile?.phone || ""}
            />
            <p className="text-xs text-muted-foreground">
              Nomor ini akan digunakan sebagai default untuk notifikasi
            </p>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
