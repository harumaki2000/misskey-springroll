/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { UserApplicationsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiUser } from '@/models/User.js';
import type { MiUserApplication } from '@/models/UserApplication.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class UserApplicationEntityService {
	constructor(
		@Inject(DI.userApplicationsRepository)
		private userApplicationsRepository: UserApplicationsRepository,
		private userEntityService: UserEntityService,
		private idService: IdService,
	) {}

	@bindThis
	public async pack(
		src: MiUserApplication['id'] | MiUserApplication,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedReviewedBy?: Packed<'UserLite'>,
		},
	): Promise<Packed<'UserApplication'>> {
		const target = typeof src === 'object' ? src : await this.userApplicationsRepository.findOneOrFail({
			where: { id: src },
			relations: ['reviewedBy'],
		});

		return await awaitAll({
			id: target.id,
			createdAt: target.createdAt.toISOString(),
			username: target.username,
			email: target.email,
			reason: target.reason,
			state: target.state,
			reviewedAt: target.reviewedAt ? target.reviewedAt.toISOString() : null,
			reviewedBy: target.reviewedBy
				? (hint?.packedReviewedBy ?? await this.userEntityService.pack(target.reviewedBy, me, { schema: 'UserLite' }))
				: null,
		});
	}

	@bindThis
	public async packMany(
		applications: MiUserApplication[],
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'UserApplication'>[]> {
		const reviewedByUsers = applications
			.map(app => app.reviewedBy)
			.filter((user): user is MiUser => user != null);

		const userMap = await this.userEntityService.packMany(reviewedByUsers, me, { schema: 'UserLite' })
			.then(users => new Map(users.map(u => [u.id, u])));

		return Promise.all(
			applications.map(app => {
				const packedReviewedBy = app.reviewedBy ? userMap.get(app.reviewedBy.id) : undefined;
				return this.pack(app, me, { packedReviewedBy });
			}),
		);
	}
}
