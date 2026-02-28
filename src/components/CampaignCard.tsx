import React from "react";
import { type CampaignState, formatXLM } from "../lib/stellar";

interface CampaignCardProps {
    state: CampaignState;
    loading: boolean;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ state, loading }) => {
    const percent = Math.min((state.raised / state.target) * 100, 100);
    const daysLeft = 31; // Demo: days to deadline

    return (
        <div className="campaign-card glass-card">
            <div className="shimmer-top" />

            <div className="campaign-header">
                <div>
                    <div className="campaign-title">🚀 Build a Stellar Future</div>
                    <div className="campaign-subtitle">
                        Community crowdfunding on Soroban testnet
                    </div>
                </div>
                <div className="campaign-deadline">
                    <span>Ends</span>
                    <strong>{state.deadline}</strong>
                    <span
                        style={{
                            display: "block",
                            fontSize: "11px",
                            color: "var(--pink)",
                            marginTop: "4px",
                        }}
                    >
                        {daysLeft}d remaining
                    </span>
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-box">
                    <div className="stat-value">
                        {loading ? "..." : formatXLM(state.raised)}
                    </div>
                    <div className="stat-label">XLM Raised</div>
                </div>
                <div className="stat-box">
                    <div className="stat-value">{formatXLM(state.target)}</div>
                    <div className="stat-label">XLM Target</div>
                </div>
                <div className="stat-box">
                    <div className="stat-value">{Math.round(percent)}%</div>
                    <div className="stat-label">Progress</div>
                </div>
            </div>

            <div className="progress-section">
                <div className="progress-labels">
                    <span>◈ {formatXLM(state.raised)} XLM raised</span>
                    <span>Goal: {formatXLM(state.target)} XLM</span>
                </div>
                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                </div>
                <div className="progress-percent">
                    {percent.toFixed(1)}% funded
                </div>
            </div>

            {state.isGoalReached && (
                <div
                    style={{
                        marginTop: "20px",
                        padding: "14px 18px",
                        background: "rgba(34, 197, 94, 0.1)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        borderRadius: "12px",
                        color: "#4ade80",
                        fontSize: "14px",
                        fontWeight: 700,
                        textAlign: "center",
                    }}
                >
                    🎉 Campaign Goal Reached!
                </div>
            )}

            <div
                style={{
                    marginTop: "20px",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "rgba(240,244,255,0.4)",
                    display: "flex",
                    gap: "16px",
                }}
            >
                <span>
                    🔗 Contract:{" "}
                    <a
                        href="https://stellar.expert/explorer/testnet"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--teal)", textDecoration: "none" }}
                    >
                        View on Explorer ↗
                    </a>
                </span>
                <span>📡 Network: Testnet</span>
            </div>
        </div>
    );
};

export default CampaignCard;
