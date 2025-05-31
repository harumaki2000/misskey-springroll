<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-timer">
	<template #icon><i class="ti ti-hourglass"></i></template>
	<template #header>{{ i18n.ts._widgets.timer }}</template>
	<template #func="{ buttonStyleClass }"><button class="button" :class="buttonStyleClass" @click="configure"><i class="ti ti-settings"></i></button></template>

	<div :class="$style.root">
		<div :class="$style.display">
			<div :class="$style.time">{{ formatTime(remainingTime) }}</div>
			<div :class="$style.controls">
				<button class="_button" :class="$style.button" :disabled="isRunning" @click="startTimer">
					<i class="ti ti-player-play"></i>
				</button>
				<button class="_button" :class="$style.button" :disabled="!isRunning" @click="stopTimer">
					<i class="ti ti-player-pause"></i>
				</button>
				<button class="_button" :class="$style.button" @click="resetTimer">
					<i class="ti ti-refresh"></i>
				</button>
			</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

const name = 'timer';
const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	timerMinutes: {
		type: 'number' as const,
		default: 5,
		min: 1,
		max: 60,
	},
	maxMinutes: {
		type: 'number' as const,
		default: 60,
		min: 1,
		max: 1440,
	},
	message: {
		type: 'string' as const,
		default: 'タイマーが終了しました！',
	},
	isRunning: {
		type: 'boolean' as const,
		default: false,
		hidden: true,
	},
	remainingSeconds: {
		type: 'number' as const,
		default: 0,
		hidden: true,
	},
	startTime: {
		type: 'number' as const,
		deffault: 0,
		hidden: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const remainingTime = ref(0);
const isRunning = ref(false);
let intervalId: number | null = null;

const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const saveState = () => {
	widgetProps.isRunning = isRunning.value;
	widgetProps.remainingSeconds = remainingTime.value;
	widgetProps.startTime = isRunning.value ? Date.now() : 0;
	save();
};

const restoreState = () => {
	if (widgetProps.isRunning && widgetProps.startTime > 0) {
		const elapsed = Math.floor((Date.now() - widgetProps.startTime) / 1000);
		const remaining = Math.max(0, widgetProps.remainingSeconds - elapsed);

		if (remaining > 0) {
			remainingTime.value = remaining;
			isRunning.value = true;
			startInterval();
		} else {
			remainingTime.value = 0;
			isRunning.value = false;
			widgetProps.isRunning = false;
			save();
			showToast();
		}
	} else {
		remainingTime.value = widgetProps.remainingSeconds || Math.min(widgetProps.timerMinutes, widgetProps.maxMinutes) * 60;
		isRunning.value = false;
	}
};

const startInterval = () => {
	if (intervalId) return;

	intervalId = window.setInterval(() => {
		remainingTime.value--;
		saveState();

		if (remainingTime.value <= 0) {
			stopTimer();
			showToast();
		}
	}, 1000);
};

const stopTimer = () => {
	if (intervalId) {
		window.clearInterval(intervalId);
		intervalId = null;
	}
	isRunning.value = false;
};

const startTimer = () => {
	if (isRunning.value) return;

	const minutes = Math.min(widgetProps.timerMinutes, widgetProps.maxMinutes);
	remainingTime.value = minutes * 60;
	isRunning.value = true;

	intervalId = window.setInterval(() => {
		remainingTime.value--;

		if (remainingTime.value <= 0) {
			stopTimer();
			showToast();
		}
	}, 1000);
};

const resetTimer = () => {
	stopTimer();
	remainingTime.value = Math.min(widgetProps.timerMinutes, widgetProps.maxMinutes) * 60;
};

const showToast = () => {
	os.toast(widgetProps.message);
};

watch(() => [widgetProps.timerMinutes, widgetProps.maxMinutes], () => {
	if (!isRunning.value) {
		resetTimer();
	}
});

onMounted(() => {
	restoreState();
});

onUnmounted(() => {
	if (intervalId) {
		window.clearInterval(intervalId);
		intervalId = null;
	}
	saveState();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}

.display {
	text-align: center;
}

.time {
	font-size: 2em;
	font-weight: bold;
	margin-bottom: 16px;
	font-family: monospace;
}

.controls {
	display: flex;
	gap: 8px;
	justify-content: center;
	flex-wrap: wrap;
}

.button {
	padding: 8px 16px;
	border-radius: 6px;
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-buttonFg);
	border: none;
	cursor: pointer;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}
</style>
