<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root]">
	<div :class="$style.items">
		<button class="_button" :class="[$style.item, x === 'left' && y === 'top' ? $style.active : null]" @click="() => { x = 'left'; y = 'top'; }"><i class="ti ti-align-box-left-top"></i></button>
		<button class="_button" :class="[$style.item, x === 'center' && y === 'top' ? $style.active : null]" @click="() => { x = 'center'; y = 'top'; }"><i class="ti ti-align-box-center-top"></i></button>
		<button class="_button" :class="[$style.item, x === 'right' && y === 'top' ? $style.active : null]" @click="() => { x = 'right'; y = 'top'; }"><i class="ti ti-align-box-right-top"></i></button>
		<button class="_button" :class="[$style.item, x === 'left' && y === 'center' ? $style.active : null]" @click="() => { x = 'left'; y = 'center'; }"><i class="ti ti-align-box-left-middle"></i></button>
		<button class="_button" :class="[$style.item, x === 'center' && y === 'center' ? $style.active : null]" @click="() => { x = 'center'; y = 'center'; }"><i class="ti ti-align-box-center-middle"></i></button>
		<button class="_button" :class="[$style.item, x === 'right' && y === 'center' ? $style.active : null]" @click="() => { x = 'right'; y = 'center'; }"><i class="ti ti-align-box-right-middle"></i></button>
		<button class="_button" :class="[$style.item, x === 'left' && y === 'bottom' ? $style.active : null]" @click="() => { x = 'left'; y = 'bottom'; }"><i class="ti ti-align-box-left-bottom"></i></button>
		<button class="_button" :class="[$style.item, x === 'center' && y === 'bottom' ? $style.active : null]" @click="() => { x = 'center'; y = 'bottom'; }"><i class="ti ti-align-box-center-bottom"></i></button>
		<button class="_button" :class="[$style.item, x === 'right' && y === 'bottom' ? $style.active : null]" @click="() => { x = 'right'; y = 'bottom'; }"><i class="ti ti-align-box-right-bottom"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';

const x = defineModel<string>('x', { default: 'center' });
const y = defineModel<string>('y', { default: 'center' });
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.items {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: repeat(3, 1fr);
	gap: 4px;
	border-radius: 8px;
	overflow: clip;
}

.item {
	height: 32px;
	background: var(--MI_THEME-panel);
	border-radius: 4px;

	&.active {
		background: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
	}
}
</style>
