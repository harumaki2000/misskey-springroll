<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-cy-mkw-counter class="mkw-counter">
	<template #icon><i class="ti ti-numbers"></i></template>
	<template #header>{{ i18n.ts._widgets.counter }}</template>
	<div :class="$style.root">
		<div>
			<h2>{{ clickCount }}</h2>
			<div :class="$style.buttonGroup">
				<MkButton primary @click="counterPlus">+1</MkButton>
				<MkButton primary @click="counterMinus">-1</MkButton>
				<MkButton primary @click="reset">リセット</MkButton>
				<MkButton primary @click="saveCounter">{{ i18n.ts.save }}</MkButton>
			</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import { i18n } from '@/i18n.js';
import { defaultStore } from '@/store.js';
import MkButton from '@/components/MkButton.vue';

const name = 'counter';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	height: {
		type: 'number' as const,
		default: 100,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

const clickCount = ref(0);
const changed = ref(false);
let timeoutId;

const counterPlus = () => {
	clickCount.value++;
	onChange();
};

const counterMinus = () => {
	clickCount.value--;
	onChange();
};

const reset = () => {
	clickCount.value = 0;
	onChange();
};

const saveCounter = () => {
	defaultStore.set('counter', String(clickCount.value));
	changed.value = false;
};

const onChange = () => {
	changed.value = true;
	window.clearTimeout(timeoutId);
	timeoutId = window.setTimeout(saveCounter, 1000);
};

onMounted(() => {
	if (defaultStore.state.counter) {
		clickCount.value = Number(defaultStore.state.counter);
	}
});

watch(() => defaultStore.reactiveState.counter, newText => {
	if (newText.value !== String(clickCount.value)) {
		clickCount.value = Number(newText.value);
	}
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
	text-align: center;
}

.buttonGroup {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.buttonGroup button {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 12px;
  font-size: 0.9em;
  min-width: 50px;
  height: 28px;
  white-space: nowrap;
}
</style>

