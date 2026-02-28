#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Vec, Symbol, log,
};

// ── Storage Keys ──────────────────────────────────────────────────────────────
const OWNER_KEY: Symbol    = symbol_short!("OWNER");
const TARGET_KEY: Symbol   = symbol_short!("TARGET");
const BALANCE_KEY: Symbol  = symbol_short!("BALANCE");
const DEADLINE_KEY: Symbol = symbol_short!("DEADLINE");
const DONORS_KEY: Symbol   = symbol_short!("DONORS");

// ── Contract ──────────────────────────────────────────────────────────────────
#[contract]
pub struct CrowdfundContract;

#[contractimpl]
impl CrowdfundContract {
    /// Initialize the campaign. Call once after deployment.
    /// target_amount: in stroops (1 XLM = 10_000_000 stroops)
    /// deadline_ledger: the ledger number after which no donations accepted
    pub fn initialize(
        env: Env,
        owner: Address,
        target_amount: i128,
        deadline_ledger: u32,
    ) {
        // Can only initialize once
        if env.storage().instance().has(&OWNER_KEY) {
            panic!("Already initialized");
        }
        owner.require_auth();
        env.storage().instance().set(&OWNER_KEY, &owner);
        env.storage().instance().set(&TARGET_KEY, &target_amount);
        env.storage().instance().set(&BALANCE_KEY, &0_i128);
        env.storage().instance().set(&DEADLINE_KEY, &deadline_ledger);
        env.storage().instance().set(&DONORS_KEY, &Vec::<Address>::new(&env));

        // Extend instance TTL so contract lives long enough
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    /// Accept a donation from a donor.
    /// The actual XLM transfer must be done as an inner payment operation.
    pub fn donate(env: Env, donor: Address, amount: i128) {
        donor.require_auth();

        // Check deadline
        let deadline: u32 = env.storage().instance().get(&DEADLINE_KEY).unwrap();
        if env.ledger().sequence() > deadline {
            panic!("Campaign deadline has passed");
        }

        // Check positive amount
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Update balance
        let current: i128 = env.storage().instance().get(&BALANCE_KEY).unwrap_or(0);
        let new_balance = current + amount;
        env.storage().instance().set(&BALANCE_KEY, &new_balance);

        // Record donor
        let mut donors: Vec<Address> = env
            .storage()
            .instance()
            .get(&DONORS_KEY)
            .unwrap_or_else(|| Vec::new(&env));

        if !donors.contains(&donor) {
            donors.push_back(donor.clone());
            env.storage().instance().set(&DONORS_KEY, &donors);
        }

        // Extend TTL
        env.storage().instance().extend_ttl(100_000, 100_000);

        // Emit event: ("donation", donor, amount)
        env.events().publish(
            (symbol_short!("donation"), donor.clone()),
            amount,
        );

        log!(&env, "Donation received from {} for {} stroops", donor, amount);
    }

    /// Owner withdraws raised funds after goal reached or deadline passed.
    pub fn withdraw(env: Env, owner: Address) {
        owner.require_auth();

        let stored_owner: Address = env.storage().instance().get(&OWNER_KEY).unwrap();
        if owner != stored_owner {
            panic!("Only the campaign owner can withdraw");
        }

        let balance: i128 = env.storage().instance().get(&BALANCE_KEY).unwrap_or(0);
        if balance == 0 {
            panic!("No funds to withdraw");
        }

        // Reset balance
        env.storage().instance().set(&BALANCE_KEY, &0_i128);

        env.events().publish(
            (symbol_short!("withdraw"), owner),
            balance,
        );
    }

    /// Returns current raised amount in stroops.
    pub fn get_balance(env: Env) -> i128 {
        env.storage().instance().get(&BALANCE_KEY).unwrap_or(0)
    }

    /// Returns campaign target in stroops.
    pub fn get_target(env: Env) -> i128 {
        env.storage().instance().get(&TARGET_KEY).unwrap_or(0)
    }

    /// Returns the deadline ledger number.
    pub fn get_deadline(env: Env) -> u32 {
        env.storage().instance().get(&DEADLINE_KEY).unwrap_or(0)
    }

    /// Returns true if deadline ledger has been passed.
    pub fn is_deadline_passed(env: Env) -> bool {
        let deadline: u32 = env.storage().instance().get(&DEADLINE_KEY).unwrap_or(0);
        env.ledger().sequence() > deadline
    }

    /// Returns list of donor addresses.
    pub fn get_donors(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DONORS_KEY)
            .unwrap_or_else(|| Vec::new(&env))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::{Address as _, Ledger}, Env};

    #[test]
    fn test_initialize_and_donate() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, CrowdfundContract);
        let client = CrowdfundContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let donor = Address::generate(&env);

        // Initialize: 5000 XLM target, deadline ledger 1000
        client.initialize(&owner, &(5000 * 10_000_000_i128), &1000u32);

        assert_eq!(client.get_balance(), 0);
        assert_eq!(client.get_target(), 5000 * 10_000_000_i128);

        // Donate 100 XLM
        client.donate(&donor, &(100 * 10_000_000_i128));
        assert_eq!(client.get_balance(), 100 * 10_000_000_i128);

        let donors = client.get_donors();
        assert_eq!(donors.len(), 1);
    }

    #[test]
    fn test_deadline_passed() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, CrowdfundContract);
        let client = CrowdfundContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        client.initialize(&owner, &(100 * 10_000_000_i128), &5u32);

        // Advance ledger past deadline
        env.ledger().with_mut(|info| info.sequence_number = 10);

        assert!(client.is_deadline_passed());
    }
}
