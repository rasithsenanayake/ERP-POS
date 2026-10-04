import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { MembershipEntity } from '../database/entities/membership.entity';
import { UserEntity } from '../database/entities/user.entity';
import { WorkspaceDocumentEntity } from '../database/entities/workspace-document.entity';
import { WorkspaceEntity } from '../database/entities/workspace.entity';
import { WorkspaceInviteEntity } from '../database/entities/workspace-invite.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(MembershipEntity) private readonly memberships: Repository<MembershipEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(WorkspaceEntity) private readonly workspaces: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceDocumentEntity) private readonly documents: Repository<WorkspaceDocumentEntity>,
    @InjectRepository(WorkspaceInviteEntity) private readonly invites: Repository<WorkspaceInviteEntity>
  ) {}

  async listDocuments(userId: string) {
    const membership = await this.activeMembership(userId);
    const rows = await this.documents.find({ where: { workspaceId: membership.workspaceId }, order: { key: 'ASC' } });
    return rows.map(({ key, data, updatedAt }) => ({ key, data, updatedAt }));
  }

  async saveDocuments(userId: string, entries: { key: string; data: unknown }[]) {
    const membership = await this.activeMembership(userId);
    const uniqueEntries = new Map(entries.map(({ key, data }) => {
      if (data === null || typeof data !== 'object') throw new BadRequestException('Workspace data must be a JSON object or array.');
      return [key, data as Record<string, unknown> | unknown[]] as const;
    }));
    await this.documents.upsert(Array.from(uniqueEntries, ([key, data]) => ({
      workspaceId: membership.workspaceId,
      key,
      // TypeORM's upsert type recursively maps JSONB instead of treating it as opaque JSON.
      data: data as any,
      updatedBy: userId
    })), ['workspaceId', 'key']);
    return { ok: true };
  }

  async resetDocuments(userId: string) {
    const membership = await this.ownerMembership(userId);
    await this.documents.delete({ workspaceId: membership.workspaceId });
    return { ok: true };
  }

  async inviteMember(userId: string, emailInput: string, access: { role: string; branchId?: string | null }) {
    const owner = await this.ownerMembership(userId);
    const email = this.normalizeEmail(emailInput);
    const user = await this.users.findOneBy({ email });
    if (user) {
      const existing = await this.memberships.findOneBy({ workspaceId: owner.workspaceId, userId: user.id });
      if (existing) {
        existing.role = access.role;
        existing.branchId = access.branchId ?? null;
        existing.active = true;
        await this.memberships.save(existing);
        return { invited: false };
      }
      throw new BadRequestException('This email already has an account in another workspace. Accounts currently belong to one workspace.');
    }

    const inviteToken = randomBytes(32).toString('hex');
    await this.invites.upsert({
      workspaceId: owner.workspaceId,
      email,
      role: access.role,
      branchId: access.branchId ?? null,
      invitedBy: userId,
      tokenHash: createHash('sha256').update(inviteToken).digest('hex')
    }, ['workspaceId', 'email']);
    return { invited: true, inviteToken };
  }

  async updateMember(userId: string, emailInput: string, access: { role: string; branchId?: string | null; active?: boolean }) {
    const owner = await this.ownerMembership(userId);
    const email = this.normalizeEmail(emailInput);
    const targetUser = await this.users.findOneBy({ email });
    if (targetUser?.id === userId) throw new ForbiddenException('You cannot change your own workspace access here.');

    const member = targetUser && await this.memberships.findOneBy({ workspaceId: owner.workspaceId, userId: targetUser.id });
    if (member) {
      member.role = access.role;
      member.branchId = access.branchId ?? null;
      if (typeof access.active === 'boolean') member.active = access.active;
      await this.memberships.save(member);
      return { active: member.active };
    }

    if (access.active === false) {
      await this.invites.delete({ workspaceId: owner.workspaceId, email });
      return { active: false };
    }
    const existingInvite = await this.invites.findOneBy({ workspaceId: owner.workspaceId, email });
    if (existingInvite) {
      existingInvite.role = access.role;
      existingInvite.branchId = access.branchId ?? null;
      existingInvite.invitedBy = userId;
      await this.invites.save(existingInvite);
      return { active: true };
    }

    const inviteToken = randomBytes(32).toString('hex');
    await this.invites.save(this.invites.create({
      workspaceId: owner.workspaceId,
      email,
      role: access.role,
      branchId: access.branchId ?? null,
      invitedBy: userId,
      tokenHash: createHash('sha256').update(inviteToken).digest('hex')
    }));
    return { active: true, inviteToken };
  }

  async revokeMember(userId: string, emailInput: string) {
    const owner = await this.ownerMembership(userId);
    const email = this.normalizeEmail(emailInput);
    const targetUser = await this.users.findOneBy({ email });
    if (targetUser?.id === userId) throw new ForbiddenException('You cannot remove your own access.');
    if (targetUser) {
      const member = await this.memberships.findOneBy({ workspaceId: owner.workspaceId, userId: targetUser.id });
      if (member) {
        member.active = false;
        await this.memberships.save(member);
      }
    }
    await this.invites.delete({ workspaceId: owner.workspaceId, email });
    return { ok: true };
  }

  private async activeMembership(userId: string) {
    const membership = await this.memberships.findOne({ where: { userId }, order: { createdAt: 'ASC' } });
    if (!membership || !membership.active) throw new ForbiddenException('Your workspace access is not active.');
    return membership;
  }

  private async ownerMembership(userId: string) {
    const membership = await this.activeMembership(userId);
    if (membership.role !== 'owner') throw new ForbiddenException('Only workspace owners can make this change.');
    return membership;
  }

  private normalizeEmail(value: string) {
    const email = value.trim().toLowerCase();
    if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Enter a valid email address.');
    }
    return email;
  }
}
