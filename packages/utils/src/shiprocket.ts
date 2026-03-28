/**
 * Shiprocket Integration Service
 *
 * Supports two modes:
 * - LIVE: Calls real Shiprocket API (requires SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD)
 * - MOCK: Returns realistic fake data for development/testing ($0 cost)
 *
 * Set SHIPROCKET_MODE=mock in env to use mock mode (default if no credentials).
 */

// ---------- Types ----------

export interface ShiprocketConfig {
  email: string;
  password: string;
  mode: "live" | "mock";
}

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string; // ISO date
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: ShiprocketOrderItem[];
  payment_method: "COD" | "Prepaid";
  sub_total: number; // in rupees
  length: number; // cm
  breadth: number; // cm
  height: number; // cm
  weight: number; // kg
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number; // rupees
}

export interface ShiprocketOrderResponse {
  order_id: string;
  shipment_id: string;
  status: string;
  status_code: number;
}

export interface ShiprocketAWBResponse {
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
  applied_weight: number;
  freight_charge: number;
  routing_code: string;
}

export interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: ShiprocketTrackEvent[];
    shipment_track_activities: ShiprocketTrackActivity[];
    track_url: string;
    etd: string; // estimated delivery date
  };
}

export interface ShiprocketTrackEvent {
  id: number;
  awb_code: string;
  courier_company_id: number;
  shipment_id: number;
  order_id: number;
  pickup_date: string;
  delivered_date: string;
  weight: string;
  packages: number;
  current_status: string;
  delivered_to: string;
  destination: string;
  consignee_name: string;
  origin: string;
  courier_agent_details: string | null;
  edd: string | null;
}

export interface ShiprocketTrackActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  "sr-status": string;
  "sr-status-label": string;
}

export type OurOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

// ---------- Status Mapping ----------

const SHIPROCKET_STATUS_MAP: Record<number, OurOrderStatus> = {
  1: "processing",    // AWB Assigned
  2: "processing",    // Ready to Ship
  3: "shipped",       // Picked Up
  4: "shipped",       // In Transit
  5: "shipped",       // In Transit (hub)
  6: "out_for_delivery", // Out for Delivery
  7: "delivered",     // Delivered
  8: "cancelled",     // Cancelled
  9: "cancelled",     // RTO Initiated
  10: "cancelled",    // RTO Delivered
};

export function mapShiprocketStatusToOrderStatus(
  shiprocketStatusCode: number
): OurOrderStatus {
  return SHIPROCKET_STATUS_MAP[shiprocketStatusCode] ?? "shipped";
}

// ---------- Mock Data Generators ----------

function generateMockAWB(): string {
  const prefix = ["SR", "DL", "BL", "EK"][Math.floor(Math.random() * 4)];
  const num = Math.floor(100000000000 + Math.random() * 900000000000);
  return `${prefix}${num}`;
}

function generateMockTrackingUrl(awb: string): string {
  return `https://shiprocket.co/tracking/${awb}`;
}

const MOCK_COURIERS = [
  { id: 1, name: "Delhivery Surface" },
  { id: 2, name: "BlueDart Express" },
  { id: 3, name: "DTDC Express" },
  { id: 4, name: "Ecom Express" },
  { id: 5, name: "Xpressbees Surface" },
];

// ---------- Service Class ----------

export class ShiprocketService {
  private config: ShiprocketConfig;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<ShiprocketConfig>) {
    const email = config?.email ?? process.env.SHIPROCKET_EMAIL ?? "";
    const password = config?.password ?? process.env.SHIPROCKET_PASSWORD ?? "";
    const mode =
      (config?.mode ?? process.env.SHIPROCKET_MODE ?? "mock") as "live" | "mock";

    this.config = {
      email,
      password,
      mode: email && password && mode !== "mock" ? "live" : "mock",
    };
  }

  get isMockMode(): boolean {
    return this.config.mode === "mock";
  }

  // ---------- Authentication ----------

  private async authenticate(): Promise<string> {
    if (this.config.mode === "mock") {
      return "mock-token-" + Date.now();
    }

    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.config.email,
        password: this.config.password,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Shiprocket auth failed: ${err}`);
    }

    const data = (await res.json()) as { token: string };
    this.token = data.token;
    // Token valid for 10 days, refresh after 9
    this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
    return this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const token = await this.authenticate();

    const res = await fetch(`https://apiv2.shiprocket.in/v1/external${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Shiprocket API error (${res.status}): ${err}`);
    }

    return res.json() as Promise<T>;
  }

  // ---------- Create Order ----------

  async createOrder(
    payload: ShiprocketOrderPayload
  ): Promise<ShiprocketOrderResponse> {
    if (this.config.mode === "mock") {
      const orderId = Math.floor(10000000 + Math.random() * 90000000).toString();
      const shipmentId = Math.floor(10000000 + Math.random() * 90000000).toString();
      return {
        order_id: orderId,
        shipment_id: shipmentId,
        status: "NEW",
        status_code: 1,
      };
    }

    return this.request<ShiprocketOrderResponse>(
      "POST",
      "/orders/create/adhoc",
      payload as unknown as Record<string, unknown>
    );
  }

  // ---------- Generate AWB (Assign Courier) ----------

  async generateAWB(
    shipmentId: string,
    courierCompanyId?: number
  ): Promise<ShiprocketAWBResponse> {
    if (this.config.mode === "mock") {
      const courier =
        MOCK_COURIERS[Math.floor(Math.random() * MOCK_COURIERS.length)] ?? MOCK_COURIERS[0]!;
      const awb = generateMockAWB();
      return {
        awb_code: awb,
        courier_company_id: courier.id,
        courier_name: courier.name,
        applied_weight: 0.5,
        freight_charge: 45,
        routing_code: "BLR/KOC",
      };
    }

    const body: Record<string, unknown> = { shipment_id: shipmentId };
    if (courierCompanyId) {
      body.courier_id = courierCompanyId;
    }

    const res = await this.request<{
      response: { data: ShiprocketAWBResponse };
    }>("POST", "/courier/assign/awb", body);

    return res.response.data;
  }

  // ---------- Request Pickup ----------

  async requestPickup(shipmentId: string): Promise<{ pickup_scheduled: boolean }> {
    if (this.config.mode === "mock") {
      return { pickup_scheduled: true };
    }

    return this.request<{ pickup_scheduled: boolean }>(
      "POST",
      "/courier/generate/pickup",
      { shipment_id: [shipmentId] }
    );
  }

  // ---------- Get Tracking ----------

  async getTracking(awbCode: string): Promise<ShiprocketTrackingResponse> {
    if (this.config.mode === "mock") {
      const now = new Date();
      const activities: ShiprocketTrackActivity[] = [
        {
          date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          status: "In Transit",
          activity: "Shipment arrived at destination hub",
          location: "Kochi Hub, Kerala",
          "sr-status": "4",
          "sr-status-label": "In Transit",
        },
        {
          date: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
          status: "In Transit",
          activity: "Shipment in transit to next facility",
          location: "Bangalore Sort Center",
          "sr-status": "4",
          "sr-status-label": "In Transit",
        },
        {
          date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          status: "Picked Up",
          activity: "Shipment picked up by courier",
          location: "Warehouse, Bangalore",
          "sr-status": "3",
          "sr-status-label": "Picked Up",
        },
      ];

      const edd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      return {
        tracking_data: {
          track_status: 1,
          shipment_status: 4,
          shipment_track: [
            {
              id: 1,
              awb_code: awbCode,
              courier_company_id: 1,
              shipment_id: 12345678,
              order_id: 87654321,
              pickup_date: activities[2]?.date ?? new Date().toISOString(),
              delivered_date: "",
              weight: "0.5",
              packages: 1,
              current_status: "In Transit",
              delivered_to: "",
              destination: "Kochi",
              consignee_name: "Customer",
              origin: "Bangalore",
              courier_agent_details: null,
              edd: edd ?? null,
            },
          ],
          shipment_track_activities: activities,
          track_url: generateMockTrackingUrl(awbCode),
          etd: edd ?? "",
        },
      };
    }

    return this.request<ShiprocketTrackingResponse>(
      "GET",
      `/courier/track/awb/${awbCode}`,
    );
  }

  // ---------- Cancel Order ----------

  async cancelOrder(shiprocketOrderIds: string[]): Promise<{ status: boolean }> {
    if (this.config.mode === "mock") {
      return { status: true };
    }

    return this.request<{ status: boolean }>("POST", "/orders/cancel", {
      ids: shiprocketOrderIds,
    });
  }

  // ---------- Full Ship Flow (convenience) ----------

  async shipOrder(payload: ShiprocketOrderPayload): Promise<{
    shiprocket_order_id: string;
    shiprocket_shipment_id: string;
    awb_code: string;
    courier_name: string;
    courier_tracking_url: string;
    estimated_delivery_at: string;
  }> {
    // Step 1: Create order in Shiprocket
    const order = await this.createOrder(payload);

    // Step 2: Generate AWB (auto-assigns best courier)
    const awb = await this.generateAWB(order.shipment_id);

    // Step 3: Request pickup
    await this.requestPickup(order.shipment_id);

    // Step 4: Get tracking URL
    const tracking = await this.getTracking(awb.awb_code);

    return {
      shiprocket_order_id: order.order_id,
      shiprocket_shipment_id: order.shipment_id,
      awb_code: awb.awb_code,
      courier_name: awb.courier_name,
      courier_tracking_url: tracking.tracking_data.track_url,
      estimated_delivery_at: tracking.tracking_data.etd,
    };
  }
}

// ---------- Singleton ----------

let _instance: ShiprocketService | null = null;

export function getShiprocketService(): ShiprocketService {
  if (!_instance) {
    _instance = new ShiprocketService();
  }
  return _instance;
}
