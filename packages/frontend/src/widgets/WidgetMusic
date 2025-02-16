<!--
SPDX-FileCopyrightText: harumaki2000
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
  <MkContainer :showHeader="widgetProps.showHeader" data-cy-mkw-music class="mkw-music">
    <template #icon><i class="ti ti-note"></i></template>
    <template #header>{{ i18n.ts._widgets.music }}</template>
    <div :class="$style.root">
      <MkLoading v-if="isLoading"/>
      <div v-else :style="`height: ${widgetProps.height}px;`" :class="$style.music-widget">
        <p>{{ listenbrainzData }}</p>
        <img :src="infoImageUrl" alt="Info Image"/>
      </div>
      <MkButton :class="$style.refresh" class="_buttonPrimary" @click="refreshData">{{ i18n.ts.refresh }}</MkButton>
    </div>
  </MkContainer>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted, shallowReactive } from 'vue';
  import { useWidgetPropsManager } from './widget.js';
  import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.ts';
  import type { GetFormResultType } from '@/scripts/form.ts';
  import MkContainer from '@/components/MkContainer.vue';
  import MkButton from '@/components/MkButton.vue';
  import { i18n } from '@/i18n.js';
  import { misskeyApi } from '@/scripts/misskey-api.js';
  import MkLoading from '@/components/global/MkLoading.vue';
  import { infoImageUrl } from '@/instance.js';
  
  export default defineComponent({
    name: 'WidgetMusic',
    props: {
      showHeader: Boolean,
      height: Number,
      username: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const name = 'music'; // ウィジェットの名前
      const listenbrainzData = ref<string>('');
      const isLoading = ref<boolean>(false);
  
      const widgetPropsDef = {
        showHeader: {
          type: 'boolean' as const,
          default: true,
        },
        height: {
          type: 'number' as const,
          default: 200,
        },
      };
  
      type WidgetProps = GetFormResultType<typeof widgetPropsDef>;
  
      const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
  
      const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);
  
      const fetchListenbrainzData = async () => {
        isLoading.value = true;
        try {
          const response = await fetch(`https://api.listenbrainz.org/1/user/${props.username}/listening-history`);
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
          }
          const data = await response.json();
          listenbrainzData.value = data;
        } catch (error) {
          console.error('Error fetching Listenbrainz data:', error);
          // 必要に応じてユーザーにエラーメッセージを表示
        } finally {
          isLoading.value = false;
        }
      };
  
      const refreshData = () => {
        fetchListenbrainzData();
      };
  
      onMounted(() => {
        fetchListenbrainzData();
      });
  
      return {
        name,
        listenbrainzData,
        isLoading,
        refreshData,
        widgetProps,
        infoImageUrl,
        configure,
        id: props.widget ? props.widget.id : null
      };
    }
  });
  </script>
  
  <style scoped>
  .mkw-music {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  
  .music-widget {
    width: 100%;
    overflow: hidden;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  p {
    margin: 0;
    padding: 8px;
    font-size: 14px;
    color: #333;
  }
  
  img {
    width: 100%;
    height: auto;
    border-top: 1px solid #ddd;
  }
  
  ._buttonPrimary {
    margin-top: 8px;
  }
  </style>
  
