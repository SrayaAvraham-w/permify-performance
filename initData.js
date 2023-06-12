const { Client } = require('pg');

const config = {
  user: 'user',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'ba-test'
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
