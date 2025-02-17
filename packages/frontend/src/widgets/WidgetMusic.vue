<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer v-if="widgetProps && Object.keys(widgetProps).length > 0" :showHeader="widgetProps.showHeader" data-cy-mkw-music class="mkw-music">
	<template #icon><i class="ti ti-note"></i></template>
	<template #header>{{ i18n.ts.widgets.music }}</template>
	<div v-if="isLoading" class="root">
		<MkLoading/>
	</div>
	<div v-else :style="`height: ${widgetProps.height}px;`" class="music-widget">
		<p v-if="formattedData">{{ formattedData }}</p>
		<img v-if="infoImageUrl" :src="infoImageUrl" alt="Info Image"/>
		<MkButton class="refresh _buttonPrimary" @click="refreshData">{{ i18n.ts.refresh }}</MkButton>
		<MkButton class="note _buttonPrimary" @click="postNote">{{ i18n.ts.note }}</MkButton>
	</div>
</MkContainer>
<div v-else-if="!widgetProps">Error loading widget properties</div>
<div v-else>Loading widget properties...</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentProps } from './widget.ts';
import type { GetFormResultType } from '@/scripts/form.ts';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { infoImageUrl } from '@/instance.js';
import { i18n } from '@/i18n.js';

const name = 'music';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	height: {
		type: 'number' as const,
		default: 200,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

if (!widgetProps) {
	configure({});
}

const listenbrainzData = ref<any>(null);
const isLoading = ref<boolean>(false);
const formattedData = ref<string>('');

const fetchListenbrainzData = async () => {
	isLoading.value = true;
	try {
		if (!props.username) {
			throw new Error('Username is required.');
		}

		const url = `https://api.listenbrainz.org/1/user/${props.username}/listening-history`;

		const response = await fetch(url, {
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Listenbrainz API error: ${response.status} - ${response.statusText}`, errorText);

			throw new Error(`Listenbrainz API request failed: ${response.status}`);
		}

		const data = await response.json();

		if (!data || !data.payload || !Array.isArray(data.payload)) {
			console.error('Invalid data format received from Listenbrainz API:', data);
			throw new Error('Invalid data format.');
		}

		listenbrainzData.value = data;
		formattedData.value = formatData(data);
	} catch (error) {
		console.error('Error fetching Listenbrainz data:', error);
		emit('error', error);
	} finally {
		isLoading.value = false;
	}
};

const formatData = (data: any): string => {
	if (data && data.payload && data.payload.length > 0) {
		const latestTrack = data.payload[0];
		const trackName = latestTrack.track_name;
		const artistName = latestTrack.artist_name;
		const albumName = latestTrack.album_name;
		return `${trackName} - ${artistName} - ${albumName} #NowPlaying`;
	}
	return '';
};

const refreshData = () => {
	fetchListenbrainzData();
};

const postNote = async () => {
	try {
		const noteContent = formattedData.value;
		const response = await misskeyApi.post('/notes/create', {
			text: noteContent,
		});
		if (response.status !== 200) {
			throw new Error(`Failed to post note: ${response.statusText}`);
		}
		console.log('Note posted successfully:', response.data);
	} catch (error) {
		console.error('Error posting note:', error);
		emit('error', error);
	}
};

onMounted(() => {
	fetchListenbrainzData();
});
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
}

.music-widget {
  width: 100%;
  overflow: hidden;
  border-radius: 4px;
}

p {
  margin: 0;
  padding: 8px;
  font-size: 14px;
}

img {
  width: 100%;
  height: auto;
}

._buttonPrimary {
  margin-top: 8px;
}

.error {
  text-align: center;
  padding: 16px;
}
</style>
