const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
  const targetFile = process.argv[2];

  if (!targetFile) {
    throw new Error("Missing SQL file path. Example: node server/scripts/run-sql.js database/schema.sql");
  }

  const sqlPath = path.resolve(process.cwd(), targetFile);
  const sql = fs.readFileSync(sqlPath, "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true
  });

  await connection.query(sql);
  await connection.end();

  console.log(`Executed SQL file: ${sqlPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
