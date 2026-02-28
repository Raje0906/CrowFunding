import React, { useState } from "react";

export type TxStatus = "idle" | "pending" | "success" | "error";

interface TxRecord {
    status: TxStatus;
    hash?: string;
    error?: string;
}

interface DonateFormProps {
    address: string;
    balance: number;
    onDonate: (amount: number) => Promise<void>;
    txRecord: TxRecord;
}

const QUICK_AMOUNTS = [10, 50, 100, 500];

const DonateForm: React.FC<DonateFormProps> = ({
    address,
    balance,
    onDonate,
    txRecord,
}) => {
    const [amount, setAmount] = useState("");

    const handleDonate = async () => {
        const num = parseFloat(amount);
        if (!num || num <= 0) return;
        await onDonate(num);
        if (txRecord.status === "success") setAmount("");
    };

    const isDisabled =
        !amount || parseFloat(amount) <= 0 || txRecord.status === "pending";

    return (
        <div className="donate-card glass-card">
            <div className="shimmer-top" />
            <div className="card-label">💸 Make a Donation</div>

            <div className="amount-input-wrap">
                <input
                    className="amount-input"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.1"
                    step="0.01"
                    disabled={txRecord.status === "pending"}
                />
                <span className="amount-currency">XLM</span>
            </div>

            <div className="quick-amounts">
                {QUICK_AMOUNTS.map((q) => (
                    <button key={q} className="quick-btn" onClick={() => setAmount(String(q))}>
                        {q}
                    </button>
                ))}
            </div>

            <div
                style={{
                    fontSize: "12px",
                    color: "rgba(240,244,255,0.4)",
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                }}
            >
                <span>
                    Balance:{" "}
                    <span style={{ color: "var(--teal)", fontWeight: 700 }}>
                        {balance.toFixed(2)} XLM
                    </span>
                </span>
                <span
                    onClick={() => setAmount(String(Math.max(balance - 1, 0).toFixed(2)))}
                    style={{ cursor: "pointer", color: "var(--cyan)", fontWeight: 600 }}
                >
                    MAX
                </span>
            </div>

            <button
                className="btn-donate"
                onClick={handleDonate}
                disabled={isDisabled}
            >
                {txRecord.status === "pending" ? (
                    <span
                        style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}
                    >
                        <span className="spinner" /> Processing...
                    </span>
                ) : (
                    `◈ Donate ${amount ? `${amount} XLM` : "XLM"}`
                )}
            </button>

            {/* Transaction Status */}
            {txRecord.status === "pending" && (
                <div className="tx-status-bar pending">
                    <span className="spinner" />
                    Transaction pending — awaiting confirmation...
                </div>
            )}
            {txRecord.status === "success" && txRecord.hash && (
                <div className="tx-status-bar success">
                    ✅ Success!{" "}
                    <a
                        className="tx-hash-link"
                        href={`https://stellar.expert/explorer/testnet/tx/${txRecord.hash}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {txRecord.hash.slice(0, 12)}...
                    </a>
                </div>
            )}
            {txRecord.status === "error" && (
                <div className="tx-status-bar error">❌ {txRecord.error}</div>
            )}

            <div
                style={{
                    marginTop: "20px",
                    fontSize: "11px",
                    color: "rgba(240,244,255,0.3)",
                    textAlign: "center",
                    lineHeight: 1.6,
                }}
            >
                Transactions are signed by your wallet and submitted to Stellar testnet.
                <br />
                Connected as:{" "}
                <span
                    style={{
                        fontFamily: "JetBrains Mono, monospace",
                        color: "var(--teal)",
                    }}
                >
                    {address.slice(0, 8)}...{address.slice(-6)}
                </span>
            </div>
        </div>
    );
};

export default DonateForm;
export type { TxRecord };
