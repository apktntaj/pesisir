import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mt-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Selamat Datang!</h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            {profile?.name && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Nama:</span> {profile.name}
              </p>
            )}
            {profile?.phone && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">WhatsApp:</span> {profile.phone}
              </p>
            )}
          </div>
          <div className="mt-6">
            <p className="text-sm text-gray-500">
              🚀 Authentication system berhasil! Dashboard ini protected dan hanya bisa diakses setelah login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
