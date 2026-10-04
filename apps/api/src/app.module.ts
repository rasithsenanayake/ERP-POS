import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { InitialSchema1710000000000 } from './database/migrations/1710000000000-InitialSchema';
import { MembershipEntity } from './database/entities/membership.entity';
import { UserEntity } from './database/entities/user.entity';
import { WorkspaceEntity } from './database/entities/workspace.entity';
import { WorkspaceDocumentEntity } from './database/entities/workspace-document.entity';
import { WorkspaceInviteEntity } from './database/entities/workspace-invite.entity';
import { HealthController } from './health.controller';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [UserEntity, WorkspaceEntity, MembershipEntity, WorkspaceInviteEntity, WorkspaceDocumentEntity],
      migrations: [InitialSchema1710000000000],
      migrationsRun: true,
      synchronize: false,
      retryAttempts: 20,
      retryDelay: 1500
    }),
    AuthModule,
    WorkspaceModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
