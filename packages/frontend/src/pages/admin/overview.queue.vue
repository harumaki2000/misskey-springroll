<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_table status">
		<div class="_row">
			<div class="_cell" style="text-align: center;"><div class="_label">Process</div>{{ number(activeSincePrevTick) }}</div>
			<div class="_cell" style="text-align: center;"><div class="_label">Active</div>{{ number(active) }}</div>
			<div class="_cell" style="text-align: center;"><div class="_label">Waiting</div>{{ number(waiting) }}</div>
			<div class="_cell" style="text-align: center;"><div class="_label">Delayed</div>{{ number(delayed) }}</div>
		</div>
	</div>
	<div class="charts">
		<div class="chart">
			<div class="title">Process</div>
			<XChart ref="chartProcess" type="process"/>
		</div>
		<div class="chart">
			<div class="title">Active</div>
			<XChart ref="chartActive" type="active"/>
		</div>
		<div class="chart">
			<div class="title">Delayed</div>
			<XChart ref="chartDelayed" type="delayed"/>
		</div>
		<div class="chart">
			<div class="title">Waiting</div>
			<XChart ref="chartWaiting" type="waiting"/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { markRaw, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import XChart from './overview.queue.chart.vue';
import type { ApQueueDomain } from '@/pages/admin/queue.vue';
import number from '@/filters/number.js';
import { useStream } from '@/stream.js';
import { genId } from '@/utility/id.js';

const connection = markRaw(useStream().useChannel('queueStats'));

const activeSincePrevTick = ref(0);
const active = ref(0);
const delayed = ref(0);
const waiting = ref(0);
const chartProcess = useTemplateRef('chartProcess');
const chartActive = useTemplateRef('chartActive');
const chartDelayed = useTemplateRef('chartDelayed');
const chartWaiting = useTemplateRef('chartWaiting');

const props = defineProps<{
	domain: ApQueueDomain;
}>();

function onStats(stats: Misskey.entities.QueueStats) {
	activeSincePrevTick.value = stats[props.domain].activeSincePrevTick;
	active.value = stats[props.domain].active;
	delayed.value = stats[props.domain].delayed;
	waiting.value = stats[props.domain].waiting;

	chartProcess.value.pushData(stats[props.domain].activeSincePrevTick);
	chartActive.value.pushData(stats[props.domain].active);
	chartDelayed.value.pushData(stats[props.domain].delayed);
	chartWaiting.value.pushData(stats[props.domain].waiting);
}

function onStatsLog(statsLog: Misskey.entities.QueueStatsLog) {
	const dataProcess: Misskey.entities.QueueStats[ApQueueDomain]['activeSincePrevTick'][] = [];
	const dataActive: Misskey.entities.QueueStats[ApQueueDomain]['active'][] = [];
	const dataDelayed: Misskey.entities.QueueStats[ApQueueDomain]['delayed'][] = [];
	const dataWaiting: Misskey.entities.QueueStats[ApQueueDomain]['waiting'][] = [];

	for (const stats of [...statsLog].reverse()) {
		dataProcess.push(stats[props.domain].activeSincePrevTick);
		dataActive.push(stats[props.domain].active);
		dataDelayed.push(stats[props.domain].delayed);
		dataWaiting.push(stats[props.domain].waiting);
	}

	chartProcess.value.setData(dataProcess);
	chartActive.value.setData(dataActive);
	chartDelayed.value.setData(dataDelayed);
	chartWaiting.value.setData(dataWaiting);
}

onMounted(() => {
	connection.on('stats', onStats);
	connection.on('statsLog', onStatsLog);
	connection.send('requestLog', {
		id: genId(),
		length: 100,
	});
});

onUnmounted(() => {
	connection.off('stats', onStats);
	connection.off('statsLog', onStatsLog);
	connection.dispose();
});
</script>

<style lang="scss" module>
.root {
	&:global {
		> .status {
			padding: 0 0 16px 0;
		}

		> .charts {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 12px;

			> .chart {
				min-width: 0;
				padding: 16px;
				background: var(--MI_THEME-panel);
				border-radius: var(--MI-radius);

				> .title {
					font-size: 0.85em;
				}
			}
		}
	}
}
</style>
