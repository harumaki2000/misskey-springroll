<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/deck" :label="i18n.ts.deck" :keywords="['deck', 'ui']" icon="ti ti-columns">
	<div class="_gaps_m">
		<SearchMarker :keywords="['sync', 'profiles', 'devices']">
			<MkSwitch :modelValue="profilesSyncEnabled" @update:modelValue="changeProfilesSyncEnabled">
				<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ i18n.ts._deck.enableSyncBetweenDevicesForProfiles }}</SearchLabel></template>
			</MkSwitch>
		</SearchMarker>

		<hr>

		<SearchMarker :keywords="['ui', 'root', 'page']">
			<MkPreferenceContainer k="deck.useSimpleUiForNonRootPages">
				<MkSwitch v-model="useSimpleUiForNonRootPages">
					<template #label><SearchLabel>{{ i18n.ts._deck.useSimpleUiForNonRootPages }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['default', 'navigation', 'behaviour', 'window']">
			<MkPreferenceContainer k="deck.navWindow">
				<MkSwitch v-model="navWindow">
					<template #label><SearchLabel>{{ i18n.ts.defaultNavigationBehaviour }}</SearchLabel>: {{ i18n.ts.openInWindow }}</template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['always', 'show', 'main', 'column']">
			<MkPreferenceContainer k="deck.alwaysShowMainColumn">
				<MkSwitch v-model="alwaysShowMainColumn">
					<template #label><SearchLabel>{{ i18n.ts._deck.alwaysShowMainColumn }}</SearchLabel></template>
				</MkSwitch>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['column', 'align']">
			<MkPreferenceContainer k="deck.columnAlign">
				<MkRadios v-model="columnAlign">
					<template #label><SearchLabel>{{ i18n.ts._deck.columnAlign }}</SearchLabel></template>
					<option value="left">{{ i18n.ts.left }}</option>
					<option value="center">{{ i18n.ts.center }}</option>
				</MkRadios>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['menu', 'position']">
			<MkPreferenceContainer k="deck.menuPosition">
				<MkRadios v-model="menuPosition">
					<template #label><SearchLabel>{{ i18n.ts._deck.deckMenuPosition }}</SearchLabel></template>
					<option value="right">{{ i18n.ts.right }}</option>
					<option value="bottom">{{ i18n.ts.bottom }}</option>
				</MkRadios>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['navbar', 'position']">
			<MkPreferenceContainer k="deck.navbarPosition">
				<MkRadios v-model="navbarPosition">
					<template #label><SearchLabel>{{ i18n.ts._deck.navbarPosition }}</SearchLabel></template>
					<option value="left">{{ i18n.ts.left }}</option>
					<option value="top">{{ i18n.ts.top }}</option>
					<option value="bottom">{{ i18n.ts.bottom }}</option>
				</MkRadios>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['column', 'gap', 'margin']">
			<MkPreferenceContainer k="deck.columnGap">
				<MkRange v-model="columnGap" :min="3" :max="100" :step="1" :continuousUpdate="true">
					<template #label><SearchLabel>{{ i18n.ts._deck.columnGap }}</SearchLabel></template>
				</MkRange>
			</MkPreferenceContainer>
		</SearchMarker>

		<SearchMarker :keywords="['wallpaper']">
			<MkPreferenceContainer k="deck.wallpaper">
				<MkButton v-if="wallpaper == null" @click="setWallpaper"><SearchLabel>{{ i18n.ts.setWallpaper }}</SearchLabel></MkButton>
				<MkButton v-else @click="wallpaper = null">{{ i18n.ts.removeWallpaper }}</MkButton>
			</MkPreferenceContainer>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkRange from '@/components/MkRange.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { prefer } from '@/preferences.js';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import { reloadAsk } from '@/utility/reload-ask.js';
import { selectFile } from '@/utility/drive.js';

const navWindow = prefer.model('deck.navWindow');
const useSimpleUiForNonRootPages = prefer.model('deck.useSimpleUiForNonRootPages');
const alwaysShowMainColumn = prefer.model('deck.alwaysShowMainColumn');
const columnAlign = prefer.model('deck.columnAlign');
const columnGap = prefer.model('deck.columnGap');
const menuPosition = prefer.model('deck.menuPosition');
const navbarPosition = prefer.model('deck.navbarPosition');
const wallpaper = prefer.model('deck.wallpaper');

watch(wallpaper, async () => {
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

function setWallpaper(ev: MouseEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	}).then(file => {
		wallpaper.value = file.url;
	});
}

const profilesSyncEnabled = ref(prefer.isSyncEnabled('deck.profiles'));

function changeProfilesSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('deck.profiles').then((res) => {
			if (res == null) return;
			if (res.enabled) profilesSyncEnabled.value = true;
		});
	} else {
		prefer.disableSync('deck.profiles');
		profilesSyncEnabled.value = false;
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.deck,
	icon: 'ti ti-columns',
}));
</script>
