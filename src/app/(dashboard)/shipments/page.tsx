import Link from "next/link";
import { Suspense } from "react";
import { getShipments, type ShipmentsFilter } from "./actions";
import { ShipmentsFilter as FilterComponent } from "./shipments-filter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_DISPLAY_NAMES, type ShipmentStatus } from "@/lib/validations/shipment";

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function statusToBadgeVariant(status: ShipmentStatus) {
  const variants: Record<ShipmentStatus, "created" | "sailing" | "pre-arrival" | "arrived" | "clearing" | "released" | "delivered"> = {
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

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    variant?: string;
  }>;
}

export default async function ShipmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters: ShipmentsFilter = {
    search: params.search,
    status: params.status,
    variant: params.variant,
  };

  const result = await getShipments(filters);

  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  const shipments = result.data;
  const hasFilters = params.search || params.status || params.variant;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
          <p className="text-muted-foreground">
            {shipments.length} shipment{hasFilters ? " ditemukan" : ""}
          </p>
        </div>
        <Link href="/shipments/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Shipment
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 animate-pulse bg-muted rounded" />}>
        <FilterComponent />
      </Suspense>

      {shipments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <p className="mb-4 text-muted-foreground">
              {hasFilters
                ? "Tidak ada shipment yang cocok dengan filter."
                : "Belum ada shipment. Buat shipment pertama Anda!"}
            </p>
            {!hasFilters && (
              <Link href="/shipments/new">
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Tambah Shipment
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shipments.map((shipment) => (
            <Link key={shipment.id} href={`/shipments/${shipment.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{shipment.bl_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {shipment.ref && `Ref: ${shipment.ref} • `}
                        {shipment.vessel && `${shipment.vessel} `}
                        {shipment.voyage && `(${shipment.voyage})`}
                      </p>
                    </div>
                    <Badge variant={statusToBadgeVariant(shipment.status)}>
                      {STATUS_DISPLAY_NAMES[shipment.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <p className="font-medium text-muted-foreground">Shipper</p>
                      <p className="truncate">{shipment.shipper}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Consignee</p>
                      <p className="truncate">{shipment.consignee}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Route</p>
                      <p>
                        {shipment.pol || "—"} → {shipment.pod}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Type</p>
                      <p>{shipment.variant}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
