import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipEntity } from '../database/entities/membership.entity';
import { UserEntity } from '../database/entities/user.entity';
import { WorkspaceEntity } from '../database/entities/workspace.entity';
import { WorkspaceInviteEntity } from '../database/entities/workspace-invite.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, WorkspaceEntity, MembershipEntity, WorkspaceInviteEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
        return { secret, signOptions: { expiresIn: 60 * 60 * 24 * 7 } };
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionGuard],
  exports: [SessionGuard]
})
export class AuthModule {}
