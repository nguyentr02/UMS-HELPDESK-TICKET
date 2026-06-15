import type { Department } from '@/lib/types/domain';

import { apiFetch } from './client';

// NOTE: `GET /departments` is a FE-driven addition to the contract — Forward
// dialogs need the phòng-ban list (the contract only references departmentIds).
export const listDepartments = () => apiFetch<Department[]>('/departments');
