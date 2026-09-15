import { describe, expect, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import type { App } from 'vue';
import { Button, Calendar, Empty, Icon, Loading, Tag } from 'vant';
import GrowthPanel from './GrowthPanel.vue';
import type { GrowthRecord } from '../types';

vi.mock('../api/growth', () => ({
  listGrowthRecords: vi.fn(),
  saveGrowthRecord: vi.fn(),
}));

import { listGrowthRecords } from '../api/growth';

const BABY_ID = '2099799435994071041';

function growthRecord(overrides: Partial<GrowthRecord> = {}): GrowthRecord {
  return {
    id: '2099800771959668738',
    babyId: BABY_ID,
    recordedAt: '2026-08-01',
    heightCm: 68.5,
    weightKg: 8.4,
    ...overrides,
  };
}

const vantPlugin = {
  install(app: App) {
    app.use(Button).use(Calendar).use(Empty).use(Icon).use(Loading).use(Tag);
  },
};

const chartStub = { name: 'GrowthChart', props: ['records'], template: '<div class="chart-stub" />' };
const recordStub = {
  name: 'RecordGrowthPopup',
  props: ['show', 'babyId'],
  template: '<div class="record-stub" />',
};

function mountPanel() {
  return mount(GrowthPanel, {
    props: { babyId: BABY_ID },
    global: { plugins: [vantPlugin], stubs: { GrowthChart: chartStub, RecordGrowthPopup: recordStub } },
  });
}

describe('GrowthPanel 生长面板展示', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('规则：服务异常时必须显示错误提示和重试，而不是伪装成“还没有记录”空态', async () => {
    vi.mocked(listGrowthRecords).mockRejectedValue(new Error('服务器内部错误'));

    const wrapper = mountPanel();
    await flushPromises();

    expect(wrapper.text()).toContain('服务器内部错误');
    expect(wrapper.text()).toContain('重试');
    expect(wrapper.text()).not.toContain('还没有生长记录');
    expect(wrapper.find('.chart-stub').exists(), '出错时不应渲染曲线误导用户').toBe(false);
  });

  it('规则：错误后点击重试，恢复成功必须清除错误并渲染真实数据', async () => {
    vi.mocked(listGrowthRecords).mockRejectedValueOnce(new Error('服务器内部错误'));
    const wrapper = mountPanel();
    await flushPromises();
    expect(wrapper.text()).toContain('服务器内部错误');

    vi.mocked(listGrowthRecords).mockResolvedValue([growthRecord()]);
    const retry = wrapper
      .findAll('button')
      .find((button) => button.text().includes('重试'));
    expect(retry, '错误态必须提供重试按钮').toBeTruthy();
    await retry!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).not.toContain('服务器内部错误');
    const chart = wrapper.findComponent(chartStub);
    expect(chart.props('records'), '重试成功后曲线应拿到真实记录').toHaveLength(1);
    expect(wrapper.text()).toContain('2026-08-01');
  });

  it('规则：未建档（或从未记录）宝宝返回空数组时显示引导空态，而不是错误', async () => {
    vi.mocked(listGrowthRecords).mockResolvedValue([]);

    const wrapper = mountPanel();
    await flushPromises();

    expect(wrapper.text()).toContain('还没有生长记录，快来记录第一次吧');
    expect(wrapper.text()).not.toContain('重试');
    expect(wrapper.find('.chart-stub').exists()).toBe(false);
  });

  it('规则：有历史记录但所选时段为空时，提示“该时段无记录”，区别于从未记录', async () => {
    vi.mocked(listGrowthRecords).mockImplementation(async (query) =>
      query.start || query.end ? [] : [growthRecord()],
    );

    const wrapper = mountPanel();
    await flushPromises();

    expect(wrapper.text()).toContain('所选时间段内暂无生长记录');
    expect(wrapper.text()).not.toContain('还没有生长记录');
  });

  it('规则：按原始字符串宝宝标识发起查询，绝不转成 number', async () => {
    vi.mocked(listGrowthRecords).mockResolvedValue([]);

    mountPanel();
    await flushPromises();

    expect(vi.mocked(listGrowthRecords).mock.calls.length).toBeGreaterThan(0);
    for (const call of vi.mocked(listGrowthRecords).mock.calls) {
      expect(call[0].babyId, '每次查询都必须使用完整的字符串长标识').toBe(BABY_ID);
      expect(typeof call[0].babyId).toBe('string');
    }
  });

  it('规则：保存新记录后自动重新拉取，曲线数据随之刷新', async () => {
    vi.mocked(listGrowthRecords).mockResolvedValue([growthRecord()]);
    const wrapper = mountPanel();
    await flushPromises();
    const callsBefore = vi.mocked(listGrowthRecords).mock.calls.length;

    wrapper.findComponent(recordStub).vm.$emit('saved');
    await flushPromises();

    expect(
      vi.mocked(listGrowthRecords).mock.calls.length,
      '保存成功后必须触发重新查询',
    ).toBeGreaterThan(callsBefore);
  });
});
