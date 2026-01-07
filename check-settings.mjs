import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function checkSettings() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const [rows] = await connection.execute('SELECT heroHeadline, heroSubheadline, heroDescription, logoUrl FROM siteSettings');
  console.log('Current siteSettings:');
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}

checkSettings().catch(console.error);
