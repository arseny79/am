import mysql from 'mysql2/promise';

async function createTable() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS adminAuditLogs (
      id int AUTO_INCREMENT PRIMARY KEY,
      adminId int NOT NULL,
      adminName varchar(255),
      adminEmail varchar(320),
      action varchar(100) NOT NULL,
      resource varchar(100) NOT NULL,
      resourceId int,
      details text,
      ipAddress varchar(45),
      userAgent text,
      status enum('success','failure') NOT NULL DEFAULT 'success',
      errorMessage text,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX adminAuditLogs_adminId (adminId),
      INDEX adminAuditLogs_action (action),
      INDEX adminAuditLogs_resource (resource),
      INDEX adminAuditLogs_createdAt (createdAt)
    )
  `;
  
  await connection.execute(createTableSQL);
  console.log('adminAuditLogs table created successfully');
  await connection.end();
}

createTable().catch(console.error);
