import React, { ReactNode } from 'react';
import { useErp } from '../../contexts/ErpContext';
import type { Permission } from '../../types/org';

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/** UI-level gate only. Every action is re-checked by the domain layer, mirroring server-side enforcement. */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { can } = useErp();
  return <>{can(permission) ? children : fallback}</>;
}