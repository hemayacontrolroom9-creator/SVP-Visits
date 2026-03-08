import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enums
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('admin', 'manager', 'supervisor', 'viewer')`);
    await queryRunner.query(`CREATE TYPE "site_status_enum" AS ENUM ('active', 'inactive', 'maintenance')`);
    await queryRunner.query(`CREATE TYPE "visit_status_enum" AS ENUM ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "verification_method_enum" AS ENUM ('gps', 'qr_code', 'both', 'manual')`);
    await queryRunner.query(`CREATE TYPE "alert_type_enum" AS ENUM ('missed_visit', 'late_check_in', 'gps_outside_geofence', 'visit_overdue', 'system', 'checklist_incomplete', 'supervisor_inactive')`);
    await queryRunner.query(`CREATE TYPE "alert_severity_enum" AS ENUM ('low', 'medium', 'high', 'critical')`);
    await queryRunner.query(`CREATE TYPE "alert_status_enum" AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed')`);

    // Users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'supervisor',
        "phone" VARCHAR(20),
        "avatar_url" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMPTZ,
        "last_login_ip" VARCHAR(45),
        "fcm_token" TEXT,
        "password_reset_token" TEXT,
        "password_reset_expiry" TIMESTAMPTZ,
        "preferences" JSONB,
        "employee_id" VARCHAR(50),
        "department" VARCHAR(100),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_is_active" ON "users" ("is_active")`);

    // Refresh Tokens
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "token" TEXT NOT NULL,
        "user_id" uuid NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "is_revoked" BOOLEAN NOT NULL DEFAULT false,
        "ip_address" VARCHAR(45),
        "user_agent" TEXT,
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`);

    // Sites
    await queryRunner.query(`
      CREATE TABLE "sites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "site_code" VARCHAR(50) NOT NULL,
        "address" TEXT NOT NULL,
        "city" VARCHAR(100),
        "country" VARCHAR(100),
        "latitude" DECIMAL(10,8) NOT NULL,
        "longitude" DECIMAL(11,8) NOT NULL,
        "geofence_radius" INTEGER NOT NULL DEFAULT 200,
        "status" "site_status_enum" NOT NULL DEFAULT 'active',
        "qr_code" TEXT,
        "qr_code_secret" TEXT,
        "contact_name" VARCHAR(100),
        "contact_phone" VARCHAR(20),
        "contact_email" VARCHAR(255),
        "visit_frequency_days" INTEGER NOT NULL DEFAULT 7,
        "metadata" JSONB,
        "image_urls" TEXT,
        CONSTRAINT "PK_sites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sites_site_code" UNIQUE ("site_code")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sites_status" ON "sites" ("status")`);

    // User-Sites join table
    await queryRunner.query(`
      CREATE TABLE "user_sites" (
        "user_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        CONSTRAINT "PK_user_sites" PRIMARY KEY ("user_id", "site_id"),
        CONSTRAINT "FK_user_sites_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_sites_site" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE
      )
    `);

    // Checklist Templates
    await queryRunner.query(`
      CREATE TABLE "checklist_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "items" JSONB NOT NULL DEFAULT '[]',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_by" uuid,
        "version" INTEGER NOT NULL DEFAULT 1,
        CONSTRAINT "PK_checklist_templates" PRIMARY KEY ("id")
      )
    `);

    // Visits
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS visits_visit_number_seq`);
    await queryRunner.query(`
      CREATE TABLE "visits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "supervisor_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        "status" "visit_status_enum" NOT NULL DEFAULT 'scheduled',
        "scheduled_at" TIMESTAMPTZ NOT NULL,
        "started_at" TIMESTAMPTZ,
        "completed_at" TIMESTAMPTZ,
        "check_in_latitude" DECIMAL(10,8),
        "check_in_longitude" DECIMAL(11,8),
        "check_out_latitude" DECIMAL(10,8),
        "check_out_longitude" DECIMAL(11,8),
        "check_in_distance_meters" INTEGER,
        "is_gps_verified" BOOLEAN NOT NULL DEFAULT false,
        "is_qr_verified" BOOLEAN NOT NULL DEFAULT false,
        "verification_method" "verification_method_enum",
        "gps_track" JSONB,
        "duration_minutes" INTEGER,
        "notes" TEXT,
        "photo_urls" TEXT,
        "signature_url" TEXT,
        "created_by" uuid,
        "is_overtime" BOOLEAN NOT NULL DEFAULT false,
        "visit_number" INTEGER NOT NULL DEFAULT nextval('visits_visit_number_seq'),
        CONSTRAINT "PK_visits" PRIMARY KEY ("id"),
        CONSTRAINT "FK_visits_supervisor" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_visits_site" FOREIGN KEY ("site_id") REFERENCES "sites"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_visits_status" ON "visits" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_visits_scheduled_at" ON "visits" ("scheduled_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_visits_supervisor_id" ON "visits" ("supervisor_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_visits_site_id" ON "visits" ("site_id")`);

    // Checklist Responses
    await queryRunner.query(`
      CREATE TABLE "checklist_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "template_id" uuid NOT NULL,
        "visit_id" uuid NOT NULL,
        "answers" JSONB NOT NULL DEFAULT '[]',
        "submitted_by" uuid NOT NULL,
        "submitted_at" TIMESTAMPTZ,
        "score" DECIMAL(5,2),
        "total_items" INTEGER NOT NULL DEFAULT 0,
        "completed_items" INTEGER NOT NULL DEFAULT 0,
        "notes" TEXT,
        "is_submitted" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "PK_checklist_responses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_checklist_responses_template" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id"),
        CONSTRAINT "FK_checklist_responses_visit" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_checklist_responses_visit_id" ON "checklist_responses" ("visit_id")`);

    // Alerts
    await queryRunner.query(`
      CREATE TABLE "alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "type" "alert_type_enum" NOT NULL,
        "severity" "alert_severity_enum" NOT NULL DEFAULT 'medium',
        "status" "alert_status_enum" NOT NULL DEFAULT 'active',
        "title" VARCHAR(300) NOT NULL,
        "message" TEXT NOT NULL,
        "user_id" uuid,
        "entity_type" VARCHAR(100),
        "entity_id" uuid,
        "acknowledged_at" TIMESTAMPTZ,
        "acknowledged_by" uuid,
        "resolved_at" TIMESTAMPTZ,
        "metadata" JSONB,
        CONSTRAINT "PK_alerts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alerts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_alerts_status_severity" ON "alerts" ("status", "severity")`);
    await queryRunner.query(`CREATE INDEX "IDX_alerts_user_id" ON "alerts" ("user_id")`);

    // Audit Logs (immutable - no update/delete)
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "action" VARCHAR(100) NOT NULL,
        "entity_type" VARCHAR(100) NOT NULL,
        "entity_id" uuid,
        "user_id" uuid,
        "user_email" VARCHAR(255),
        "user_role" VARCHAR(50),
        "ip_address" VARCHAR(45),
        "old_values" JSONB,
        "new_values" JSONB,
        "metadata" JSONB,
        "is_success" BOOLEAN NOT NULL DEFAULT true,
        "error_message" TEXT,
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")`);

    // Make audit_logs append-only via rule
    await queryRunner.query(`
      CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING
    `);
    await queryRunner.query(`
      CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING
    `);

    // Seed default admin user (password: Admin@123456)
    await queryRunner.query(`
      INSERT INTO "users" ("first_name", "last_name", "email", "password", "role", "is_active")
      VALUES (
        'System', 'Admin',
        'admin@supervisorvisits.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCoBIlMGYX5aBTdIeHwXF96',
        'admin', true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "alerts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checklist_responses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "visits" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checklist_templates" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sites" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sites" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alert_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alert_severity_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alert_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "verification_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "visit_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "site_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
