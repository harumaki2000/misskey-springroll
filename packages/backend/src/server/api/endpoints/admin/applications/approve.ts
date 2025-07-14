/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { UserApplicationService } from '@/core/UserApplicationService.js';
import type { MiUser } from '@/models/User.js';

export const meta = {
	tags: ['admin'],
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:user-applications',
	res: { type: 'object', properties: {} },
	errors: {
		notFound: {
			message: 'Application not found.',
			code: 'NOT_FOUND',
			id: '5dba4ff6-ebb4-4951-b5d0-3f287300a9ca',
		},
		notPending: {
			message: 'Application is not pending.',
			code: 'NOT_PENDING',
			id: '197b5ac0-d276-441c-a008-889f77321f93',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		applicationId: { type: 'string' },
	},
	required: ['applicationId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private moderationLogService: ModerationLogService,
		private userApplicationService: UserApplicationService,
	) {
		super(meta, paramDef, async (ps, me: MiUser) => {
			const account = await this.userApplicationService.approve(ps.applicationId, me);

			this.moderationLogService.log(me, 'approveUserApplication', { applicationId: ps.applicationId, userId: account.id });

			return {};
		});
	}
}
