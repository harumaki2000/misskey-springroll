/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IsNull, LessThanOrEqual } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { RegistrationTicketsRepository, UsedUsernamesRepository, UserPendingsRepository, UserProfilesRepository, UsersRepository, UserApplicationsRepository, MiRegistrationTicket, MiMeta } from '@/models/_.js';
import type { Config } from '@/config.js';
import { CaptchaService } from '@/core/CaptchaService.js';
import { IdService } from '@/core/IdService.js';
import { SignupService } from '@/core/SignupService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { EmailService } from '@/core/EmailService.js';
import { MiLocalUser } from '@/models/User.js';
import { FastifyReplyError } from '@/misc/fastify-reply-error.js';
import { bindThis } from '@/decorators.js';
import { L_CHARS, secureRndstr } from '@/misc/secure-rndstr.js';
import { SigninService } from './SigninService.js';
import type { FindOptionsWhere } from 'typeorm';
import type { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class SignupApiService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userPendingsRepository)
		private userPendingsRepository: UserPendingsRepository,

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,

		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		@Inject(DI.userApplicationsRepository)
		private userApplicationsRepository: UserApplicationsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private captchaService: CaptchaService,
		private signupService: SignupService,
		private signinService: SigninService,
		private emailService: EmailService,
	) {
	}

	@bindThis
	public async signup(
		request: FastifyRequest<{
			Body: {
				username: string;
				password: string;
				host?: string;
				invitationCode?: string;
				emailAddress?: string;
				reason?: string;
				'hcaptcha-response'?: string;
				'g-recaptcha-response'?: string;
				'turnstile-response'?: string;
				'm-captcha-response'?: string;
				'testcaptcha-response'?: string;
			}
		}>,
		reply: FastifyReply,
	) {
		const body = request.body;

		if (process.env.NODE_ENV !== 'test') {
			if (this.meta.enableHcaptcha && this.meta.hcaptchaSecretKey) {
				await this.captchaService.verifyHcaptcha(this.meta.hcaptchaSecretKey, body['hcaptcha-response']).catch(err => { throw new FastifyReplyError(400, err); });
			}
			if (this.meta.enableMcaptcha && this.meta.mcaptchaSecretKey && this.meta.mcaptchaSitekey && this.meta.mcaptchaInstanceUrl) {
				await this.captchaService.verifyMcaptcha(this.meta.mcaptchaSecretKey, this.meta.mcaptchaSitekey, this.meta.mcaptchaInstanceUrl, body['m-captcha-response']).catch(err => { throw new FastifyReplyError(400, err); });
			}
			if (this.meta.enableRecaptcha && this.meta.recaptchaSecretKey) {
				await this.captchaService.verifyRecaptcha(this.meta.recaptchaSecretKey, body['g-recaptcha-response']).catch(err => { throw new FastifyReplyError(400, err); });
			}
			if (this.meta.enableTurnstile && this.meta.turnstileSecretKey) {
				await this.captchaService.verifyTurnstile(this.meta.turnstileSecretKey, body['turnstile-response']).catch(err => { throw new FastifyReplyError(400, err); });
			}
			if (this.meta.enableTestcaptcha) {
				await this.captchaService.verifyTestcaptcha(body['testcaptcha-response']).catch(err => { throw new FastifyReplyError(400, err); });
			}
		}

		const { username, password, invitationCode, emailAddress, reason } = body;
		const host: string | null = process.env.NODE_ENV === 'test' ? (body['host'] ?? null) : null;

		if (await this.usersRepository.exists({ where: { usernameLower: username.toLowerCase(), host: IsNull() } })) {
			throw new FastifyReplyError(400, 'DUPLICATED_USERNAME');
		}
		if (await this.usedUsernamesRepository.exists({ where: { username: username.toLowerCase() } })) {
			throw new FastifyReplyError(400, 'USED_USERNAME');
		}
		const isPreserved = this.meta.preservedUsernames.map(x => x.toLowerCase()).includes(username.toLowerCase());
		if (isPreserved) {
			throw new FastifyReplyError(400, 'DENIED_USERNAME');
		}
		if (this.meta.emailRequiredForSignup || this.meta.requireApplicationForSignup) {
			if (!emailAddress) throw new FastifyReplyError(400, 'EMAIL_REQUIRED');
			const res = await this.emailService.validateEmailForAccount(emailAddress);
			if (!res.available) throw new FastifyReplyError(400, 'EMAIL_TAKEN');
		}

		let ticket: MiRegistrationTicket | null = null;
		// テスト時はこの機構は障害となるため無効にする
		if (process.env.NODE_ENV !== 'test' && this.meta.disableRegistration) {
			if (!invitationCode) throw new FastifyReplyError(400, 'INVITATION_CODE_REQUIRED');
			// ここでの検証はあくまで早期リジェクトのための事前チェックで、
			// 実際の使用可否は消費直前の claimRegistrationTicket() が担保する
			ticket = await this.registrationTicketsRepository.findOneBy({ code: invitationCode });
			if (!ticket || ticket.usedById != null) throw new FastifyReplyError(400, 'INVITATION_CODE_INVALID');
			if (ticket.expiresAt && ticket.expiresAt < new Date()) throw new FastifyReplyError(400, 'INVITATION_CODE_EXPIRED');
		}

		const salt = await bcrypt.genSalt(8);
		const passwordHash = await bcrypt.hash(password, salt);

		if (this.meta.requireApplicationForSignup) {
			if (!reason || reason.trim() === '') {
				throw new FastifyReplyError(400, 'REASON_REQUIRED');
			}
			await this.userApplicationsRepository.insertOne({
				id: this.idService.gen(),
				username,
				email: emailAddress!,
				passwordHash,
				reason: reason,
			});

			const subject = `[${this.config.url}] 登録申請を受け付けました`;
			const textContent = `${username}\n\n[${this.config.url}] への登録申請を受け付けました。\n管理者の承認が完了するまで、今しばらくお待ちください。`;
			const htmlContent = textContent.replace(/\n/g, '<br>');
			this.emailService.sendEmail(emailAddress!, subject, htmlContent, textContent);

			reply.code(204);
			return;
		} else if (this.meta.emailRequiredForSignup) {
			const code = secureRndstr(16, { chars: L_CHARS });
			if (ticket && !await this.claimRegistrationTicket(ticket)) {
				reply.code(400);
				return;
			}

			try {
				const pendingUser = await this.userPendingsRepository.insertOne({
					id: this.idService.gen(),
					code,
					email: emailAddress!,
					username,
					password: passwordHash,
				});
				const link = `${this.config.url}/signup-complete/${code}`;
				this.emailService.sendEmail(emailAddress!, 'Signup',
					`To complete signup, please click this link:<br><a href="${link}">${link}</a>`,
					`To complete signup, please click this link: ${link}`);
				if (ticket) {
					await this.registrationTicketsRepository.update(ticket.id, {
						pendingUserId: pendingUser.id,
					});
				}
			} catch (err) {
				// 確保したコードが無駄に消費されたままになるのを防ぐ
				if (ticket) await this.releaseRegistrationTicket(ticket);
				throw err;
			}
			reply.code(204);
			return;
		} else {
			if (ticket && !await this.claimRegistrationTicket(ticket)) {
				reply.code(400);
				return;
			}

			try {
				const { account, secret } = await this.signupService.signup({
					username, password, host,
				});

				if (ticket) {
					await this.registrationTicketsRepository.update(ticket.id, {
						usedBy: account,
						usedById: account.id,
					});
				}

				const res = await this.userEntityService.pack(account, account, {
					schema: 'MeDetailed',
					includeSecrets: true,
				});

				return {
					...res,
					token: secret,
				};
			} catch (err) {
				// 確保したコードが無駄に消費されたままになるのを防ぐ
				// (アカウントと紐付け済みの場合は release 側の条件により戻らない)
				if (ticket) await this.releaseRegistrationTicket(ticket);
				throw new FastifyReplyError(400, typeof err === 'string' ? err : (err as Error).toString());
			}
		}
	}

	/**
	 * 招待コードを使用中として確保する
	 *
	 * @returns 確保できた場合は true、既に他のリクエストが消費していた場合は false
	 */
	@bindThis
	private async claimRegistrationTicket(ticket: MiRegistrationTicket): Promise<boolean> {
		const where: FindOptionsWhere<MiRegistrationTicket>[] = [
			{ id: ticket.id, usedById: IsNull(), usedAt: IsNull() },
		];

		// メアド認証が有効の場合、認証されないままメール送信から30分経過したコードは再び使用できる
		if (this.meta.emailRequiredForSignup) {
			where.push({
				id: ticket.id,
				usedById: IsNull(),
				usedAt: LessThanOrEqual(new Date(Date.now() - (1000 * 60 * 30))),
			});
		}

		const result = await this.registrationTicketsRepository.update(where, {
			usedAt: new Date(),
		});

		return (result.affected ?? 0) > 0;
	}

	/**
	 * {@link claimRegistrationTicket} で確保した招待コードを未使用に戻す
	 *
	 * 既にアカウントと紐付いた (= 消費が確定した) コードは戻さない
	 */
	@bindThis
	private async releaseRegistrationTicket(ticket: MiRegistrationTicket): Promise<void> {
		await this.registrationTicketsRepository.update({
			id: ticket.id,
			usedById: IsNull(),
		}, {
			usedAt: null,
			pendingUserId: null,
		});
	}

	@bindThis
	public async signupPending(request: FastifyRequest<{ Body: { code: string; } }>, reply: FastifyReply) {
		const body = request.body;

		const code = body['code'];

		try {
			const pendingUser = await this.userPendingsRepository.findOneByOrFail({ code });

			if (this.idService.parse(pendingUser.id).date.getTime() + (1000 * 60 * 30) < Date.now()) {
				throw new FastifyReplyError(400, 'EXPIRED');
			}

			const { account } = await this.signupService.signup({
				username: pendingUser.username,
				passwordHash: pendingUser.password,
			});

			this.userPendingsRepository.delete({
				id: pendingUser.id,
			});

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: account.id });

			await this.userProfilesRepository.update({ userId: profile.userId }, {
				email: pendingUser.email,
				emailVerified: true,
				emailVerifyCode: null,
			});

			const ticket = await this.registrationTicketsRepository.findOneBy({ pendingUserId: pendingUser.id });
			if (ticket) {
				await this.registrationTicketsRepository.update(ticket.id, {
					usedBy: account,
					usedById: account.id,
					pendingUserId: null,
				});
			}

			return this.signinService.signin(request, reply, account as MiLocalUser);
		} catch (err) {
			throw new FastifyReplyError(400, typeof err === 'string' ? err : (err as Error).toString());
		}
	}
}
