<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader">
	<template #icon><i class="ti ti-building-lighthouse"></i></template>
	<template #header>{{ i18n.ts._widgets.earthquake }}</template>
	<div :class="$style.content" :style="{ height: widgetProps.height + 'px'}">
		<MkLoading v-if="fetching"/>
		<div v-else-if="eqData" :class="$style.data">
			<p>{{ eqData.Title }}</p>
			<p>発生時刻: {{ eqData.time }}</p>
			<p>震源地: {{ eqData.location }}</p>
			<p>最大震度: {{ eqData.shindo }}</p>
			<p>マグニチュード: {{ eqData.magnitude }}</p>
			<p>震源の深さ: {{ eqData.depth }}</p>
			<p>{{ eqData.Info }}</p>
		</div>
		<div v-else :class="$style.empty">
			<p>地震情報はありません。</p>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form';
import MkContainer from '@/components/MkContainer.vue';
import { i18n } from '@/i18n.js';

const name = 'earthquake';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		default: true,
	},
	height: {
		type: 'number',
		default: 100,
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

interface EqData {
	Title: string;
	time: string;
	location: string;
	magnitude: string;
	shindo: string;
	depth: string;
	Info: string;
}

const eqData = ref<EqData | null>(null);
const fetching = ref(false);
let ws: WebSocket | null = null;
let clearTimer: number | null = null;

const showLoadingTemporarily = () => {
	fetching.value = true;
	window.setTimeout(() => {
		fetching.value = false;
	}, 1000);
};

const connectWebSocket = () => {
	if (ws) {
		ws.close();
	}

	ws = new WebSocket('wss://ws-api.wolfx.jp/jma_eqlist');

	ws.onopen = () => {
		showLoadingTemporarily();
		ws?.send('query_jmaeqlist');
	};

	ws.onmessage = (event) => {
		const data = JSON.parse(event.data);

		if (data.type === 'heartbeat') {
			return;
		}

		if (data.type === 'jma_eqlist' && data.No1) {
			const latestEq = data.No1;
			const newEqData: EqData = {
				Title: latestEq.Title,
				time: latestEq.time,
				location: latestEq.location,
				magnitude: latestEq.magnitude,
				shindo: latestEq.shindo,
				depth: latestEq.depth,
				Info: latestEq.Info,
			};

			eqData.value = newEqData;

			showLoadingTemporarily();

			if (clearTimer !== null) {
				window.clearTimeout(clearTimer);
			}
			clearTimer = window.setTimeout(() => {
				eqData.value = null;
				clearTimer = null;
			}, 5 * 60 * 1000);
		}
	};
};

onMounted(() => {
	connectWebSocket();
});

onUnmounted(() => {
	if (ws) {
		ws.close();
	}
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.content {
	overflow-y: auto;
	padding: 16px;
	color: var(--MI_THEME-fg);
	font-size: 0.9em;
}

.data {
	> * + * {
		margin-top: 8px;
	}
}

.empty {
	text-align: center;
	opacity: 0.7;
}

.title {
  font-weight: bold;
  font-size: 1.1em;
  margin: 0;
}

.data ul {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  border-top: solid 1px var(--divider);
  border-bottom: solid 1px var(--divider);
}

.data li {
  padding: 2px 0;
  > strong {
    color: var(--accent);
    margin-right: 4px;
  }
}

.info {
  margin: 0;
  font-size: 0.9em;
  opacity: 0.8;
}
</style>
