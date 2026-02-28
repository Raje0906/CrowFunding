import React from "react";
import { formatXLM, shortenAddress, fundTestnetAccount } from "../lib/stellar";
import { type TxRecord } from "./DonateForm";

interface TxHistoryItem extends TxRecord {
    id: string;
    amount: number;
    timestamp: number;
}

interface WalletCardProps {
    address: string;
    balance: number;
    txHistory: TxHistoryItem[];
    onDisconnect: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({
    address,
    balance,
    txHistory,
    onDisconnect,
}) => {
    const STATUS_ICON: Record<string, string> = {
        success: "✅",
        pending: "⏳",
        error: "❌",
        idle: "—",
    };

    return (
        <>
            {/* Wallet Info */}
            <div className="wallet-card glass-card">
                <div className="shimmer-top" />
                <div className="wallet-balance-label">Your XLM Balance</div>
                <div className="wallet-balance-value">{formatXLM(balance)}</div>
                <div className="wallet-balance-sub">XLM · Stellar Testnet</div>

                <div
                    style={{
                        marginTop: "16px",
                        padding: "10px 14px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "10px",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "12px",
                        color: "var(--teal)",
                        wordBreak: "break-all",
                    }}
                >
                    {address}
                </div>

                <div className="wallet-actions">
                    <a
                        className="btn-sm"
                        href={fundTestnetAccount(address)}
                        target="_blank"
                        rel="noreferrer"
                    >
                        🚿 Fund Account
                    </a>
                    <button className="btn-sm danger" onClick={onDisconnect}>
                        ⏻ Disconnect
                    </button>
                </div>
            </div>

            {/* Tx History */}
            {txHistory.length > 0 && (
                <div className="history-card glass-card">
                    <div className="shimmer-top" />
                    <div
                        style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: "var(--teal)",
                            marginBottom: "16px",
                        }}
                    >
                        My Transactions
                    </div>

                    {txHistory.map((tx) => (
                        <div className="history-item" key={tx.id}>
                            <div className={`history-status-icon ${tx.status}`}>
                                {STATUS_ICON[tx.status]}
                            </div>
                            <div className="history-info">
                                <div className="history-amount">
                                    {formatXLM(tx.amount)} XLM
                                </div>
                                <div className="history-meta">
                                    {tx.status === "success" && tx.hash ? (
                                        <a
                                            href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: "var(--teal)", textDecoration: "none" }}
                                        >
                                            {shortenAddress(tx.hash, 6)} ↗
                                        </a>
                                    ) : tx.status === "error" ? (
                                        <span style={{ color: "var(--pink)" }}>{tx.error}</span>
                                    ) : (
                                        <span>Pending...</span>
                                    )}
                                </div>
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "rgba(240,244,255,0.3)",
                                }}
                            >
                                {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default WalletCard;
export type { TxHistoryItem };
