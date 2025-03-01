<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-cy-mkw-todoList class="mkw-todoList">
	<template #icon><i class="ti ti-list-check"></i></template>
	<template #header>{{ i18n.ts._widgets.todoList }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="saveList"><i class="ti ti-check"></i></button>
	</template>
	<div :class="$style.root">
		<div :class="$style.inputWrapper">
			<input v-model="newTask" :placeholder="i18n.ts.placeholder" @keyup.enter="addTask" @input="onChange"/>
			<MkButton primary @click="addTask">追加</MkButton>
		</div>

		<ul>
			<li v-for="(task, index) in tasks" :key="index">
				<span :class="{ completed: task.completed }">{{ task.text }}</span>
				<MkButton primary @click="removeTask(index)">完了</MkButton>
			</li>
		</ul>
	</div>
</MkContainer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import { i18n } from '@/i18n.js';
import { defaultStore } from '@/store.js';
import MkButton from '@/components/MkButton.vue';

const name = 'todoList';

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

interface Task {
	text: string;
	completed: boolean;
}

const tasks = ref<Task[]>(defaultStore.state.todoList || []);
const newTask = ref('');
let timeoutId: number | null = null;

const addTask = (): void => {
	const taskText = newTask.value.trim();
	if (!taskText) return;

	tasks.value.push({ text: taskText, completed: false });
	newTask.value = '';
};

const saveList = () => {
	defaultStore.set('todoList', tasks.value);
};

const onChange = () => {
	if (timeoutId !== null) window.clearTimeout(timeoutId);
	timeoutId = window.setTimeout(saveList, 1000);
};

watch(() => defaultStore.reactiveState.todoList, (newTasks) => {
	tasks.value = newTasks;
});

const removeTask = (index: number): void => {
	tasks.value.splice(index, 1);
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget?.id ?? null,
});
</script>

<style lang="scss" module>
.root {
  padding: 16px;

	.inputWrapper {
	display: flex;
	margin-bottom: 16px;
}

  .input-container {
    display: flex;
    margin-bottom: 10px;
  }

  ul {
    list-style: none;
    padding: 0;

    li {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      span {
        margin-left: 8px;
        flex-grow: 1;

        &.completed {
          text-decoration: line-through;
        }
      }
    }
  }
}
</style>
