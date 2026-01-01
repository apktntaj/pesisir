import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="sm:pl-64">
        <Navbar userEmail={user.email || ""} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
