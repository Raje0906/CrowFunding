import React from "react";
import { type DonationEvent, formatXLM, timeAgo } from "../lib/stellar";

interface DonationFeedProps {
    events: DonationEvent[];
    loading: boolean;
}

const AVATARS = ["🦋", "🌟", "🔮", "⚡", "🎯", "🦄", "💫", "🌊"];

const DonationFeed: React.FC<DonationFeedProps> = ({ events, loading }) => {
    return (
        <div className="feed-card glass-card">
            <div className="shimmer-top" />
            <div className="feed-header">
                <span className="feed-title">Recent Donations</span>
                <div className="live-indicator">
                    <div className="live-dot" />
                    LIVE
                </div>
            </div>

            {loading ? (
                <div className="history-empty">Loading events...</div>
            ) : events.length === 0 ? (
                <div className="history-empty">
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌱</div>
                    Be the first to donate!
                </div>
            ) : (
                <div className="feed-list">
                    {events.map((ev, i) => (
                        <div className="feed-item" key={ev.id}>
                            <div className="feed-avatar">{AVATARS[i % AVATARS.length]}</div>
                            <div className="feed-info">
                                <div className="feed-donor">{ev.donor}</div>
                                <div className="feed-time">{timeAgo(ev.timestamp)}</div>
                            </div>
                            <div className="feed-amount">+{formatXLM(ev.amount)} XLM</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DonationFeed;
