import {
    rpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    Contract,
    nativeToScVal,
    Address,
    scValToNative,
} from "@stellar/stellar-sdk";

// ── Network Configuration ─────────────────────────────────────────────────────
export const NETWORK = "TESTNET" as const;
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

// ── Contract ID ───────────────────────────────────────────────────────────────
export const CONTRACT_ID =
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2X3ZNKU";

// ── RPC Server ────────────────────────────────────────────────────────────────
export const server = new rpc.Server(RPC_URL, { allowHttp: false });

// ── Error Types ───────────────────────────────────────────────────────────────
export class WalletNotFoundError extends Error {
    constructor(wallet: string) {
        super(`${wallet} wallet not found. Please install the extension.`);
        this.name = "WalletNotFoundError";
    }
}

export class TransactionRejectedError extends Error {
    constructor() {
        super("Transaction was rejected by the user.");
        this.name = "TransactionRejectedError";
    }
}

export class InsufficientBalanceError extends Error {
    constructor(required: number, available: number) {
        super(
            `Insufficient XLM balance. Required: ${required}, Available: ${available.toFixed(2)}`
        );
        this.name = "InsufficientBalanceError";
    }
}

// ── Get Account ───────────────────────────────────────────────────────────────
export async function getAccount(address: string) {
    try {
        return await server.getAccount(address);
    } catch {
        throw new Error("Account not found. Fund your testnet account first.");
    }
}

// ── Get XLM Balance ───────────────────────────────────────────────────────────
export async function getXLMBalance(address: string): Promise<number> {
    try {
        const response = await fetch(`${HORIZON_URL}/accounts/${address}`);
        if (!response.ok) return 0;
        const data = await response.json();
        const xlmBalance = data.balances?.find(
            (b: { asset_type: string }) => b.asset_type === "native"
        );
        return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
    } catch {
        return 0;
    }
}

// ── Campaign State Interface ──────────────────────────────────────────────────
export interface CampaignState {
    raised: number;
    target: number;
    deadline: string;
    donors: string[];
    isGoalReached: boolean;
    isDeadlinePassed: boolean;
}

// ── Read Contract State ───────────────────────────────────────────────────────
export async function readContractState(): Promise<CampaignState> {
    // Campaign treasury — receives donations when contract is not yet deployed
    const CAMPAIGN_TREASURY = "GCWHSFPEKYG5OYYQT2M5VRRVM3LSCXACMBNKSZUTH7XCIUGQTGFDAYWD";
    const TARGET = 5000;

    // Helper: get real XLM balance of treasury from Horizon
    async function getTreasuryBalance(): Promise<number> {
        try {
            const res = await fetch(`${HORIZON_URL}/accounts/${CAMPAIGN_TREASURY}`);
            if (!res.ok) return 0;
            const data = await res.json();
            const native = data.balances?.find(
                (b: { asset_type: string }) => b.asset_type === "native"
            );
            return native ? parseFloat(native.balance) : 0;
        } catch {
            return 0;
        }
    }

    try {
        // ── Try Soroban contract first ──────────────────────────────────────────
        const contract = new Contract(CONTRACT_ID);
        const dummyAccount = await server
            .getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN")
            .catch(() => ({
                accountId: () =>
                    "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
                sequenceNumber: () => "1",
                incrementSequenceNumber: () => { },
            }));

        const ops = [contract.call("get_balance"), contract.call("get_target")];
        let raised = -1; // -1 means "not fetched from contract"
        let target = TARGET;

        for (const op of ops) {
            try {
                const tx = new TransactionBuilder(dummyAccount as never, {
                    fee: BASE_FEE,
                    networkPassphrase: NETWORK_PASSPHRASE,
                })
                    .addOperation(op)
                    .setTimeout(30)
                    .build();

                const simResult = await server.simulateTransaction(tx);
                if ("transactionData" in simResult && simResult.result) {
                    const successSim = simResult as rpc.Api.SimulateTransactionSuccessResponse;
                    if (successSim.result) {
                        const val = scValToNative(successSim.result.retval);
                        if (op === ops[0]) raised = Number(val) / 10_000_000;
                        if (op === ops[1]) target = Number(val) / 10_000_000;
                    }
                }
            } catch {
                // contract not deployed — fall through below
            }
        }

        // If contract returned real data use it; otherwise fall back to treasury balance
        const realRaised = raised >= 0 ? raised : await getTreasuryBalance();

        return {
            raised: realRaised,
            target,
            deadline: "March 31, 2026",
            donors: [],
            isGoalReached: realRaised >= target,
            isDeadlinePassed: false,
        };
    } catch {
        // Network error — still show real treasury balance
        const realRaised = await getTreasuryBalance();
        return {
            raised: realRaised,
            target: TARGET,
            deadline: "March 31, 2026",
            donors: [],
            isGoalReached: realRaised >= TARGET,
            isDeadlinePassed: false,
        };
    }
}

// ── Build Donate Transaction ──────────────────────────────────────────────────
export async function buildDonateTx(
    donorAddress: string,
    amountXLM: number
): Promise<string> {
    const amountStroops = BigInt(Math.round(amountXLM * 10_000_000));
    const account = await getAccount(donorAddress);
    const contract = new Contract(CONTRACT_ID);

    const tx = new TransactionBuilder(account, {
        fee: String(500_000),
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(
            contract.call(
                "donate",
                new Address(donorAddress).toScVal(),
                nativeToScVal(amountStroops, { type: "i128" })
            )
        )
        .setTimeout(300)
        .build();

    const prepared = await server.prepareTransaction(tx);
    return prepared.toXDR();
}

// ── Submit Classic (non-Soroban) Transaction via Horizon ──────────────────────
export async function submitClassicTx(signedXDR: string): Promise<string> {
    const params = new URLSearchParams({ tx: signedXDR });
    const response = await fetch(`${HORIZON_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });
    const data = await response.json();
    if (!response.ok) {
        const ops = data?.extras?.result_codes?.operations ?? [];
        const errCode = ops[0] ?? data?.extras?.result_codes?.transaction ?? data?.title ?? "Unknown error";
        if (String(errCode).includes("underfunded") || String(errCode).includes("insufficient"))
            throw new InsufficientBalanceError(0, 0);
        throw new Error(String(errCode));
    }
    return data.hash as string;
}

// ── Submit Signed Transaction ─────────────────────────────────────────────────
export async function submitTransaction(signedXDR: string): Promise<string> {
    const tx = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
    const response = await server.sendTransaction(tx);

    if (response.status === "ERROR") {
        const errMsg =
            (response as { errorResult?: { result?: () => string } }).errorResult
                ?.result?.() || "Unknown RPC error";
        if (errMsg.includes("insufficient")) throw new InsufficientBalanceError(0, 0);
        throw new Error(errMsg);
    }

    const hash = response.hash;
    let attempts = 0;
    while (attempts < 30) {
        await sleep(2000);
        const status = await server.getTransaction(hash);
        // Use string comparison (enum values are string literals)
        if (status.status === "SUCCESS") {
            return hash;
        }
        if (status.status === "FAILED") {
            throw new Error("Transaction failed on-chain.");
        }
        attempts++;
    }
    throw new Error("Transaction timeout. Check Stellar Explorer.");
}

// ── Donation Event Interface ──────────────────────────────────────────────────
export interface DonationEvent {
    id: string;
    donor: string;
    amount: number;
    timestamp: number;
    txHash: string;
}

// ── Fetch Donation Events ─────────────────────────────────────────────────────
export async function fetchRecentDonations(): Promise<DonationEvent[]> {
    // Real events are tracked in-memory by App.tsx when donations succeed.
    // Future: query Soroban RPC getEvents() once contract is deployed.
    return [];
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export function shortenAddress(addr: string, chars = 4): string {
    if (!addr) return "";
    return `${addr.slice(0, chars + 1)}...${addr.slice(-chars)}`;
}

export function formatXLM(amount: number): string {
    return amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
}

export function fundTestnetAccount(address: string): string {
    return `${FRIENDBOT_URL}?addr=${address}`;
}
