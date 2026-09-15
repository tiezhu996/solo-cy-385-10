import { computed, ref } from 'vue';
import type { Baby } from '../types';
import { listBabies } from '../api/baby';

const STORAGE_KEY = 'babytracker.currentBabyId';

const babies = ref<Baby[]>([]);
const currentBabyId = ref<number | null>(null);
let loaded = false;

function persist() {
  if (currentBabyId.value == null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, String(currentBabyId.value));
  }
}

/** 宝宝档案列表与当前选中宝宝的全局状态，选择结果记忆在 localStorage。 */
export function useBabyStore() {
  async function loadBabies(force = false): Promise<void> {
    if (loaded && !force) return;
    const data = await listBabies();
    babies.value = data;
    const savedId = Number(localStorage.getItem(STORAGE_KEY));
    const saved = data.find((baby) => baby.id === savedId);
    currentBabyId.value = saved ? saved.id : data[0]?.id ?? null;
    persist();
    loaded = true;
  }

  function selectBaby(id: number) {
    currentBabyId.value = id;
    persist();
  }

  const currentBaby = computed<Baby | null>(
    () => babies.value.find((baby) => baby.id === currentBabyId.value) ?? null,
  );

  return { babies, currentBabyId, currentBaby, loadBabies, selectBaby };
}
