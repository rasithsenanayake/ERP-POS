import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(320) NOT NULL UNIQUE,
        display_name varchar(160) NOT NULL,
        password_hash varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE workspaces (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(160) NOT NULL,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE workspace_members (
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role varchar(32) NOT NULL DEFAULT 'owner',
        branch_id varchar(128),
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (workspace_id, user_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE workspace_invites (
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        email varchar(320) NOT NULL,
        role varchar(32) NOT NULL,
        token_hash varchar(64) NOT NULL,
        branch_id varchar(128),
        invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (workspace_id, email)
      )
    `);
    await queryRunner.query(`CREATE INDEX workspace_invites_email_idx ON workspace_invites (email)`);
    await queryRunner.query(`
      CREATE TABLE workspace_documents (
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        key varchar(120) NOT NULL,
        data jsonb NOT NULL,
        updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (workspace_id, key)
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE workspace_documents`);
    await queryRunner.query(`DROP TABLE workspace_invites`);
    await queryRunner.query(`DROP TABLE workspace_members`);
    await queryRunner.query(`DROP TABLE workspaces`);
    await queryRunner.query(`DROP TABLE users`);
  }
}
