-- =============================================================
-- Seed Data: Categories + 20 Exotic Plants
-- =============================================================
-- Prices in paise (1 INR = 100 paise)
-- =============================================================

-- Categories
insert into public.categories (id, name, slug, description, sort_order) values
  ('a1000000-0000-0000-0000-000000000001', 'Tropical Fruits', 'tropical-fruits', 'Exotic fruit-bearing plants from tropical regions', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Rare Flowers', 'rare-flowers', 'Stunning and hard-to-find flowering plants', 2),
  ('a1000000-0000-0000-0000-000000000003', 'Carnivorous Plants', 'carnivorous-plants', 'Insect-eating plants for the curious collector', 3),
  ('a1000000-0000-0000-0000-000000000004', 'Succulents & Cacti', 'succulents-cacti', 'Drought-tolerant exotic varieties', 4),
  ('a1000000-0000-0000-0000-000000000005', 'Aroids & Foliage', 'aroids-foliage', 'Statement foliage plants with dramatic leaves', 5),
  ('a1000000-0000-0000-0000-000000000006', 'Bonsai', 'bonsai', 'Miniature trees crafted with patience', 6);

-- Tropical Fruits
insert into public.plants (category_id, name, slug, description, short_description, price_paise, compare_at_price_paise, stock_quantity, care_level, sunlight, watering, growth_time, max_height, origin, care_tips, is_featured) values
  ('a1000000-0000-0000-0000-000000000001', 'Dragon Fruit (Hylocereus)', 'dragon-fruit', 'A stunning climbing cactus that produces vibrant pink-skinned fruits with white or red flesh speckled with tiny black seeds. Easy to grow in Indian climates.', 'Climbing cactus with vibrant pink fruits', 34900, 49900, 25, 'easy', 'full_sun', 'moderate', '12-18 months to first fruit', '3-5 meters', 'Central America', 'Needs a sturdy support to climb. Water deeply but let soil dry between waterings. Feed with balanced fertilizer monthly during growing season.', true),

  ('a1000000-0000-0000-0000-000000000001', 'Passion Fruit (Passiflora edulis)', 'passion-fruit', 'A vigorous climbing vine producing fragrant purple fruits with aromatic orange pulp. Beautiful flowers precede the fruit.', 'Fragrant vine with purple fruits', 29900, null, 18, 'medium', 'full_sun', 'moderate', '8-12 months to fruit', '5-8 meters', 'South America', 'Provide trellis support. Needs well-drained soil. Prune after fruiting season to encourage new growth.', true),

  ('a1000000-0000-0000-0000-000000000001', 'Rambutan (Nephelium lappaceum)', 'rambutan', 'A tropical evergreen tree producing hairy red fruits with sweet translucent flesh. A close relative of lychee.', 'Hairy red fruits with sweet flesh', 59900, null, 8, 'hard', 'partial', 'daily', '3-5 years to fruit', '10-15 meters', 'Southeast Asia', 'Requires humid tropical conditions. Sensitive to wind. Mulch heavily to retain moisture.', false),

  ('a1000000-0000-0000-0000-000000000001', 'Star Fruit (Averrhoa carambola)', 'star-fruit', 'An attractive tree producing star-shaped fruits when sliced. The waxy yellow fruit is both tart and sweet.', 'Star-shaped tropical fruit tree', 44900, null, 12, 'medium', 'full_sun', 'moderate', '2-3 years to fruit', '5-8 meters', 'Sri Lanka', 'Prefers acidic soil (pH 5-6.5). Protect from strong winds. Feed with citrus fertilizer.', true);

-- Rare Flowers
insert into public.plants (category_id, name, slug, description, short_description, price_paise, compare_at_price_paise, stock_quantity, care_level, sunlight, watering, growth_time, max_height, origin, care_tips, is_featured) values
  ('a1000000-0000-0000-0000-000000000002', 'Blue Passion Flower (Passiflora caerulea)', 'blue-passion-flower', 'Produces stunning intricate blue and white flowers that look almost otherworldly. A vigorous climber.', 'Intricate blue-white exotic blooms', 19900, 24900, 30, 'easy', 'full_sun', 'moderate', 'Blooms in first year', '5-10 meters', 'South America', 'Very hardy once established. Can tolerate brief frosts. Prune in spring to control growth.', true),

  ('a1000000-0000-0000-0000-000000000002', 'Bird of Paradise (Strelitzia reginae)', 'bird-of-paradise', 'Iconic tropical plant with striking orange and blue flowers resembling a tropical bird in flight.', 'Iconic orange bird-shaped flowers', 39900, null, 15, 'medium', 'full_sun', 'moderate', '3-5 years from seed to bloom', '1-1.5 meters', 'South Africa', 'Needs bright light for flowering. Allow to become slightly root-bound for better blooms. Feed monthly in summer.', true),

  ('a1000000-0000-0000-0000-000000000002', 'Black Bat Flower (Tacca chantrieri)', 'black-bat-flower', 'One of the most unusual flowers in the plant kingdom. Produces deep purple-black flowers with long whiskers.', 'Deep purple-black flowers with whiskers', 79900, null, 5, 'expert', 'low_light', 'daily', 'Blooms in 2-3 years', '60-90 cm', 'Southeast Asia', 'Requires high humidity (70%+). No direct sunlight. Use orchid mix for potting. Mist daily.', false),

  ('a1000000-0000-0000-0000-000000000002', 'Plumeria (Frangipani)', 'plumeria', 'Beloved tropical tree with intensely fragrant waxy flowers in shades of pink, white, yellow, and red.', 'Intensely fragrant tropical blooms', 24900, null, 20, 'easy', 'full_sun', 'weekly', 'Blooms in 1-2 years', '3-5 meters', 'Central America', 'Drought tolerant once established. Let soil dry completely between waterings. Goes dormant in winter — reduce water drastically.', false);

-- Carnivorous Plants
insert into public.plants (category_id, name, slug, description, short_description, price_paise, compare_at_price_paise, stock_quantity, care_level, sunlight, watering, growth_time, max_height, origin, care_tips, is_featured) values
  ('a1000000-0000-0000-0000-000000000003', 'Venus Flytrap (Dionaea muscipula)', 'venus-flytrap', 'The most famous carnivorous plant. Snap-trap leaves close in milliseconds to capture insects.', 'Iconic snap-trap insect catcher', 14900, 19900, 35, 'medium', 'full_sun', 'daily', 'Mature in 2-3 years', '10-15 cm', 'North America', 'Use only distilled water or rainwater. Never use tap water. Needs 4+ hours direct sunlight. Do not trigger traps for fun — it exhausts the plant.', true),

  ('a1000000-0000-0000-0000-000000000003', 'Sundew (Drosera capensis)', 'cape-sundew', 'Glistening tentacles covered in sticky dew drops trap and digest insects. Mesmerizing to watch.', 'Glistening sticky tentacles trap insects', 12900, null, 22, 'easy', 'full_sun', 'daily', 'Fast grower, flowers in 1 year', '15-20 cm', 'South Africa', 'Keep soil constantly moist with distilled water. Use peat and perlite mix. Very beginner-friendly carnivorous plant.', false),

  ('a1000000-0000-0000-0000-000000000003', 'Pitcher Plant (Nepenthes)', 'tropical-pitcher', 'Produces elaborate hanging pitchers filled with digestive fluid. Insects enter and cannot escape.', 'Hanging pitchers that trap insects', 44900, null, 10, 'hard', 'partial', 'daily', 'Pitchers form in 6-12 months', '30-60 cm', 'Borneo', 'High humidity essential. Hang in bright indirect light. Use sphagnum moss. Mist frequently.', true);

-- Succulents & Cacti
insert into public.plants (category_id, name, slug, description, short_description, price_paise, compare_at_price_paise, stock_quantity, care_level, sunlight, watering, growth_time, max_height, origin, care_tips, is_featured) values
  ('a1000000-0000-0000-0000-000000000004', 'Lithops (Living Stones)', 'lithops', 'Masters of camouflage — these succulents mimic pebbles. Split open to reveal daisy-like flowers.', 'Stone-mimicking succulents', 19900, null, 28, 'medium', 'full_sun', 'minimal', 'Flowers in 3-5 years', '2-3 cm', 'Southern Africa', 'Overwatering is the #1 killer. Water only when old leaves are fully shriveled. Keep completely dry in summer dormancy.', false),

  ('a1000000-0000-0000-0000-000000000004', 'Moon Cactus (Gymnocalycium)', 'moon-cactus', 'Vibrant grafted cactus with neon red, orange, or yellow tops on a green rootstock. An instant conversation starter.', 'Neon-colored grafted cactus', 9900, 14900, 40, 'easy', 'partial', 'weekly', 'Already mature when sold', '10-15 cm', 'South America', 'The colorful top cannot photosynthesize — it relies on the green base. Bright indirect light. Water sparingly.', false),

  ('a1000000-0000-0000-0000-000000000004', 'Spiral Cactus (Cereus forbesii spiralis)', 'spiral-cactus', 'A rare cactus with a mesmerizing twisted spiral growth pattern. A true collector piece.', 'Mesmerizing twisted spiral growth', 89900, null, 3, 'medium', 'full_sun', 'weekly', 'Slow grower, 10cm/year', '1-2 meters', 'South America', 'Well-draining cactus mix essential. Full sun for best spiral development. Reduce water in winter.', true);

-- Aroids & Foliage
insert into public.plants (category_id, name, slug, description, short_description, price_paise, compare_at_price_paise, stock_quantity, care_level, sunlight, watering, growth_time, max_height, origin, care_tips, is_featured) values
  ('a1000000-0000-0000-0000-000000000005', 'Monstera Thai Constellation', 'monstera-thai-constellation', 'A highly sought-after variegated Monstera with creamy white splashes and speckles on large fenestrated leaves.', 'Variegated Monstera with cream splashes', 249900, null, 4, 'medium', 'indirect', 'moderate', 'New leaf every 4-6 weeks', '1-2 meters', 'Thailand (cultivar)', 'Bright indirect light to maintain variegation. Overwatering causes root rot. Use chunky aroid mix with perlite and bark.', true),

  ('a1000000-0000-0000-0000-000000000005', 'Alocasia Dragon Scale', 'alocasia-dragon-scale', 'Thick, rigid leaves with deep veining that looks like dragon scales. Dark green with silvery-green venation.', 'Dramatic dragon-scale textured leaves', 69900, null, 8, 'hard', 'indirect', 'moderate', 'New leaf monthly in summer', '60-90 cm', 'Borneo', 'High humidity (60%+). Prone to spider mites — check undersides regularly. Well-draining soil. Let top inch dry between waterings.', false),

  ('a1000000-0000-0000-0000-000000000005', 'Philodendron Pink Princess', 'philodendron-pink-princess', 'A stunning climbing Philodendron with dark green leaves splashed with bubblegum pink variegation.', 'Bubblegum pink variegated climber', 149900, null, 6, 'medium', 'indirect', 'moderate', 'Moderate grower', '1-2 meters', 'Colombia', 'Needs bright indirect light to maintain pink variegation. Too much shade = all green leaves. Provide a moss pole.', true);

-- Bonsai
insert into public.plants (category_id, name, slug, description, short_description, price_paise, compare_at_price_paise, stock_quantity, care_level, sunlight, watering, growth_time, max_height, origin, care_tips, is_featured) values
  ('a1000000-0000-0000-0000-000000000006', 'Ficus Microcarpa Bonsai', 'ficus-bonsai', 'A classic indoor bonsai with glossy oval leaves and dramatic aerial roots. Very forgiving for beginners.', 'Classic indoor bonsai with aerial roots', 34900, 44900, 15, 'easy', 'indirect', 'moderate', 'Shapeable from year 1', '30-60 cm', 'Southeast Asia', 'Tolerates indoor conditions well. Water when top soil feels dry. Prune regularly to maintain shape. Repot every 2 years.', true),

  ('a1000000-0000-0000-0000-000000000006', 'Jade Plant Bonsai (Crassula ovata)', 'jade-bonsai', 'A succulent bonsai with thick trunk and fleshy oval leaves. Develops character with age.', 'Succulent bonsai with thick trunk', 24900, null, 20, 'easy', 'full_sun', 'weekly', 'Develops trunk in 2-3 years', '20-40 cm', 'South Africa', 'Let soil dry completely between waterings. Needs lots of light for compact growth. Very drought tolerant.', false);
