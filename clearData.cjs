const { Client } = require('pg');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
};

const tableName = 'relation_tuples';

async function dropTable() {
  const client = new Client(config);

  try {
    await client.connect();
    await client.query(`DELETE FROM ${tableName}`);
    console.log(`Data deleted from table '${tableName}' successfully.`);
  } catch (error) {
    console.error('Error deleted from table:', error);
  } finally {
    await client.end();
  }
}

dropTable();
