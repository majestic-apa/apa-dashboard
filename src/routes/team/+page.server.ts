import type { PageServerLoad } from './$types';
import { getHierarchy, getMyTeam } from '$lib/api/hierarchy';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  const role = user?.role ?? 'staff';
  const token = undefined; // all mock, no token needed yet

  const isBD = role === 'super_admin' || role === 'management';

  const [team, hierarchy] = await Promise.all([
    getMyTeam(token, role),
    isBD ? getHierarchy(token) : Promise.resolve([])
  ]);

  return { team, hierarchy, role };
};
