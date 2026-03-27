-- =============================================================
-- Migration: Analytics views for admin dashboard
-- =============================================================

-- Daily order counts and revenue (last 30 days)
CREATE OR REPLACE VIEW public.v_daily_orders AS
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS order_count,
  SUM(total_paise) AS revenue_paise,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count
FROM public.orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top selling plants (by quantity sold)
CREATE OR REPLACE VIEW public.v_top_plants AS
SELECT
  oi.plant_id,
  oi.plant_name,
  SUM(oi.quantity) AS total_sold,
  SUM(oi.quantity * oi.price_paise) AS total_revenue_paise,
  COUNT(DISTINCT oi.order_id) AS order_count
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
WHERE o.status != 'cancelled'
GROUP BY oi.plant_id, oi.plant_name
ORDER BY total_sold DESC
LIMIT 10;

-- Order status breakdown
CREATE OR REPLACE VIEW public.v_order_status_counts AS
SELECT
  status,
  COUNT(*) AS count,
  SUM(total_paise) AS total_revenue_paise
FROM public.orders
GROUP BY status
ORDER BY count DESC;

-- Monthly revenue summary
CREATE OR REPLACE VIEW public.v_monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS order_count,
  SUM(total_paise) AS revenue_paise,
  AVG(total_paise)::integer AS avg_order_paise
FROM public.orders
WHERE status != 'cancelled'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
