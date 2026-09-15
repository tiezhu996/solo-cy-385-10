package com.babytracker.controller;

import com.babytracker.BaseIntegrationTest;
import com.babytracker.entity.Baby;
import com.babytracker.mapper.BabyMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 异常输入的接口层测试：空请求体、损坏 JSON、字段类型/格式非法都必须以 400 明确失败，
 * 不能被当成 500，也不能写入任何记录。与业务校验（BizException）分属不同失败层级。
 */
class GrowthMalformedRequestIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private BabyMapper babyMapper;

    private static final String BASE = "/api/growth";

    private long createBaby() {
        Baby baby = new Baby();
        baby.setName("畸形输入宝");
        baby.setBirthday(LocalDate.of(2025, 11, 20));
        babyMapper.insert(baby);
        return baby.getId();
    }

    private void assertBadRequest(MvcResult result) throws Exception {
        assertThat(result.getResponse().getStatus())
                .as("畸形请求必须返回 400，不能是 500 也不能 200 静默成功").isEqualTo(400);
        JsonNode body = readJson(result);
        assertThat(body.get("success").asBoolean()).isFalse();
        assertThat(body.get("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(body.get("message").asText()).isNotBlank();
    }

    @Test
    @DisplayName("规则：空请求体必须 400 拒绝，不能保存成功也不能报 500")
    void emptyBodyIsRejected() throws Exception {
        assertBadRequest(postRaw(BASE, ""));
        assertBadRequest(postRaw(BASE, null));
    }

    @Test
    @DisplayName("规则：损坏的 JSON 必须 400 拒绝")
    void malformedJsonIsRejected() throws Exception {
        assertBadRequest(postRaw(BASE, "{not-valid-json"));
    }

    @Test
    @DisplayName("规则：空对象 {} 落入业务校验，提示先选择宝宝且不落库")
    void emptyObjectTriggersBusinessValidation() throws Exception {
        MvcResult result = postRaw(BASE, "{}");
        assertBadRequest(result);
        JsonNode body = readJson(result);
        assertThat(body.get("message").asText()).contains("宝宝");
    }

    @Test
    @DisplayName("规则：测量字段类型非法（数字写成字符串）必须 400 拒绝")
    void wrongFieldTypeIsRejected() throws Exception {
        long babyId = createBaby();
        String payload = "{\"babyId\":" + babyId
                + ",\"recordedAt\":\"2026-09-10\",\"heightCm\":\"not-a-number\",\"weightKg\":8.0}";

        assertBadRequest(postRaw(BASE, payload));
        JsonNode all = readJson(get(BASE + "?babyId=" + babyId));
        assertThat(all).as("字段类型非法的请求不得写入记录").hasSize(0);
    }

    @Test
    @DisplayName("规则：日期字段格式非法必须 400 拒绝")
    void illegalDateFormatIsRejected() throws Exception {
        long babyId = createBaby();
        String payload = "{\"babyId\":" + babyId
                + ",\"recordedAt\":\"2026/09/10\",\"heightCm\":68.0,\"weightKg\":8.0}";

        assertBadRequest(postRaw(BASE, payload));
        JsonNode all = readJson(get(BASE + "?babyId=" + babyId));
        assertThat(all).as("日期非法的请求不得写入记录").hasSize(0);
    }

    @Test
    @DisplayName("规则：babyId 类型非法（数字写成对象）必须 400 拒绝")
    void wrongBabyIdTypeIsRejected() throws Exception {
        assertBadRequest(postRaw(BASE,
                "{\"babyId\":{\"value\":1},\"recordedAt\":\"2026-09-10\",\"weightKg\":8.0}"));
    }
}
