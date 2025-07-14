<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>{{ application.username }}</template>
	<template #suffix>
		<span v-if="application.state === 'pending'" style="color: var(--MI_THEME-warn);">{{ i18n.ts.pending }}</span>
		<span v-else-if="application.state === 'approved'" style="color: var(--MI_THEME-success);">{{ i18n.ts.approved }}</span>
		<span v-else-if="application.state === 'rejected'" style="color: var(--MI_THEME-error);">{{ i18n.ts.rejected }}</span>
	</template>
	<template #footer>
		<div v-if="application.state === 'pending'" class="_buttons">
			<MkButton primary rounded @click="approve"><i class="ti ti-check"></i> {{ i18n.ts.approve }}</MkButton>
			<MkButton danger rounded @click="reject"><i class="ti ti-x"></i> {{ i18n.ts.reject }}</MkButton>
		</div>
	</template>

	<div :class="$style.root">
		<div :class="$style.items">
			<div>
				<div :class="$style.label">{{ i18n.ts.username }}</div>
				<div>{{ application.username }}</div>
			</div>
			<div>
				<div :class="$style.label">{{ i18n.ts.emailAddress }}</div>
				<div>{{ application.email }}</div>
			</div>
			<div v-if="application.reason">
				<div :class="$style.label">{{ i18n.ts.reason }}</div>
				<div class="_prewrap">{{ application.reason }}</div>
			</div>
			<div>
				<div :class="$style.label">{{ i18n.ts.createdAt }}</div>
				<div><MkTime :time="application.createdAt" mode="absolute"/></div>
			</div>
			<div v-if="application.reviewedBy">
				<div :class="$style.label">{{ i18n.ts.reviewedBy }}</div>
				<div :class="$style.user">
					<MkAvatar :user="application.reviewedBy" :class="$style.avatar" link preview/>
					<MkUserName :user="application.reviewedBy"/>
				</div>
			</div>
			<div v-if="application.reviewedAt">
				<div :class="$style.label">{{ i18n.ts.reviewedAt }}</div>
				<div><MkTime :time="application.reviewedAt" mode="absolute"/></div>
			</div>
		</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import MkAvatar from './global/MkAvatar.vue';
import MkUserName from './global/MkUserName.vue';
import MkTime from './global/MkTime.vue';
import type { UserApplication } from '@/misskey-js-entities.js';

const props = defineProps<{
	application: UserApplication;
}>();

const emits = defineEmits<{
	(event: 'updated', id: string): void;
}>();

async function approve() {
	await os.apiWithDialog('admin/applications/approve', { applicationId: props.application.id });
	emits('updated', props.application.id);
}

async function reject() {
	await os.apiWithDialog('admin/applications/reject', { applicationId: props.application.id });
	emits('updated', props.application.id);
}
</script>

<style lang="scss" module>
.root { text-align: left; }
.items { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); grid-gap: 12px; }
.label { font-size: 0.85em; padding: 0 0 8px 0; user-select: none; opacity: 0.7; }
.user { display: flex; align-items: center; gap: 8px; }
.avatar { --height: 24px; width: var(--height); height: var(--height); }
</style>
