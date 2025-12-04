import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, CreditCard, ArrowRightLeft, DollarSign, Activity, 
  Wifi, Database, Lock, Unlock, Server, LogOut, History, ArrowDownCircle
} from 'lucide-react';
import AccountActions from './AccountActions';

// --- TYPES ---
type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  accountId: string;
};

type Card = {
  id: string;
  type: string;
  last4: string;
  status: 'active' | 'inactive';
  linkedAccountId: string;
};

type Account = {
  id: string;
  type: string;
  balance: number;
  number: string;
  external?: boolean;
};

type UserData = {
  id: string;
  name: string;
  email: string;
  accounts: Account[];
  cards: Card[];
  transactions: Transaction[];
};




function generateAccountNumber(userEmail: string, accountId: string) {
  // Simple hash: combine email and accountId, then get a 4-digit number
  let hash = 0;
  const str = userEmail + accountId;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const num = Math.abs(hash % 9000) + 1000;
  return '**** ' + num.toString();
}


function generateCardLast4(userEmail: string, cardId: string) {
  let hash = 0;
  const str = userEmail + cardId;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const num = Math.abs(hash % 9000) + 1000;
  return num.toString();
}

const INITIAL_DATA_TEMPLATE: UserData = {
  id: 'usr_000',
  name: '',
  email: '',
  accounts: [
    { id: 'acc_chk_01', type: 'Checking', balance: 5420.50, number: generateAccountNumber('', 'acc_chk_01') },
    { id: 'acc_sav_01', type: 'Savings', balance: 12500.00, number: generateAccountNumber('', 'acc_sav_01') },
    { id: 'acc_ext_02', type: 'External (Mom)', balance: 0, number: generateAccountNumber('', 'acc_ext_02'), external: true }
  ],
  cards: [
    { id: 'crd_001', type: 'Visa Platinum', last4: '4242', status: 'active', linkedAccountId: 'acc_chk_01' },
    { id: 'crd_002', type: 'Mastercard Gold', last4: '8811', status: 'inactive', linkedAccountId: 'acc_sav_01' }
  ],
  transactions: [
    { id: 'tx_1', date: '2023-10-24', description: 'Grocery Store', amount: -150.25, accountId: 'acc_chk_01' },
    { id: 'tx_2', date: '2023-10-23', description: 'Salary Deposit', amount: 3200.00, accountId: 'acc_chk_01' },
    { id: 'tx_3', date: '2023-10-20', description: 'Netflix', amount: -15.99, accountId: 'acc_chk_01' },
  ]
};

// --- COMPONENT: AUTH SCREEN ---
const AuthScreen = ({ onLogin }: { onLogin: (name: string, email: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (isLogin) {
        if (formData.email && formData.password.length > 5) {
          onLogin(formData.name, formData.email);
        } else {
          setError('Invalid credentials.');
        }
      } else {
        if (formData.name && formData.email && formData.password.length > 5) {
          onLogin(formData.name, formData.email);
        } else {
          setError('All fields are required.');
        }
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans text-gray-100">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden relative">
        <div className="bg-gray-800/50 p-8 text-center border-b border-gray-700/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <DollarSign className="text-white w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">NovaBank AI</h1>
          <p className="text-gray-400 text-sm mt-2">Voice-First Financial Intelligence</p>
        </div>

        <div className="p-8">
          <div className="flex mb-6 bg-gray-900/50 rounded-lg p-1 border border-gray-700/50">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400 ml-1">Full Name</label>
                <input type="text" className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Email</label>
              <input type="email" className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Password</label>
              <input type="password" className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center disabled:opacity-50 mt-4">
              {loading ? <Activity className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: DASHBOARD ---
const Dashboard = ({ user: initialUser, onLogout }: { user: UserData, onLogout: () => void }) => {
  const [user, setUser] = useState(initialUser);
  const [isListening, setIsListening] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  // Greet user by name on login
  const [lastResponse, setLastResponse] = useState(`Welcome, ${initialUser.name && initialUser.name.trim() ? initialUser.name : initialUser.email ? initialUser.email.split('@')[0] : 'User'}! How can I assist you today? Try saying "Withdraw $20" or "Show transaction history".`);
  const [logs, setLogs] = useState<{type: string, msg: string}[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    localStorage.setItem('novabank_user', JSON.stringify(user));
  }, [user]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  // --- MOCK BACKEND LOGIC (The "SQL" Layer) ---
  const logSystem = (msg: string, type: 'db' | 'ai' | 'net' | 'auth' = 'info' as any) => {
    setLogs(prev => [...prev.slice(-8), {type, msg}]);
  };

  const getAccount = (typeOrId: string) => {
    return user.accounts.find(a => a.id === typeOrId || a.type.toLowerCase().includes(typeOrId.toLowerCase()));
  };

  // 1. WITHDRAW LOGIC
  const withdrawFunds = (amount: number, fromType: string) => {
    const fromAcc = getAccount(fromType);
    if (!fromAcc) return { success: false, msg: "I couldn't find that account." };
    if (fromAcc.balance < amount) return { success: false, msg: `Insufficient funds in ${fromAcc.type}.` };

    logSystem(`SQL UPDATE: Withdraw $${amount} from ${fromAcc.id}`, 'db');
    
    setUser(prev => {
      const newAccounts = prev.accounts.map(acc => {
        if (acc.id === fromAcc.id) return { ...acc, balance: acc.balance - amount };
        return acc;
      });
      const newTx = {
        id: `tx_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `ATM Withdrawal`,
        amount: -amount,
        accountId: fromAcc.id
      };
      return { ...prev, accounts: newAccounts, transactions: [newTx, ...prev.transactions] };
    });

    return { success: true, msg: `I've withdrawn $${amount} from your ${fromAcc.type}. Please take your cash.` };
  };

  // 2. TRANSFER LOGIC
  const transferFunds = (amount: number, fromType: string, toType: string) => {
    const fromAcc = getAccount(fromType);
    const toAcc = getAccount(toType);

    if (!fromAcc || !toAcc) return { success: false, msg: "I couldn't find one of those accounts." };
    if (fromAcc.balance < amount) return { success: false, msg: `Insufficient funds in ${fromAcc.type}.` };

    logSystem(`SQL TRANSACTION: Transfer $${amount} ${fromAcc.id} -> ${toAcc.id}`, 'db');
    
    setUser(prev => {
      const newAccounts = prev.accounts.map(acc => {
        if (acc.id === fromAcc.id) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAcc.id && !acc.external) return { ...acc, balance: acc.balance + amount };
        return acc;
      });
      const newTx = {
        id: `tx_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Transfer to ${toAcc.type}`,
        amount: -amount,
        accountId: fromAcc.id
      };
      return { ...prev, accounts: newAccounts, transactions: [newTx, ...prev.transactions] };
    });

    return { success: true, msg: `Successfully transferred $${amount} from ${fromAcc.type} to ${toAcc.type}.` };
  };

  // 3. HISTORY LOGIC
  const getHistory = (accountType: string) => {
    const acc = getAccount(accountType);
    if (!acc) return { success: false, msg: "Account not found." };

    logSystem(`SQL SELECT: TOP 3 Transactions WHERE AccountID='${acc.id}'`, 'db');
    // Include all transactions, including deposits
    const recent = user.transactions
      .filter(t => t.accountId === acc.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    if (recent.length === 0) return { success: true, msg: `No recent transactions found for ${acc.type}.` };

    const summary = recent.map(t => {
      if (t.description.toLowerCase().includes('deposit')) {
        return `Deposit of $${Math.abs(t.amount)}`;
      }
      return `${t.description} for $${Math.abs(t.amount)}`;
    }).join(', ');
    return { success: true, msg: `Here are the last 3 transactions for ${acc.type}: ${summary}.` };
  };

  const setCardStatus = (cardType: string, status: 'active' | 'inactive') => {
    const card = user.cards.find(c => c.type.toLowerCase().includes(cardType.toLowerCase()) || c.last4 === cardType);
    if (!card) return { success: false, msg: "Card not found." };
    logSystem(`SQL UPDATE: Cards SET Status='${status}' WHERE ID='${card.id}'`, 'db');
    setUser(prev => ({ ...prev, cards: prev.cards.map(c => c.id === card.id ? { ...c, status } : c) }));
    return { success: true, msg: `Your ${card.type} is now ${status}.` };
  };

  // --- VOICE LOGIC ---
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google US English')) || voices[0];
      if (preferred) utter.voice = preferred;
      utter.onstart = () => setAgentStatus('speaking');
      utter.onend = () => setAgentStatus('idle');
      window.speechSynthesis.speak(utter);
    }
  };

  const processVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    setAgentStatus('processing');
    logSystem(`AI PROCESSING: Intent recognition for "${text}"`, 'ai');
    
    setTimeout(() => {
      let responseText = "I didn't quite catch that.";
      let actionTaken = false;

      // Intent: Balance
      if (lower.includes('balance')) {
        const acc = user.accounts.find(a => lower.includes(a.type.toLowerCase())) || user.accounts[0];
        responseText = `The balance in your ${acc.type} account is $${acc.balance.toLocaleString()}.`;
        actionTaken = true;
      }

      // Intent: Transfer
      const transferMatch = lower.match(/transfer \$?(\d+).*from (\w+).*to (\w+)/);
      if (transferMatch) {
        const [_, amt, from, to] = transferMatch;
        const result = transferFunds(parseFloat(amt), from, to);
        responseText = result.msg;
        actionTaken = true;
      }

      // Intent: Withdraw 
      const withdrawMatch = lower.match(/withdraw \$?(\d+).*from (\w+)/);
      if (withdrawMatch) {
        const [_, amt, from] = withdrawMatch;
        const result = withdrawFunds(parseFloat(amt), from);
        responseText = result.msg;
        actionTaken = true;
      }

      // Intent: History 
      if (lower.includes('history') || lower.includes('transactions') || lower.includes('last spent')) {
        const type = lower.includes('savings') ? 'Savings' : 'Checking';
        const result = getHistory(type);
        responseText = result.msg;
        actionTaken = true;
      }

      // Intent: Card Status
      if (lower.includes('card') || lower.includes('visa') || lower.includes('mastercard')) {
        let cardType = '';
        if (lower.includes('visa')) cardType = 'Visa';
        if (lower.includes('mastercard')) cardType = 'Mastercard';
        const status = (lower.includes('lock') || lower.includes('deactivate')) ? 'inactive'
                      : (lower.includes('unlock') || lower.includes('activate')) ? 'active'
                      : null;
        if (cardType && status) {
          const cardMatch = user.cards.find(c => c.type.toLowerCase().includes(cardType.toLowerCase()));
          if (cardMatch) {
            const result = setCardStatus(cardMatch.type, status);
            responseText = result.msg;
            actionTaken = true;
          }
        } else if (lower.includes('card') && status) {
          const cardMatch = user.cards.find(c => lower.includes(c.type.toLowerCase()));
          if (cardMatch) {
            const result = setCardStatus(cardMatch.type, status);
            responseText = result.msg;
            actionTaken = true;
          }
        }
      }

      setLastResponse(responseText);
      speak(responseText);
      if (!actionTaken && agentStatus !== 'speaking') setAgentStatus('idle');
      logSystem(actionTaken ? "AI: Executed Tool & Responded" : "AI: Conversational Response", 'ai');
    }, 1000);
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onstart = () => {
        setAgentStatus('listening');
        logSystem("WebSocket: Audio Stream Open", 'net');
      };

      recognitionRef.current.onresult = (event: any) => {
        const txt = event.results[0][0].transcript;
        setTranscript(txt);
        processVoiceCommand(txt);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setAgentStatus('idle');
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [user]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Inject  for AccountActions
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.__withdrawFunds = (amt: number, type: string) => withdrawFunds(amt, type);
    // @ts-ignore
    window.__transferFunds = (amt: number, from: string, to: string) => transferFunds(amt, from, to);
    // @ts-ignore
    window.__setUser = setUser;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <DollarSign className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">NovaBank AI</h1>
          </div>
          <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-2 text-sm text-gray-400">
               <div className={`w-2 h-2 rounded-full ${agentStatus === 'idle' ? 'bg-green-500' : 'bg-blue-400 animate-pulse'}`}></div>
               <span className="hidden sm:inline">System Online</span>
             </div>
            <div className="flex items-center space-x-4">
               <span className="text-sm font-bold text-blue-300" title="Logged in user">{user.name && user.name.trim() ? user.name : user.email ? user.email.split('@')[0] : 'User'}</span>
               <button onClick={onLogout} className="bg-gray-700 hover:bg-red-600/80 p-2 rounded-full transition-colors" title="Logout">
                 <LogOut className="w-4 h-4 text-white" />
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Accounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.accounts.filter(a => !a.external).map(acc => (
              <div key={acc.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <CreditCard className="w-24 h-24 text-blue-500" />
                </div>
                <h3 className="text-gray-400 font-medium mb-1 text-sm uppercase tracking-wide">{acc.type}</h3>
                <div className="text-3xl font-bold text-white mb-4">${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span className="font-mono">{acc.number}</span>
                  <span className="text-green-400 flex items-center bg-green-400/10 px-2 py-1 rounded-full"><Activity className="w-3 h-3 mr-1" /> Active</span>
                </div>
                <AccountActions acc={acc} />
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <h3 className="font-semibold text-gray-200 flex items-center"><CreditCard className="w-4 h-4 mr-2" /> My Cards</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {user.cards.map(card => (
                <div key={card.id} className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-8 rounded flex items-end justify-end pr-1 pb-1 ${card.type.includes('Visa') ? 'bg-blue-900' : 'bg-yellow-900'} shadow-sm border border-white/10`}>
                      <span className="text-[6px] text-white/80 font-bold uppercase">{card.type.split(' ')[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{card.type}</p>
                      <p className="text-xs text-gray-500">**** {card.last4}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${card.status === 'active' ? 'border-green-900 bg-green-900/20 text-green-400' : 'border-red-900 bg-red-900/20 text-red-400'}`}> 
                      {card.status.toUpperCase()}
                    </span>
                    {card.status === 'active' ? <Unlock className="w-4 h-4 text-gray-600" /> : <Lock className="w-4 h-4 text-red-500" />}
                    <button
                      className={`ml-2 px-2 py-1 rounded text-white text-xs ${card.status === 'active' ? 'bg-red-700 hover:bg-red-800' : 'bg-green-700 hover:bg-green-800'}`}
                      onClick={() => setCardStatus(card.type, card.status === 'active' ? 'inactive' : 'active')}
                    >
                      {card.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-gray-800 rounded-xl border border-gray-700">
             <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <h3 className="font-semibold text-gray-200 flex items-center"><History className="w-4 h-4 mr-2" /> Recent Transactions</h3>
            </div>
            <div className="p-4 space-y-3">
              {user.transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded transition-colors">
                  <div className="flex items-center space-x-3">
                     <div className="bg-gray-700 p-2 rounded-full">
                       {tx.amount < 0 && !tx.description.includes('Transfer') ? <ArrowDownCircle className="w-4 h-4 text-red-300" /> : <ArrowRightLeft className="w-4 h-4 text-gray-300" />}
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-200">{tx.description}</p>
                       <p className="text-xs text-gray-500">{tx.date}</p>
                     </div>
                  </div>
                  <span className={`font-mono font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-gray-100'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Voice Agent */}
        <div className="lg:col-span-1 flex flex-col h-full space-y-6">
          <div className="bg-gradient-to-b from-indigo-900 to-gray-900 rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col h-[500px] relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
               <div className={`w-32 h-32 rounded-full border-4 border-indigo-400 ${agentStatus === 'speaking' || agentStatus === 'processing' ? 'animate-ping' : ''}`}></div>
               <div className={`absolute w-56 h-56 rounded-full border border-indigo-300 ${agentStatus === 'speaking' ? 'animate-pulse' : ''}`}></div>
            </div>

            <div className="p-6 text-center z-10 mt-8 flex-1 flex flex-col items-center">
               <div className={`inline-flex items-center justify-center p-4 rounded-full mb-6 ring-1 ring-white/10 transition-all duration-500 ${agentStatus === 'listening' ? 'bg-red-500/20 ring-red-500/50' : agentStatus === 'speaking' ? 'bg-green-500/20 ring-green-500/50' : agentStatus === 'processing' ? 'bg-indigo-500/20 ring-indigo-500/50' : 'bg-gray-800 ring-gray-600'}`}>
                 {agentStatus === 'processing' && <Activity className="w-8 h-8 text-indigo-400 animate-spin" />}
                 {agentStatus === 'listening' && <Mic className="w-8 h-8 text-red-400 animate-pulse" />}
                 {agentStatus === 'speaking' && <Wifi className="w-8 h-8 text-green-400 animate-pulse" />}
                 {agentStatus === 'idle' && <Server className="w-8 h-8 text-gray-400" />}
               </div>

               <h2 className="text-2xl font-bold text-white mb-2 transition-all">
                 {agentStatus === 'listening' ? 'Listening...' : agentStatus === 'processing' ? 'Processing...' : agentStatus === 'speaking' ? 'Agent Speaking' : 'Voice Assistant'}
               </h2>
               
               <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 w-full mt-4 border border-white/5 min-h-[100px] flex flex-col items-center justify-center">
                 <p className="text-indigo-100 text-lg leading-relaxed">"{transcript || lastResponse}"</p>
                 <p className="text-blue-300 text-base font-bold mt-2">{user.name && user.name.trim() ? `👋 Hello, ${user.name}!` : user.email ? `👋 Hello, ${user.email.split('@')[0]}!` : ''}</p>
               </div>
            </div>

            <div className="p-6 flex justify-center z-10 pb-10">
               <button onClick={toggleListening} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 ${isListening ? 'bg-red-500 hover:bg-red-600 shadow-red-900/50 ring-4 ring-red-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50 ring-4 ring-indigo-600/20'}`}>
                 {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
               </button>
            </div>
            
            <div className="p-3 bg-black/40 text-xs text-center text-gray-400 border-t border-white/5">
               Try: "Withdraw $50", "Transfer money", "Show history"
            </div>
          </div>

          <div className="bg-black/80 rounded-xl border border-gray-800 p-4 font-mono text-xs overflow-hidden flex-1 flex flex-col h-48">
            <h3 className="text-gray-500 mb-2 flex items-center uppercase tracking-wider text-[10px]"><Database className="w-3 h-3 mr-2" /> Backend Operations Log</h3>
            <div className="space-y-1 overflow-y-auto flex-1 text-gray-300 pr-2 scrollbar-thin scrollbar-thumb-gray-700" ref={scrollRef}>
              {logs.length === 0 && <span className="text-gray-600 italic">System ready. Waiting for voice stream...</span>}
              {logs.map((log, i) => (
                <div key={i} className="flex space-x-2 animate-in fade-in slide-in-from-left-2 duration-300 leading-tight py-0.5">
                  <span className={`font-bold flex-shrink-0 ${log.type === 'db' ? 'text-yellow-500' : log.type === 'ai' ? 'text-purple-400' : log.type === 'net' ? 'text-blue-400' : 'text-green-400'}`}>[{log.type.toUpperCase()}]</span>
                  <span className="break-all">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('novabank_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (name: string, email: string) => {
    // Generate unique account numbers for this user
    const accounts = [
      { id: 'acc_chk_01', type: 'Checking', balance: 5420.50, number: generateAccountNumber(email, 'acc_chk_01') },
      { id: 'acc_sav_01', type: 'Savings', balance: 12500.00, number: generateAccountNumber(email, 'acc_sav_01') },
      { id: 'acc_ext_02', type: 'External (Mom)', balance: 0, number: generateAccountNumber(email, 'acc_ext_02'), external: true }
    ];
    // Generate unique card numbers for this user
    const cards = [
      { id: 'crd_001', type: 'Visa Platinum', last4: generateCardLast4(email, 'crd_001'), status: 'active' as 'active', linkedAccountId: 'acc_chk_01' },
      { id: 'crd_002', type: 'Mastercard Gold', last4: generateCardLast4(email, 'crd_002'), status: 'inactive' as 'inactive', linkedAccountId: 'acc_sav_01' }
    ];
    // Greet user by name on login
    const userData: UserData = { ...INITIAL_DATA_TEMPLATE, name: name, email: email, accounts, cards };
    setCurrentUser(userData);
    localStorage.setItem('novabank_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('novabank_user');
  };

  
  React.useEffect(() => {
    if (currentUser) {
      localStorage.setItem('novabank_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  return <>{currentUser ? <Dashboard user={currentUser} onLogout={handleLogout} /> : <AuthScreen onLogin={handleLogin} />}</>;
}


