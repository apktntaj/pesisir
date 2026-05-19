import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_DISPLAY_NAMES, STATUS_ORDER, type ShipmentStatus } from "@/lib/validations/shipment";

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

function ShipIcon({ className }: { className?: string }) {
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
      <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
      <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
      <path d="M12 10v4" />
      <path d="M12 2v3" />
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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  // Get shipment stats
  const { data: shipments } = await supabase
    .from("shipments")
    .select("id, bl_number, status, shipper, consignee, pod, created_at")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  // Calculate stats
  const totalShipments = shipments?.length || 0;
  const statusCounts = (shipments || []).reduce(
    (acc, s) => {
      acc[s.status as ShipmentStatus] = (acc[s.status as ShipmentStatus] || 0) + 1;
      return acc;
    },
    {} as Record<ShipmentStatus, number>
  );

  const activeShipments = totalShipments - (statusCounts.delivered || 0);
  const recentShipments = shipments?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Selamat Datang{profile?.name ? `, ${profile.name}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <Link href="/shipments/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Shipment
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <ShipIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShipments}</div>
            <p className="text-xs text-muted-foreground">
              Semua shipment terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeShipments}</div>
            <p className="text-xs text-muted-foreground">
              Dalam proses pengiriman
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.delivered || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sudah terkirim
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {STATUS_ORDER.map((status) => (
              <Link
                key={status}
                href={`/shipments?status=${status}`}
                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <Badge variant={statusToBadgeVariant(status)}>
                  {statusCounts[status] || 0}
                </Badge>
                <span className="text-sm">{STATUS_DISPLAY_NAMES[status]}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Shipments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Shipments Terbaru</CardTitle>
          <Link href="/shipments">
            <Button variant="ghost" size="sm">
              Lihat Semua
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentShipments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Belum ada shipment. Buat shipment pertama Anda!
            </p>
          ) : (
            <div className="space-y-4">
              {recentShipments.map((shipment) => (
                <Link
                  key={shipment.id}
                  href={`/shipments/${shipment.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{shipment.bl_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {shipment.shipper} → {shipment.consignee}
                    </p>
                  </div>
                  <Badge variant={statusToBadgeVariant(shipment.status as ShipmentStatus)}>
                    {STATUS_DISPLAY_NAMES[shipment.status as ShipmentStatus]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
