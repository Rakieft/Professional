USE webfy;

UPDATE roles
SET name = 'cofounder'
WHERE name = 'cofounder_secretary';

INSERT INTO roles (name)
VALUES
  ('secretary'),
  ('administrative_assistant')
ON DUPLICATE KEY UPDATE name = VALUES(name);
