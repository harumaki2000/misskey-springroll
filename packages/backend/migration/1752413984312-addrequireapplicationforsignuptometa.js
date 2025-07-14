/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddRequireApplicationForSignupToMeta1752413984312 {
	name = 'AddRequireApplicationForSignupToMeta1752413984312'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "requireApplicationForSignup" boolean NOT NULL DEFAULT false`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "requireApplicationForSignup"`);
	}
}
