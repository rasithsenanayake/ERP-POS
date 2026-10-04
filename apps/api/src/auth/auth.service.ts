import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { MembershipEntity } from '../database/entities/membership.entity';
import { UserEntity } from '../database/entities/user.entity';
import { WorkspaceEntity } from '../database/entities/workspace.entity';
import { WorkspaceInviteEntity } from '../database/entities/workspace-invite.entity';

export interface SessionAccount {
  userId: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  branchId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(WorkspaceEntity) private readonly workspaces: Repository<WorkspaceEntity>,
    @InjectRepository(MembershipEntity) private readonly memberships: Repository<MembershipEntity>,
    @InjectRepository(WorkspaceInviteEntity) private readonly invites: Repository<WorkspaceInviteEntity>,
    private readonly dataSource: DataSource,
    private readonly jwt: JwtService
  ) {}

  async register(input: { email: string; password: string; displayName: string; inviteToken?: string }) {
    const email = input.email.trim().toLowerCase();
    if (await this.users.exist({ where: { email } })) throw new ConflictException('An account already uses that email.');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const account = await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(UserEntity);
      const workspaces = manager.getRepository(WorkspaceEntity);
      const memberships = manager.getRepository(MembershipEntity);
      const invites = manager.getRepository(WorkspaceInviteEntity);
      const user = await users.save(users.create({ email, displayName: input.displayName.trim(), passwordHash }));
      const tokenHash = input.inviteToken ? createHash('sha256').update(input.inviteToken).digest('hex') : null;
      const invite = tokenHash ? await invites.findOneBy({ email, tokenHash }) : null;

      if (input.inviteToken && !invite) throw new BadRequestException('This invite link is invalid or has already been used.');

      if (invite) {
        const workspace = await workspaces.findOneByOrFail({ id: invite.workspaceId });
        await memberships.save(memberships.create({
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role,
          branchId: invite.branchId,
          active: true
        }));
        await invites.delete({ workspaceId: invite.workspaceId, email });
        return this.toAccount(user, workspace, invite.role, invite.branchId);
      }

      const workspace = await workspaces.save(workspaces.create({ name: 'My business', createdBy: user.id }));
      await memberships.save(memberships.create({ workspaceId: workspace.id, userId: user.id, role: 'owner', branchId: null, active: true }));
      return this.toAccount(user, workspace, 'owner', null);
    }).catch((error: unknown) => {
      if (error && typeof error === 'object' && 'driverError' in error) {
        const driverError = (error as { driverError?: { code?: string } }).driverError;
        if (driverError?.code === '23505') throw new ConflictException('An account already uses that email.');
      }
      throw error;
    });

    return this.issueSession(account);
  }

  async signIn(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('That email and password combination is not right.');
    }
    const account = await this.accountForUser(user.id);
    return this.issueSession(account);
  }

  async accountForUser(userId: string): Promise<SessionAccount> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException('The account no longer exists.');
    const membership = await this.memberships.findOne({ where: { userId }, order: { createdAt: 'ASC' } });
    if (!membership) throw new UnauthorizedException('This account is not a member of a workspace.');
    if (!membership.active) throw new ForbiddenException('Your access to this workspace is turned off. Contact a workspace owner.');
    const workspace = await this.workspaces.findOneBy({ id: membership.workspaceId });
    if (!workspace) throw new UnauthorizedException('The workspace is unavailable.');
    return this.toAccount(user, workspace, membership.role, membership.branchId);
  }

  private toAccount(user: UserEntity, workspace: WorkspaceEntity, role: string, branchId: string | null): SessionAccount {
    return {
      userId: user.id,
      email: user.email,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      role,
      branchId
    };
  }

  private async issueSession(account: SessionAccount) {
    const token = await this.jwt.signAsync({ sub: account.userId });
    return { token, account };
  }
}
