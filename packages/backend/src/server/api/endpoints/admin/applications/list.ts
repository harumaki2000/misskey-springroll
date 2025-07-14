/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { UserApplicationsRepository } from '@/models/_.js';
import { UserApplicationEntityService } from '@/core/entities/UserApplicationEntityService.js';

export const meta = {
	tags: ['admin'],
	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:user-applications',
	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				createdAt: { type: 'string', format: 'date-time' },
				username: { type: 'string' },
				email: { type: 'string' },
				reason: { type: 'string', nullable: true },
				state: { type: 'string' },
				reviewedAt: { type: 'string', format: 'date-time', nullable: true },
				reviewedBy: { type: 'object', nullable: true, ref: 'UserLite' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		offset: { type: 'integer', default: 0 },
		sort: { type: 'string', enum: ['+createdAt', '-createdAt'], default: '-createdAt' },
		state: { type: 'string', enum: ['pending', 'approved', 'rejected', 'all'], default: 'pending' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userApplicationsRepository)
		private userApplicationsRepository: UserApplicationsRepository,
		private userApplicationEntityService: UserApplicationEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.userApplicationsRepository.createQueryBuilder('app')
				.leftJoinAndSelect('app.reviewedBy', 'reviewedBy');

			if (ps.state !== 'all') {
				query.andWhere('app.state = :state', { state: ps.state });
			}

			switch (ps.sort) {
				case '+createdAt':
					query.orderBy('app.createdAt', 'ASC');
					break;
				case '-createdAt':
				default:
					query.orderBy('app.createdAt', 'DESC');
					break;
			}

			query.limit(ps.limit);
			query.offset(ps.offset);

			const applications = await query.getMany();

			return this.userApplicationEntityService.packMany(applications, me);
		});
	}
}
