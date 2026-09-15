<template>
  <div class="growth-range">
    <div class="growth-range__pills">
      <button
        v-for="preset in RANGE_PRESETS"
        :key="preset.key"
        type="button"
        class="growth-range__pill"
        :class="{ 'growth-range__pill--active': modelValue.key === preset.key }"
        @click="$emit('update:modelValue', { key: preset.key })"
      >
        {{ preset.label }}
      </button>
    </div>
    <van-button size="small" plain type="primary" @click="showCalendar = true">
      <van-icon name="calendar-o" />
      <span>{{ customLabel }}</span>
    </van-button>
    <van-calendar
      v-model:show="showCalendar"
      type="range"
      title="选择日期范围"
      :min-date="minDate"
      :max-date="maxDate"
      :allow-same-day="true"
      @confirm="onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { toDateString } from '../utils/date';
import { RANGE_PRESETS, type RangeSelection } from '../utils/growthRange';

const props = defineProps<{ modelValue: RangeSelection }>();
const emit = defineEmits<{ 'update:modelValue': [value: RangeSelection] }>();

const showCalendar = ref(false);
const minDate = new Date(2020, 0, 1);
const maxDate = new Date();

const customLabel = computed(() => {
  const { start, end } = props.modelValue;
  return start && end ? `${start} 至 ${end}` : '自定义范围';
});

function onConfirm(dates: Date | Date[]) {
  const [startDate, endDate] = Array.isArray(dates) ? dates : [dates, dates];
  if (!startDate || !endDate) return;
  emit('update:modelValue', {
    key: 'custom',
    start: toDateString(startDate),
    end: toDateString(endDate),
  });
}
</script>

<style scoped>
.growth-range {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.growth-range__pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.growth-range__pill {
  border: 1px solid #f3b8a3;
  background: #fff;
  color: #b05c3f;
  border-radius: 999px;
  padding: 3px 12px;
  font-size: 12px;
  cursor: pointer;
}
.growth-range__pill--active {
  background: #ff8a65;
  border-color: #ff8a65;
  color: #fff;
}
</style>
