import { notFound } from "next/navigation";
import Link from "next/link";
import { getShipmentById } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STATUS_DISPLAY_NAMES,
  STATUS_ORDER,
  type ShipmentStatus,
} from "@/lib/validations/shipment";
import { UpdateStatusForm } from "./update-status-form";

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

function EditIcon({ className }: { className?: string }) {
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
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function statusToBadgeVariant(
  status: ShipmentStatus
):
  | "created"
  | "sailing"
  | "pre-arrival"
  | "arrived"
  | "clearing"
  | "released"
  | "delivered" {
  const variants: Record<
    ShipmentStatus,
    | "created"
    | "sailing"
    | "pre-arrival"
    | "arrived"
    | "clearing"
    | "released"
    | "delivered"
  > = {
    created: "created",
    sailing: "sailing",
    pre_arrival: "pre-arrival",
    arrived: "arrived",
    clearing: "clearing",
    released: "released",
    delivered: "delivered",
  };
  return variants[status];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getShipmentById(id);

  if (!result.success) {
    notFound();
  }

  const shipment = result.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/shipments">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {shipment.bl_number}
              </h1>
              <Badge variant={statusToBadgeVariant(shipment.status)}>
                {STATUS_DISPLAY_NAMES[shipment.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {shipment.ref && `Ref: ${shipment.ref} • `}
              Dibuat {formatDate(shipment.created_at)}
            </p>
          </div>
        </div>
        <Link href={`/shipments/${id}/edit`}>
          <Button variant="outline">
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Pihak Terkait</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-muted-foreground">Shipper</p>
                <p className="font-semibold">{shipment.shipper}</p>
                {shipment.shipper_address && (
                  <p className="text-sm text-muted-foreground">
                    {shipment.shipper_address}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Consignee</p>
                <p className="font-semibold">{shipment.consignee}</p>
                {shipment.consignee_address && (
                  <p className="text-sm text-muted-foreground">
                    {shipment.consignee_address}
                  </p>
                )}
              </div>
              {shipment.third_party && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Notify Party
                  </p>
                  <p className="font-semibold">{shipment.third_party}</p>
                  {shipment.third_party_address && (
                    <p className="text-sm text-muted-foreground">
                      {shipment.third_party_address}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voyage Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pelayaran</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-muted-foreground">Vessel</p>
                <p>{shipment.vessel || "—"}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Voyage</p>
                <p>{shipment.voyage || "—"}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  Port of Loading
                </p>
                <p>{shipment.pol || "—"}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  Port of Discharge
                </p>
                <p>{shipment.pod}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Tipe</p>
                <p>{shipment.variant}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Volume</p>
                <p>{shipment.volume || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {(shipment.description || shipment.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Tambahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shipment.description && (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Deskripsi Barang
                    </p>
                    <p className="whitespace-pre-wrap">{shipment.description}</p>
                  </div>
                )}
                {shipment.notes && (
                  <div>
                    <p className="font-medium text-muted-foreground">Catatan</p>
                    <p className="whitespace-pre-wrap">{shipment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <UpdateStatusForm
                shipmentId={shipment.id}
                currentStatus={shipment.status}
              />
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {STATUS_ORDER.map((status, index) => {
                  const currentIndex = STATUS_ORDER.indexOf(shipment.status);
                  const isPast = index <= currentIndex;
                  const isCurrent = status === shipment.status;
                  const historyEntry = shipment.status_histories?.find(
                    (h) => h.status === status
                  );

                  return (
                    <div key={status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            isCurrent
                              ? "bg-primary ring-4 ring-primary/20"
                              : isPast
                                ? "bg-primary"
                                : "bg-muted"
                          }`}
                        />
                        {index < STATUS_ORDER.length - 1 && (
                          <div
                            className={`h-full w-0.5 ${
                              isPast && index < currentIndex
                                ? "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        )}
                      </div>
                      <div className="pb-4">
                        <p
                          className={`font-medium ${
                            isPast ? "" : "text-muted-foreground"
                          }`}
                        >
                          {STATUS_DISPLAY_NAMES[status]}
                        </p>
                        {historyEntry && (
                          <p className="text-xs text-muted-foreground">
                            {formatDate(historyEntry.changed_at)}
                          </p>
                        )}
                        {historyEntry?.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {historyEntry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
