<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-weather">
	<template #icon><i class="ti ti-cloud"></i></template>
	<template #header>{{ i18n.ts._widgets.weather }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="configure">
			<i class="ti ti-settings"></i>
		</button>
		<button class="_button" :class="buttonStyleClass" @click="refresh">
			<i class="ti ti-refresh"></i>
		</button>
	</template>
	<div class="$style.root">
		<MkLoading v-if="fetching"></MkLoading>
		<div v-else-if="weatherData">
			<div class="$style.location">
				<i class="ti ti-map-pin"></i>
				{{ weatherData.location }}
			</div>
			<div class="$style.current">
				<div class="$style.temperature">
					{{ Math.round(weatherData.current.temp_c) }}°C
				</div>
				<div class="$style.condition">
					<img :src="weatherData.current.condition.icon" :alt="weatherData.current.condition.text" class="$style.icon">
					{{ weatherData.current.condition.text }}
				</div>
			</div>
			<div class="$style.details">
				<div class="$style.detail">
					<i class="ti ti-droplet"></i>
					湿度: {{ weatherData.current.humidity }}%
				</div>
				<div class="$style.detail">
					<i class="ti ti-wind"></i>
					風速: {{ weatherData.current.wind_kph }}km/h
				</div>
				<div class="$style.detail">
					<i class="ti ti-eye"></i>
					視界: {{ weatherData.current.vis_km }}km
				</div>
			</div>
		</div>
		<div v-else-if="error" class="$style.error">
			<i class="ti ti-alert-circle"></i>
			{{ error }}
		</div>
		<div v-else class="$style.noData">
			天気情報を取得できませんでした
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import { i18n } from '@/i18n.js';

const name = 'weather';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	location: {
		type: 'string' as const,
		default: 'Tokyo',
		description: '都市名（例: Tokyo, Osaka, New York）',
	},
	apiKey: {
		type: 'string' as const,
		default: '',
		description: 'WeatherAPI.com APIキー',
	},
	refreshInterval: {
		type: 'number' as const,
		default: 30,
		description: '更新間隔（分）',
		min: 5,
		max: 120,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

interface WeatherData {
	location: string;
	current: {
		temp_c: number;
		condition: {
			text: string;
			icon: string;
		};
		humidity: number;
		wind_kph: number;
		vis_km: number;
	};
}

const weatherData = ref<WeatherData | null>(null);
const fetching = ref(false);
const error = ref<string | null>(null);
let refreshTimer: number | null = null;

const fetchWeather = async () => {
	if (!widgetProps.apiKey) {
		error.value = 'APIキーが設定されていません';
		return;
	}

	if (!widgetProps.location) {
		error.value = '位置情報が設定されていません';
		return;
	}

	fetching.value = true;
	error.value = null;

	try {
		const response = await window.fetch(
			`https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(widgetProps.apiKey)}&q=${encodeURIComponent(widgetProps.location)}&lang=ja`
		);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();

		weatherData.value = {
			location: data.location.name,
			current: {
				temp_c: data.current.temp_c,
				condition: {
					text: data.current.condition.text,
					icon: data.current.condition.icon,
				},
				humidity: data.current.humidity,
				wind_kph: data.current.wind_kph,
				vis_km: data.current.vis_km,
			},
		};
	} catch (err) {
		console.error('Weather API error:', err);
		error.value = err instanceof Error ? err.message : '天気情報の取得に失敗しました';
		weatherData.value = null;
	} finally {
		fetching.value = false;
	}
};

const refresh = () => {
	fetchWeather();
};

const setupRefreshTimer = () => {
	if (refreshTimer) {
		window.clearInterval(refreshTimer);
	}

	if (widgetProps.refreshInterval > 0) {
		refreshTimer = window.setInterval(() => {
			fetchWeather();
		}, widgetProps.refreshInterval * 60 * 1000);
	}
};

// 設定変更時に再取得
watch(() => [widgetProps.location, widgetProps.apiKey], () => {
	fetchWeather();
});

watch(() => widgetProps.refreshInterval, () => {
	setupRefreshTimer();
});

onMounted(() => {
	fetchWeather();
	setupRefreshTimer();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.location {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	font-weight: 600;
	margin-bottom: 20px;
	color: var(--MI_THEME-accent);
	font-size: 1.1em;

	i {
		font-size: 1.2em;
	}
}

.current {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin-bottom: 24px;
	padding: 24px;
	background: rgba(var(--MI_THEME-accent), 0.1);
	border-radius: 12px;
	min-height: 120px;
	width: 100%;
	max-width: 200px;
}

.temperature {
	font-size: 3.5em;
	font-weight: 700;
	margin-bottom: 8px;
	color: var(--MI_THEME-fg);
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	line-height: 1;
}

.condition {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	font-size: 1.1em;
	color: var(--MI_THEME-fg);
	font-weight: 500;
}

.icon {
	width: 32px;
	height: 32px;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.details {
	display: grid;
	grid-template-columns: 1fr;
	gap: 8px;
	width: 100%;
	max-width: 250px;
}

.detail {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	font-size: 0.9em;
	padding: 8px 12px;
	background: var(--MI_THEME-bg);
	border-radius: 6px;
	color: var(--MI_THEME-fg);

	i {
		color: var(--MI_THEME-accent);
		font-size: 1em;
		width: 16px;
	}
}

.error {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	color: var(--MI_THEME-error);
	text-align: center;
	padding: 24px;
	background: rgba(var(--MI_THEME-error), 0.1);
	border-radius: 8px;
	border: 1px solid var(--MI_THEME-error);

	i {
		font-size: 1.5em;
	}
}

.noData {
	text-align: center;
	color: var(--MI_THEME-fgTransparentWeak);
	padding: 24px;
	font-style: italic;
}

// レスポンシブ対応
@media (max-width: 400px) {
	.temperature {
		font-size: 2.8em;
	}

	.current {
		max-width: 100%;
		padding: 20px;
	}

	.details {
		max-width: 100%;
	}
}
</style>
