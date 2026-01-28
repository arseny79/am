import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Create kycSubmissions table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS kycSubmissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      submissionType ENUM('initial', 'business_verification', 'resubmission') DEFAULT 'initial' NOT NULL,
      status ENUM('pending', 'under_review', 'approved', 'rejected', 'more_info_requested') DEFAULT 'pending' NOT NULL,
      reviewedAt TIMESTAMP NULL,
      reviewedBy INT NULL,
      reviewerNotes TEXT NULL,
      rejectionReason TEXT NULL,
      flagged TINYINT DEFAULT 0 NOT NULL,
      flagReason VARCHAR(255) NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_userId (userId),
      INDEX idx_status (status),
      INDEX idx_flagged (flagged),
      INDEX idx_createdAt (createdAt)
    )
  `);
  console.log("Created kycSubmissions table");

  // Create userNotes table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS userNotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      authorId INT NOT NULL,
      authorName VARCHAR(255) NULL,
      content TEXT NOT NULL,
      category ENUM('general', 'kyc', 'affiliate', 'support', 'compliance', 'fraud') DEFAULT 'general' NOT NULL,
      isPinned TINYINT DEFAULT 0 NOT NULL,
      editedAt TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_userId (userId),
      INDEX idx_authorId (authorId),
      INDEX idx_category (category),
      INDEX idx_isPinned (isPinned)
    )
  `);
  console.log("Created userNotes table");

  // Add submissionId to kycDocuments if not exists
  const [columns] = await connection.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kycDocuments' AND COLUMN_NAME = 'submissionId'
  `);
  
  if (columns.length === 0) {
    await connection.query(`
      ALTER TABLE kycDocuments ADD COLUMN submissionId INT NULL AFTER userId
    `);
    console.log("Added submissionId column to kycDocuments");
  } else {
    console.log("submissionId column already exists in kycDocuments");
  }

  console.log("\nAll tables created successfully!");
} catch (e) {
  console.log("ERROR:", e.message);
}

await connection.end();
