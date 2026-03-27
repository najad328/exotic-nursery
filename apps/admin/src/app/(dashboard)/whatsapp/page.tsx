import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { WhatsAppTemplatesClient } from "./WhatsAppTemplatesClient";

export const dynamic = "force-dynamic";

export default async function WhatsAppPage() {
  const supabase = await createSupabaseServerClient();

  const { data: templates, error } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .order("sort_order");

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load templates: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">WhatsApp Templates</h2>
        <p className="text-gray-500 text-sm mt-1">
          Manage message templates for customer communication. Click any template to copy a ready-to-send message.
        </p>
      </div>

      <WhatsAppTemplatesClient templates={templates ?? []} />
    </div>
  );
}
