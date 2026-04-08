import { describe, it, expect } from "vitest";
import {
  ShiprocketService,
  mapShiprocketStatusToOrderStatus,
} from "../shiprocket";

describe("mapShiprocketStatusToOrderStatus", () => {
  it("maps AWB Assigned (1) to processing", () => {
    expect(mapShiprocketStatusToOrderStatus(1)).toBe("processing");
  });

  it("maps Picked Up (3) to shipped", () => {
    expect(mapShiprocketStatusToOrderStatus(3)).toBe("shipped");
  });

  it("maps Out for Delivery (6) to out_for_delivery", () => {
    expect(mapShiprocketStatusToOrderStatus(6)).toBe("out_for_delivery");
  });

  it("maps Delivered (7) to delivered", () => {
    expect(mapShiprocketStatusToOrderStatus(7)).toBe("delivered");
  });

  it("maps Cancelled (8) to cancelled", () => {
    expect(mapShiprocketStatusToOrderStatus(8)).toBe("cancelled");
  });

  it("maps RTO (9, 10) to cancelled", () => {
    expect(mapShiprocketStatusToOrderStatus(9)).toBe("cancelled");
    expect(mapShiprocketStatusToOrderStatus(10)).toBe("cancelled");
  });

  it("defaults to shipped for unknown codes", () => {
    expect(mapShiprocketStatusToOrderStatus(999)).toBe("shipped");
  });
});

describe("ShiprocketService (mock mode)", () => {
  const service = new ShiprocketService({ mode: "mock" });

  it("is in mock mode", () => {
    expect(service.isMockMode).toBe(true);
  });

  it("createOrder returns order and shipment IDs", async () => {
    const result = await service.createOrder({
      order_id: "test-123",
      order_date: new Date().toISOString(),
      pickup_location: "Warehouse",
      billing_customer_name: "Test",
      billing_address: "123 Main St",
      billing_city: "Kochi",
      billing_pincode: "682001",
      billing_state: "Kerala",
      billing_country: "India",
      billing_email: "test@test.com",
      billing_phone: "9876543210",
      shipping_is_billing: true,
      order_items: [{ name: "Plant", sku: "P1", units: 1, selling_price: 500 }],
      payment_method: "COD",
      sub_total: 500,
      length: 20,
      breadth: 15,
      height: 25,
      weight: 0.5,
    });

    expect(result.order_id).toBeTruthy();
    expect(result.shipment_id).toBeTruthy();
    expect(result.status).toBe("NEW");
  });

  it("generateAWB returns AWB code and courier name", async () => {
    const result = await service.generateAWB("mock-shipment-123");
    expect(result.awb_code).toBeTruthy();
    expect(result.awb_code.length).toBeGreaterThan(5);
    expect(result.courier_name).toBeTruthy();
    expect(result.courier_company_id).toBeGreaterThan(0);
  });

  it("requestPickup returns pickup_scheduled true", async () => {
    const result = await service.requestPickup("mock-shipment-123");
    expect(result.pickup_scheduled).toBe(true);
  });

  it("getTracking returns tracking activities", async () => {
    const result = await service.getTracking("SRMOCK123");
    expect(result.tracking_data.shipment_track_activities.length).toBeGreaterThan(0);
    expect(result.tracking_data.track_url).toContain("SRMOCK123");
    expect(result.tracking_data.etd).toBeTruthy();
  });

  it("cancelOrder returns success", async () => {
    const result = await service.cancelOrder(["mock-order-1"]);
    expect(result.status).toBe(true);
  });

  it("shipOrder runs full flow and returns all data", async () => {
    const result = await service.shipOrder({
      order_id: "full-flow-test",
      order_date: new Date().toISOString(),
      pickup_location: "Warehouse",
      billing_customer_name: "Test",
      billing_address: "123 Main St",
      billing_city: "Kochi",
      billing_pincode: "682001",
      billing_state: "Kerala",
      billing_country: "India",
      billing_email: "test@test.com",
      billing_phone: "9876543210",
      shipping_is_billing: true,
      order_items: [{ name: "Plant", sku: "P1", units: 1, selling_price: 500 }],
      payment_method: "COD",
      sub_total: 500,
      length: 20,
      breadth: 15,
      height: 25,
      weight: 0.5,
    });

    expect(result.shiprocket_order_id).toBeTruthy();
    expect(result.shiprocket_shipment_id).toBeTruthy();
    expect(result.awb_code).toBeTruthy();
    expect(result.courier_name).toBeTruthy();
    expect(result.courier_tracking_url).toBeTruthy();
    expect(result.estimated_delivery_at).toBeTruthy();
  });
});

describe("ShiprocketService auto-detects mock mode", () => {
  it("defaults to mock mode when no credentials", () => {
    const service = new ShiprocketService({});
    expect(service.isMockMode).toBe(true);
  });
});
