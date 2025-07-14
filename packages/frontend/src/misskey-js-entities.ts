/*
 * SPDX-FileCopyrightText: harumaki2000
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { UserLite } from "misskey-js/entities.js";

export type UserApplication = {
	id: string;
	createdAt: string;
	username: string;
	email: string;
	reason: string | null;
	state: 'pending' | 'approved' | 'rejected';
	reviewedAt: string | null;
	reviewedBy: UserLite | null;
};
