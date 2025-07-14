/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { UserApplicationsRepository } from '@/models/_.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:user-applications',
	res: { type: 'object', properties: {}, required: [] },
	errors: {
		notFound: {
			message: 'Application not found.',
			code: 'NOT_FOUND',
			id: 'be3a2235-955c-479e-9292-835e0b97a433',
		},
		notPending: {
			message: 'Application is not pending.',
			code: 'NOT_PENDING',
			id: '6570f3c7-6459-4a60-bf81-f2b46d82870b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		applicationId: { type: 'string', format: 'misskey:id' },
	},
	required: ['applicationId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userApplicationsRepository)
		private userApplicationsRepository: UserApplicationsRepository,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const application = await this.userApplicationsRepository.findOneBy({ id: ps.applicationId });

			if (!application) {
				throw new ApiError(meta.errors.notFound);
			}
			if (application.state !== 'pending') {
				throw new ApiError(meta.errors.notPending);
			}

			await this.userApplicationsRepository.update(application.id, {
				state: 'rejected',
				reviewedById: me.id,
				reviewedAt: new Date(),
			});

			this.moderationLogService.log(me, 'rejectUserApplication', { applicationId: application.id });

			return {};
		});
	}
}
