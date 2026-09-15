package com.babytracker.controller;

import com.babytracker.BaseIntegrationTest;
import com.babytracker.entity.Baby;
import com.babytracker.entity.GrowthRecord;
import com.babytracker.mapper.BabyMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 生长记录写入校验测试：非法数据必须以 400 明确失败并给出可读提示，且不得落库；
 * 合法数据（含只录一项、同日多次）必须正常保存并可回读。
 */
class GrowthRecordValidationIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private BabyMapper babyMapper;

    private static final String BASE = "/api/growth";

    private long createBaby(String name) {
        Baby baby = new Baby();
        baby.setName(name);
        baby.setBirthday(LocalDate.of(2025, 11, 20));
        babyMapper.insert(baby);
        return baby.getId();
    }

    private MvcResult postRecord(GrowthRecord record) throws Exception {
        return post(BASE, record);
    }

    private GrowthRecord buildRecord(long babyId, String date, Double height, Double weight) {
        GrowthRecord record = new GrowthRecord();
        record.setBabyId(babyId);
        record.setRecordedAt(date == null ? null : LocalDate.parse(date));
        record.setHeightCm(height);
        record.setWeightKg(weight);
        return record;
    }

    private JsonNode recordsOf(long babyId) throws Exception {
        return readJson(get(BASE + "?babyId=" + babyId));
    }

    private void assertRejected(MvcResult result, String messageHint) throws Exception {
        assertThat(result.getResponse().getStatus())
                .as("非法写入必须返回 400，而不是静默保存成功").isEqualTo(400);
        JsonNode body = readJson(result);
        assertThat(body.get("success").asBoolean()).isFalse();
        assertThat(body.get("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(body.get("message").asText())
                .as("错误提示必须清楚说明被破坏的规则").contains(messageHint);
    }

    @Test
    @DisplayName("规则：已建档宝宝的合法记录保存成功并可按标识精确回读")
    void validRecordForExistingBabyIsSaved() throws Exception {
        long babyId = createBaby("合规宝");

        MvcResult result = postRecord(buildRecord(babyId, "2026-09-10", 68.5, 8.4));

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode saved = readJson(result);
        assertThat(saved.get("id").asText()).isNotBlank();
        assertThat(saved.get("babyId").asText()).isEqualTo(String.valueOf(babyId));

        JsonNode list = recordsOf(babyId);
        assertThat(list).as("合法记录必须能按原始标识回读").hasSize(1);
        assertThat(list.get(0).get("weightKg").asDouble()).isEqualTo(8.4);
    }

    @Test
    @DisplayName("规则：未建档宝宝的记录必须 400 拒绝并提示建档，不得产生查不到归属的孤儿记录")
    void unknownBabyIsRejected() throws Exception {
        long fakeBabyId = 999999999999999999L;

        MvcResult result = postRecord(buildRecord(fakeBabyId, "2026-09-10", 68.0, 8.0));

        assertRejected(result, "档案不存在");
        JsonNode list = recordsOf(fakeBabyId);
        assertThat(list).as("被拒绝的记录绝不能落库").hasSize(0);
    }

    @Test
    @DisplayName("规则：未来日期必须 400 拒绝，不能录入晚于今天的测量")
    void futureDateIsRejected() throws Exception {
        long babyId = createBaby("日期宝");
        String future = LocalDate.now().plusDays(1).toString();

        MvcResult result = postRecord(buildRecord(babyId, future, 68.0, 8.0));

        assertRejected(result, "不能晚于今天");
        assertThat(recordsOf(babyId)).as("未来日期记录不得落库").hasSize(0);
    }

    @Test
    @DisplayName("规则：身高体重都为空必须 400 拒绝，不能保存没有意义的空记录")
    void bothMetricsEmptyIsRejected() throws Exception {
        long babyId = createBaby("空值宝");

        MvcResult result = postRecord(buildRecord(babyId, "2026-09-10", null, null));

        assertRejected(result, "至少填写一项");
        assertThat(recordsOf(babyId)).hasSize(0);
    }

    @Test
    @DisplayName("规则：零或负数测量值必须 400 拒绝，并指出具体是哪一项")
    void nonPositiveMeasurementsAreRejected() throws Exception {
        long babyId = createBaby("数值宝");

        assertRejected(postRecord(buildRecord(babyId, "2026-09-10", 0.0, 8.0)), "身高");
        assertRejected(postRecord(buildRecord(babyId, "2026-09-10", -5.0, 8.0)), "身高");
        assertRejected(postRecord(buildRecord(babyId, "2026-09-10", 68.0, 0.0)), "体重");
        assertRejected(postRecord(buildRecord(babyId, "2026-09-10", 68.0, -0.1)), "体重");

        assertThat(recordsOf(babyId)).as("所有非正数据都不得落库").hasSize(0);
    }

    @Test
    @DisplayName("规则：只录一项是合法的，缺项保存为 null，缺项曲线场景保持可用")
    void singleMetricRecordIsAllowed() throws Exception {
        long babyId = createBaby("单项宝");

        MvcResult result = postRecord(buildRecord(babyId, "2026-09-10", null, 9.0));

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode list = recordsOf(babyId);
        assertThat(list).hasSize(1);
        assertThat(list.get(0).get("weightKg").asDouble()).isEqualTo(9.0);
        assertThat(list.get(0).get("heightCm").isNull())
                .as("未记录的身高必须保持 null，不能补点").isTrue();
    }

    @Test
    @DisplayName("规则：同一日期可多次记录，均保存成功并都能回看到")
    void multipleRecordsSameDayAreAllKept() throws Exception {
        long babyId = createBaby("同日宝");

        postRecord(buildRecord(babyId, "2026-09-10", 68.0, 8.2));
        postRecord(buildRecord(babyId, "2026-09-10", 68.5, 8.4));

        JsonNode list = recordsOf(babyId);
        assertThat(list).as("同日两次记录都必须保留，供旧值回看").hasSize(2);
    }
}
