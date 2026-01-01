"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { STATUS_DISPLAY_NAMES, STATUS_ORDER, type ShipmentStatus } from "@/lib/validations/shipment";

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function ShipmentsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const variant = searchParams.get("variant") || "";

  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });

      return newParams.toString();
    },
    [searchParams]
  );

  const updateFilter = (key: string, value: string) => {
    startTransition(() => {
      const query = createQueryString({ [key]: value });
      router.push(`/shipments${query ? `?${query}` : ""}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push("/shipments");
    });
  };

  const hasFilters = search || status || variant;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari BL Number, Shipper, Consignee..."
          className="pl-9"
          defaultValue={search}
          onChange={(e) => {
            const value = e.target.value;
            // Debounce search
            const timeout = setTimeout(() => {
              updateFilter("search", value);
            }, 300);
            return () => clearTimeout(timeout);
          }}
        />
      </div>

      {/* Status Filter */}
      <Select
        className="w-full sm:w-40"
        value={status}
        onChange={(e) => updateFilter("status", e.target.value)}
      >
        <option value="">Semua Status</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_DISPLAY_NAMES[s as ShipmentStatus]}
          </option>
        ))}
      </Select>

      {/* Variant Filter */}
      <Select
        className="w-full sm:w-32"
        value={variant}
        onChange={(e) => updateFilter("variant", e.target.value)}
      >
        <option value="">Semua Tipe</option>
        <option value="FCL">FCL</option>
        <option value="LCL">LCL</option>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={isPending}
        >
          <XIcon className="mr-1 h-4 w-4" />
          Reset
        </Button>
      )}

      {isPending && (
        <span className="text-sm text-muted-foreground">Loading...</span>
      )}
    </div>
  );
}
