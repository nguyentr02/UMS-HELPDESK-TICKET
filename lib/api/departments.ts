import { apiFetch } from './client';
import type { Department } from '@/lib/types/domain';

// NOTE: `GET /departments` is a FE-driven addition to the contract — Forward/Redirect
// dialogs need the phòng-ban list (the contract only references departmentIds).
export const listDepartments = () => apiFetch<Department[]>('/departments');
