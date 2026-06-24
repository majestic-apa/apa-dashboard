import type { BankAccount, TerminationLetter } from '$lib/types';
import { mockBankAccount, mockTerminations } from '$lib/mock/auth';

// All functions return mock data unconditionally.
// Suleiman has not yet built the profile/bank/termination API endpoints.
// When endpoints are ready: re-add MOCK_API guard + apiRequest calls,
// update endpoint strings, and remove this comment.

let bankAccountStore: BankAccount = structuredClone(mockBankAccount);
let terminationsStore: TerminationLetter[] = structuredClone(mockTerminations);

export async function getBankAccount(_token: string): Promise<BankAccount> {
  return structuredClone(bankAccountStore);
}

export async function updateBankAccount(
  _token: string,
  data: { bank_name: string; account_number: string; account_name: string }
): Promise<BankAccount> {
  bankAccountStore = {
    ...bankAccountStore,
    ...data,
    is_verified: false,
    flagged_for_update: true,
    updated_at: new Date().toISOString()
  };
  return structuredClone(bankAccountStore);
}

export async function getTerminations(_token: string): Promise<TerminationLetter[]> {
  return structuredClone(terminationsStore);
}

export async function submitTermination(
  _token: string,
  data: { reason: string; effective_date: string }
): Promise<TerminationLetter> {
  const letter: TerminationLetter = {
    id: 'term-' + Date.now(),
    ...data,
    status: 'pending',
    submitted_at: new Date().toISOString(),
    response: null,
    responded_by: null,
    responded_at: null
  };
  terminationsStore = [letter, ...terminationsStore];
  return structuredClone(letter);
}
