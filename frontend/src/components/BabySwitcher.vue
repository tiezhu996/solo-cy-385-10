<template>
  <div class="baby-switcher">
    <van-button size="small" plain type="primary" @click="showActions = true">
      <van-icon name="manager" />
      <span class="baby-switcher__name">{{ currentBaby?.name ?? '请选择宝宝' }}</span>
      <van-icon name="arrow-down" />
    </van-button>
    <van-action-sheet
      v-model:show="showActions"
      :actions="actions"
      cancel-text="取消"
      close-on-click-action
      title="切换宝宝"
      @select="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ActionSheetAction } from 'vant';
import { useBabyStore } from '../stores/baby';

const { babies, currentBaby, selectBaby } = useBabyStore();
const showActions = ref(false);

const actions = computed<ActionSheetAction[]>(() =>
  babies.value.map((baby) => ({
    name: baby.id === currentBaby.value?.id ? `${baby.name}（当前）` : baby.name,
  })),
);

function onSelect(_action: ActionSheetAction, index: number) {
  const baby = babies.value[index];
  if (baby) selectBaby(baby.id);
}
</script>

<style scoped>
.baby-switcher__name {
  margin: 0 4px;
  font-weight: 600;
}
</style>
