
import sqlite3 from 'sqlite3';
import 'dotenv/config'; // Keep for other settings like AZURE_OPENAI_KEY

const dbPath = './bank.db';
let db;

/**
 * Initializes the SQLite database connection and sets up tables.
 * @returns {Promise<sqlite3.Database>} The connected database instance.
 */
export const connectDb = () => {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);

        // Use sqlite3.verbose() for better stack traces and logging
        const SQLite = sqlite3.verbose();
        
        // Open the database (creates the file if it doesn't exist)
        db = new SQLite.Database(dbPath, async (err) => {
            if (err) {
                console.error("[DB ERROR] Failed to open SQLite database:", err.message);
                return reject(err);
            }
            console.log(`[DB] Connected to SQLite database: ${dbPath}`);
            
            try {
                await initializeTables();
                resolve(db);
            } catch (initErr) {
                console.error("[DB ERROR] Failed to initialize tables:", initErr);
                reject(initErr);
            }
        });
    });
};

/**
 * Creates tables and populates initial mock data if they don't exist.
 */
const initializeTables = () => {
    const run = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) return reject(err);
                resolve(this);
            });
        });
    };

    return new Promise(async (resolve) => {
        await run(`
            CREATE TABLE IF NOT EXISTS Accounts (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                balance REAL NOT NULL,
                number TEXT NOT NULL,
                external INTEGER DEFAULT 0,
                userId TEXT NOT NULL
            );
        `);
        
        await run(`
            CREATE TABLE IF NOT EXISTS Transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                accountId TEXT NOT NULL
            );
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS Cards (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                last4 TEXT NOT NULL,
                status TEXT NOT NULL,
                linkedAccountId TEXT NOT NULL
            );
        `)

        await run(`
            CREATE TABLE IF NOT EXISTS ATMTransactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                accountId TEXT NOT NULL,
                userId TEXT NOT NULL
            );
        `)

        await run(`
            CREATE TABLE IF NOT EXISTS ATMTransactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                accountId TEXT NOT NULL,
                userId TEXT NOT NULL
            );
        `);;;

        db.get("SELECT COUNT(*) AS count FROM Accounts", async (err, row) => {
            if (err) { console.error("Error checking account count:", err); return resolve(); }

            if (row.count === 0) {
                console.log("[DB INIT] Populating initial mock data.");
                
                await run("INSERT INTO Accounts VALUES (?, ?, ?, ?, ?, ?)", ['acc_chk_01', 'Checking', 5420.50, '**** 4421', 0, 'usr_000']);
                await run("INSERT INTO Accounts VALUES (?, ?, ?, ?, ?, ?)", ['acc_sav_01', 'Savings', 12500.00, '**** 9928', 0, 'usr_000']);
                await run("INSERT INTO Accounts VALUES (?, ?, ?, ?, ?, ?)", ['acc_ext_02', 'External (Mom)', 0, '**** 1122', 1, 'usr_000']);

                await run("INSERT INTO Cards VALUES (?, ?, ?, ?, ?)", ['crd_001', 'Visa Platinum', '4242', 'active', 'acc_chk_01']);
                await run("INSERT INTO Cards VALUES (?, ?, ?, ?, ?)", ['crd_002', 'Mastercard Gold', '8811', 'inactive', 'acc_sav_01']);

                await run("INSERT INTO Transactions (date, description, amount, accountId) VALUES (?, ?, ?, ?)", ['2023-10-24', 'Grocery Store', -150.25, 'acc_chk_01']);
                await run("INSERT INTO Transactions (date, description, amount, accountId) VALUES (?, ?, ?, ?)", ['2023-10-23', 'Salary Deposit', 3200.00, 'acc_chk_01']);
            }
            resolve();
        });
    });
};

/**
 * Executes a SELECT query and returns records.
 * @param {string} sqlQuery The SQL command to execute.
 * @param {Array<any>} params Parameters for the query.
 * @returns {Promise<Array<Object>>} The resulting records.
 */
export const query = (sqlQuery, params = []) => {
    return new Promise(async (resolve) => {
        try {
            await connectDb();
            db.all(sqlQuery, params, (err, rows) => {
                if (err) {
                    console.error("[DB ERROR] Query failed:", err.message);
                    return resolve([]);
                }
                console.log(`[DB] Executed query: "${sqlQuery.substring(0, 50)}..."`);
                resolve(rows);
            });
        } catch (err) {
            resolve([]);
        }
    });
};

/**
 * Executes a Transfer transaction atomically.
 */
export const transaction = (amt, fromAccount, toAccount) => {
    const fromId = fromAccount.id;
    const toId = toAccount.id;
    const amount = parseFloat(amt);

    if (isNaN(amount) || amount <= 0) return Promise.resolve({ success: false, msg: "Invalid amount." });

    return new Promise(async (resolve) => {
        await connectDb();
        
        db.serialize(() => {
            // Start the transaction
            db.run("BEGIN TRANSACTION;");

            // 1. Debit from source (and check balance sufficient)
            db.run("UPDATE Accounts SET balance = balance - ? WHERE id = ? AND balance >= ?", [amount, fromId, amount], function(err) {
                if (err || this.changes === 0) {
                    db.run("ROLLBACK;");
                    console.error("[DB ERROR] Transaction failed (Debit/Insufficient funds).", err?.message);
                    return resolve({ success: false, msg: "Transaction failed (Debit or Insufficient Funds)." });
                }
                
                // 2. Credit to destination
                db.run("UPDATE Accounts SET balance = balance + ? WHERE id = ?", [amount, toId], function(err) {
                    if (err) {
                        db.run("ROLLBACK;");
                        console.error("[DB ERROR] Transaction failed (Credit).", err.message);
                        return resolve({ success: false, msg: "Transaction failed (Credit)." });
                    }

                    // 3. Insert transaction record
                    const date = new Date().toISOString().split('T')[0];
                    db.run("INSERT INTO Transactions (date, description, amount, accountId) VALUES (?, ?, ?, ?)", 
                        [date, `Transfer to ${toAccount.type}`, -amount, fromId], 
                        function(err) {
                            if (err) {
                                db.run("ROLLBACK;");
                                console.error("[DB ERROR] Transaction failed (Log).", err.message);
                                return resolve({ success: false, msg: "Transaction failed (Log)." });
                            }
                            
                            // 4. Commit the transaction
                            db.run("COMMIT;", (commitErr) => {
                                if (commitErr) {
                                    console.error("[DB ERROR] Transaction failed (Commit).", commitErr.message);
                                    return resolve({ success: false, msg: "Transaction failed (Commit)." });
                                }
                                console.log(`[DB] Successfully executed transaction: Transfer ${amount} from ${fromId} to ${toId}`);
                                resolve({ success: true });
                            });
                        }
                    );
                });
            });
        });
    });
};

