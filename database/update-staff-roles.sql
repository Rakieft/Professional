USE qrcodev;

INSERT INTO roles (name)
VALUES
  ('marketing_lead'),
  ('content_creator'),
  ('visual_designer'),
  ('community_manager'),
  ('frontend_developer'),
  ('backend_developer'),
  ('business_sales'),
  ('administrative_assistant')
ON DUPLICATE KEY UPDATE name = VALUES(name);
