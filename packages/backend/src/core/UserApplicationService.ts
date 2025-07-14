/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { UserApplicationsRepository, UserProfilesRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { MiUserApplication } from '@/models/UserApplication.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { bindThis } from '@/decorators.js';
import { SignupService } from '@/core/SignupService.js';
import { EmailService } from '@/core/EmailService.js';
import { MetaService } from '@/core/MetaService.js';
import { IdService } from '@/core/IdService.js';

@Injectable()
export class UserApplicationService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userApplicationsRepository)
		private userApplicationsRepository: UserApplicationsRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private signupService: SignupService,
		private emailService: EmailService,
		private metaService: MetaService,
		private idService: IdService,
	) { }

	@bindThis
	public async create(data: {
		username: string;
		passwordHash: string;
		email: string;
		reason: string | null;
	}): Promise<MiUserApplication> {
		return await this.userApplicationsRepository.insertOne({
			id: this.idService.gen(),
			username: data.username,
			passwordHash: data.passwordHash,
			email: data.email,
			reason: data.reason ?? '',
			state: 'pending',
		});
	}

	@bindThis
	public async approve(applicationId: string, moderator: MiUser): Promise<MiUser> {
		const application = await this.userApplicationsRepository.findOneBy({ id: applicationId });
		if (!application) {
			throw new IdentifiableError('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Application not found');
		}

		if (application.state !== 'pending') {
			throw new IdentifiableError('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Application is not pending');
		}

		// ユーザーアカウントを作成
		const { account } = await this.signupService.signup({
			username: application.username,
			passwordHash: application.passwordHash,
		});

		await this.userProfilesRepository.update({ userId: account.id }, {
			email: application.email,
			emailVerified: true,
		});

		// 申請情報を更新
		await this.userApplicationsRepository.update(application.id, {
			state: 'approved',
			reviewedAt: new Date(),
			reviewedById: moderator.id,
		});

		// 承認メールを送信
		const meta = await this.metaService.fetch();
		const instanceName = meta.name ?? 'Misskey';

		const subject = `[${instanceName}] アカウントが承認されました`;
		const textContent = `${account.username}\n\n${instanceName}への登録申請が承認されました。\n以下のURLからログインしてください。\n\n${this.config.url}`;
		const htmlContent = textContent.replace(/\n/g, '<br>');

		// 承認メールを送信
		await this.emailService.sendEmail(
			application.email,
			subject,
			htmlContent,
			textContent,
		);

		return account;
	}

	@bindThis
	public async reject(applicationId: string, moderator: MiUser): Promise<void> {
		const application = await this.userApplicationsRepository.findOneBy({ id: applicationId });

		if (!application) {
			throw new IdentifiableError('e221ef3f-0bfd-4977-814f-39b6db4401c0', 'Application not found');
		}

		if (application.state !== 'pending') {
			throw new IdentifiableError('aff7faff-c89a-420c-b698-5c928a6f3d7b', 'Application is not pending');
		}

		await this.userApplicationsRepository.update(application.id, {
			state: 'rejected',
			reviewedAt: new Date(),
			reviewedById: moderator.id,
		});
	}
}
