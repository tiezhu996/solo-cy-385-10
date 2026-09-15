<template>
  <main>
    <header>
      <div class="header-row">
        <div>
          <h1>宝宝成长记录</h1>
          <p>{{ subtitle }}</p>
        </div>
        <BabySwitcher v-if="babies.length" />
      </div>
    </header>

    <GrowthPanel v-if="currentBabyId != null" :key="currentBabyId" :baby-id="currentBabyId" />

    <section v-else-if="!loading" class="card empty-card">
      <van-empty v-if="!loadFailed" description="暂无宝宝档案，请先在档案管理中创建" />
      <van-empty v-else image="error" description="宝宝档案加载失败">
        <van-button type="primary" size="small" round @click="retry">重新加载</van-button>
      </van-empty>
    </section>

    <section class="card">
      <h2>疫苗提醒</h2>
      <van-cell
        v-for="item in vaccines"
        :key="item.name"
        :title="item.name"
        :value="item.date"
      >
        <template #label>
          <van-tag :type="item.done ? 'success' : 'warning'">
            {{ item.done ? '已接种' : '待接种' }}
          </van-tag>
        </template>
      </van-cell>
    </section>
    <section class="card">
      <h2>辅食推荐</h2>
      <van-cell v-for="food in foods" :key="food" :title="food" value="适合 9-12 个月" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BabySwitcher from './components/BabySwitcher.vue';
import GrowthPanel from './components/GrowthPanel.vue';
import { useBabyStore } from './stores/baby';
import { describeAge } from './utils/date';

const { babies, currentBabyId, currentBaby, loadBabies } = useBabyStore();
const loading = ref(true);
const loadFailed = ref(false);

const vaccines = [
  { name: '麻腮风疫苗', date: '2026-06-18', done: false },
  { name: '乙肝疫苗', date: '2026-04-10', done: true },
];
const foods = ['南瓜米糊', '鳕鱼土豆泥', '苹果燕麦粥'];

const subtitle = computed(() => {
  const baby = currentBaby.value;
  if (!baby) return '今日辅食 3 次';
  return `${baby.name} ${describeAge(baby.birthday)} · 今日辅食 3 次`;
});

onMounted(retry);

async function retry() {
  loading.value = true;
  loadFailed.value = false;
  try {
    await loadBabies(true);
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.header-row h1 {
  margin: 0 0 4px;
}
.header-row p {
  margin: 0;
}
.empty-card {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
