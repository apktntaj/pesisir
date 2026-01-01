import { EditShipmentForm } from "./edit-form";

export default async function EditShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EditShipmentForm shipmentId={id} />;
}
