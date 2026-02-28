import {
    StellarWalletsKit,
    Networks,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { RabetModule } from "@creit.tech/stellar-wallets-kit/modules/rabet";

// Helper: extract readable message from any error type
// Freighter and other wallets throw plain { code, message } objects
function errMsg(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === "object" && "message" in err)
        return String((err as { message: unknown }).message);
    return String(err);
}

StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: [
        new FreighterModule(),
        new xBullModule(),
        new AlbedoModule(),
        new HanaModule(),
        new LobstrModule(),
        new RabetModule(),
    ],
});

/**
 * Opens the StellarWalletsKit auth modal.
 * Returns the connected wallet address.
 * Throws categorized errors for: WalletNotFound, TransactionRejected.
 */
export async function connectWallet(): Promise<string> {
    try {
        const { address } = await StellarWalletsKit.authModal();
        return address;
    } catch (err: unknown) {
        const msg = errMsg(err).toLowerCase();
        if (
            msg.includes("not found") ||
            msg.includes("not installed") ||
            msg.includes("extension not found") ||
            msg.includes("is not defined") ||
            msg.includes("cannot read properties of undefined")
        ) {
            throw new Error("WalletNotFound:Wallet");
        }
        if (
            msg.includes("reject") ||
            msg.includes("cancel") ||
            msg.includes("denied") ||
            msg.includes("declined") ||
            msg.includes("closed") ||
            msg.includes("dismiss") ||
            // modal closed by user
            msg.includes("user closed")
        ) {
            throw new Error("TransactionRejected:");
        }
        throw err;
    }
}

/**
 * Signs a transaction XDR with the currently connected wallet.
 */
export async function signTransaction(
    txXDR: string,
    address: string
): Promise<string> {
    try {
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXDR, {
            networkPassphrase: Networks.TESTNET,
            address,
        });
        return signedTxXdr;
    } catch (err: unknown) {
        const msg = errMsg(err).toLowerCase();
        if (
            msg.includes("reject") ||
            msg.includes("cancel") ||
            msg.includes("denied") ||
            msg.includes("declined") ||
            msg.includes("user declined") ||
            msg.includes("closed")
        ) {
            throw new Error("TransactionRejected:");
        }
        throw err;
    }
}

/**
 * Disconnects the current wallet session.
 */
export async function disconnectWallet(): Promise<void> {
    try {
        await StellarWalletsKit.disconnect();
    } catch {
        /* ignore disconnect errors */
    }
}
