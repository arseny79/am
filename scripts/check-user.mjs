import { createConnection } from 'mysql2/promise';

async function main() {
  const connection = await createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await connection.execute(
    "SELECT id, email, kycVerified, kycSubmittedAt, kycReviewedAt, emailVerified FROM users WHERE email = 'arsenijs.kardass@gmail.com'"
  );
  
  console.log('User data:', JSON.stringify(rows, null, 2));
  
  // Also check kyc_documents
  const [docs] = await connection.execute(
    "SELECT * FROM kyc_documents WHERE userId IN (SELECT id FROM users WHERE email = 'arsenijs.kardass@gmail.com')"
  );
  
  console.log('KYC Documents:', JSON.stringify(docs, null, 2));
  
  await connection.end();
}

main().catch(console.error);
