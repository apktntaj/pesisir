"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createShipment } from "../actions";
import {
  CreateShipmentSchema,
  type CreateShipmentInput,
} from "@/lib/validations/shipment";

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

type FormErrors = Partial<Record<keyof CreateShipmentInput | "root", string>>;

export default function NewShipmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data: CreateShipmentInput = {
      bl_number: formData.get("bl_number") as string,
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
    const validated = CreateShipmentSchema.safeParse(data);
    if (!validated.success) {
      const fieldErrors: FormErrors = {};
      validated.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateShipmentInput;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    // Server action
    const result = await createShipment(validated.data);

    if (!result.success) {
      setErrors({ root: result.error });
      setIsLoading(false);
      return;
    }

    router.push(`/shipments/${result.data.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/shipments">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Shipment</h1>
          <p className="text-muted-foreground">
            Masukkan data shipment baru
          </p>
        </div>
      </div>

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
              <Label htmlFor="bl_number">BL Number *</Label>
              <Input
                id="bl_number"
                name="bl_number"
                placeholder="OOLU1234567890"
                required
              />
              {errors.bl_number && (
                <p className="text-sm text-destructive">{errors.bl_number}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Reference Number</Label>
              <Input id="ref" name="ref" placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant">Tipe *</Label>
              <Select id="variant" name="variant" required defaultValue="FCL">
                <option value="FCL">FCL (Full Container Load)</option>
                <option value="LCL">LCL (Less than Container Load)</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume">Volume</Label>
              <Input id="volume" name="volume" placeholder="e.g., 1x40HC" />
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consignee">Consignee *</Label>
              <Input
                id="consignee"
                name="consignee"
                placeholder="Nama consignee"
                required
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="third_party">Notify Party</Label>
              <Input
                id="third_party"
                name="third_party"
                placeholder="Nama pihak ketiga"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="third_party_address">Alamat Notify Party</Label>
              <Input
                id="third_party_address"
                name="third_party_address"
                placeholder="Alamat lengkap"
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
              <Input id="vessel" name="vessel" placeholder="Nama kapal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voyage">Voyage</Label>
              <Input id="voyage" name="voyage" placeholder="Nomor voyage" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pol">Port of Loading</Label>
              <Input id="pol" name="pol" placeholder="e.g., CNSHA (Shanghai)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pod">Port of Discharge *</Label>
              <Input
                id="pod"
                name="pod"
                placeholder="e.g., IDJKT (Jakarta)"
                required
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Catatan internal"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan Shipment"}
          </Button>
          <Link href="/shipments">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
