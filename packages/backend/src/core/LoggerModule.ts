/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { LoggerService } from './LoggerService.js';

@Module({
	providers: [LoggerService],
	exports: [LoggerService],
})
export class LoggerModule {}
