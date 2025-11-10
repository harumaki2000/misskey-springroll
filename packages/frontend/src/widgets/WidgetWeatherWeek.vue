<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader">
	<template #icon><i class="ti ti-cloud"></i></template>
	<template #header>{{ i18n.ts._widgets.weatherWeek }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="refreshWeatherData"><i class="ti ti-refresh"></i></button>
		<button class="_button" :class="buttonStyleClass" @click="configure"><i class="ti ti-settings"></i></button>
	</template>
	<div>
		<MkLoading v-if="fetching"/>
		<div v-else-if="error" class="error-message">{{ error }}</div>
		<div v-else class="weather-container">
			<div class="city-name">{{ cityLabel }}</div>
			<div class="weather-days">
				<div v-for="day in forecasts" :key="day.dt" class="weather-day">
					<div class="weather-date">{{ formatDate(day.dt) }}</div>
					<img :src="getIconUrl(day.weather[0].icon)" :alt="day.weather[0].description" class="weather-icon">
					<div class="weather-temp">
						<span class="temp-max">{{ getMaxTemp(day) }}℃</span>
						<span class="temp-separator"> / </span>
						<span class="temp-min">{{ getMinTemp(day) }}℃</span>
					</div>
				</div>
			</div>
			<div class="from">from OpenWeatherMap</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import { i18n } from '@/i18n.js';

const GEO_ENDPOINT = 'https://api.openweathermap.org/geo/1.0/direct';
const WEATHER_ENDPOINT = 'https://api.openweathermap.org/data/3.0/onecall';
const EXCLUDED_PARTS = 'current,minutely,hourly,alerts';

const name = 'weatherWeek';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	appid: {
		type: 'string' as const,
		default: '',
		description: 'OpenWeatherMap One Call API 3.0(https://openweathermap.org/api)APIキーを入力してください。',
	},
	city: {
		type: 'string' as const,
		default: 'Tokyo',
	},
	units: {
		type: 'string' as const,
		default: 'metric',
	},
	lang: {
		type: 'string' as const,
		default: 'ja',
	},
	refreshIntervalSec: {
		type: 'number' as const,
		default: 3600,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

interface DailyTemp {
	min: number;
	max: number;
}

interface DailyWeather {
	description: string;
	icon: string;
}

interface DailyForecast {
	dt: number;
	temp: DailyTemp;
	weather: DailyWeather[];
}

interface WeatherResponse {
	daily: DailyForecast[];
}

type Coordinates = {
	lat: number;
	lon: number;
	cityName: string;
};

interface GeocodeResult {
	lat: number;
	lon: number;
	name?: string;
	local_names?: Record<string, string>;
}

const fetching = ref(true);
const weatherData = ref<WeatherResponse | null>(null);
const error = ref<string | null>(null);
const intervalId = ref<number | null>(null);
const foundCityName = ref<string | null>(null);
const cityLabel = computed(() => foundCityName.value ?? widgetProps.city);

const forecasts = computed(() => {
	return weatherData.value?.daily?.slice(0, 7) ?? [];
});

async function resolveCityCoordinates(city: string): Promise<Coordinates> {
	const url = new URL(GEO_ENDPOINT);

	url.searchParams.set('q', city);
	url.searchParams.set('limit', '1');
	url.searchParams.set('appid', widgetProps.appid);

	const response = await window.fetch(url.toString());

	if (!response.ok) {
		throw new Error('GEOCODING_FAILED');
	}

	const data: GeocodeResult[] = await response.json();

	if (!data || data.length === 0) {
		throw new Error('CITY_NOT_FOUND');
	}

	const location = data[0];

	return {
		lat: location.lat,
		lon: location.lon,
		cityName: location.local_names?.ja ?? location.name ?? city,
	};
}

async function fetchWeatherByCoords(coords: Coordinates): Promise<WeatherResponse> {
	const url = new URL(WEATHER_ENDPOINT);

	url.searchParams.set('lat', String(coords.lat));
	url.searchParams.set('lon', String(coords.lon));
	url.searchParams.set('appid', widgetProps.appid);
	url.searchParams.set('units', widgetProps.units);
	url.searchParams.set('lang', widgetProps.lang);
	url.searchParams.set('exclude', EXCLUDED_PARTS);

	const response = await window.fetch(url.toString());

	if (!response.ok) {
		if (response.status === 401) {
			throw new Error('INVALID_API_KEY');
		}
		throw new Error('WEATHER_FETCH_FAILED');
	}

	return response.json();
}

function resolveErrorMessage(err: unknown) {
	if (err instanceof Error) {
		switch (err.message) {
			case 'NO_API_KEY':
				return 'APIキーが設定されていません';
			case 'NO_CITY_NAME':
				return '都市名を入力してください';
			case 'CITY_NOT_FOUND':
				return '都市が見つかりません';
			case 'INVALID_API_KEY':
				return 'APIキーが無効です';
			case 'GEOCODING_FAILED':
				return '都市情報の取得に失敗しました';
			case 'WEATHER_FETCH_FAILED':
				return '天気予報の取得に失敗しました';
			default:
				break;
		}
	}
	return '通信エラーが発生しました';
}

async function refreshWeatherData() {
	fetching.value = true;
	error.value = null;
	foundCityName.value = null;

	if (!widgetProps.appid) {
		error.value = resolveErrorMessage(new Error('NO_API_KEY'));
		fetching.value = false;
		return;
	}

	const cityQuery = widgetProps.city?.trim();
	if (!cityQuery) {
		error.value = resolveErrorMessage(new Error('NO_CITY_NAME'));
		fetching.value = false;
		return;
	}

	try {
		const coords = await resolveCityCoordinates(cityQuery);
		foundCityName.value = coords.cityName;
		weatherData.value = await fetchWeatherByCoords(coords);
	} catch (err) {
		error.value = resolveErrorMessage(err);
	} finally {
		fetching.value = false;
	}
}

function formatDate(dt: number) {
	const date = new Date(dt * 1000);
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${month}/${day}`;
}

function getIconUrl(iconCode: string) {
	return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function getMaxTemp(forecast: DailyForecast) {
	return Math.round(forecast.temp.max);
}

function getMinTemp(forecast: DailyForecast) {
	return Math.round(forecast.temp.min);
}

function setupAutoRefresh () {
	if (intervalId.value) {
		window.clearInterval(intervalId.value);
		intervalId.value = null;
	}
	if (widgetProps.refreshIntervalSec > 0) {
		intervalId.value = window.setInterval(() => {
			refreshWeatherData();
		}, widgetProps.refreshIntervalSec * 1000);
	}
}

watch(() => widgetProps.refreshIntervalSec, setupAutoRefresh, { immediate: true });

watch(
	[
		() => widgetProps.appid,
		() => widgetProps.city,
		() => widgetProps.units,
		() => widgetProps.lang,
	],
	refreshWeatherData,
);

onMounted(() => {
	refreshWeatherData();
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
  padding: 8px;
}

.city-name {
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
}

.from {
	text-align: center;
	opacity: 0.7;
}

.weather-days {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
}

.weather-day {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 1px solid var(--MI_THEME-divider);
}

.weather-day:last-child {
  border-bottom: none;
}

.weather-date {
  font-size: 14px;
  font-weight: bold;
  flex-basis: 60px;
  text-align: center;
}

.weather-icon {
  width: 40px;
  height: 40px;
  margin: 0 8px;
}

.weather-temp {
  display: flex;
  gap: 2px;
  font-size: 14px;
  margin-left: auto;
  white-space: nowrap;
}

.temp-max {
  font-weight: bold;
  color: #f04715;
}

.temp-separator {
  opacity: 0.7;
}

.temp-min {
  color: #0988e6;
  opacity: 0.9;
}
</style>
