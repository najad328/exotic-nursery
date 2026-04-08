-- =============================================================
-- Sample Data Seed for Exotic Nursery
-- Run this in Supabase SQL Editor to populate test data
-- =============================================================

-- 1. Create sample auth users (Supabase auth.users)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'priya.sharma@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '30 days', now(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'rahul.verma@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '25 days', now(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'anita.nair@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '20 days', now(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'vikram.patel@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '18 days', now(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'deepa.menon@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '15 days', now(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'arjun.kumar@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '10 days', now(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'meera.reddy@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '8 days', now(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'suresh.iyer@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '5 days', now(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'kavitha.das@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '3 days', now(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'amit.joshi@gmail.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now() - interval '1 day', now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 2. Create customer profiles
INSERT INTO public.profiles (id, full_name, phone, address, city, pincode, role)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Priya Sharma', '9876543210', '42 MG Road, Indiranagar', 'Bangalore', '560038', 'customer'),
  ('c0000000-0000-0000-0000-000000000002', 'Rahul Verma', '9876543211', '15 Marine Drive, Colaba', 'Mumbai', '400001', 'customer'),
  ('c0000000-0000-0000-0000-000000000003', 'Anita Nair', '9876543212', '78 Panampilly Nagar', 'Kochi', '682036', 'customer'),
  ('c0000000-0000-0000-0000-000000000004', 'Vikram Patel', '9876543213', '23 Navrangpura', 'Ahmedabad', '380009', 'customer'),
  ('c0000000-0000-0000-0000-000000000005', 'Deepa Menon', '9876543214', '5 Besant Nagar', 'Chennai', '600090', 'customer'),
  ('c0000000-0000-0000-0000-000000000006', 'Arjun Kumar', '9876543215', '90 Koramangala 4th Block', 'Bangalore', '560034', 'customer'),
  ('c0000000-0000-0000-0000-000000000007', 'Meera Reddy', '9876543216', '12 Jubilee Hills', 'Hyderabad', '500033', 'customer'),
  ('c0000000-0000-0000-0000-000000000008', 'Suresh Iyer', '9876543217', '67 Mylapore', 'Chennai', '600004', 'customer'),
  ('c0000000-0000-0000-0000-000000000009', 'Kavitha Das', '9876543218', '34 Salt Lake City', 'Kolkata', '700091', 'customer'),
  ('c0000000-0000-0000-0000-000000000010', 'Amit Joshi', '9876543219', '8 Connaught Place', 'Delhi', '110001', 'customer')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  pincode = EXCLUDED.pincode,
  role = EXCLUDED.role;

-- 3. Create orders spread across the last 30 days
-- Order statuses: pending, confirmed, processing, shipped, delivered, cancelled

-- === 28 days ago — Delivered orders ===
INSERT INTO public.orders (id, user_id, status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'delivered', 'cod', 109800, 0, 109800, 'Priya Sharma', '9876543210', '42 MG Road, Indiranagar', 'Bangalore', '560038', now() - interval '28 days', now() - interval '23 days'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'delivered', 'cod', 79900, 0, 79900, 'Rahul Verma', '9876543211', '15 Marine Drive, Colaba', 'Mumbai', '400001', now() - interval '27 days', now() - interval '22 days');

-- === 20 days ago — Delivered ===
INSERT INTO public.orders (id, user_id, status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'delivered', 'cod', 249900, 0, 249900, 'Anita Nair', '9876543212', '78 Panampilly Nagar', 'Kochi', '682036', now() - interval '20 days', now() - interval '15 days'),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'delivered', 'cod', 59800, 0, 59800, 'Vikram Patel', '9876543213', '23 Navrangpura', 'Ahmedabad', '380009', now() - interval '19 days', now() - interval '14 days');

-- === 15 days ago — Delivered + Cancelled ===
INSERT INTO public.orders (id, user_id, status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'delivered', 'cod', 149900, 0, 149900, 'Deepa Menon', '9876543214', '5 Besant Nagar', 'Chennai', '600090', now() - interval '15 days', now() - interval '10 days'),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'delivered', 'cod', 89900, 0, 89900, 'Priya Sharma', '9876543210', '42 MG Road, Indiranagar', 'Bangalore', '560038', now() - interval '14 days', now() - interval '9 days'),
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006', 'cancelled', 'cod', 34900, 0, 34900, 'Arjun Kumar', '9876543215', '90 Koramangala 4th Block', 'Bangalore', '560034', now() - interval '14 days', now() - interval '13 days');

-- === 10 days ago — Shipped ===
INSERT INTO public.orders (id, user_id, status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000007', 'shipped', 'cod', 69900, 0, 69900, 'Meera Reddy', '9876543216', '12 Jubilee Hills', 'Hyderabad', '500033', now() - interval '10 days', now() - interval '7 days'),
  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', 'shipped', 'cod', 179800, 0, 179800, 'Rahul Verma', '9876543211', '15 Marine Drive, Colaba', 'Mumbai', '400001', now() - interval '9 days', now() - interval '6 days');

-- === 7 days ago — Processing ===
INSERT INTO public.orders (id, user_id, status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000008', 'processing', 'cod', 44900, 0, 44900, 'Suresh Iyer', '9876543217', '67 Mylapore', 'Chennai', '600004', now() - interval '7 days', now() - interval '5 days'),
  ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000003', 'processing', 'cod', 139800, 0, 139800, 'Anita Nair', '9876543212', '78 Panampilly Nagar', 'Kochi', '682036', now() - interval '6 days', now() - interval '4 days');

-- === 4 days ago — Confirmed ===
INSERT INTO public.orders (id, user_id, status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000009', 'confirmed', 'cod', 89900, 0, 89900, 'Kavitha Das', '9876543218', '34 Salt Lake City', 'Kolkata', '700091', now() - interval '4 days', now() - interval '3 days'),
  ('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000006', 'confirmed', 'cod', 69800, 0, 69800, 'Arjun Kumar', '9876543215', '90 Koramangala 4th Block', 'Bangalore', '560034', now() - interval '3 days', now() - interval '2 days');

-- === 2 days ago — Pending ===
INSERT INTO public.orders (id, user_id, status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000005', 'pending', 'cod', 299800, 0, 299800, 'Deepa Menon', '9876543214', '5 Besant Nagar', 'Chennai', '600090', now() - interval '2 days', now() - interval '2 days'),
  ('d0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000010', 'pending', 'cod', 44900, 0, 44900, 'Amit Joshi', '9876543219', '8 Connaught Place', 'Delhi', '110001', now() - interval '2 days', now() - interval '2 days');

-- === Yesterday — Pending ===
INSERT INTO public.orders (id, user_id, status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000007', 'pending', 'cod', 159800, 0, 159800, 'Meera Reddy', '9876543216', '12 Jubilee Hills', 'Hyderabad', '500033', now() - interval '1 day', now() - interval '1 day');

-- === Today — Fresh orders ===
INSERT INTO public.orders (id, user_id, status, payment_method, subtotal_paise, delivery_fee_paise, total_paise, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_pincode, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000001', 'pending', 'cod', 119800, 0, 119800, 'Priya Sharma', '9876543210', '42 MG Road, Indiranagar', 'Bangalore', '560038', now() - interval '3 hours', now() - interval '3 hours'),
  ('d0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000004', 'pending', 'cod', 89900, 0, 89900, 'Vikram Patel', '9876543213', '23 Navrangpura', 'Ahmedabad', '380009', now() - interval '1 hour', now() - interval '1 hour'),
  ('d0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000008', 'pending', 'cod', 249900, 0, 249900, 'Suresh Iyer', '9876543217', '67 Mylapore', 'Chennai', '600004', now() - interval '30 minutes', now() - interval '30 minutes');

-- 4. Create order items for each order
INSERT INTO public.order_items (order_id, plant_id, plant_name, quantity, price_paise)
VALUES
  -- Order 1: Priya — Bird of Paradise + Alocasia Dragon Scale
  ('d0000000-0000-0000-0000-000000000001', 'a0b3dd3a-9e78-4bd1-9681-b633446582c3', 'Bird of Paradise (Strelitzia reginae)', 1, 39900),
  ('d0000000-0000-0000-0000-000000000001', '50f84fa6-539e-4f67-9d36-a1de78e6643c', 'Alocasia Dragon Scale', 1, 69900),

  -- Order 2: Rahul — Black Bat Flower
  ('d0000000-0000-0000-0000-000000000002', '32d42fce-fbeb-4610-b1a8-fac09a767b05', 'Black Bat Flower (Tacca chantrieri)', 1, 79900),

  -- Order 3: Anita — Monstera Thai Constellation
  ('d0000000-0000-0000-0000-000000000003', '61f4ae7e-d769-4ccc-83ef-70846710cb20', 'Monstera Thai Constellation', 1, 249900),

  -- Order 4: Vikram — Dragon Fruit x2
  ('d0000000-0000-0000-0000-000000000004', 'a7c3d08c-cd65-4a77-a998-6c7f7b4a13a1', 'Dragon Fruit (Hylocereus)', 2, 29900),

  -- Order 5: Deepa — Philodendron Pink Princess
  ('d0000000-0000-0000-0000-000000000005', '09432483-8887-4ac2-902f-106ba3b14d56', 'Philodendron Pink Princess', 1, 149900),

  -- Order 6: Priya (repeat) — Spiral Cactus
  ('d0000000-0000-0000-0000-000000000006', '92c5b226-a3b6-4e9f-bb6e-15fee4cfa6cd', 'Spiral Cactus (Cereus forbesii spiralis)', 1, 89900),

  -- Order 7: Arjun (cancelled) — Dragon Fruit
  ('d0000000-0000-0000-0000-000000000007', 'a7c3d08c-cd65-4a77-a998-6c7f7b4a13a1', 'Dragon Fruit (Hylocereus)', 1, 34900),

  -- Order 8: Meera — Alocasia Dragon Scale
  ('d0000000-0000-0000-0000-000000000008', '50f84fa6-539e-4f67-9d36-a1de78e6643c', 'Alocasia Dragon Scale', 1, 69900),

  -- Order 9: Rahul — Spiral Cactus + Star Fruit
  ('d0000000-0000-0000-0000-000000000009', '92c5b226-a3b6-4e9f-bb6e-15fee4cfa6cd', 'Spiral Cactus (Cereus forbesii spiralis)', 1, 89900),
  ('d0000000-0000-0000-0000-000000000009', '6a9229b5-95d4-4901-b988-44bf3c902808', 'Star Fruit (Averrhoa carambola)', 2, 44900),

  -- Order 10: Suresh — Pitcher Plant
  ('d0000000-0000-0000-0000-000000000010', 'b59be642-e22f-46aa-9a4e-c6200c492c67', 'Pitcher Plant (Nepenthes)', 1, 44900),

  -- Order 11: Anita — Alocasia Dragon Scale + Bird of Paradise
  ('d0000000-0000-0000-0000-000000000011', '50f84fa6-539e-4f67-9d36-a1de78e6643c', 'Alocasia Dragon Scale', 1, 69900),
  ('d0000000-0000-0000-0000-000000000011', 'a0b3dd3a-9e78-4bd1-9681-b633446582c3', 'Bird of Paradise (Strelitzia reginae)', 1, 39900),
  ('d0000000-0000-0000-0000-000000000011', 'de8d939b-d0d7-4a4b-8438-30bf9e96f037', 'Passion Fruit (Passiflora edulis)', 1, 29900),

  -- Order 12: Kavitha — Spiral Cactus
  ('d0000000-0000-0000-0000-000000000012', '92c5b226-a3b6-4e9f-bb6e-15fee4cfa6cd', 'Spiral Cactus (Cereus forbesii spiralis)', 1, 89900),

  -- Order 13: Arjun — Bird of Paradise + Plumeria
  ('d0000000-0000-0000-0000-000000000013', 'a0b3dd3a-9e78-4bd1-9681-b633446582c3', 'Bird of Paradise (Strelitzia reginae)', 1, 39900),
  ('d0000000-0000-0000-0000-000000000013', 'a71c9d78-e35d-4fec-a9ca-c6e0193b67f3', 'Plumeria (Frangipani)', 1, 24900),
  ('d0000000-0000-0000-0000-000000000013', 'de326529-0c59-4427-8735-bba7e0c438da', 'Sundew (Drosera capensis)', 1, 5000),

  -- Order 14: Deepa — Monstera Thai + Pink Princess
  ('d0000000-0000-0000-0000-000000000014', '61f4ae7e-d769-4ccc-83ef-70846710cb20', 'Monstera Thai Constellation', 1, 249900),
  ('d0000000-0000-0000-0000-000000000014', '09432483-8887-4ac2-902f-106ba3b14d56', 'Philodendron Pink Princess', 1, 49900),

  -- Order 15: Amit — Pitcher Plant
  ('d0000000-0000-0000-0000-000000000015', 'b59be642-e22f-46aa-9a4e-c6200c492c67', 'Pitcher Plant (Nepenthes)', 1, 44900),

  -- Order 16: Meera — Venus Flytrap x3 + Moon Cactus x2
  ('d0000000-0000-0000-0000-000000000016', '4626e001-6da7-4681-b42d-d3ac1bbbb3cb', 'Venus Flytrap (Dionaea muscipula)', 3, 14900),
  ('d0000000-0000-0000-0000-000000000016', '23250721-d4de-4deb-a070-af078ec7e402', 'Moon Cactus (Gymnocalycium)', 2, 9900),
  ('d0000000-0000-0000-0000-000000000016', '15cf5464-e1c9-4b92-802d-ae365ea3ec3c', 'Lithops (Living Stones)', 3, 19900),

  -- Order 17: Priya today — Rambutan + Star Fruit
  ('d0000000-0000-0000-0000-000000000017', '810a12c8-f1cc-4f2d-a41d-7d6aceb63840', 'Rambutan (Nephelium lappaceum)', 1, 59900),
  ('d0000000-0000-0000-0000-000000000017', '6a9229b5-95d4-4901-b988-44bf3c902808', 'Star Fruit (Averrhoa carambola)', 1, 44900),
  ('d0000000-0000-0000-0000-000000000017', '4626e001-6da7-4681-b42d-d3ac1bbbb3cb', 'Venus Flytrap (Dionaea muscipula)', 1, 14900),

  -- Order 18: Vikram today — Spiral Cactus
  ('d0000000-0000-0000-0000-000000000018', '92c5b226-a3b6-4e9f-bb6e-15fee4cfa6cd', 'Spiral Cactus (Cereus forbesii spiralis)', 1, 89900),

  -- Order 19: Suresh today — Monstera Thai Constellation
  ('d0000000-0000-0000-0000-000000000019', '61f4ae7e-d769-4ccc-83ef-70846710cb20', 'Monstera Thai Constellation', 1, 249900);

-- Done! Summary:
-- 10 customers across Bangalore, Mumbai, Kochi, Ahmedabad, Chennai, Hyderabad, Kolkata, Delhi
-- 19 orders:
--   - 6 delivered (28-10 days ago)
--   - 2 shipped (10-9 days ago)
--   - 2 processing (7-6 days ago)
--   - 2 confirmed (4-3 days ago)
--   - 4 pending (2 days - yesterday)
--   - 3 today (pending)
--   - 1 cancelled
-- Total revenue (excl. cancelled): ~₹22,100+
-- Top plants: Spiral Cactus (4), Monstera Thai (3), Alocasia Dragon Scale (3), Bird of Paradise (3)
