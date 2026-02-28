import React from "react";

interface HeroCardProps {
    onConnect: () => void;
    loading: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({ onConnect, loading }) => {
    return (
        <div className="hero-card glass-card">
            <div className="shimmer-top" />
            <div className="teal-corner-glow" />

            <div className="eyebrow">Stellar Testnet</div>

            <h1 className="hero-title">
                Fund the <span className="gradient-text">Future</span>
            </h1>

            <p className="hero-subtitle">
                Back real projects on Stellar's blockchain. Connect your wallet to
                donate XLM, track progress, and see real-time contributions.
            </p>

            <span className="diamond-icon">◈</span>

            <p
                style={{
                    fontSize: "14px",
                    color: "rgba(240,244,255,0.5)",
                    marginBottom: "28px",
                    lineHeight: 1.6,
                }}
            >
                Connect your Freighter wallet to view balance and send XLM
            </p>

            <button
                className="btn-primary"
                onClick={onConnect}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <span className="spinner" style={{ borderTopColor: "var(--teal)" }} />
                        Connecting...
                    </>
                ) : (
                    <>⚡ Connect Freighter</>
                )}
            </button>

            <div
                style={{
                    display: "flex",
                    gap: "24px",
                    justifyContent: "center",
                    marginTop: "32px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: "24px",
                }}
            >
                {[
                    { icon: "🔒", label: "Non-Custodial" },
                    { icon: "⚡", label: "Instant Settlement" },
                    { icon: "🌐", label: "Multi-Wallet" },
                ].map((f) => (
                    <div key={f.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>{f.icon}</div>
                        <div style={{ fontSize: "11px", color: "rgba(240,244,255,0.4)", fontWeight: 600 }}>
                            {f.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeroCard;
