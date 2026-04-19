import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = {
  title: "Notifications | Exotic Nursery Admin",
};

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch recent notification log
  const { data: logs } = await (supabase.from("notification_log" as "orders") as unknown as {
    select: (cols: string) => {
      order: (col: string, opts: { ascending: boolean }) => {
        limit: (n: number) => Promise<{ data: unknown[] | null }>;
      };
    };
  })
    .select("*")
    .order("sent_at" as "created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Push Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            Send notifications to customers and view history
          </p>
        </div>
      </div>

      <NotificationsClient initialLogs={(logs ?? []) as NotificationLog[]} />
    </div>
  );
}

export interface NotificationLog {
  id: string;
  type: string;
  title: string;
  body: string;
  user_id: string | null;
  order_id: string | null;
  plant_id: string | null;
  is_broadcast: boolean;
  status: "sent" | "failed";
  recipient_count: number;
  sent_at: string;
}
