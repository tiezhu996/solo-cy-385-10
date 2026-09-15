import { describe, expect, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import type { App } from 'vue';
import { Button, DatePicker, Field, Icon, Popup } from 'vant';
import RecordGrowthPopup from './RecordGrowthPopup.vue';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock('vant', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vant')>();
  return { ...actual, showToast };
});

vi.mock('../api/growth', () => ({
  saveGrowthRecord: vi.fn(),
}));

import { saveGrowthRecord } from '../api/growth';

const BABY_ID = '2099799435994071041';

const vantPlugin = {
  install(app: App) {
    app.use(Button).use(DatePicker).use(Field).use(Icon).use(Popup);
  },
};

function mountPopup() {
  return mount(RecordGrowthPopup, {
    props: { show: true, babyId: BABY_ID },
    global: { plugins: [vantPlugin] },
    // Vant 弹层 teleport 到 body，必须挂到文档上才能查到内部输入框
    attachTo: document.body,
  });
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function clickButton(text: string) {
  const target = Array.from(document.querySelectorAll('button')).find((button) =>
    button.textContent?.includes(text),
  );
  if (!target) throw new Error(`未找到按钮：${text}`);
  target.dispatchEvent(new Event('click', { bubbles: true }));
}

describe('RecordGrowthPopup 生长记录录入', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('规则：两项测量都为空时点保存必须提示，且不发起保存请求', async () => {
    const wrapper = mountPopup();
    await flushPromises();

    clickButton('保存');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith('身高和体重至少填写一项');
    expect(saveGrowthRecord).not.toHaveBeenCalled();
    expect(wrapper.emitted('saved')).toBeUndefined();
    wrapper.unmount();
  });

  it('规则：身高为非正数必须明确提示是哪一项，且不发起保存请求', async () => {
    const wrapper = mountPopup();
    await flushPromises();

    const inputs = document.querySelectorAll('input');
    setInputValue(inputs[1] as HTMLInputElement, '-3');
    setInputValue(inputs[2] as HTMLInputElement, '8.4');

    clickButton('保存');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith('身高必须为大于 0 的数值');
    expect(saveGrowthRecord).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('规则：合法输入保存成功后提示、回传 saved，并按字符串长标识提交', async () => {
    vi.mocked(saveGrowthRecord).mockResolvedValue({
      id: '2099800771959668738',
      babyId: BABY_ID,
      recordedAt: '2026-09-15',
      heightCm: 68.5,
      weightKg: 8.4,
    });
    const wrapper = mountPopup();
    await flushPromises();

    const inputs = document.querySelectorAll('input');
    setInputValue(inputs[1] as HTMLInputElement, '68.5');
    setInputValue(inputs[2] as HTMLInputElement, '8.4');

    clickButton('保存');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith('已保存');
    expect(saveGrowthRecord).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(saveGrowthRecord).mock.calls[0][0];
    expect(payload.babyId).toBe(BABY_ID);
    expect(typeof payload.babyId).toBe('string');
    expect(payload.heightCm).toBe(68.5);
    expect(wrapper.emitted('saved')).toBeTruthy();
    wrapper.unmount();
  });

  it('规则：只录一项是允许的（缺项记录），保存成功', async () => {
    vi.mocked(saveGrowthRecord).mockResolvedValue({
      id: '2099800771959668739',
      babyId: BABY_ID,
      recordedAt: '2026-09-15',
      heightCm: null,
      weightKg: 9.0,
    });
    const wrapper = mountPopup();
    await flushPromises();

    const inputs = document.querySelectorAll('input');
    setInputValue(inputs[2] as HTMLInputElement, '9');

    clickButton('保存');
    await flushPromises();

    expect(saveGrowthRecord).toHaveBeenCalledTimes(1);
    expect(vi.mocked(saveGrowthRecord).mock.calls[0][0].heightCm).toBeNull();
    expect(wrapper.emitted('saved')).toBeTruthy();
    wrapper.unmount();
  });

  it('规则：后端拒绝（如未建档宝宝）时必须显示服务器提示，不能伪装成保存成功', async () => {
    vi.mocked(saveGrowthRecord).mockRejectedValue(new Error('宝宝档案不存在，请先建档后再记录'));
    const wrapper = mountPopup();
    await flushPromises();

    const inputs = document.querySelectorAll('input');
    setInputValue(inputs[1] as HTMLInputElement, '68.5');
    setInputValue(inputs[2] as HTMLInputElement, '8.4');

    clickButton('保存');
    await flushPromises();

    expect(showToast).toHaveBeenCalledWith('宝宝档案不存在，请先建档后再记录');
    expect(wrapper.emitted('saved')).toBeUndefined();
    wrapper.unmount();
  });
});
