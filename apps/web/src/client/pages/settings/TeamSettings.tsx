import React, { useMemo, useState } from 'react';
import { CopyIcon, MoreHorizontalIcon, UserPlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { MemberDrawer } from '../../components/settings/MemberDrawer';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { MenuItem } from '../../components/ui/Menu';
import { PageHeader } from '../../components/ui/PageHeader';
import { Popover } from '../../components/ui/Popover';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { useErp } from '../../contexts/ErpContext';
import type { User } from '../../types/org';
import { grantAccess, revokeAccess, updateAccess } from '../../utils/backend/team';
import type { MemberInput } from '../../utils/domain/settings';

type View = 'active' | 'deactivated';

export function TeamSettings() {
  const { state, can, actions, lookups, user: me } = useErp();
  const canManage = can('team.manage');
  const [view, setView] = useState<View>('active');
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const people = useMemo(
    () =>
    state.users.
    filter((u) => u.kind === 'person' && (view === 'active' ? u.active !== false : u.active === false)).
    sort((a, b) => (a.role === 'owner' ? -1 : 0) - (b.role === 'owner' ? -1 : 0) || a.name.localeCompare(b.name)),
    [state.users, view]
  );
  const deactivatedCount = state.users.filter((u) => u.kind === 'person' && u.active === false).length;

  const handleSubmit = async (input: MemberInput): Promise<boolean> => {
    if (editing === 'new') {
      try {
        const invite = await grantAccess(input.email, input.role, input.branchId);
        const created = actions.inviteMember(input, true);
        if (!created) return false;
        if (invite.inviteToken) setInviteLink(`${window.location.origin}/#invite=${invite.inviteToken}`);
        toast.success(`Invite ready for ${created.email}`, { description: 'Share the one-time invite link. They join when they register with this email.' });
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not save the invite.');
        return false;
      }
    }
    if (editing) {
      try {
        await updateAccess(editing.email, input.role, input.branchId, editing.active !== false);
        const updated = actions.updateMember(editing.id, input);
        if (!updated) return false;
        toast.success(`${updated.name} updated`);
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not update workspace access.');
        return false;
      }
    }
    return false;
  };

  const toggleActive = async (person: User, active: boolean) => {
    try {
      if (active) {
        const result = await updateAccess(person.email, person.role, person.branchId, true);
        if (result.inviteToken) setInviteLink(`${window.location.origin}/#invite=${result.inviteToken}`);
      }
      else await revokeAccess(person.email);
      const updated = actions.setMemberActive(person.id, active);
      if (!updated) return;
      toast.success(active ? `${person.name} reactivated` : `${person.name} deactivated`, { description: active ? undefined : 'Their history stays. They can no longer sign in.' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update workspace access.');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink ?? window.location.origin);
      toast.success(inviteLink ? 'Invite link copied' : 'Sign-in link copied');
    } catch {
      toast.error('Could not copy. The link is ' + window.location.origin);
    }
  };

  return (
    <div>
      <PageHeader
        title="Team & roles"
        meta={canManage ? 'Invite people, set what they can see, and remove access.' : 'Only owners can change the team.'}
        actions={
        canManage &&
        <>
          <Button icon={CopyIcon} onClick={() => void copyLink()}>
                  Copy sign-in link
                </Button>
              <Button variant="primary" icon={UserPlusIcon} onClick={() => setEditing('new')}>
                Invite teammate
              </Button>
            </>

        } />

      {inviteLink && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-info/30 bg-info-soft px-3 py-2.5 text-[13px] text-ink" role="status">
          <span>One-time invite link ready. Copy it and send it to the teammate; email is not sent by this server.</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void copyLink()}>Copy invite link</Button>
            <Button size="sm" variant="ghost" onClick={() => setInviteLink(null)}>Dismiss</Button>
          </div>
        </div>
      )}
      

      <div className="mb-3 flex items-center justify-between gap-3">
        <SegmentedControl<View>
          label="Show"
          value={view}
          onChange={setView}
          options={[
          { value: 'active', label: `Active` },
          { value: 'deactivated', label: `Deactivated${deactivatedCount ? ` · ${deactivatedCount}` : ''}` }]
          } />
        
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
        {people.length === 0 ?
        <p className="px-4 py-10 text-center text-[13px] text-muted">{view === 'active' ? 'No active teammates.' : 'Nobody is deactivated.'}</p> :

        <table className="w-full text-[13px]">
            <thead className="hidden border-b border-line text-left text-xs text-muted md:table-header-group">
              <tr>
                <th className="px-4 py-2 font-medium">Person</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="w-12 px-4 py-2" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map((p) => {
              const role = state.roles.find((r) => r.key === p.role);
              const isMe = p.id === me.id;
              return (
                <tr key={p.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={p.initials} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 font-medium text-ink">
                            {p.name}
                            {isMe && <Badge tone="outline">You</Badge>}
                            {p.invited && <Badge tone="info">Invited</Badge>}
                          </div>
                          <div className="truncate text-xs text-muted">
                            {p.email}
                            {p.title ? ` · ${p.title}` : ''}
                          </div>
                          <div className="mt-1 text-xs text-muted md:hidden">
                            {role?.name} · {p.branchId ? lookups.branchesById.get(p.branchId)?.shortName : 'All branches'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Badge tone={p.role === 'owner' ? 'accent' : 'neutral'}>{role?.name ?? p.role}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">{p.branchId ? lookups.branchesById.get(p.branchId)?.name : 'All branches'}</td>
                    <td className="px-4 py-3 text-right">
                      {canManage &&
                    <Popover
                      align="end"
                      className="w-48"
                      trigger={({ open, toggle }) => <Button size="sm" variant="ghost" icon={MoreHorizontalIcon} aria-label={`Actions for ${p.name}`} aria-expanded={open} onClick={toggle} />}>
                      
                          {(close) =>
                      <div>
                              <MenuItem
                          onClick={() => {
                            setEditing(p);
                            close();
                          }}>
                          
                                Edit role & details
                              </MenuItem>
                              {p.invited && (
                                <MenuItem
                                  onClick={async () => {
                                    try {
                                      const invite = await grantAccess(p.email, p.role, p.branchId);
                                      if (invite.inviteToken) setInviteLink(`${window.location.origin}/#invite=${invite.inviteToken}`);
                                      toast.success('A new invite link is ready to copy.');
                                    } catch (error) {
                                      toast.error(error instanceof Error ? error.message : 'Could not create an invite link.');
                                    }
                                    close();
                                  }}>
                                  Create new invite link
                                </MenuItem>
                              )}
                              {!isMe && (
                        p.active === false ?
                        <MenuItem
                          onClick={() => {
                            void toggleActive(p, true);
                            close();
                          }}>
                          
                                    Reactivate
                                  </MenuItem> :

                        <MenuItem
                          danger
                          onClick={() => {
                            setDeactivating(p);
                            close();
                          }}>
                          
                                    Deactivate
                                  </MenuItem>)
                        }
                            </div>
                      }
                        </Popover>
                    }
                    </td>
                  </tr>);

            })}
            </tbody>
          </table>
        }
      </section>

      <MemberDrawer open={editing !== null} member={editing && editing !== 'new' ? editing : undefined} onClose={() => setEditing(null)} onSubmit={handleSubmit} />
      <ConfirmationDialog
        open={deactivating !== null}
        title={`Deactivate ${deactivating?.name ?? ''}?`}
        description="They lose access immediately. Orders, notes and history they created stay intact, and you can reactivate them later."
        confirmLabel="Deactivate"
        onCancel={() => setDeactivating(null)}
        onConfirm={() => {
          if (deactivating) void toggleActive(deactivating, false);
          setDeactivating(null);
        }} />
      
    </div>);

}
