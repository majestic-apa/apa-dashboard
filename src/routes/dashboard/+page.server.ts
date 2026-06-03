import type { PageServerLoad } from './$types';
import { getDashboardStats } from '$lib/api/reports';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('auth_token');
  const stats = await getDashboardStats(token);
  return { stats };
};
