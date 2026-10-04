import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PowerOffIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import type { ModuleKey, Permission } from '../../types/org';
import { moduleDefinitions } from '../../data/modules';
import { ErrorState } from '../ui/ErrorState';
import { Button } from '../ui/Button';

interface ModuleGuardProps {
  module: ModuleKey;
  permission?: Permission;
  children: ReactNode;
}

export function ModuleGuard({ module, permission, children }: ModuleGuardProps) {
  const { isModuleOn, can, role } = useErp();
  const navigate = useNavigate();
  const definition = moduleDefinitions.find((m) => m.key === module);
  if (!isModuleOn(module)) {
    return (
      <ErrorState
        icon={PowerOffIcon}
        title={`${definition?.name ?? 'This module'} is turned off`}
        description="An owner switched this module off for your organization. Records are kept and reappear when it's turned back on."
        actions={<Button onClick={() => navigate('/settings/modules')}>Open module settings</Button>} />);


  }
  if (permission && !can(permission)) {
    return <ErrorState title="You don't have access to this page" description={`Your role (${role.name}) doesn't include the ${permission} permission. Ask an owner if you need it.`} />;
  }
  return <>{children}</>;
}