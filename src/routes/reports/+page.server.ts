import type { PageServerLoad } from './$types';
import { getStaffSummary, getAgentSummary, getActivityLog, getAgentNetwork } from '$lib/api/reports';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('auth_token');
  const [staffSummary, agentSummary, activityLog, agentNetwork] = await Promise.all([
    getStaffSummary(token),
    getAgentSummary(token),
    getActivityLog(token),
    getAgentNetwork(token)
  ]);
  return { staffSummary, agentSummary, activityLog, agentNetwork };
};
