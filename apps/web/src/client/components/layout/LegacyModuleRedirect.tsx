import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { legacyModuleRoutes } from '../../data/navigation';
import type { ModuleKey } from '../../types/org';

export function LegacyModuleRedirect() {
  const { moduleKey } = useParams();
  const to = legacyModuleRoutes[moduleKey as ModuleKey] ?? '/dashboard';
  return <Navigate to={to} replace />;
}