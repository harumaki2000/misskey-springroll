<!--
SPDX-FileCopyrightText: lqvp and harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-weather">
	<template #icon><i class="ti ti-cloud"></i></template>
	<template #header>{{ i18n.ts._widgets.weather }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="refreshWeatherData"><i class="ti ti-refresh"></i></button>
		<button class="_button" :class="buttonStyleClass" @click="configure"><i class="ti ti-settings"></i></button>
	</template>

	<div>
		<MkLoading v-if="fetching"/>
		<div v-else-if="error" class="error-message">{{ error }}</div>
		<div v-else class="weather-container">
			<div class="weather-days">
				<div v-for="day in forecasts" :key="day.time" class="weather-day">
					<div class="weather-date">{{ formatTime(day.time) }}</div>
					<img :src="getWeatherInfo(day.weather_code).iconPath" :alt="getWeatherInfo(day.weather_code).description" class="weather-icon"/>
					<div class="weather-description">{{ getWeatherInfo(day.weather_code).description }}</div>
					<div class="weather-temp">
						<span class="temp-max">{{ getHourlyTemp(day) }}℃</span>
					</div>
				</div>
			</div>
			<div class="footer-info">
				<div class="city-name">{{ cityLabel }}</div>
				<div class="from">from Open-Meteo (Updated: {{ updateTime }})</div>
			</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import { i18n } from '@/i18n.js';

const GEO_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/jma';
const ICON_BASE_PATH = '/vite/widgets/';

const name = i18n.ts._widgets.weather;

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	city: {
		type: 'string',
		default: 'Tokyo',
	},
	refreshIntervalSec: {
		type: 'number' as const,
		default: 3600,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

interface JmaCurrentData {
	time: string;
	weather_code: number;
}

interface JmaHourlyData {
	time: string[];
	weather_code: number[];
	temperature_2m: number[];
}

interface WeatherResponse {
	current: JmaCurrentData;
	hourly: JmaHourlyData;
}

interface ProcessedHourlyForecast {
	time: string;
	weather_code: number;
	temperature: number;
}

type Coordinates = {
	lat: number;
	lon: number;
	cityName: string;
};

interface GeocodeResponse {
	results: {
		latitude: number;
		longitude: number;
		name?: string;
	}[];
}

const fetching = ref(true);
const weatherData = ref<WeatherResponse | null>(null);
const error = ref<string | null>(null);
const foundCityName = ref<string | null>(null);
const cityLabel = computed(() => foundCityName.value ?? widgetProps.city);
const updateTime = ref('');
const intervalId = ref<number | null>(null);

const forecasts = computed((): ProcessedHourlyForecast[] => {
	const currentData = weatherData.value?.current;
	const hourlyData = weatherData.value?.hourly;

	if (!currentData || !hourlyData?.time?.length) {
		return [];
	}

	const startIndex = hourlyData.time.findIndex(time => time >= currentData.time);
	if (startIndex === -1) {
		return [];
	}

	const sliceStart = Math.max(0, startIndex - 1);
	const sliceEnd = Math.min(hourlyData.time.length, startIndex + 3);

	return hourlyData.time.slice(sliceStart, sliceEnd).map((time, index) => ({
		time,
		weather_code: hourlyData.weather_code[sliceStart + index],
		temperature: hourlyData.temperature_2m[sliceStart + index],
	}));
});

const errorMessages: Record<string, string> = {
	NO_CITY_NAME: '都市名を入力してください',
	CITY_NOT_FOUND: '都市が見つかりません',
	GEOCODING_FAILED: '都市情報の取得に失敗しました',
	WEATHER_FETCH_FAILED: '天気予報の取得に失敗しました',
};

interface WeatherIconDefinition {
	predicate: (code: number) => boolean;
	icon: string;
	description: string;
}

const weatherIconDefinitions: WeatherIconDefinition[] = [
	{ predicate: code => code === 0, icon: 'clear-day.svg', description: '晴れ' },
	{ predicate: code => code >= 1 && code <= 3, icon: 'partly-cloudy-day.svg', description: 'ほぼ晴れ' },
	{ predicate: code => code === 45 || code === 48, icon: 'fog-day.svg', description: '霧' },
	{ predicate: code => (code >= 51 && code <= 67) || (code >= 80 && code <= 82), icon: 'rain.svg', description: '雨' },
	{ predicate: code => (code >= 71 && code <= 77) || (code >= 85 && code <= 86), icon: 'snow.svg', description: '雪' },
	{ predicate: code => code >= 95 && code <= 99, icon: 'thunderstorms-rain.svg', description: '雷雨' },
];

async function resolveCityCoordinates(city: string): Promise<Coordinates> {
	const url = new URL(GEO_ENDPOINT);

	url.searchParams.set('name', city);
	url.searchParams.set('count', '1');

	const response = await window.fetch(url.toString());

	if (!response.ok) {
		throw new Error('GEOCODING_FAILED');
	}

	const data: GeocodeResponse = await response.json();

	if (!data.results?.length) {
		throw new Error('CITY_NOT_FOUND');
	}

	const location = data.results[0];

	return {
		lat: location.latitude,
		lon: location.longitude,
		cityName: location.name ?? city,
	};
}

async function fetchWeatherByCoords(coords: Coordinates): Promise<WeatherResponse> {
	const url = new URL(WEATHER_ENDPOINT);

	url.searchParams.set('latitude', String(coords.lat));
	url.searchParams.set('longitude', String(coords.lon));

	const hourlyParams = ['temperature_2m', 'weather_code'];
	url.searchParams.set('hourly', hourlyParams.join(','));
	url.searchParams.set('current', 'weather_code');
	url.searchParams.set('forecast_days', '2');
	url.searchParams.set('timezone', 'Asia/Tokyo');

	const response = await window.fetch(url.toString());

	if (!response.ok) {
		throw new Error('WEATHER_FETCH_FAILED');
	}

	return response.json();
}

const fetchWeatherData = async () => {
	fetching.value = true;
	error.value = null;
	weatherData.value = null;
	foundCityName.value = null;
	updateTime.value = '';

	const cityQuery = widgetProps.city?.trim();
	if (!cityQuery) {
		error.value = '都市名が設定されていません';
		fetching.value = false;
		return;
	}

	try {
		const coords = await resolveCityCoordinates(cityQuery);
		foundCityName.value = coords.cityName;
		weatherData.value = await fetchWeatherByCoords(coords);
		updateTime.value = new Date().toLocaleTimeString();
	} catch (err: unknown) {
		error.value = resolveErrorMessage(err);
	} finally {
		fetching.value = false;
	}
};

const refreshWeatherData = () => {
	fetchWeatherData();
};

function formatTime(isoString: string) {
	const date = new Date(isoString);
	return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function getHourlyTemp(forecast: ProcessedHourlyForecast) {
	return forecast.temperature?.toFixed(1) ?? '--';
}

function resolveErrorMessage(err: unknown) {
	if (err instanceof Error && err.message in errorMessages) {
		return errorMessages[err.message];
	}
	return '通信エラーが発生しました';
}

function getWeatherInfo(code: number) {
	const matched = weatherIconDefinitions.find(def => def.predicate(code));

	return {
		iconPath: ICON_BASE_PATH + (matched?.icon ?? 'cloudy.svg'),
		description: matched?.description ?? '曇り',
	};
}

const setupAutoRefresh = () => {
	if (intervalId.value) {
		window.clearInterval(intervalId.value);
		intervalId.value = null;
	}

	if (widgetProps.refreshIntervalSec > 0) {
		intervalId.value = window.setInterval(() => {
			fetchWeatherData();
		}, widgetProps.refreshIntervalSec * 1000);
	}
};

watch(() => widgetProps.city, fetchWeatherData, { immediate: true });
watch(() => widgetProps.refreshIntervalSec, setupAutoRefresh, { immediate: true });

onMounted(() => {
	fetchWeatherData();
});

onBeforeUnmount(() => {
	if (intervalId.value) {
		window.clearInterval(intervalId.value);
	}
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.error-message {
	color: var(--MI_THEME-accent);
	padding: 16px;
	text-align: center;
}
.weather-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 8px;
	color: var(--MI_THEME-fg);
}

.weather-days {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	width: 100%;
	gap: 8px;
}

.weather-day {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	flex: 1;
	padding: 8px;
	border-right: 1px solid var(--MI_THEME-divider);
}

.weather-day:last-child {
	border-right: none;
}

.weather-date {
	font-size: 12px;
	text-align: center;
}

.weather-icon {
	width: 40px;
	height: 40px;
}

.weather-description {
	font-size: 12px;
	text-align: center;
}

.weather-temp {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 4px;
}

.temp-max {
	font-size: 14px;
	font-weight: bold;
}

.footer-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 4px;
}

.city-name {
	font-size: 0.8em;
	opacity: 0.9;
	text-align: center;
	margin-top: 4px;
}

.from {
	font-size: 0.8em;
	opacity: 0.9;
	text-align: center;
	margin-top: 4px;
}
</style>
