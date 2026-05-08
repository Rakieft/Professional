USE webfy_platform;

INSERT INTO roles (name)
VALUES ('admin'), ('manager'), ('creative'), ('developer')
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

INSERT INTO activity_logs (project_id, message, happened_at)
SELECT
  p.id,
  'Initialisation du backend WebFy et du schema MySQL.',
  NOW()
FROM projects p
WHERE p.name = 'Refonte WebFy';
