const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const config = require('../src/config.json');

const app = express();
const port = 5000;

const pool = new Pool(config.db);

app.use(cors({
  origin: 'http://192.168.1.112:3000' // Allow requests from your frontend
}));
app.use(express.json());

app.get('/api/users', async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT * FROM users');
    res.json(usersResult.rows);
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tables', async (req, res) => {
  try {
    const tablesResult = await pool.query('SELECT * FROM tables');
    res.json(tablesResult.rows);
  } catch (err) {
    console.error('Error fetching tables', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/usertables/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    if (!tableId) {
      return res.status(400).json({ error: 'Table ID is required' });
    }
    const userTablesResult = await pool.query('SELECT * FROM players WHERE table_id = $1', [tableId]);
    res.json(userTablesResult.rows);
  } catch (err) {
    console.error('Error fetching user-table relationships', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://192.168.1.112:${port}`);
});