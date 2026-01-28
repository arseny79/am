import mysql from 'mysql2/promise';

async function addColumn() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Check if column exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'lastReminderSentAt'"
    );
    
    if (columns.length === 0) {
      await connection.execute(
        "ALTER TABLE users ADD COLUMN lastReminderSentAt TIMESTAMP NULL"
      );
      console.log("Added lastReminderSentAt column to users table");
    } else {
      console.log("lastReminderSentAt column already exists");
    }
  } finally {
    await connection.end();
  }
}

addColumn().catch(console.error);
