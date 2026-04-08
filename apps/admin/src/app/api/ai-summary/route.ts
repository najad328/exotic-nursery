import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { formatPrice } from "@exotic-nursery/utils";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";

// Fetch all business data from Supabase and build a context string
async function getBusinessContext() {
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Today's orders
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("id, status, total_paise, created_at, delivery_name, delivery_city")
    .gte("created_at", `${todayStr}T00:00:00`)
    .order("created_at", { ascending: false });

  // Last 7 days orders
  const { data: weekOrders } = await supabase
    .from("orders")
    .select("id, status, total_paise, created_at")
    .gte("created_at", last7Days);

  // Last 30 days orders
  const { data: monthOrders } = await supabase
    .from("orders")
    .select("id, status, total_paise, created_at")
    .gte("created_at", last30Days);

  // All pending/processing orders
  const { data: activeOrders } = await supabase
    .from("orders")
    .select("id, status, total_paise, created_at, delivery_name, delivery_city")
    .in("status", ["pending", "confirmed", "processing"])
    .order("created_at", { ascending: false });

  // Top selling plants (all time)
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("plant_name, quantity, price_paise");

  const plantSales = new Map<string, { name: string; sold: number; revenue: number }>();
  for (const item of orderItems ?? []) {
    const existing = plantSales.get(item.plant_name) ?? { name: item.plant_name, sold: 0, revenue: 0 };
    existing.sold += item.quantity;
    existing.revenue += item.quantity * item.price_paise;
    plantSales.set(item.plant_name, existing);
  }
  const topPlants = Array.from(plantSales.values())
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10);

  // Inventory
  const { data: plants } = await supabase
    .from("plants")
    .select("name, stock_quantity, price_paise, is_active")
    .eq("is_active", true)
    .order("stock_quantity", { ascending: true })
    .limit(50);

  const lowStockPlants = (plants ?? []).filter((p) => p.stock_quantity <= 3);

  // Customer count
  const { count: totalCustomers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const order of monthOrders ?? []) {
    statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
  }

  // Revenue calculations
  const todayRevenue = (todayOrders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total_paise, 0);
  const weekRevenue = (weekOrders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total_paise, 0);
  const monthRevenue = (monthOrders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total_paise, 0);

  // Build context
  const lines: string[] = [
    `=== BUSINESS DATA SNAPSHOT (${today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}) ===`,
    "",
    `--- TODAY ---`,
    `Orders today: ${todayOrders?.length ?? 0}`,
    `Revenue today: ${formatPrice(todayRevenue)}`,
    ...(todayOrders ?? []).map(
      (o) => `  • Order ${o.id.slice(0, 8).toUpperCase()} — ${o.delivery_name}, ${o.delivery_city} — ${formatPrice(o.total_paise)} — ${o.status}`
    ),
    "",
    `--- THIS WEEK (Last 7 days) ---`,
    `Orders: ${weekOrders?.length ?? 0}`,
    `Revenue: ${formatPrice(weekRevenue)}`,
    "",
    `--- THIS MONTH (Last 30 days) ---`,
    `Orders: ${monthOrders?.length ?? 0}`,
    `Revenue: ${formatPrice(monthRevenue)}`,
    `Status breakdown: ${Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(", ")}`,
    "",
    `--- ACTIVE ORDERS (Need attention) ---`,
    `Total active: ${activeOrders?.length ?? 0}`,
    ...(activeOrders ?? []).slice(0, 15).map(
      (o) => `  • ${o.id.slice(0, 8).toUpperCase()} — ${o.delivery_name} (${o.delivery_city}) — ${formatPrice(o.total_paise)} — ${o.status} — ${new Date(o.created_at).toLocaleDateString("en-IN")}`
    ),
    "",
    `--- TOP SELLING PLANTS ---`,
    ...topPlants.map((p, i) => `  ${i + 1}. ${p.name} — ${p.sold} units sold — ${formatPrice(p.revenue)} revenue`),
    "",
    `--- LOW STOCK ALERTS (≤3 units) ---`,
    lowStockPlants.length === 0
      ? "  No low stock items"
      : lowStockPlants.map((p) => `  ⚠ ${p.name} — ${p.stock_quantity} left — ${formatPrice(p.price_paise)}`).join("\n"),
    "",
    `--- OVERVIEW ---`,
    `Total customers: ${totalCustomers ?? 0}`,
    `Active catalog: ${plants?.length ?? 0} plants`,
    `Average order value (month): ${(monthOrders?.length ?? 0) > 0 ? formatPrice(Math.round(monthRevenue / (monthOrders?.length ?? 1))) : "N/A"}`,
  ];

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are an AI business analyst for "Exotic Nursery", a rare and exotic plants e-commerce business in India. You help the admin owner understand their business performance.

When providing a daily summary, structure it as:
1. **Quick Overview** — A 1-2 sentence summary of how the business is doing
2. **Today's Performance** — Orders, revenue, notable orders
3. **Action Items** — Pending orders that need attention, low stock alerts
4. **Trends** — What's selling well, comparisons with previous periods
5. **Recommendations** — Actionable suggestions based on the data

Rules:
- Always use Indian Rupee (₹) for currency — values are already formatted
- Be concise but insightful — highlight what matters
- Flag urgent items (pending orders, low stock)
- When asked questions, answer based on the data provided
- If the data doesn't contain enough info to answer, say so
- Use bullet points and bold text for readability (Markdown format)
- Be encouraging and professional`;

export async function POST(request: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { messages: chatMessages, type } = body as {
      messages?: { role: string; content: string }[];
      type?: "summary" | "chat";
    };

    // Fetch fresh business data
    const businessContext = await getBusinessContext();

    // Build messages for Groq
    const messages: { role: string; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "system",
        content: `Here is the current business data:\n\n${businessContext}`,
      },
    ];

    if (type === "summary" || !chatMessages?.length) {
      messages.push({
        role: "user",
        content:
          "Give me today's business summary. Include: orders received, revenue, top orders, trending plants, pending orders needing attention, and any recommendations.",
      });
    } else {
      // Chat mode — include conversation history
      for (const msg of chatMessages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.5,
        max_tokens: 2048,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate AI response" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("AI summary error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
