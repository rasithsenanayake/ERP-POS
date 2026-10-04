import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MembershipEntity } from '../database/entities/membership.entity';
import { UserEntity } from '../database/entities/user.entity';
import { WorkspaceDocumentEntity } from '../database/entities/workspace-document.entity';
import { WorkspaceEntity } from '../database/entities/workspace.entity';
import { WorkspaceInviteEntity } from '../database/entities/workspace-invite.entity';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([MembershipEntity, UserEntity, WorkspaceDocumentEntity, WorkspaceEntity, WorkspaceInviteEntity])
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService]
})
export class WorkspaceModule {}
