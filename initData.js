const { Client } = require('pg');

const config = {
  user: 'user',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'loadTest'
};

const tableName = 'relation_tuples';

async function deleteFromTable() {
  const client = new Client(config);

  try {
    await client.connect();
    await client.query(`DELETE FROM ${tableName}`);
  } catch (error) {
    console.error('Error dropping table:', error);
  } finally {
    await client.end();
  }
}

deleteFromTable();
