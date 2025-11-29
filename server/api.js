import express from 'express';
import cors from 'cors';
import { query } from './config/db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Get user by email
app.get('/api/user', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const users = await query('SELECT * FROM Users WHERE email = ?', [email]);
  res.json(users[0] || {});
});

// Get accounts for user
app.get('/api/accounts', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const accounts = await query('SELECT * FROM Accounts WHERE userId = ?', [userId]);
  res.json(accounts);
});

// Get cards for user
app.get('/api/cards', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const cards = await query('SELECT * FROM Cards WHERE linkedAccountId IN (SELECT id FROM Accounts WHERE userId = ?)', [userId]);
  res.json(cards);
});

// Get transactions for user
app.get('/api/transactions', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const transactions = await query('SELECT * FROM Transactions WHERE accountId IN (SELECT id FROM Accounts WHERE userId = ?)', [userId]);
  res.json(transactions);
});

// Register new user
app.post('/api/register', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  // Ensure Users table exists
  await query(`CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE
  )`);
  // Insert user
  await query('INSERT INTO Users (name, email) VALUES (?, ?)', [name, email]);
  // Fetch and return new user
  const users = await query('SELECT * FROM Users WHERE email = ?', [email]);
  const user = users[0] || {};
  if (user && user.id) {
    // Ensure Accounts and Cards tables exist
    await query(`CREATE TABLE IF NOT EXISTS Accounts (
      id TEXT PRIMARY KEY,
      type TEXT,
      balance REAL,
      number TEXT,
      external INTEGER,
      userId INTEGER
    )`);
    await query(`CREATE TABLE IF NOT EXISTS Cards (
      id TEXT PRIMARY KEY,
      type TEXT,
      last4 TEXT,
      status TEXT,
      linkedAccountId TEXT
    )`);
    // Create default accounts
    await query('INSERT INTO Accounts (id, type, balance, number, external, userId) VALUES (?, ?, ?, ?, ?, ?)', ['acc_chk_' + user.id, 'Checking', 1000.00, '**** 4421', 0, user.id]);
    await query('INSERT INTO Accounts (id, type, balance, number, external, userId) VALUES (?, ?, ?, ?, ?, ?)', ['acc_sav_' + user.id, 'Savings', 5000.00, '**** 9928', 0, user.id]);
    // Create default cards
    await query('INSERT INTO Cards (id, type, last4, status, linkedAccountId) VALUES (?, ?, ?, ?, ?)', ['crd_' + user.id + '_1', 'Visa Platinum', '4242', 'active', 'acc_chk_' + user.id]);
    await query('INSERT INTO Cards (id, type, last4, status, linkedAccountId) VALUES (?, ?, ?, ?, ?)', ['crd_' + user.id + '_2', 'Mastercard Gold', '8811', 'inactive', 'acc_sav_' + user.id]);
  }
  res.json(user);
});

const PORT = process.env.API_PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
