/**
 * WhatsApp deep-link utilities.
 * Uses wa.me links — works on both mobile (opens WhatsApp) and web (opens WhatsApp Web).
 */

/** Build a WhatsApp deep-link URL with pre-filled message */
export function buildWhatsAppUrl(phone: string, message: string): string {
  // Clean phone number: remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Add India country code if not present
  const withCode = cleaned.startsWith("+")
    ? cleaned.replace("+", "")
    : cleaned.startsWith("91")
    ? cleaned
    : `91${cleaned}`;

  return `https://wa.me/${withCode}?text=${encodeURIComponent(message)}`;
}

/** Interpolate template variables: {{variable_name}} → value */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return variables[key] ?? match;
  });
}

/** Build a WhatsApp URL from a template + variables + phone */
export function buildWhatsAppFromTemplate(
  phone: string,
  template: string,
  variables: Record<string, string>
): string {
  const message = interpolateTemplate(template, variables);
  return buildWhatsAppUrl(phone, message);
}

/** Quick WhatsApp link for order status update */
export function buildOrderStatusWhatsAppUrl(
  phone: string,
  customerName: string,
  orderId: string,
  status: string,
  total?: string
): string {
  const statusMessages: Record<string, string> = {
    pending: `Hi ${customerName}! 🌿 Your order #${orderId.slice(0, 8).toUpperCase()} has been placed. ${total ? `Total: ${total}. ` : ""}Thank you for choosing Exotic Nursery!`,
    confirmed: `Great news, ${customerName}! ✅ Your order #${orderId.slice(0, 8).toUpperCase()} has been confirmed and is being prepared.`,
    processing: `Hi ${customerName}! Your order #${orderId.slice(0, 8).toUpperCase()} is being prepared with care. 🌱`,
    shipped: `Hey ${customerName}! 📦 Your order #${orderId.slice(0, 8).toUpperCase()} has been shipped! It's on its way.`,
    out_for_delivery: `${customerName}, your order #${orderId.slice(0, 8).toUpperCase()} is out for delivery! 🚚 Please keep your phone handy.`,
    delivered: `Hi ${customerName}! 🎉 Your order #${orderId.slice(0, 8).toUpperCase()} has been delivered. Enjoy your plants!`,
    cancelled: `Hi ${customerName}, we're sorry but your order #${orderId.slice(0, 8).toUpperCase()} has been cancelled. Please contact us if you have questions.`,
  };

  const message = statusMessages[status] ?? `Update on order #${orderId.slice(0, 8).toUpperCase()}: Status is now ${status}.`;
  return buildWhatsAppUrl(phone, message);
}

/** Quick WhatsApp link for plant inquiry */
export function buildPlantInquiryWhatsAppUrl(
  phone: string,
  plantName: string
): string {
  const message = `Hi! I'm interested in ${plantName} from Exotic Nursery. Could you tell me more about it? 🌿`;
  return buildWhatsAppUrl(phone, message);
}
