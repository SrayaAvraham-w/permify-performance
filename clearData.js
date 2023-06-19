const { Client } = require('pg');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'admin',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'loadTest'
};

const tableName = 'relation_tuples';

async function dropTable() {
  const client = new Client(config);

  try {
    await client.connect();
    await client.query(`DELETE FROM ${tableName}`);
    console.log(`Data deleted from table '${tableName}' successfully.`);
  } catch (error) {
    console.error('Error dropping table:', error);
  } finally {
    await client.end();
  }
}

dropTable();
