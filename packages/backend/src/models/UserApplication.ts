/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('user_application')
export class MiUserApplication {
	@PrimaryColumn(id())
	public id: string;

	@CreateDateColumn({ type: 'timestamptz' })
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 128,
	})
	public username: string;

	@Column('varchar', {
		length: 128,
	})
	public email: string;

	@Column('varchar', {
		length: 128,
	})
	public passwordHash: string;

	@Column('text', {
		nullable: false,
	})
	public reason: string;

	@Index()
	@Column('varchar', {
		length: '32',
		default: 'pending',
	})
	public state: string;

	@Column({ type: 'timestamptz', nullable: true })
	public reviewedAt: Date | null;

	@Column({ type: 'varchar', length: '32', nullable: true })
	public reviewedById: string | null;

	@ManyToOne(() => MiUser, { nullable: true })
	@JoinColumn({ name: 'reviewedById' })
	public reviewedBy: MiUser | null;
}
