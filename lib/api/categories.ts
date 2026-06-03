import { apiFetch } from './client';
import type { Category } from '@/lib/types/domain';

export const listCategories = () => apiFetch<Category[]>('/categories');

export const createCategory = (input: { name: string }) =>
  apiFetch<Category>('/categories', { method: 'POST', body: JSON.stringify(input) });

export const updateCategory = (id: string, input: Partial<{ name: string; isActive: boolean }>) =>
  apiFetch<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(input) });

export const deleteCategory = (id: string) =>
  apiFetch<{ id: string }>(`/categories/${id}`, { method: 'DELETE' });
