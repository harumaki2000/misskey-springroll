/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NotesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class CheckExpiredNotesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('check-expired-notes');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('Checking expired notes...');

		const now = new Date();

		const expiredNotes = await this.notesRepository.find({
			where: {
				expiresAt: LessThan(now),
			},
			select: ['id'],
		});

		if (expiredNotes.length > 0) {
			const ids = expiredNotes.map((n: { id: any; }) => n.id);
			await this.notesRepository.delete(ids);
			this.logger.info(`Deleted ${ids.length} expired notes.`);
		} else {
			this.logger.info('No expired notes found.');
		}

		this.logger.succ('All expired notes checked.');
	}
}
