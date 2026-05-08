const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const db = require("../config/db");

dotenv.config();

async function main() {
  const email = process.env.STAFF_ADMIN_EMAIL;
  const password = process.env.STAFF_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing STAFF_ADMIN_EMAIL or STAFF_ADMIN_PASSWORD in .env");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const adminRoles = await db.query(`SELECT id FROM roles WHERE name = 'admin' LIMIT 1`);
  const adminRoleId = adminRoles[0]?.id;

  if (!adminRoleId) {
    throw new Error("Admin role not found. Run db:seed first.");
  }

  await db.query(
    `UPDATE users
     SET password_hash = ?, role_id = ?
     WHERE email = ?`,
    [hashedPassword, adminRoleId, email]
  );

  console.log(`Admin user synced for ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
