
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true // Required for Azure
  }
};

async function connectAzureSql() {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT TOP 10 * FROM INFORMATION_SCHEMA.TABLES');
    console.log(result);
  } catch (err) {
    console.error('Connection error:', err);
  }
}

connectAzureSql();
