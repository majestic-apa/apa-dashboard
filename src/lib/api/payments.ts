import type { CommissionPeriodSummary } from '$lib/types';
import {
  mockCurrentPeriodSummary,
  mockPreviousPeriodSummary,
  mockNextPeriodSummary
} from '$lib/mock/payments';

// All functions return mock data unconditionally.
// Suleiman has not yet built the payments/commission API endpoints.
// When endpoints are ready: re-add MOCK_API guard + apiRequest calls,
// update endpoint strings, and remove this comment.

export async function getCurrentPeriod(_token: string): Promise<CommissionPeriodSummary> {
  return structuredClone(mockCurrentPeriodSummary);
}

export async function getPreviousPeriod(_token: string): Promise<CommissionPeriodSummary> {
  return structuredClone(mockPreviousPeriodSummary);
}

export async function getNextPeriod(_token: string): Promise<CommissionPeriodSummary> {
  return structuredClone(mockNextPeriodSummary);
}

export async function getAllPeriods(_token: string): Promise<CommissionPeriodSummary[]> {
  return [
    structuredClone(mockPreviousPeriodSummary),
    structuredClone(mockCurrentPeriodSummary),
    structuredClone(mockNextPeriodSummary)
  ];
}
