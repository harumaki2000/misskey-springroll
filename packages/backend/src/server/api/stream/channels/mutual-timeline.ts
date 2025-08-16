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
	private mutualFollowings: Record<string, { withReplies: boolean }> = {};

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
			const followees = await this.userFollowingService.getFollowees(this.user.id);
			const followingsCache = await this.cacheService.userFollowingsCache.fetch(this.user.id);

			for (const followee of followees) {
				if (await this.userFollowingService.isMutual(this.user.id, followee.followeeId)) {
					this.mutualFollowUserIds.push(followee.followeeId);
					this.mutualFollowings[followee.followeeId] = {
						withReplies: followingsCache[followee.followeeId]?.withReplies ?? false,
					};
				}
			}

			this.subscriber.on('notesStream', this.onNote);
		}
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
			// followers投稿の場合、相互フォロー関係を再確認
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
			// 相互フォローユーザーのwithReplies設定をチェック
			const isMutualWithReplies = this.isMutualFollow(note.userId) &&
				this.mutualFollowings[note.userId]?.withReplies;

			if (!isMutualWithReplies) {
				// 「チャンネル接続主への返信」でもなければ、「チャンネル接続主が行った返信」でもなければ、「投稿者の投稿者自身への返信」でもない場合
				if (reply.userId !== this.user!.id && !isMe && reply.userId !== note.userId) return;
			} else {
				// withRepliesが有効でも、followers投稿への返信は相互フォロー関係をチェック
				if (reply.visibility === 'followers' && !this.isMutualFollow(reply.userId) && reply.userId !== this.user!.id) return;
			}
		}

		// 純粋なリノート（引用リノートでないリノート）の場合
		if (isRenotePacked(note) && !isQuotePacked(note) && note.renote) {
			if (!this.withRenotes) return;
			if (note.renote.reply) {
				const reply = note.renote.reply;
				// 相互フォローしていないユーザーの visibility: followers な投稿への返信のリノートは弾く
				if (reply.visibility === 'followers' && !this.isMutualFollow(reply.userId) && reply.userId !== this.user!.id) return;
			}
		}

		if (this.isNoteMutedOrBlocked(note)) return;

		if (this.user && isRenotePacked(note) && !isQuotePacked(note)) {
			if (note.renote && Object.keys(note.renote.reactions).length > 0) {
				const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user.id);
				note.renote.myReaction = myRenoteReaction;
			}
		}

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
