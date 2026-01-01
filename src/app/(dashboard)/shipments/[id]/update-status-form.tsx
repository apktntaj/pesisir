"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateShipmentStatus } from "../actions";
import {
  STATUS_DISPLAY_NAMES,
  getNextValidStatuses,
  type ShipmentStatus,
} from "@/lib/validations/shipment";

interface UpdateStatusFormProps {
  shipmentId: string;
  currentStatus: ShipmentStatus;
}

export function UpdateStatusForm({
  shipmentId,
  currentStatus,
}: UpdateStatusFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = getNextValidStatuses(currentStatus);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as ShipmentStatus;
    const notes = formData.get("notes") as string;

    const result = await updateShipmentStatus(shipmentId, {
      status,
      notes: notes || undefined,
    });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.refresh();
    setIsLoading(false);
  }

  if (nextStatuses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Shipment sudah mencapai status akhir (Terkirim).
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="status">Status Baru</Label>
        <Select id="status" name="status" required>
          <option value="">Pilih status...</option>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {STATUS_DISPLAY_NAMES[status]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Tambahkan catatan untuk perubahan status"
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Mengupdate..." : "Update Status"}
      </Button>
    </form>
  );
}
