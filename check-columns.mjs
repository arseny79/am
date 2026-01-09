import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Check if buyerSignature column exists
try {
  const result = await connection.query("SELECT buyerSignature FROM ndaSignings LIMIT 1");
  console.log("buyerSignature column exists");
} catch (e) {
  console.log("buyerSignature column DOES NOT EXIST:", e.message);
}

// Check if buyerSignatureType column exists
try {
  const result = await connection.query("SELECT buyerSignatureType FROM ndaSignings LIMIT 1");
  console.log("buyerSignatureType column exists");
} catch (e) {
  console.log("buyerSignatureType column DOES NOT EXIST:", e.message);
}

// Check if variableValues column exists
try {
  const result = await connection.query("SELECT variableValues FROM ndaSignings LIMIT 1");
  console.log("variableValues column exists");
} catch (e) {
  console.log("variableValues column DOES NOT EXIST:", e.message);
}

await connection.end();
