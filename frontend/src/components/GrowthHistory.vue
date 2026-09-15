<template>
  <div v-if="records.length" class="growth-history">
    <h3 class="growth-history__title">记录明细<span>同日多次记录均可回看，最新一条已标记</span></h3>
    <div v-for="item in marked" :key="item.record.id" class="growth-history__item">
      <div class="growth-history__date">
        {{ item.record.recordedAt }}
        <van-tag v-if="item.latestOfDay" plain type="primary" size="medium">最新</van-tag>
      </div>
      <div class="growth-history__values">
        <span :class="{ 'growth-history__missing': item.record.heightCm == null }">
          身高 {{ item.record.heightCm != null ? `${item.record.heightCm} cm` : '未记录' }}
        </span>
        <span :class="{ 'growth-history__missing': item.record.weightKg == null }">
          体重 {{ item.record.weightKg != null ? `${item.record.weightKg} kg` : '未记录' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GrowthRecord } from '../types';

const props = defineProps<{ records: GrowthRecord[] }>();

/** 最新录入在前；每个日期的第一条（id 最大）为当日最新值。 */
const marked = computed(() => {
  const desc = [...props.records].sort((a, b) => {
    if (a.recordedAt !== b.recordedAt) return b.recordedAt.localeCompare(a.recordedAt);
    return b.id - a.id;
  });
  const seenDates = new Set<string>();
  return desc.map((record) => {
    const latestOfDay = !seenDates.has(record.recordedAt);
    seenDates.add(record.recordedAt);
    return { record, latestOfDay };
  });
});
</script>

<style scoped>
.growth-history {
  margin-top: 14px;
  border-top: 1px solid #f4ece7;
  padding-top: 10px;
}
.growth-history__title {
  margin: 0 0 8px;
  font-size: 14px;
  color: #7a5a4c;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.growth-history__title span {
  font-size: 11px;
  font-weight: 400;
  color: #b39b8f;
}
.growth-history__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #f1e3db;
  font-size: 13px;
}
.growth-history__date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #3b2b24;
}
.growth-history__values {
  display: flex;
  gap: 10px;
  color: #5d4438;
}
.growth-history__missing {
  color: #b9a69c;
}
</style>
