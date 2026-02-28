import { useState, useEffect, useCallback, useRef } from "react";
import "./index.css";
import AuroraBackground from "./components/AuroraBackground";
import Navbar from "./components/Navbar";
import HeroCard from "./components/HeroCard";
import CampaignCard from "./components/CampaignCard";
import DonateForm, { type TxRecord } from "./components/DonateForm";
import DonationFeed from "./components/DonationFeed";
import WalletCard, { type TxHistoryItem } from "./components/WalletCard";
import ErrorToast, { type Toast, type ToastType } from "./components/ErrorToast";
import {
  type CampaignState,
  type DonationEvent,
  readContractState,
  buildDonateTx,
  submitTransaction,
  submitClassicTx,
  fetchRecentDonations,
  getXLMBalance,
  WalletNotFoundError,
  TransactionRejectedError,
  InsufficientBalanceError,
  formatXLM,
  server,
} from "./lib/stellar";
import {
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Asset,
  Operation,
} from "@stellar/stellar-sdk";
import { connectWallet, signTransaction, disconnectWallet } from "./lib/walletKit";

// ── ID generator ──────────────────────────────────────────────────────────────
let nextId = 1;
const uid = () => String(nextId++);

export default function App() {
  // ── Wallet State ────────────────────────────────────────────────────────────
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [connectLoading, setConnectLoading] = useState(false);

  // ── Campaign State ──────────────────────────────────────────────────────────
  const [campaign, setCampaign] = useState<CampaignState>({
    raised: 1247.5,
    target: 5000,
    deadline: "March 31, 2026",
    donors: [],
    isGoalReached: false,
    isDeadlinePassed: false,
  });
  const [campaignLoading, setCampaignLoading] = useState(false);

  // ── Donation Events ─────────────────────────────────────────────────────────
  const [events, setEvents] = useState<DonationEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // ── Transaction ─────────────────────────────────────────────────────────────
  const [txRecord, setTxRecord] = useState<TxRecord>({ status: "idle" });
  const [txHistory, setTxHistory] = useState<TxHistoryItem[]>([]);

  // ── UI State ────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTab, setActiveTab] = useState("Campaign");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Toast helpers ───────────────────────────────────────────────────────────
  const addToast = useCallback(
    (type: ToastType, title: string, message: string) => {
      setToasts((prev) => [...prev, { id: uid(), type, title, message }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Error classifier ────────────────────────────────────────────────────────
  const handleError = useCallback(
    (err: unknown) => {
      // Wallets (Freighter, xBull) throw plain objects like { code: 4001, message: "..." }
      // not Error instances — extract the message properly
      let msg: string;
      if (err instanceof Error) {
        msg = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        msg = String((err as { message: unknown }).message);
      } else {
        msg = String(err);
      }

      // Error type 1: Wallet not found
      if (
        msg.startsWith("WalletNotFound:") ||
        err instanceof WalletNotFoundError ||
        msg.includes("not found") ||
        msg.includes("not installed") ||
        msg.includes("Extension not found")
      ) {
        const wallet = msg.includes(":") ? msg.split(":")[1] : "Wallet";
        addToast(
          "error",
          "🚫 Wallet Not Found",
          `${wallet} is not installed. Please install a Stellar wallet extension (Freighter, xBull, etc.) and refresh.`
        );
        return;
      }

      // Error type 2: Transaction rejected
      if (
        msg.startsWith("TransactionRejected:") ||
        err instanceof TransactionRejectedError ||
        msg.includes("reject") ||
        msg.includes("cancel") ||
        msg.includes("denied") ||
        msg.includes("declined") ||
        msg.includes("User declined")
      ) {
        addToast(
          "warning",
          "⚠️ Transaction Rejected",
          "You cancelled the transaction in your wallet. No XLM was sent."
        );
        return;
      }

      // Error type 3: Insufficient balance
      if (
        err instanceof InsufficientBalanceError ||
        msg.includes("insufficient") ||
        msg.includes("underfunded") ||
        msg.toLowerCase().includes("balance")
      ) {
        addToast(
          "error",
          "💸 Insufficient Balance",
          `Not enough XLM in your wallet. Current balance: ${formatXLM(balance)} XLM. Click "Fund Account" to get free testnet XLM.`
        );
        return;
      }

      // Generic error
      addToast("error", "Transaction Failed", msg || "An unexpected error occurred.");
    },
    [addToast, balance]
  );

  // ── Connect Wallet ──────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      setConnected(true);
      const bal = await getXLMBalance(addr);
      setBalance(bal);
      if (bal === 0) {
        addToast(
          "info",
          "✅ Wallet Connected",
          `Connected! Balance is 0 — click "Fund Account" to get free testnet XLM.`
        );
      } else {
        addToast("info", "✅ Connected", `Wallet connected: ${addr.slice(0, 8)}...`);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setConnectLoading(false);
    }
  };

  // ── Disconnect ──────────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    await disconnectWallet();
    setConnected(false);
    setAddress("");
    setBalance(0);
    setTxHistory([]);
    addToast("info", "Disconnected", "Wallet disconnected successfully.");
  };

  // ── Donate ──────────────────────────────────────────────────────────────────
  const handleDonate = async (amount: number) => {
    // Client-side balance check
    if (amount > balance) {
      handleError(new InsufficientBalanceError(amount, balance));
      setTxRecord({ status: "error", error: "Insufficient balance" });
      return;
    }

    const historyId = uid();
    setTxRecord({ status: "pending" });
    setTxHistory((prev) => [
      { id: historyId, status: "pending" as const, amount, timestamp: Date.now() },
      ...prev,
    ]);

    try {
      // 1. Build transaction XDR — try Soroban contract first, fall back to classic payment
      let txXDR: string;
      let isClassic = false;
      try {
        txXDR = await buildDonateTx(address, amount);
      } catch {
        // Fallback: send to campaign treasury (user's 2nd wallet)
        isClassic = true;
        const CAMPAIGN_TREASURY = "GCWHSFPEKYG5OYYQT2M5VRRVM3LSCXACMBNKSZUTH7XCIUGQTGFDAYWD";
        const account = await server.getAccount(address);
        const tx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            Operation.payment({
              destination: CAMPAIGN_TREASURY,
              asset: Asset.native(),
              amount: String(amount),
            })
          )
          .setTimeout(300)
          .build();
        txXDR = tx.toXDR();
      }

      // 2. Wallet signs
      let signedXDR: string;
      try {
        signedXDR = await signTransaction(txXDR, address);
      } catch (err) {
        handleError(err);
        setTxRecord({ status: "error", error: "Transaction rejected by wallet" });
        setTxHistory((prev) =>
          prev.map((t) =>
            t.id === historyId
              ? { ...t, status: "error" as const, error: "Rejected" }
              : t
          )
        );
        return;
      }

      // 3. Submit — Soroban txs go to RPC, classic txs go to Horizon
      const hash = isClassic
        ? await submitClassicTx(signedXDR)
        : await submitTransaction(signedXDR);

      setTxRecord({ status: "success", hash });
      setTxHistory((prev) =>
        prev.map((t) =>
          t.id === historyId
            ? { ...t, status: "success" as const, hash }
            : t
        )
      );

      // 4. Refresh balance
      const newBal = await getXLMBalance(address);
      setBalance(newBal);

      // 5. Refresh campaign
      refreshCampaign();

      // 6. Prepend synthetic event
      const newEvent: DonationEvent = {
        id: uid(),
        donor: `${address.slice(0, 8)}...${address.slice(-4)}`,
        amount,
        timestamp: Date.now(),
        txHash: hash,
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 10));

      addToast("info", "🎉 Donation Sent!", `${amount} XLM donated successfully.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      handleError(err);
      setTxRecord({ status: "error", error: msg });
      setTxHistory((prev) =>
        prev.map((t) =>
          t.id === historyId
            ? { ...t, status: "error" as const, error: msg }
            : t
        )
      );
    }
  };

  // ── Refresh Campaign ────────────────────────────────────────────────────────
  const refreshCampaign = useCallback(async () => {
    setCampaignLoading(true);
    try {
      const state = await readContractState();
      setCampaign(state);
    } catch {
      // silently keep current state
    } finally {
      setCampaignLoading(false);
    }
  }, []);

  // ── Refresh Events ──────────────────────────────────────────────────────────
  const refreshEvents = useCallback(async () => {
    try {
      const evs = await fetchRecentDonations();
      // Only update from remote if we got real data; preserve locally-tracked events
      if (evs.length > 0) setEvents(evs);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // ── Polling every 5s ────────────────────────────────────────────────────────
  useEffect(() => {
    refreshCampaign();
    refreshEvents();

    pollRef.current = setInterval(() => {
      refreshCampaign();
      refreshEvents();
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshCampaign, refreshEvents]);

  // ── Balance refresh every 10s when connected ────────────────────────────────
  useEffect(() => {
    if (!connected || !address) return;
    const interval = setInterval(async () => {
      const bal = await getXLMBalance(address);
      setBalance(bal);
    }, 10000);
    return () => clearInterval(interval);
  }, [connected, address]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <AuroraBackground />
      <ErrorToast toasts={toasts} onDismiss={dismissToast} />

      <div className="app-wrapper">
        <Navbar
          connected={connected}
          address={address}
          onConnect={handleConnect}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <main className="main-content">
          {!connected ? (
            <HeroCard onConnect={handleConnect} loading={connectLoading} />
          ) : (
            <div className="dashboard-grid">
              <div className="dashboard-left">
                <CampaignCard state={campaign} loading={campaignLoading} />
                <DonateForm
                  address={address}
                  balance={balance}
                  onDonate={handleDonate}
                  txRecord={txRecord}
                />
              </div>
              <div className="dashboard-right">
                <WalletCard
                  address={address}
                  balance={balance}
                  txHistory={txHistory}
                  onDisconnect={handleDisconnect}
                />
                <DonationFeed events={events} loading={eventsLoading} />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
