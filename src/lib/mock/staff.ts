import type { StaffMember } from '$lib/types';

export const mockStaff: StaffMember[] = [
  {
    id: 's1',
    first_name: 'Amina',
    last_name: 'Hassan',
    email: 'amina.hassan@majesticapa.com',
    role: 'super_admin',
    is_active: true
  },
  {
    id: 's2',
    first_name: 'Chukwudi',
    last_name: 'Obi',
    email: 'chukwudi.obi@majesticapa.com',
    role: 'operations',
    is_active: true
  },
  {
    id: 's3',
    first_name: 'Blessing',
    last_name: 'Eze',
    email: 'blessing.eze@majesticapa.com',
    role: 'compliance',
    is_active: true
  },
  {
    id: 's4',
    first_name: 'Usman',
    last_name: 'Garba',
    email: 'usman.garba@majesticapa.com',
    role: 'internal_audit',
    is_active: false
  },
  {
    id: 's5',
    first_name: 'Ngozi',
    last_name: 'Adeyemi',
    email: 'ngozi.adeyemi@majesticapa.com',
    role: 'management',
    is_active: true
  }
];
