const { Client } = require('pg');

async function testPG() {
  const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '123456', database: 'postgres' });
  try {
    await client.connect();
    console.log('PG Connected!');
    const r = await client.query('SELECT version()');
    console.log(r.rows[0].version);
    const r2 = await client.query("SELECT datname FROM pg_database WHERE datname='placehub'");
    if (r2.rowCount === 0) {
      console.log('Creating placehub database...');
      await client.query('CREATE DATABASE placehub');
      console.log('placehub database created!');
    } else {
      console.log('placehub database already exists.');
    }
  } catch(e) {
    console.error('FAILED:', e.message);
  } finally {
    await client.end();
  }
}
testPG();
