/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddExpiresAtToNote1745841293812 {
	name = 'AddExpiresAtToNote1745841293812'

	async up (queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" ADD "expiresAt" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`CREATE INDEX "IDX_note_expires_at" ON "note" ("expiresAt") WHERE "expiresAt" IS NOT NULL`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_note_expires_at"`);
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "expiresAt"`);
	}
}
