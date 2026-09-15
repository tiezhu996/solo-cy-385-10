<template>
  <section class="card growth-panel">
    <div class="growth-panel__header">
      <h2>生长曲线</h2>
      <van-button size="small" type="primary" icon="plus" @click="showRecordPopup = true">
        记录
      </van-button>
    </div>

    <GrowthDateRange v-model="rangeSelection" />

    <div v-if="loading" class="growth-panel__placeholder">
      <van-loading size="24px">加载中…</van-loading>
    </div>

    <div v-else-if="loadError" class="growth-panel__error">
      <van-empty image="error" :description="loadError" />
      <van-button type="primary" size="small" round @click="load">重试</van-button>
    </div>

    <template v-else>
      <van-empty
        v-if="!records.length"
        :description="everRecorded ? '所选时间段内暂无生长记录' : '还没有生长记录，快来记录第一次吧'"
      >
        <van-button type="primary" size="small" round @click="showRecordPopup = true">
          记录身高体重
        </van-button>
      </van-empty>

      <template v-else>
        <GrowthChart :records="records" />
        <GrowthHistory :records="records" />
      </template>
    </template>

    <RecordGrowthPopup
      v-model:show="showRecordPopup"
      :baby-id="babyId"
      @saved="reload"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import GrowthChart from './GrowthChart.vue';
import GrowthDateRange from './GrowthDateRange.vue';
import GrowthHistory from './GrowthHistory.vue';
import RecordGrowthPopup from './RecordGrowthPopup.vue';
import type { GrowthRecord } from '../types';
import { listGrowthRecords } from '../api/growth';
import { DEFAULT_RANGE, resolveRange, type RangeSelection } from '../utils/growthRange';

const props = defineProps<{ babyId: string }>();

const records = ref<GrowthRecord[]>([]);
const loading = ref(false);
const loadError = ref('');
const everRecorded = ref(false);
const rangeSelection = ref<RangeSelection>({ ...DEFAULT_RANGE });
const showRecordPopup = ref(false);

// 每次宝宝切换时由父组件通过 :key 重建组件；序号只用于防止时间段快速切换的响应竞态。
let requestSeq = 0;

async function load() {
  const seq = ++requestSeq;
  loading.value = true;
  loadError.value = '';
  const range = resolveRange(rangeSelection.value);
  try {
    const [data, allData] = await Promise.all([
      listGrowthRecords({ babyId: props.babyId, start: range.start, end: range.end }),
      everRecorded.value
        ? Promise.resolve(null)
        : listGrowthRecords({ babyId: props.babyId }),
    ]);
    if (seq !== requestSeq) return;
    records.value = data;
    if (allData) everRecorded.value = allData.length > 0;
  } catch (error) {
    if (seq === requestSeq) {
      // 查询失败必须明确提示，不能退化成“还没有记录”的空态
      records.value = [];
      loadError.value = error instanceof Error ? error.message : '生长记录加载失败';
    }
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

function reload() {
  everRecorded.value = true;
  load();
}

watch(rangeSelection, load, { deep: true });

load();
</script>

<style scoped>
.growth-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.growth-panel__header h2 {
  margin: 0;
  font-size: 16px;
}
.growth-panel__placeholder {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.growth-panel__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 16px;
}
.growth-panel__error :deep(.van-empty__description) {
  color: #ee0a24;
}
</style>
