import type { PageServerLoad } from './$types';
import {
  getAgentNetwork,
  getAgentSummary,
  getCommissionSummary,
  getContributionLog,
  getOnboardingLog,
  getStaffSummary,
  getWithdrawalLog
} from '$lib/api/reports';

export const load: PageServerLoad = async ({ cookies, parent }) => {
  const token = cookies.get('auth_token');

  // Access user role from parent layout load to gate commission data
  const { user } = await parent();
  const canViewCommission =
    user?.role === 'super_admin' || user?.role === 'management';

  const [staffSummary, agentSummary, onboardingLog, contributionLog, withdrawalLog, agentNetwork] =
    await Promise.all([
      getStaffSummary(token),
      getAgentSummary(token),
      getOnboardingLog(token),
      getContributionLog(token),
      getWithdrawalLog(token),
      getAgentNetwork(token)
    ]);

  // Commission is only loaded for authorised roles; null otherwise
  const commissionSummary = canViewCommission
    ? await getCommissionSummary(token)
    : null;

  return {
    staffSummary,
    agentSummary,
    onboardingLog,
    contributionLog,
    withdrawalLog,
    agentNetwork,
    commissionSummary
  };
};
