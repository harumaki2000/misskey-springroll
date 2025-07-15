/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MakeApplicationReasonRequired1752580342181 {
	name = 'MakeApplicationReasonRequired1752580342181'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_application" ALTER COLUMN "reason" SET NOT NULL`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_application" ALTER COLUMN "reason" DROP NOT NULL`);
	}
}
