/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Packed } from '@/misc/json-schema.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { isQuotePacked, isRenotePacked } from '@/misc/is-renote.js';
import type { JsonObject } from '@/misc/json-value.js';
import { CacheService } from '@/core/CacheService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import Channel, { type ChannelRequest } from '../channel.js';

@Injectable({ scope: Scope.TRANSIENT })
export class MutualTimelineChannel extends Channel {
	public readonly chName = 'mutualTimeline';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private withRenotes: boolean;
	private withReplies: boolean;
	private withFiles: boolean;
	private mutualFollowUserIds: string[] = [];
	private mutualFollowings: Record<string, { withReplies: boolean }> = {};

	constructor(
		@Inject(REQUEST)
		request: ChannelRequest,

		private noteEntityService: NoteEntityService,
		private cacheService: CacheService,
		private userFollowingService: UserFollowingService,
	) {
		super(request);
	}

	@bindThis
	public async init(params: JsonObject) {
		this.withRenotes = !!(params.withRenotes ?? true);
		this.withReplies = !!(params.withReplies ?? false);
		this.withFiles = !!(params.withFiles ?? false);

		const followees = await this.userFollowingService.getFollowees(this.user!.id);
		const followingsCache = await this.cacheService.userFollowingsCache.fetch(this.user!.id);

		for (const followee of followees) {
			if (await this.userFollowingService.isMutual(this.user!.id, followee.followeeId)) {
				this.mutualFollowUserIds.push(followee.followeeId);
				this.mutualFollowings[followee.followeeId] = {
					withReplies: followingsCache[followee.followeeId]?.withReplies ?? false,
				};
			}
		}

		this.subscriber.on('notesStream', this.onNote);
	}

	@bindThis
	private isMutualFollow(userId: string): boolean {
		return this.mutualFollowUserIds.includes(userId);
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		if (this.withFiles && (note.fileIds == null || note.fileIds.length === 0)) return;

		const isMe = this.user!.id === note.userId;
		if (!isMe && !this.isMutualFollow(note.userId)) return;

		if (note.visibility === 'followers') {
			if (!isMe && !this.isMutualFollow(note.userId)) return;
		} else if (note.visibility === 'specified') {
			if (!isMe && !note.visibleUserIds!.includes(this.user!.id)) return;
		} else if (note.visibility !== 'public' && note.visibility !== 'home') {
			return;
		}

		if (note.channelId != null) return;
		if (note.user.requireSigninToViewContents && this.user == null) return;
		if (note.renote && note.renote.user.requireSigninToViewContents && this.user == null) return;
		if (note.reply && note.reply.user.requireSigninToViewContents && this.user == null) return;
		if (note.reply && !this.withReplies) {
			const reply = note.reply;
			const isMutualWithReplies = this.isMutualFollow(note.userId) &&
				this.mutualFollowings[note.userId]?.withReplies;

			if (!isMutualWithReplies) {
				if (reply.userId !== this.user!.id && !isMe && reply.userId !== note.userId) return;
			} else {
				if (reply.visibility === 'followers' && !this.isMutualFollow(reply.userId) && reply.userId !== this.user!.id) return;
			}
		}

		if (isRenotePacked(note) && !isQuotePacked(note) && note.renote) {
			if (!this.withRenotes) return;
			if (note.renote.reply) {
				const reply = note.renote.reply;
				if (reply.visibility === 'followers' && !this.isMutualFollow(reply.userId) && reply.userId !== this.user!.id) return;
			}
		}

		if (this.isNoteMutedOrBlocked(note)) return;

		if (isRenotePacked(note) && !isQuotePacked(note) && note.renote && Object.keys(note.renote.reactions).length > 0) {
			const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user!.id);
			note.renote.myReaction = myRenoteReaction;
		}

		this.send('note', note);
	}

	@bindThis
	public dispose() {
		this.subscriber.off('notesStream', this.onNote);
	}
}
