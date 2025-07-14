/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CreateUserApplication1752409333284 {
	name = 'CreateUserApplication1752409333284'

	async up(queryRunner) {
		await queryRunner.query(`
			CREATE TABLE "user_application" (
				"id" character varying(32) NOT NULL,
				"createdAt" timestamptz NOT NULL DEFAULT now(),
				"username" character varying(128) NOT NULL,
				"email" character varying(128) NOT NULL,
				"passwordHash" character varying(128) NOT NULL,
				"reason" text,
				"state" character varying(32) NOT NULL DEFAULT 'pending',
				"reviewedAt" timestamptz,
				"reviewedById" character varying(32),
				CONSTRAINT "PK_user_application_id" PRIMARY KEY ("id")
			)
		`);

		await queryRunner.query(`CREATE INDEX "IDX_user_application_username" ON "user_application" ("username")`);
		await queryRunner.query(`CREATE INDEX "IDX_user_application_state" ON "user_application" ("state")`);
		await queryRunner.query(`CREATE INDEX "IDX_user_application_email" ON "user_application" ("email")`);
		await queryRunner.query(`CREATE INDEX "IDX_user_application_createdAt" ON "user_application" ("createdAt")`);

		await queryRunner.query(`
			ALTER TABLE "user_application"
			ADD CONSTRAINT "FK_user_application_reviewedById_user_id"
			FOREIGN KEY ("reviewedById")
			REFERENCES "user"("id")
			ON DELETE SET NULL
		`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "user_application"`);
	}
}
