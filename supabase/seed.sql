-- Seed data — fake only, no real names, emails, costs, or phone numbers.

-- projects
insert into projects (id, name, description) values
  ('00000000-0000-0000-0000-000000000001', 'Short-Term Fixes', 'Quick wins and repairs before the full renovation begins'),
  ('00000000-0000-0000-0000-000000000002', 'Full Renovation',  'Complete overhaul of all rooms in the flat');

-- spaces  (zone: day = living/social areas, night = sleeping/bathing areas)
insert into spaces (id, name, zone) values
  ('00000000-0000-0000-0001-000000000001', 'Bathroom',    'night'),
  ('00000000-0000-0000-0001-000000000002', 'Kitchen',     'day'),
  ('00000000-0000-0000-0001-000000000003', 'Bedroom 1',   'night'),
  ('00000000-0000-0000-0001-000000000004', 'Bedroom 2',   'night'),
  ('00000000-0000-0000-0001-000000000005', 'Living Room', 'day'),
  ('00000000-0000-0000-0001-000000000006', 'Hallway',     'day');

-- contractors
insert into contractors (id, name, email, phone) values
  ('00000000-0000-0000-0002-000000000001', 'Alex Rivera',  'alex@example-contractors.dev',   '555-0101'),
  ('00000000-0000-0000-0002-000000000002', 'Jordan Lee',   'jordan@example-contractors.dev', '555-0202'),
  ('00000000-0000-0000-0002-000000000003', 'Sam Patel',    'sam@example-contractors.dev',    '555-0303'),
  ('00000000-0000-0000-0002-000000000004', 'Casey Morgan', 'casey@example-contractors.dev',  '555-0404');

-- tasks  (owner_id left null — no real auth users in dev seed)
insert into tasks (id, title, description, project_id, contractor_id,
                   expected_cost, actual_cost, expected_duration_days,
                   actual_start, actual_end, status) values
  -- Short-Term Fixes -------------------------------------------------------
  ('00000000-0000-0000-0003-000000000001',
   'Fix bathroom tap',
   'Replace worn washer and reseat the mixer tap',
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001',
   350.00, 380.00, 1, '2026-03-10', '2026-03-10', 'done'),

  ('00000000-0000-0000-0003-000000000002',
   'Paint hallway',
   'Strip, prime, and repaint hallway walls and ceiling',
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000004',
   800.00, null, 3, '2026-05-20', null, 'in_progress'),

  ('00000000-0000-0000-0003-000000000003',
   'Replace kitchen cabinet handles',
   'Swap all cabinet and drawer handles for brushed brass',
   '00000000-0000-0000-0000-000000000001', null,
   200.00, null, 1, null, null, 'planned'),

  ('00000000-0000-0000-0003-000000000004',
   'Install bedroom 1 blackout blinds',
   'Measure and fit blackout roller blinds on both windows',
   '00000000-0000-0000-0000-000000000001', null,
   450.00, null, 1, null, null, 'planned'),

  ('00000000-0000-0000-0003-000000000005',
   'Patch living room wall cracks',
   'Fill hairline cracks above the window lintel',
   '00000000-0000-0000-0000-000000000001', null,
   null, null, 1, null, null, 'ideation'),

  -- Full Renovation ---------------------------------------------------------
  ('00000000-0000-0000-0003-000000000006',
   'Gut bathroom and retile',
   'Strip to shell, new tiles, new fixtures throughout',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0002-000000000001',
   8500.00, null, 10, null, null, 'planned'),

  ('00000000-0000-0000-0003-000000000007',
   'Full kitchen remodel',
   'Replace units, worktops, appliances, and plumbing',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0002-000000000002',
   22000.00, null, 21, null, null, 'ideation'),

  ('00000000-0000-0000-0003-000000000008',
   'Install kitchen island',
   'Build and fit bespoke island with integrated hob',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0002-000000000002',
   4500.00, null, 5, null, null, 'ideation'),

  ('00000000-0000-0000-0003-000000000009',
   'Rewire bedroom 2 lighting',
   'Replace ceiling rose and add two bedside wall lights',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0002-000000000003',
   1200.00, null, 2, null, null, 'planned'),

  ('00000000-0000-0000-0003-000000000010',
   'Lay new hallway flooring',
   'Remove carpet, level subfloor, lay LVT planks',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0002-000000000003',
   2400.00, null, 4, '2026-05-10', null, 'in_progress'),

  ('00000000-0000-0000-0003-000000000011',
   'Paint all day-zone walls',
   'Two coats across kitchen, living room, and hallway',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0002-000000000004',
   3200.00, null, 5, null, null, 'planned'),

  ('00000000-0000-0000-0003-000000000012',
   'Install bathroom extractor fan',
   'Fit inline extractor to existing duct run',
   '00000000-0000-0000-0000-000000000002', null,
   320.00, null, 1, null, null, 'discarded'),

  ('00000000-0000-0000-0003-000000000013',
   'Resurface bedroom 1 floors',
   'Sand, stain, and lacquer original timber boards',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0002-000000000003',
   3200.00, 3150.00, 3, '2026-04-01', '2026-04-03', 'done');

-- task_spaces
insert into task_spaces (task_id, space_id) values
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000001'), -- tap       → Bathroom
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000006'), -- paint     → Hallway
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0001-000000000002'), -- handles   → Kitchen
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0001-000000000003'), -- blinds    → Bedroom 1
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0001-000000000005'), -- cracks    → Living Room
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0001-000000000001'), -- gut bath  → Bathroom
  ('00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0001-000000000002'), -- remodel   → Kitchen
  ('00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0001-000000000002'), -- island    → Kitchen
  ('00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0001-000000000004'), -- rewire    → Bedroom 2
  ('00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0001-000000000006'), -- flooring  → Hallway
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0001-000000000002'), -- paint day → Kitchen
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0001-000000000005'), -- paint day → Living Room
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0001-000000000006'), -- paint day → Hallway
  ('00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0001-000000000001'), -- extractor → Bathroom
  ('00000000-0000-0000-0003-000000000013', '00000000-0000-0000-0001-000000000003'); -- resurface → Bedroom 1

-- task_deps  (task_id must wait for depends_on_task_id)
insert into task_deps (task_id, depends_on_task_id) values
  -- install island only after kitchen remodel
  ('00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0003-000000000007'),
  -- blackout blinds only after bedroom 1 floors are done
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0003-000000000013'),
  -- paint day zones only after hallway flooring is down
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0003-000000000010'),
  -- paint day zones only after living room cracks are patched
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0003-000000000005');
