import React from "react";
import { shortenAddress } from "../lib/stellar";

interface NavbarProps {
    connected: boolean;
    address: string;
    onConnect: () => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
    connected,
    address,
    onConnect,
    activeTab,
    onTabChange,
}) => {
    return (
        <nav className="navbar">
            <div className="logo">
                <div className="logo-gem">💎</div>
                <span className="logo-text">Stellar dApp</span>
            </div>

            <div className="nav-center">
                {["Campaign", "Donate", "History"].map((tab) => (
                    <button
                        key={tab}
                        className={`nav-pill ${activeTab === tab ? "active" : ""}`}
                        onClick={() => onTabChange(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="wallet-status">
                {connected ? (
                    <>
                        <div className="pulse-dot" />
                        <div className="wallet-address">{shortenAddress(address, 4)}</div>
                    </>
                ) : (
                    <button className="btn-connect-nav" onClick={onConnect}>
                        ⚡ Connect Wallet
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
