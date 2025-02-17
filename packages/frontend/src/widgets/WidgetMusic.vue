<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer v-if="widgetProps" :showHeader="widgetProps.showHeader" data-cy-mkw-music class="mkw-music">
	<template #icon><i class="ti ti-note"></i></template>
	<template #header>{{ i18n.ts._widgets.music }}</template>
	<div v-if="isLoading" class="root">
		<MkLoading/>
	</div>
	<div v-else-if="errorMessage">
		<div class="error">{{ errorMessage }}</div>
	</div>
	<div v-else :style="`height: ${widgetProps.height}px;`" class="music-widget">
		<p v-if="formattedData">{{ formattedData }}</p>
		<img v-if="infoImageUrl" :src="infoImageUrl" alt="Info Image"/>
		<div class="buttons">
			<button class="_button" :class="buttonStyleClass" @click="fetchPlayingNow()"><i class="ti ti-refresh"></i></button>
			<MkButton class="note _button" :disabled="!formattedData" @click="postNote">{{ i18n.ts.note }}</MkButton>
		</div>
	</div>
</MkContainer>
<div v-else>Loading widget properties...</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentProps, WidgetComponentExpose } from './widget.ts'; // WidgetComponentExpose をインポート
import type { GetFormResultType } from '@/scripts/form.ts';
import MkContainer from '@/components/MkContainer.vue';
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
	userId: {
		type: 'string' as const,
		default: null,
	},
	noteFormat: {
		type: 'string' as const,
		multiline: true,
		default: '{track_name} - {artist_name} - {album_name} #NowPlaying',
	},
};

type widgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const listenbrainzData = ref<any>(null); // any型ではなく、適切な型を指定することを推奨
const isLoading = ref(false);
const formattedData = ref('');
const errorMessage = ref<string | null>(null);
const buttonStyleClass = ref<string>('_button'); // buttonStyleClass を ref として定義

const fetchListenbrainzData = async () => {
	isLoading.value = true;
	errorMessage.value = null;

	try {
		if (!widgetProps.userId) {
			throw new Error('User ID is required.');
		}

		const response = await fetch(`https://api.listenbrainz.org/1/user/${widgetProps.userId}/playing-now`);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Listenbrainz API error: ${response.status} - ${response.statusText}`, errorText);
			throw new Error(`Listenbrainz API request failed: ${response.status}`);
		}

		const data = await response.json();

		if (!data?.payload?.listens?.length) {
			console.error('Invalid or empty data received from Listenbrainz API:', data);
			throw new Error('No listening data found.');
		}

		listenbrainzData.value = data;
		formattedData.value = formatData(data);
	} catch (error: any) {
		console.error('Error fetching Listenbrainz data:', error);
		emit('error', error);
		errorMessage.value = error.message;
		formattedData.value = '';
	} finally {
		isLoading.value = false;
	}
};

const formatData = (data: any): string => {
	const latestTrack = data?.payload?.listens?.[0];
	if (!latestTrack) return '';

	return widgetProps.noteFormat
		.replace('{track_name}', latestTrack.track_name || '')
		.replace('{artist_name}', latestTrack.artist_name || '')
		.replace('{album_name}', latestTrack.album_name || '');
};

const refreshData = () => {
	fetchListenbrainzData()
		.then((result: any) => {
			listenbrainzData.value = result;
			errorMessage.value = null;
		})
		.catch((err: any) => {
			errorMessage.value = err.message;
			emit('error', err.message);
		});
};

const postNote = async () => {
	if (!formattedData.value) return;

	try {
		const response = await misskeyApi('/notes/create', { text: formattedData.value });

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to post note: ${response.status} - ${response.statusText} - ${errorText}`);
		}

		console.log('Note posted successfully:', response.data);
	} catch (error: any) {
		console.error('Error posting note:', error);
		emit('error', error);
	}
};

const fetchPlayingNow = () => {
	fetchListenbrainzData();
};

onMounted(() => {
	if (widgetProps && widgetProps.userId) {
		fetchListenbrainzData();
	}
});

watch(
	() => widgetProps.userId,
	(newUserId: string | null) => {
		if (newUserId) {
			fetchListenbrainzData();
		} else {
			formattedData.value = '';
		}
	},
);

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
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

.buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

p {
  margin: 0;
  padding: 8px;
  font-size: 14px;
}

img {
  width: 100%;
  height: auto;
  display: block;
}

._button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background-color: transparent;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  text-align: center;
  padding: 16px;
}
</style>
