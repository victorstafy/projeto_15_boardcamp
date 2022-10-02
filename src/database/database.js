import pg from 'pg';

const { Pool } = pg;

const user = 'postgres';
const password = '123456';
const host = 'localhost';
const port = 4000;
const database = 'meu_banco_de_dados';

const connection = new Pool({
  user,
  password,
  host,
  port,
  database
});

export default connection;