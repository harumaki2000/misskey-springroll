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
				<div v-for="day in forecasts" :key="day.date" class="weather-day">
					<div class="weather-date">{{ formatDate(day.date) }}</div>
					<img :src="getWeatherInfo(day.weather_code).iconPath" :alt="getWeatherInfo(day.weather_code).description" class="weather-icon">
					<div class="weather-description">{{ getWeatherInfo(day.weather_code).description }}</div>
					<div class="weather-temp">
						<span class="temp-max">{{ getMaxTemp(day) }}℃</span>
						<span class="temp-separator"> / </span>
						<span class="temp-min">{{ getMinTemp(day) }}℃</span>
					</div>
				</div>
			</div>
			<div class="from">from Open-Meteo</div>
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

const GEO_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/jma';

const name = 'weatherWeek';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	city: {
		type: 'string' as const,
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

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

interface JmaDailyData {
	time: string[];
	weather_code: number[];
	temperature_2m_max: number[];
	temperature_2m_min: number[];
};

interface WeatherResponse {
	daily: JmaDailyData;
};

interface ProcessedForecast {
	date: string;
	weather_code: number;
	temp_max: number;
	temp_min: number;
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
}

const fetching = ref(true);
const weatherData = ref<WeatherResponse | null>(null);
const error = ref<string | null>(null);
const intervalId = ref<number | null>(null);
const foundCityName = ref<string | null>(null);
const cityLabel = computed(() => foundCityName.value ?? widgetProps.city);

const forecasts = computed((): ProcessedForecast[] => {
	const dailyData = weatherData.value?.daily;

	if (!dailyData || !dailyData.time) {
		return [];
	}

	return dailyData.time.map((dateString, index) => {
		return {
			date: dateString,
			weather_code: dailyData.weather_code[index],
			temp_max: dailyData.temperature_2m_max[index],
			temp_min: dailyData.temperature_2m_min[index],
		};
	}).slice(0, 7);
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

async function fetchWeatherByCoords(coords: Coordinates): Promise<WeatherResponse> {
	const url = new URL(WEATHER_ENDPOINT);

	url.searchParams.set('latitude', String(coords.lat));
	url.searchParams.set('longitude', String(coords.lon));

	const dailyParams = [
		'weather_code',
		'temperature_2m_max',
		'temperature_2m_min',
	];
	url.searchParams.set('daily', dailyParams.join(','));
	url.searchParams.set('timezone', 'Asia/Tokyo');
	url.searchParams.set('forecast_days', '7');

	const response = await window.fetch(url.toString());

	if (!response.ok) {
		throw new Error('WEATHER_FETCH_FAILED');
	}

	return response.json();
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

async function refreshWeatherData() {
	fetching.value = true;
	error.value = null;
	foundCityName.value = null;

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

function formatDate(isoString: string) {
	const date = new Date(isoString);
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${month}/${day}`;
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

function getMaxTemp(forecast: ProcessedForecast) {
	return Math.round(forecast.temp_max);
}

function getMinTemp(forecast: ProcessedForecast) {
	return Math.round(forecast.temp_min);
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

watch(() => widgetProps.city,
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
	font-size: 0.9em;
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
