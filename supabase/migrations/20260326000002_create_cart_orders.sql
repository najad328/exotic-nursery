-- =============================================================
-- Migration: Cart, Orders, Order Items + Atomic place_order()
-- =============================================================

-- ─── Cart Items ─────────────────────────────────────────────

CREATE TABLE public.cart_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plant_id     uuid NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  quantity     integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 100),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plant_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cart"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Orders ─────────────────────────────────────────────────

CREATE TABLE public.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'pending' CHECK (
                    status IN ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')
                  ),
  payment_method  text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'upi')),
  payment_status  text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  subtotal_paise  integer NOT NULL CHECK (subtotal_paise >= 0),
  delivery_fee_paise integer NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  total_paise     integer NOT NULL CHECK (total_paise >= 0),
  delivery_name   text NOT NULL,
  delivery_phone  text NOT NULL,
  delivery_address text NOT NULL,
  delivery_city   text NOT NULL,
  delivery_pincode text NOT NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers see own orders
CREATE POLICY "Users view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admins see all orders
CREATE POLICY "Admins view all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update order status
CREATE POLICY "Admins update orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable realtime for order status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Order Items ────────────────────────────────────────────

CREATE TABLE public.order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  plant_id     uuid NOT NULL REFERENCES public.plants(id),
  plant_name   text NOT NULL,
  plant_image  text,
  quantity     integer NOT NULL CHECK (quantity > 0),
  price_paise  integer NOT NULL CHECK (price_paise >= 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users see items for own orders
CREATE POLICY "Users view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins see all order items
CREATE POLICY "Admins view all order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── Atomic place_order() Function ──────────────────────────
-- Validates stock → inserts order + items → decrements stock → clears cart
-- Uses SELECT ... FOR UPDATE to prevent overselling

CREATE OR REPLACE FUNCTION public.place_order(
  p_payment_method text,
  p_delivery_name text,
  p_delivery_phone text,
  p_delivery_address text,
  p_delivery_city text,
  p_delivery_pincode text,
  p_notes text DEFAULT NULL,
  p_delivery_fee_paise integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_order_id uuid;
  v_subtotal integer := 0;
  v_cart_item RECORD;
  v_plant RECORD;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check cart is not empty
  IF NOT EXISTS (
    SELECT 1 FROM public.cart_items WHERE user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Validate stock and calculate subtotal (with row locks)
  FOR v_cart_item IN
    SELECT ci.plant_id, ci.quantity
    FROM public.cart_items ci
    WHERE ci.user_id = v_user_id
  LOOP
    -- Lock the plant row to prevent concurrent overselling
    SELECT id, name, image_url, price_paise, stock_quantity, is_active
    INTO v_plant
    FROM public.plants
    WHERE id = v_cart_item.plant_id
    FOR UPDATE;

    IF v_plant IS NULL THEN
      RAISE EXCEPTION 'Plant not found: %', v_cart_item.plant_id;
    END IF;

    IF NOT v_plant.is_active THEN
      RAISE EXCEPTION 'Plant "%" is no longer available', v_plant.name;
    END IF;

    IF v_plant.stock_quantity < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, requested: %',
        v_plant.name, v_plant.stock_quantity, v_cart_item.quantity;
    END IF;

    v_subtotal := v_subtotal + (v_plant.price_paise * v_cart_item.quantity);
  END LOOP;

  -- Create the order
  INSERT INTO public.orders (
    user_id, payment_method, subtotal_paise, delivery_fee_paise, total_paise,
    delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, notes
  )
  VALUES (
    v_user_id, p_payment_method, v_subtotal, p_delivery_fee_paise,
    v_subtotal + p_delivery_fee_paise,
    p_delivery_name, p_delivery_phone, p_delivery_address, p_delivery_city, p_delivery_pincode, p_notes
  )
  RETURNING id INTO v_order_id;

  -- Insert order items + decrement stock
  FOR v_cart_item IN
    SELECT ci.plant_id, ci.quantity
    FROM public.cart_items ci
    WHERE ci.user_id = v_user_id
  LOOP
    SELECT id, name, image_url, price_paise
    INTO v_plant
    FROM public.plants
    WHERE id = v_cart_item.plant_id;

    INSERT INTO public.order_items (order_id, plant_id, plant_name, plant_image, quantity, price_paise)
    VALUES (v_order_id, v_plant.id, v_plant.name, v_plant.image_url, v_cart_item.quantity, v_plant.price_paise);

    UPDATE public.plants
    SET stock_quantity = stock_quantity - v_cart_item.quantity
    WHERE id = v_cart_item.plant_id;
  END LOOP;

  -- Clear the user's cart
  DELETE FROM public.cart_items WHERE user_id = v_user_id;

  RETURN v_order_id;
END;
$$;
