/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { Packed } from '@/misc/json-schema.js';
import { MetaService } from '@/core/MetaService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { isQuotePacked, isRenotePacked } from '@/misc/is-renote.js';
import type { JsonObject } from '@/misc/json-value.js';
import { CacheService } from '@/core/CacheService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import Channel, { type MiChannelService } from '../channel.js';

class MutualTimelineChannel extends Channel {
	public readonly chName = 'mutualTimeline';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private withRenotes: boolean;
	private withReplies: boolean;
	private withFiles: boolean;
	private mutualFollowUserIds: string[] = [];

	constructor(
		private metaService: MetaService,
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,
		private cacheService: CacheService,
		private userFollowingService: UserFollowingService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: JsonObject) {
		const policies = await this.roleService.getUserPolicies(this.user ? this.user.id : null);
		if (!policies.ltlAvailable) return;

		this.withRenotes = !!(params.withRenotes ?? true);
		this.withReplies = !!(params.withReplies ?? false);
		this.withFiles = !!(params.withFiles ?? false);

		if (this.user) {
			const followings = await this.cacheService.userFollowingsCache.fetch(this.user.id);
			const followees = await this.userFollowingService.getFollowees(this.user.id);
			const mutualFollowUserIds: string[] = [];

			for (const followee of followees) {
				if (await this.userFollowingService.isMutual(this.user.id, followee.followeeId)) {
					mutualFollowUserIds.push(followee.followeeId);
				}
			}

			this.subscriber.on('notesStream', this.onNote);
		}
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		if (this.withFiles && (note.fileIds == null || note.fileIds.length === 0)) return;

		const isMe = this.user!.id === note.userId;
		if (!isMe && !this.mutualFollowUserIds.includes(note.userId)) return;

		if (note.visibility !== 'public' && note.visibility !== 'home' && note.visibility !== 'followers') {
			if (note.visibility === 'specified') {
				if (!isMe && !note.visibleUserIds!.includes(this.user!.id)) return;
			} else {
				return;
			}
		}

		if (note.channelId != null) return;
		if (note.user.requireSigninToViewContents && this.user == null) return;
		if (note.renote && note.renote.user.requireSigninToViewContents && this.user == null) return;
		if (note.reply && note.reply.user.requireSigninToViewContents && this.user == null) return;

		if (note.reply && !this.withReplies) {
			const reply = note.reply;
			if (reply.userId !== this.user!.id && !isMe && reply.userId !== note.userId) return;
		}

		if (isRenotePacked(note) && !isQuotePacked(note) && !this.withRenotes) return;

		if (this.isNoteMutedOrBlocked(note)) return;

		if (this.user && isRenotePacked(note) && !isQuotePacked(note)) {
			if (note.renote && Object.keys(note.renote.reactions).length > 0) {
				const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user.id);
				note.renote.myReaction = myRenoteReaction;
			}
		}

		this.connection.cacheNote(note);

		this.send('note', note);
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}

@Injectable()
export class MutualTimelineChannelService implements MiChannelService<true> {
	public readonly shouldShare = MutualTimelineChannel.shouldShare;
	public readonly requireCredential = MutualTimelineChannel.requireCredential;
	public readonly kind = MutualTimelineChannel.kind;

	constructor(
		private metaService: MetaService,
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,
		private cacheService: CacheService,
		private userFollowingService: UserFollowingService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): MutualTimelineChannel {
		return new MutualTimelineChannel(
			this.metaService,
			this.roleService,
			this.noteEntityService,
			this.cacheService,
			this.userFollowingService,
			id,
			connection,
		);
	}
}
