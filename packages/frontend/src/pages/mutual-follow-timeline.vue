<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div ref="rootEl">
			<div v-if="queue > 0" :class="$style.new"><button class="_buttonPrimary" :class="$style.newButton" @click="top()">{{ i18n.ts.newNoteRecived }}</button></div>
			<div :class="$style.tl">
				<MkTimeline
					ref="tlEl" :key="mutual"
					src="mutual"
					:sound="true"
					@queue="queueUpdated"
				/>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import { scrollInContainer } from '@@/js/scroll.js';
import MkTimeline from '@/components/MkTimeline.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';

const router = useRouter();
const queue = ref(0);
const tlEl = useTemplateRef('tlEl');
const rootEl = useTemplateRef('rootEl');

function queueUpdated(q) {
	queue.value = q;
}

function top() {
	scrollInContainer(rootEl.value, { top: 0 });
}

function settings() {
	router.push('/settings/timeline');
}

const headerActions = computed(() => mutual.value ? [{
	icon: 'ti ti-settings',
	text: i18n.ts.settings,
	handler: settings,
}] : []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: mutual.value ? mutual.value.name : i18n.ts.mutual,
	icon: 'ti ti-users',
}));
</script>

<style lang="scss" module>
.new {
	position: sticky;
	top: calc(var(--MI-stickyTop, 0px) + 16px);
	z-index: 1000;
	width: 100%;
	margin: calc(-0.675em - 8px) 0;

	&:first-child {
		margin-top: calc(-0.675em - 8px - var(--MI-margin));
	}
}

.newButton {
	display: block;
	margin: var(--MI-margin) auto 0 auto;
	padding: 8px 16px;
	border-radius: 32px;
}

.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}
</style>
