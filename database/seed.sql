USE webfy;

INSERT INTO roles (name)
VALUES
  ('admin'),
  ('cofounder'),
  ('secretary'),
  ('operations_manager'),
  ('project_manager'),
  ('designer'),
  ('developer'),
  ('content_creator'),
  ('social_media_manager'),
  ('sales_manager'),
  ('support_manager'),
  ('administrative_assistant')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO services (name, description)
VALUES
  ('Web design', 'Creation et refonte de sites web professionnels.'),
  ('Social media', 'Gestion des reseaux sociaux et planification editoriale.'),
  ('Branding', 'Conception de logo et image de marque.'),
  ('Development', 'Applications web et outils internes.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO users (role_id, full_name, email, job_title)
SELECT r.id, 'WebFy Admin', 'admin@webfy.ht', 'Founder'
FROM roles r
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), job_title = VALUES(job_title);

UPDATE users
SET
  phone = '+509 4479-5902',
  whatsapp_phone = '+509 4479-5902',
  bio = 'Fondateur de WebFy. Vision produit, structure operationnelle, image de marque et developpement business.'
WHERE email = 'admin@webfy.ht';

INSERT INTO staff_compensation (user_id, compensation_model, amount, currency, notes)
SELECT u.id, 'volunteer', 0, 'USD', 'Fondateur en phase de lancement'
FROM users u
WHERE u.email = 'admin@webfy.ht'
ON DUPLICATE KEY UPDATE
  compensation_model = VALUES(compensation_model),
  amount = VALUES(amount),
  currency = VALUES(currency),
  notes = VALUES(notes);

INSERT INTO clients (name, company_type, contact_name, email, phone, status)
VALUES
  ('WebFy Internal', 'Startup', 'Kieft Raphter Joly', 'contact@webfy.ht', '+509 4479-5902', 'active'),
  ('Clinique Privee', 'Healthcare', 'Responsable Clinique', 'contact@clinique.ht', '+509 3000-1000', 'lead'),
  ('Restaurant Local', 'Food', 'Owner', 'hello@restaurant.ht', '+509 3000-2000', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO leads (company_name, contact_name, email, phone, need_summary, project_type, budget_range, status, source)
VALUES
  ('Startup e-commerce', 'Lead Ecommerce', 'lead1@example.com', '+509 1111-1111', 'Site + branding', 'Site professionnel', '$300-$800', 'new', 'Website'),
  ('Restaurant local', 'Lead Restaurant', 'lead2@example.com', '+509 2222-2222', 'Contenu social', 'Social media', '$150-$300', 'contacted', 'Instagram'),
  ('Clinique privee', 'Lead Clinique', 'lead3@example.com', '+509 3333-3333', 'Refonte digitale', 'Refonte de site', '$600+', 'qualified', 'Referral')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO projects (client_id, primary_service_id, owner_user_id, name, description, status, priority, start_date, due_date)
SELECT
  c.id,
  s.id,
  u.id,
  'Refonte WebFy',
  'Refonte de la vitrine et preparation du dashboard staff.',
  'in_progress',
  'high',
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 21 DAY)
FROM clients c
JOIN services s ON s.name = 'Web design'
JOIN users u ON u.email = 'admin@webfy.ht'
WHERE c.name = 'WebFy Internal'
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO content_calendar (project_id, title, channel, day_label, publish_date, status)
SELECT
  p.id,
  'Reel branding - Instagram',
  'Instagram',
  'Lundi',
  CURDATE(),
  'scheduled'
FROM projects p
WHERE p.name = 'Refonte WebFy';

INSERT INTO tasks (project_id, assignee_user_id, title, description, status, priority, due_date)
SELECT
  p.id,
  u.id,
  'Construire le backend staff',
  'Poser l API et la base MySQL pour WebFy.',
  'in_progress',
  'high',
  DATE_ADD(CURDATE(), INTERVAL 5 DAY)
FROM projects p
JOIN users u ON u.email = 'admin@webfy.ht'
WHERE p.name = 'Refonte WebFy';

INSERT INTO task_comments (task_id, user_id, message)
SELECT
  t.id,
  u.id,
  'On pose ici les premiers echanges d execution pour transformer WebFy en vrai outil staff.'
FROM tasks t
JOIN users u ON u.email = 'admin@webfy.ht'
WHERE t.title = 'Construire le backend staff'
  AND NOT EXISTS (
    SELECT 1 FROM task_comments tc WHERE tc.task_id = t.id LIMIT 1
  );

INSERT INTO task_files (task_id, user_id, file_name, file_url, file_kind, notes)
SELECT
  t.id,
  u.id,
  'WebFy Planning Board',
  'https://www.figma.com/',
  'reference',
  'Lien de travail ou reference de structure a remplacer par vos vrais assets.'
FROM tasks t
JOIN users u ON u.email = 'admin@webfy.ht'
WHERE t.title = 'Construire le backend staff'
  AND NOT EXISTS (
    SELECT 1 FROM task_files tf WHERE tf.task_id = t.id LIMIT 1
  );

INSERT INTO activity_logs (project_id, message, happened_at)
SELECT
  p.id,
  'Initialisation du backend WebFy et du schema MySQL.',
  NOW()
FROM projects p
WHERE p.name = 'Refonte WebFy';

INSERT INTO quotes (client_id, project_type, amount, status, notes)
SELECT
  c.id,
  'Refonte site vitrine',
  950,
  'sent',
  'Pack croissance propose pour un site pro avec image plus forte.'
FROM clients c
WHERE c.name = 'Restaurant Local';

INSERT INTO invoices (quote_id, client_id, invoice_number, title, amount, currency, status, issued_date, due_date, notes)
SELECT
  q.id,
  q.client_id,
  'WFY-2026-001',
  'Facture - Refonte site vitrine',
  q.amount,
  'USD',
  'sent',
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 7 DAY),
  'Facture de lancement issue du premier devis test.'
FROM quotes q
WHERE q.project_type = 'Refonte site vitrine'
  AND NOT EXISTS (
    SELECT 1 FROM invoices i WHERE i.quote_id = q.id LIMIT 1
  );

INSERT INTO payment_records (client_id, project_id, title, amount, currency, payment_method, payment_status, payment_date, notes)
SELECT
  c.id,
  p.id,
  'Acompte lancement WebFy',
  250,
  'USD',
  'Bank transfer',
  'paid',
  CURDATE(),
  'Paiement de depart pour enclencher la production.'
FROM clients c
JOIN projects p ON p.client_id = c.id
WHERE c.name = 'WebFy Internal' AND p.name = 'Refonte WebFy';

INSERT INTO notifications (user_id, title, message, category, link_url)
SELECT
  u.id,
  'Bienvenue dans le centre d activite',
  'WebFy commence a centraliser les taches, la finance et les signaux importants ici.',
  'system',
  '/staff'
FROM users u
WHERE u.email = 'admin@webfy.ht'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.title = 'Bienvenue dans le centre d activite' LIMIT 1
  );
