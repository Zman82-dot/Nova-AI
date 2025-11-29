const WebSocket = require('ws');
const { query, transaction } = require('./config/db.js');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', async (clientWs) => {
    // 1. Connect to Azure OpenAI Realtime Endpoint
    const azureWs = new WebSocket(
        'wss://ai-dorianrcoleman2151ai866184563296.openai.azure.com/openai/realtime?api-version=2024-10-01-preview&deployment=gpt-realtime',
        { headers: { 'api-key': process.env.AZURE_OPENAI_KEY, 'OpenAI-Beta': 'realtime=v1' } }
    );

    // 2. Define Tools (The Banking Logic)
    const sessionConfig = {
        type: "session.update",
        session: {
            modalities: ["audio", "text"],
            instructions: "You are a helpful banking assistant. You can check balances, transfer funds, withdraw money, and view history. Be concise.",
            tools: [
                {
                    type: "function",
                    name: "get_balance",
                    description: "Get the balance of a specific account type",
                    parameters: {
                        type: "object",
                        properties: {
                            accountType: { type: "string", enum: ["Checking", "Savings"] }
                        },
                        required: ["accountType"]
                    }
                },
                {
                    type: "function",
                    name: "transfer_funds",
                    description: "Transfer money between internal accounts",
                    parameters: {
                        type: "object",
                        properties: {
                            amount: { type: "number" },
                            fromAccount: { type: "string" },
                            toAccount: { type: "string" }
                        },
                        required: ["amount", "fromAccount", "toAccount"]
                    }
                },
                {
                    type: "function",
                    name: "withdraw_funds",
                    description: "Withdraw money from an account (e.g. ATM or external)",
                    parameters: {
                        type: "object",
                        properties: {
                            amount: { type: "number" },
                            accountType: { type: "string", enum: ["Checking", "Savings"] }
                        },
                        required: ["amount", "accountType"]
                    }
                },
                {
                    type: "function",
                    name: "get_transaction_history",
                    description: "Get the recent transaction history for an account",
                    parameters: {
                        type: "object",
                        properties: {
                            accountType: { type: "string", enum: ["Checking", "Savings"] },
                            limit: { type: "number", description: "Number of transactions to fetch" }
                        },
                        required: ["accountType"]
                    }
                },
                {
                    type: "function",
                    name: "set_card_status",
                    description: "Lock or unlock a debit/credit card",
                    parameters: {
                        type: "object",
                        properties: {
                            cardLast4: { type: "string" },
                            status: { type: "string", enum: ["Active", "Inactive"] }
                        },
                        required: ["cardLast4", "status"]
                    }
                }
            ]
        }
    };

    // 3. Handshake & Message Loop
    azureWs.on('open', () => {
        azureWs.send(JSON.stringify(sessionConfig));
    });

    clientWs.on('message', (data) => {
        const event = JSON.parse(data);
        azureWs.send(JSON.stringify(event));
    });

    // Handle Messages from Azure
    azureWs.on('message', async (data) => {
        const event = JSON.parse(data);

        // HANDLE TOOL CALLS
        if (event.type === 'response.function_call_arguments.done') {
            const { name, arguments: args } = event;
            const parsedArgs = JSON.parse(args);
            
            let result;
            try {
                if (name === 'get_balance') {
                    result = await db.query(`SELECT Balance FROM Accounts WHERE Type = '${parsedArgs.accountType}'`);
                        result = await query(`SELECT Balance FROM Accounts WHERE Type = '${parsedArgs.accountType}'`);
                } else if (name === 'transfer_funds') {
                    result = await db.transaction(parsedArgs.amount, parsedArgs.fromAccount, parsedArgs.toAccount);
                        result = await transaction(parsedArgs.amount, parsedArgs.fromAccount, parsedArgs.toAccount);
                } else if (name === 'withdraw_funds') {
                    // Execute SQL Withdrawal
                    result = await db.query(`UPDATE Accounts SET Balance = Balance - ${parsedArgs.amount} WHERE Type = '${parsedArgs.accountType}'`);
                        result = await query(`UPDATE Accounts SET Balance = Balance - ${parsedArgs.amount} WHERE Type = '${parsedArgs.accountType}'`);
                    result = { success: true, message: `Withdrawn $${parsedArgs.amount}` };
                } else if (name === 'get_transaction_history') {
                    // Execute SQL History Fetch
                    const limit = parsedArgs.limit || 3;
                    result = await db.query(`SELECT TOP ${limit} * FROM Transactions WHERE AccountType = '${parsedArgs.accountType}' ORDER BY TransactionDate DESC`);
                        result = await query(`SELECT TOP ${limit} * FROM Transactions WHERE AccountType = '${parsedArgs.accountType}' ORDER BY TransactionDate DESC`);
                }
            } catch (e) {
                result = { error: "Database error occurred." };
            }

            // Send result back to Azure
            azureWs.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                    type: 'function_call_output',
                    call_id: event.call_id,
                    output: JSON.stringify(result)
                }
            }));
            
            // Trigger Response
            azureWs.send(JSON.stringify({ type: 'response.create' }));
        
        } else {
            // Forward audio/text to React
            clientWs.send(data);
        }
    });
});

