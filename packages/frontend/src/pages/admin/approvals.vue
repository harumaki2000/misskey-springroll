<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps_m">
			<div :class="$style.inputs">
				<MkSelect v-model="state" :items="stateDef" :class="$style.input">
					<template #label>{{ i18n.ts.state }}</template>
					<option value="pending">{{ i18n.ts._admin.approvals.pending }}</option>
					<option value="approved">{{ i18n.ts._admin.approvals.approved }}</option>
					<option value="rejected">{{ i18n.ts._admin.approvals.rejected }}</option>
					<option value="all">{{ i18n.ts.all }}</option>
				</MkSelect>
				<MkSelect v-model="sort" :items="sortDef" :class="$style.input">
					<template #label>{{ i18n.ts.sort }}</template>
					<option value="-createdAt">{{ i18n.ts.createdAt }} ({{ i18n.ts.descendingOrder }})</option>
					<option value="+createdAt">{{ i18n.ts.createdAt }} ({{ i18n.ts.ascendingOrder }})</option>
				</MkSelect>
			</div>
			<MkPagination :paginator="paginator">
				<template #default="{ items }">
					<div class="_gaps_s">
						<MkUserApplication v-for="item in items" :key="item.id" :application="item as UserApplication" @updated="onApplicationUpdated"/>
					</div>
				</template>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import type { UserApplication } from '@/misskey-js-entities.js';
import { i18n } from '@/i18n.js';
import MkSelect from '@/components/MkSelect.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkUserApplication from '@/components/MkUserApplication.vue';
import { definePage } from '@/page.js';
import { Paginator } from '@/utility/paginator.js';
import { useMkSelect } from '@/composables/use-mkselect';

// 申請の状態とソート順を管理
// const state = ref<'pending' | 'approved' | 'rejected' | 'all'>('pending');
// const sort = ref<'+createdAt' | '-createdAt'>('-createdAt');
const {
	model: state,
	def: stateDef,
} = useMkSelect({
	items: [
		{ label: i18n.ts._admin.approvals.pending, value: 'pending' },
		{ label: i18n.ts._admin.approvals.approved, value: 'approved' },
		{ label: i18n.ts._admin.approvals.rejected, value: 'rejected' },
		{ label: i18n.ts.all, value: 'all' },
	],
	initialValue: 'pending',
});
const {
	model: sort,
	def: sortDef,
} = useMkSelect({
	items: [
		{ label: `${i18n.ts.createdAt} (${i18n.ts.ascendingOrder})`, value: '+createdAt' },
		{ label: `${i18n.ts.createdAt} (${i18n.ts.descendingOrder})`, value: '-createdAt' },
	],
	initialValue: '-createdAt',
});

// PaginatorのAPIエンドポイントを申請一覧用に変更
const paginator = markRaw(new Paginator('admin/applications/list', {
	limit: 10,
	computedParams: computed(() => ({
		state: state.value,
		sort: sort.value,
	})),
	offsetMode: true,
}));

// 申請が承認/却下されたらリストから削除する
function onApplicationUpdated(id: string) {
	paginator.removeItem(id);
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts._admin.approvals.title,
	icon: 'ti ti-user-check',
}));
</script>

<style lang="scss" module>
.inputs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.input {
	flex: 1;
}
</style>
