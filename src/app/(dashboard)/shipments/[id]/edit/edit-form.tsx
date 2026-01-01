"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getShipmentById, updateShipment, deleteShipment } from "../../actions";
import {
  UpdateShipmentSchema,
  type UpdateShipmentInput,
} from "@/lib/validations/shipment";
import type { Shipment } from "@/types/database";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

type FormErrors = Partial<Record<keyof UpdateShipmentInput | "root", string>>;

interface EditShipmentFormProps {
  shipmentId: string;
}

export function EditShipmentForm({ shipmentId }: EditShipmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shipment, setShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    async function loadShipment() {
      const result = await getShipmentById(shipmentId);
      if (result.success) {
        setShipment(result.data);
      } else {
        setErrors({ root: result.error });
      }
      setIsLoading(false);
    }
    loadShipment();
  }, [shipmentId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data: UpdateShipmentInput = {
      ref: (formData.get("ref") as string) || undefined,
      shipper: formData.get("shipper") as string,
      shipper_address: (formData.get("shipper_address") as string) || undefined,
      consignee: formData.get("consignee") as string,
      consignee_address:
        (formData.get("consignee_address") as string) || undefined,
      third_party: (formData.get("third_party") as string) || undefined,
      third_party_address:
        (formData.get("third_party_address") as string) || undefined,
      vessel: (formData.get("vessel") as string) || undefined,
      voyage: (formData.get("voyage") as string) || undefined,
      pol: (formData.get("pol") as string) || undefined,
      pod: formData.get("pod") as string,
      description: (formData.get("description") as string) || undefined,
      variant: formData.get("variant") as "FCL" | "LCL",
      volume: (formData.get("volume") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    // Client-side validation
    const validated = UpdateShipmentSchema.safeParse(data);
    if (!validated.success) {
      const fieldErrors: FormErrors = {};
      validated.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof UpdateShipmentInput;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      setIsSaving(false);
      return;
    }

    // Server action
    const result = await updateShipment(shipmentId, validated.data);

    if (!result.success) {
      setErrors({ root: result.error });
      setIsSaving(false);
      return;
    }

    router.push(`/shipments/${shipmentId}`);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteShipment(shipmentId);

    if (!result.success) {
      setErrors({ root: result.error });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }

    router.push("/shipments");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive">{errors.root || "Shipment tidak ditemukan"}</p>
        <Link href="/shipments" className="mt-4">
          <Button variant="outline">Kembali ke Daftar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/shipments/${shipmentId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Shipment</h1>
            <p className="text-muted-foreground">
              BL: {shipment.bl_number}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Hapus
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Konfirmasi Hapus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Apakah Anda yakin ingin menghapus shipment{" "}
                <strong>{shipment.bl_number}</strong>? Tindakan ini tidak dapat
                dibatalkan.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.root && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {errors.root}
          </div>
        )}

        {/* BL Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Bill of Lading</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bl_number">BL Number</Label>
              <Input
                id="bl_number"
                name="bl_number"
                value={shipment.bl_number}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                BL Number tidak dapat diubah
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Reference Number</Label>
              <Input
                id="ref"
                name="ref"
                placeholder="Optional"
                defaultValue={shipment.ref || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant">Tipe *</Label>
              <Select
                id="variant"
                name="variant"
                required
                defaultValue={shipment.variant}
              >
                <option value="FCL">FCL (Full Container Load)</option>
                <option value="LCL">LCL (Less than Container Load)</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume">Volume</Label>
              <Input
                id="volume"
                name="volume"
                placeholder="e.g., 1x40HC"
                defaultValue={shipment.volume || ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Parties */}
        <Card>
          <CardHeader>
            <CardTitle>Pihak Terkait</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shipper">Shipper *</Label>
              <Input
                id="shipper"
                name="shipper"
                placeholder="Nama shipper"
                required
                defaultValue={shipment.shipper}
              />
              {errors.shipper && (
                <p className="text-sm text-destructive">{errors.shipper}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipper_address">Alamat Shipper</Label>
              <Input
                id="shipper_address"
                name="shipper_address"
                placeholder="Alamat lengkap"
                defaultValue={shipment.shipper_address || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consignee">Consignee *</Label>
              <Input
                id="consignee"
                name="consignee"
                placeholder="Nama consignee"
                required
                defaultValue={shipment.consignee}
              />
              {errors.consignee && (
                <p className="text-sm text-destructive">{errors.consignee}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="consignee_address">Alamat Consignee</Label>
              <Input
                id="consignee_address"
                name="consignee_address"
                placeholder="Alamat lengkap"
                defaultValue={shipment.consignee_address || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="third_party">Notify Party</Label>
              <Input
                id="third_party"
                name="third_party"
                placeholder="Nama pihak ketiga"
                defaultValue={shipment.third_party || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="third_party_address">Alamat Notify Party</Label>
              <Input
                id="third_party_address"
                name="third_party_address"
                placeholder="Alamat lengkap"
                defaultValue={shipment.third_party_address || ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Voyage Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pelayaran</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vessel">Vessel</Label>
              <Input
                id="vessel"
                name="vessel"
                placeholder="Nama kapal"
                defaultValue={shipment.vessel || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voyage">Voyage</Label>
              <Input
                id="voyage"
                name="voyage"
                placeholder="Nomor voyage"
                defaultValue={shipment.voyage || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pol">Port of Loading</Label>
              <Input
                id="pol"
                name="pol"
                placeholder="e.g., CNSHA (Shanghai)"
                defaultValue={shipment.pol || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pod">Port of Discharge *</Label>
              <Input
                id="pod"
                name="pod"
                placeholder="e.g., IDJKT (Jakarta)"
                required
                defaultValue={shipment.pod}
              />
              {errors.pod && (
                <p className="text-sm text-destructive">{errors.pod}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Tambahan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Barang</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Deskripsi barang yang dikirim"
                rows={3}
                defaultValue={shipment.description || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Catatan internal"
                rows={2}
                defaultValue={shipment.notes || ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <Link href={`/shipments/${shipmentId}`}>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
