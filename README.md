# ◈ Stellar Crowdfunding dApp

> **Level 2 Stellar SAM Project** — Multi-wallet crowdfunding on Soroban testnet with real-time event integration

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-0ff4c6?style=flat-square&logo=stellar)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart_Contract-7b2ff7?style=flat-square)](https://soroban.stellar.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)](https://vite.dev)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎨 **Dark Aurora UI** | Glassmorphism design with animated aurora blobs, film grain, starfield |
| 🔐 **Multi-wallet** | Freighter, xBull, Albedo, Hana, Lobstr, Rabet via StellarWalletsKit |
| 📡 **Smart Contract** | Soroban (Rust) crowdfunding contract — `contract/src/lib.rs` |
| ⏱️ **Real-time** | Campaign state + donation feed polls every 5 seconds |
| 💳 **Tx Tracking** | Live Pending 🟡 / Success ✅ / Failed ❌ with Stellar Explorer link |
| 🚫 **Error Handling** | 3 error types: Wallet Not Found, Tx Rejected, Insufficient Balance |

---

## 🚀 Clone & Run Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org) v18 or higher
- [Git](https://git-scm.com)
- A Stellar wallet browser extension — [Freighter](https://freighter.app) (recommended)

### 2. Clone the repository

```bash
git clone https://github.com/<your-username>/SAM-Project.git
cd SAM-Project
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the dev server

```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 5. Set up your wallet

1. Install the **[Freighter](https://freighter.app)** Chrome extension
2. Create or import a wallet
3. Switch network to **Testnet**: click the network name in Freighter → select "Test SDF Network"
4. Back in the app, click **"⚡ Connect Freighter"**
5. Click **"🚿 Fund Account"** to receive free testnet XLM via Friendbot
6. Enter an amount and click **"◈ Donate XLM"** — approve in Freighter

---

## 🌐 Share via Cloudflare Tunnel

To give someone else a live link to your local server:

```bash
# Install cloudflared (if not already)
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

cloudflared tunnel --url http://localhost:5173
```

Your public URL will appear:
```
+-----------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                     |
|  https://xxxx-xxxx-xxxx.trycloudflare.com                            |
+-----------------------------------------------------------------------+
```

Keep both terminals running — `npm run dev` + `cloudflared tunnel`.

---

## 🏗️ Project Structure

```
SAM-Project/
├── contract/                    # Soroban smart contract (Rust)
│   ├── Cargo.toml
│   └── src/lib.rs               # initialize / donate / withdraw / events
│
├── src/
│   ├── lib/
│   │   ├── stellar.ts           # Stellar SDK: RPC, contract calls, errors
│   │   └── walletKit.ts         # StellarWalletsKit multi-wallet wrapper
│   │
│   ├── components/
│   │   ├── AuroraBackground.tsx # Animated aurora blobs + starfield
│   │   ├── Navbar.tsx           # Floating frosted-glass nav
│   │   ├── HeroCard.tsx         # Pre-connect landing hero
│   │   ├── CampaignCard.tsx     # Progress bar + campaign stats
│   │   ├── DonateForm.tsx       # XLM input + quick amounts + tx status
│   │   ├── ErrorToast.tsx       # Auto-dismiss error toasts (3 types)
│   │   ├── DonationFeed.tsx     # Real-time donations list
│   │   └── WalletCard.tsx       # Balance + tx history + disconnect
│   │
│   ├── App.tsx                  # Root: state, wallet, contract, polling
│   └── index.css                # Dark Aurora Glassmorphism styles
│
├── index.html
├── vite.config.ts               # Node polyfills for Stellar SDK
└── package.json
```

---

## 📜 Smart Contract

The Soroban crowdfunding contract (`contract/src/lib.rs`) exposes:

| Function | Description |
|---|---|
| `initialize(owner, target, deadline)` | Set up campaign parameters |
| `donate(donor, amount)` | Accept XLM donation + emit event |
| `withdraw(owner)` | Owner withdraws after goal/deadline |
| `get_balance()` | Current raised amount |
| `get_target()` | Campaign goal |
| `is_deadline_passed()` | Check campaign status |
| `get_donors()` | List of donor addresses |

### Deploy the contract

> Requires [Rust](https://rustup.rs) and [Stellar CLI](https://github.com/stellar/stellar-cli)

```bash
# 1. Install Stellar CLI
cargo install --locked stellar-cli --features opt

# 2. Create & fund a testnet identity
stellar keys generate --global alice --network testnet
stellar keys fund alice --network testnet

# 3. Build WASM
cd contract
cargo build --target wasm32-unknown-unknown --release

# 4. Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_crowdfund.wasm \
  --source alice \
  --network testnet

# 5. Copy the returned Contract ID into src/lib/stellar.ts → CONTRACT_ID
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 7 |
| Styling | Vanilla CSS (Dark Aurora Glassmorphism) |
| Blockchain | Stellar Testnet + Soroban RPC |
| Wallets | `@creit.tech/stellar-wallets-kit` v2 |
| SDK | `@stellar/stellar-sdk` |
| Contract | Rust + `soroban-sdk` v21 |

---

## ⚡ Level 2 Requirements Met

- [x] **3 error types** — Wallet Not Found, Transaction Rejected, Insufficient Balance
- [x] **Contract on testnet** — Soroban crowdfunding contract (`contract/src/lib.rs`)
- [x] **Contract called from frontend** — `donate()`, `get_balance()`, `get_target()`
- [x] **Transaction status visible** — Pending / Success / Failed + Explorer link
- [x] **2+ meaningful commits** — Smart contract + Frontend integration + README

---

## 📄 License

MIT — built for the Stellar SAM Level 2 challenge.
