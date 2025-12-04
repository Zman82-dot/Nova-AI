import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./bank.db');

db.serialize(() => {
  db.run("INSERT INTO Users (name, email) VALUES ('Demo User', 'demo@example.com')");
  db.run("INSERT INTO Accounts VALUES ('acc_chk_01', 'Checking', 5420.50, '**** 4421', 0, 1)");
  db.run("INSERT INTO Accounts VALUES ('acc_sav_01', 'Savings', 12500.00, '**** 9928', 0, 1)");
  db.run("INSERT INTO Accounts VALUES ('acc_ext_02', 'External (Mom)', 0, '**** 1122', 1, 1)");
  db.run("INSERT INTO Cards VALUES ('crd_001', 'Visa Platinum', '4242', 'active', 'acc_chk_01')");
  db.run("INSERT INTO Cards VALUES ('crd_002', 'Mastercard Gold', '8811', 'inactive', 'acc_sav_01')");
  db.run("INSERT INTO Transactions (date, description, amount, accountId) VALUES ('2023-10-24', 'Grocery Store', -150.25, 'acc_chk_01')");
  db.run("INSERT INTO Transactions (date, description, amount, accountId) VALUES ('2023-10-23', 'Salary Deposit', 3200.00, 'acc_chk_01')");
});

db.close();
console.log('Mock data seeded to SQLite database.');
