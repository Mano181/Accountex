"use client";

import { useState, useEffect } from "react";
import TransactionForm from "@/components/TransactionForm";
import Ledger from "@/components/Ledger";
import ProfitLoss from "@/components/ProfitLoss";
import BalanceSheet from "@/components/BalanceSheet";
import { calculateAccountBalances, generateProfitLoss, generateBalanceSheet } from "@/lib/reports";

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (transactions) {
      const balances = calculateAccountBalances(transactions);
      const pl = generateProfitLoss(balances);
      const bs = generateBalanceSheet(balances, pl.netIncome);
      setReportData({ pl, bs });
    }
  }, [transactions]);

  if (loading || !reportData) {
    return <div className="container" style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 className="title" style={{ fontSize: "2rem", color: "var(--primary)" }}>Accounting Reports App</h1>
        <p style={{ color: "var(--text-secondary)" }}>Real-time Double Entry Accounting</p>
      </div>

      <div className="grid-cols-2" style={{ alignItems: "start" }}>
        {/* Left Column: Input and Ledger */}
        <div>
          <TransactionForm onTransactionAdded={fetchData} />
          <Ledger transactions={transactions} />
        </div>

        {/* Right Column: Reports */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <ProfitLoss data={reportData.pl} />
          <BalanceSheet data={reportData.bs} />
        </div>
      </div>
    </div>
  );
}
