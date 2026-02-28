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

// Initialize StellarWalletsKit once at module load
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
        const msg = err instanceof Error ? err.message : String(err);
        if (
            msg.includes("not found") ||
            msg.includes("not installed") ||
            msg.includes("Extension not found") ||
            msg.includes("is not defined") ||
            msg.includes("Cannot read properties of undefined")
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
            msg.includes("User closed")
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
        const msg = err instanceof Error ? err.message : String(err);
        if (
            msg.includes("reject") ||
            msg.includes("cancel") ||
            msg.includes("denied") ||
            msg.includes("declined") ||
            msg.includes("User declined") ||
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
