import type { PageServerLoad } from './$types';
import { getCurrentPeriod, getPreviousPeriod, getAllPeriods } from '$lib/api/payments';

export const load: PageServerLoad = async ({ cookies, parent }) => {
  const token = cookies.get('auth_token') ?? '';
  const { user } = await parent();

  const canViewAll = user?.role === 'super_admin' || user?.role === 'management';

  const [current, previous, all] = await Promise.all([
    getCurrentPeriod(token),
    getPreviousPeriod(token),
    canViewAll ? getAllPeriods(token) : Promise.resolve([])
  ]);

  return { current, previous, all, canViewAll, user };
};
