<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.inline]: inline, [$style.colored]: colored, [$style.mini]: mini, [$style.em]: em }]">
	<div :class="$style.container">
		<svg :class="[$style.spinner, $style.bg]" viewBox="0 0 168 168" xmlns="http://www.w3.org/2000/svg">
			<g transform="matrix(1.125,0,0,1.125,12,12)">
				<circle cx="64" cy="64" r="64" :class="[$style.bgcircle]"/>
			</g>
		</svg>
		<svg :class="[$style.spinner, $style.fg, { [$style.static]: static }]" viewBox="0 0 168 168" xmlns="http://www.w3.org/2000/svg">
			<g transform="matrix(1.125,0,0,1.125,12,12)">
				<path d="M128,64C128,28.654 99.346,0 64,0C99.346,0 128,28.654 128,64Z" :class="[$style.fgpath]"/>
			</g>
		</svg>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';

const props = withDefaults(defineProps<{
	static?: boolean;
	inline?: boolean;
	colored?: boolean;
	mini?: boolean;
	em?: boolean;
}>(), {
	static: false,
	inline: false,
	colored: true,
	mini: false,
	em: false,
});
</script>

<style lang="scss" module>
@keyframes spinner {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.root {
	padding: 32px;
	text-align: center;
	cursor: wait;

	--size: 38px;

	&.colored {
		color: var(--MI_THEME-accent);
	}

	&.inline {
		display: inline;
		padding: 0;
		--size: 32px;
	}

	&.mini {
		padding: 16px;
		--size: 32px;
	}

	&.em {
		display: inline-block;
		vertical-align: middle;
		padding: 0;
		--size: 1em;
	}
}

.container {
	position: relative;
	width: var(--size);
	height: var(--size);
	margin: 0 auto;
}

.spinner {
	position: absolute;
	top: 0;
	left: 0;
	width: var(--size);
	height: var(--size);
	fill-rule: evenodd;
	clip-rule: evenodd;
	stroke-linecap: round;
	stroke-linejoin: round;
	stroke-miterlimit: 1.5;
}

.bg {
	opacity: 0.275;
}

.fg {
	animation: spinner 0.5s linear infinite;

	&.static {
		animation-play-state: paused;
	}
}

.bgcircle {
	fill:none;
	stroke:currentColor;
	stroke-width:21.33px;
}

.fgpath {
	fill:none;
	stroke:currentColor;
	stroke-width:21.33px;
}
</style>
