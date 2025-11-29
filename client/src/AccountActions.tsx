import { useState } from "react";

// Extend window type for injected helpers
declare global {
  interface Window {
    __withdrawFunds?: (amt: number, type: string) => void;
    __transferFunds?: (amt: number, from: string, to: string) => void;
    __setUser?: (fn: any) => void;
  }
}

export default function AccountActions({ acc }: { acc: any }) {
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [transferAmt, setTransferAmt] = useState("");
  // These functions will be injected via window for now
  // @ts-ignore
  const withdrawFunds = (amt: number, type: string) => window.__withdrawFunds?.(amt, type);
  // @ts-ignore
  const transferFunds = (amt: number, from: string, to: string) => window.__transferFunds?.(amt, from, to);
  // @ts-ignore
  const setUser = (fn: any) => {
    if (window.__setUser) {
      window.__setUser((prev: any) => {
        const updated = fn(prev);
        localStorage.setItem('novabank_user', JSON.stringify(updated));
        return updated;
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex gap-2 items-center">
        <input type="number" min="0" step="0.01" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} className="w-20 px-2 py-1 rounded text-xs bg-gray-900 border border-gray-700 text-white" />
        <button className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs" onClick={() => {
          if (depositAmt) {
            setUser((prev: any) => ({
              ...prev,
              accounts: prev.accounts.map((a: any) => a.id === acc.id ? { ...a, balance: a.balance + parseFloat(depositAmt) } : a),
              transactions: [{
                id: `tx_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: `Deposit`,
                amount: parseFloat(depositAmt),
                accountId: acc.id
              }, ...prev.transactions]
            }));
            setDepositAmt("");
          }
        }}>Deposit</button>
      </div>
      <div className="flex gap-2 items-center">
        <input type="number" min="0" step="0.01" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} className="w-20 px-2 py-1 rounded text-xs bg-gray-900 border border-gray-700 text-white" />
        <button className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-xs" onClick={() => {
          if (withdrawAmt) {
            withdrawFunds(parseFloat(withdrawAmt), acc.type);
            // Update localStorage after withdrawal
            setTimeout(() => {
              const saved = localStorage.getItem('novabank_user');
              if (saved) localStorage.setItem('novabank_user', saved);
            }, 100);
            setWithdrawAmt("");
          }
        }}>Withdraw</button>
      </div>
      <div className="flex gap-2 items-center">
        <input type="number" min="0" step="0.01" value={transferAmt} onChange={e => setTransferAmt(e.target.value)} className="w-20 px-2 py-1 rounded text-xs bg-gray-900 border border-gray-700 text-white" />
        <button className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded text-xs" onClick={() => {
          const toType = acc.type === "Checking" ? "Savings" : "Checking";
          if (transferAmt) {
            transferFunds(parseFloat(transferAmt), acc.type, toType);
            // Update localStorage after transfer
            setTimeout(() => {
              const saved = localStorage.getItem('novabank_user');
              if (saved) localStorage.setItem('novabank_user', saved);
            }, 100);
            setTransferAmt("");
          }
        }}>Transfer to {acc.type === "Checking" ? "Savings" : "Checking"}</button>
      </div>
    </div>
  );
}
