<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    :style="{ maxHeight: '80%' }"
    @update:show="(value: boolean) => $emit('update:show', value)"
    @closed="resetForm"
  >
    <div class="record-popup">
      <h3>记录生长数据</h3>
      <van-field
        v-model="recordedAt"
        is-link
        readonly
        label="日期"
        placeholder="选择日期"
        @click="showDatePicker = true"
      />
      <van-field v-model="heightCm" type="number" label="身高 (cm)" placeholder="仅记体重可留空" input-align="right" />
      <van-field v-model="weightKg" type="number" label="体重 (kg)" placeholder="仅记身高可留空" input-align="right" />
      <div class="record-popup__actions">
        <van-button block plain type="default" @click="$emit('update:show', false)">取消</van-button>
        <van-button block type="primary" :loading="saving" @click="onSubmit">保存</van-button>
      </div>
    </div>
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="datePickerValue"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { showToast } from 'vant';
import type { GrowthRecordInput } from '../types';
import { saveGrowthRecord } from '../api/growth';
import { toDateString, todayString } from '../utils/date';

const props = defineProps<{ show: boolean; babyId: number; defaultDate?: string }>();
const emit = defineEmits<{
  'update:show': [value: boolean];
  saved: [record: GrowthRecordInput];
}>();

const recordedAt = ref(todayString());
const heightCm = ref('');
const weightKg = ref('');
const saving = ref(false);
const showDatePicker = ref(false);
const minDate = new Date(2020, 0, 1);
const maxDate = new Date();
const datePickerValue = ref<string[]>([]);

watch(
  () => props.show,
  (visible) => {
    if (visible) resetForm();
  },
);

function resetForm() {
  recordedAt.value = props.defaultDate ?? todayString();
  heightCm.value = '';
  weightKg.value = '';
  syncPicker();
}

function syncPicker() {
  datePickerValue.value = recordedAt.value.split('-');
}

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  recordedAt.value = selectedValues.join('-');
  showDatePicker.value = false;
}

function toFiniteNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function onSubmit() {
  const height = toFiniteNumber(heightCm.value);
  const weight = toFiniteNumber(weightKg.value);
  if (height == null && weight == null) {
    showToast('身高和体重至少填写一项');
    return;
  }
  if (!recordedAt.value) {
    showToast('请选择日期');
    return;
  }
  const input: GrowthRecordInput = {
    babyId: props.babyId,
    recordedAt: recordedAt.value,
    heightCm: height,
    weightKg: weight,
  };
  saving.value = true;
  try {
    await saveGrowthRecord(input);
    showToast('已保存');
    emit('saved', input);
    emit('update:show', false);
  } catch (error) {
    showToast(error instanceof Error ? error.message : '保存失败');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.record-popup {
  padding: 18px 16px calc(16px + env(safe-area-inset-bottom));
}
.record-popup h3 {
  margin: 0 0 12px;
  font-size: 16px;
  text-align: center;
}
.record-popup__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
</style>
