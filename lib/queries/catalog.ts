'use client';

import { useQuery } from '@tanstack/react-query';
import { listCategories } from '@/lib/api/categories';
import { listDepartments } from '@/lib/api/departments';
import { listAgents } from '@/lib/api/agents';
import { listRoutingRules } from '@/lib/api/routing';

export const catalogKeys = {
  categories: ['categories'] as const,
  departments: ['departments'] as const,
  agents: ['agents'] as const,
  routingRules: ['routing-rules'] as const,
};

export const useCategories = () =>
  useQuery({ queryKey: catalogKeys.categories, queryFn: listCategories });

export const useDepartments = () =>
  useQuery({ queryKey: catalogKeys.departments, queryFn: listDepartments });

export const useAgents = () => useQuery({ queryKey: catalogKeys.agents, queryFn: listAgents });

export const useRoutingRules = () =>
  useQuery({ queryKey: catalogKeys.routingRules, queryFn: listRoutingRules });
