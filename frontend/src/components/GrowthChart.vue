<template>
  <div ref="chartEl" class="growth-chart"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import type { GrowthRecord } from '../types';
import { buildGrowthSeries } from '../utils/growthSeries';

const props = defineProps<{ records: GrowthRecord[] }>();

const chartEl = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;

function render() {
  if (!chart) return;
  const { dates, height, weight } = buildGrowthSeries(props.records);
  const hasHeight = height.some((value) => value != null);
  const hasWeight = weight.some((value) => value != null);

  const option: echarts.EChartsCoreOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: [...(hasWeight ? ['体重 kg'] : []), ...(hasHeight ? ['身高 cm'] : [])],
      top: 0,
    },
    grid: { left: 48, right: hasHeight ? 48 : 16, top: 36, bottom: 40 },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLabel: { formatter: (value: string) => value.slice(5) },
    },
    yAxis: [
      {
        type: 'value',
        name: hasWeight ? 'kg' : '',
        scale: true,
        splitLine: { lineStyle: { color: '#f4ece7' } },
      },
      ...(hasHeight
        ? [{ type: 'value', name: 'cm', scale: true, splitLine: { show: false } }]
        : []),
    ],
    series: [
      ...(hasWeight
        ? [
            {
              name: '体重 kg',
              type: 'line',
              data: weight,
              yAxisIndex: 0,
              connectNulls: false,
              smooth: true,
              itemStyle: { color: '#ff8a65' },
            },
          ]
        : []),
      ...(hasHeight
        ? [
            {
              name: '身高 cm',
              type: 'line',
              data: height,
              yAxisIndex: hasWeight ? 1 : 0,
              connectNulls: false,
              smooth: true,
              itemStyle: { color: '#4db6ac' },
            },
          ]
        : []),
    ],
  };

  chart.setOption(option, true);
}

function resize() {
  chart?.resize();
}

onMounted(() => {
  if (chartEl.value) {
    chart = echarts.init(chartEl.value);
    render();
    window.addEventListener('resize', resize);
  }
});

watch(() => props.records, render, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  chart?.dispose();
  chart = null;
});
</script>

<style scoped>
.growth-chart {
  height: 260px;
}
</style>
