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
};

interface WeatherResponse {
	current: JmaCurrentData;
	hourly: JmaHourlyData;
};

interface ProcessedHourlyForecast {
	time: string;
	weather_code: number;
	temperature: number;
};

type Coordinates = {
	lat: number;
	lon: number;
	cityName: string;
};

interface GeocodeResponce {
	results: {
		latitude: number;
		longitude: number;
		name: string;
	}[];
};

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

	if (!currentData || !hourlyData || !hourlyData.time) {
		return [];
	}

	const currentTime = currentData.time;
	const startIndex = hourlyData.time.findIndex(t => t >= currentTime);

	if (startIndex === -1) {
		return [];
	}

	const futureHours = hourlyData.time.slice(startIndex - 1, startIndex + 3);
	const futureCodes = hourlyData.weather_code.slice(startIndex - 1, startIndex + 3);
	const futureTemps = hourlyData.temperature_2m.slice(startIndex - 1, startIndex + 3);

	return futureHours.map((time, index) => {
		return {
			time: time,
			weather_code: futureCodes[index],
			temperature: futureTemps[index],
		};
	});
});

async function resolveCityCoordinates(city: string): Promise<Coordinates> {
	const url = new URL(GEO_ENDPOINT);

	url.searchParams.set('name', city);
	url.searchParams.set('count', '1');

	const response = await window.fetch(url.toString());

	if (!response.ok) {
		throw new Error('GEOCODING_FAILED');
	}

	const data: GeocodeResponce = await response.json();

	if (!data.results || data.results.length === 0) {
		throw new Error('CITY_NOT_FOUND');
	};

	// eslint-disable-next-line id-denylist
	const location = data.results[0];

	return {
		// eslint-disable-next-line id-denylist
		lat: location.latitude,
		// eslint-disable-next-line id-denylist
		lon: location.longitude,
		// eslint-disable-next-line id-denylist
		cityName: location.name ?? city,
	};
}

async function fetchWeatherData() {
	fetching.value = true;
	error.value = null;
	weatherData.value = null;

	const cityQuery = widgetProps.city?.trim();
	if (!cityQuery) {
		error.value = '都市名が設定されていません';
		fetching.value = false;
		return;
	}

	try {
		const coords = await resolveCityCoordinates(cityQuery);
		foundCityName.value = coords.cityName;
		const data = await fetchWeatherByCoords(coords);
		weatherData.value = data;
		updateTime.value = new Date().toLocaleTimeString();
	} catch (err: unknown) {
		error.value = resolveErrorMessage(err);
	} finally {
		fetching.value = false;
	}
}

async function fetchWeatherByCoords(coords: Coordinates): Promise<WeatherResponse> {
	const url = new URL(WEATHER_ENDPOINT);

	url.searchParams.set('latitude', String(coords.lat));
	url.searchParams.set('longitude', String(coords.lon));

	const hourlyParams = [
		'temperature_2m',
		'weather_code',
	];
	url.searchParams.set('hourly', hourlyParams.join(','));
	url.searchParams.set('current', 'weather_code');
	url.searchParams.set('forecast_days', '1');
	url.searchParams.set('timezone', 'Asia/Tokyo');

	const response = await window.fetch(url.toString());

	if (!response.ok) {
		throw new Error('WEATHER_FETCH_FAILED');
	}
	return response.json();
}

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
	if (err instanceof Error) {
		switch (err.message) {
			case 'NO_CITY_NAME':
				return '都市名を入力してください';
			case 'CITY_NOT_FOUND':
				return '都市が見つかりません';
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

function getWeatherInfo(code: number): { iconPath: string; description: string } {
	const iconBasePath = '/vite/widgets/';
	let iconName = 'cloudy.svg';
	let description = '曇り';

	if (code === 0) {
		iconName = 'clear-day.svg';
		description = '晴れ';
	} else if (code >= 1 && code <= 3) {
		iconName = 'partly-cloudy-day.svg';
		description = 'ほぼ晴れ';
	} else if (code === 45 || code === 48) {
		iconName = 'fog-day.svg';
		description = '霧';
	} else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
		iconName = 'rain.svg';
		description = '雨';
	} else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
		iconName = 'snow.svg';
		description = '雪';
	} else if (code >= 95 && code <= 99) {
		iconName = 'thunderstorms-rain.svg';
		description = '雷雨';
	}

	return {
		iconPath: iconBasePath + iconName,
		description: description,
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

watch(() => widgetProps.refreshIntervalSec, setupAutoRefresh, { immediate: true });
watch(() => widgetProps.city, fetchWeatherData, { immediate: true });

onBeforeUnmount(() => {
	if (intervalId.value) window.clearInterval(intervalId.value);
});

onMounted(() => {
	fetchWeatherData();
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
