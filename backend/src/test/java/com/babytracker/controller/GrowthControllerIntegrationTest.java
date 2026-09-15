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
 * 生长记录查询/保存接口的业务规则测试。
 * 每个用例独立事务、结束回滚，可连续重复运行；@DisplayName 与断言信息直接对应被保护的业务规则。
 */
class GrowthControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private BabyMapper babyMapper;

    private static final String BASE = "/api/growth";

    private long createBabyWithId(long id, String name) {
        Baby baby = new Baby();
        baby.setId(id);
        baby.setName(name);
        baby.setBirthday(LocalDate.of(2025, 11, 20));
        babyMapper.insert(baby);
        return id;
    }

    private long createBaby(String name) {
        Baby baby = new Baby();
        baby.setName(name);
        baby.setBirthday(LocalDate.of(2025, 11, 20));
        babyMapper.insert(baby);
        return baby.getId();
    }

    private void record(long babyId, String date, Double height, Double weight) throws Exception {
        GrowthRecord body = new GrowthRecord();
        body.setBabyId(babyId);
        body.setRecordedAt(LocalDate.parse(date));
        body.setHeightCm(height);
        body.setWeightKg(weight);
        postJson(BASE, body);
    }

    private JsonNode getJson(String uri) throws Exception {
        MvcResult result = get(uri);
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("规则：长宝宝标识必须以字符串原样返回，按原始标识精确回读，末位不得被改写")
    void longBabyIdRoundTripsExactlyAsString() throws Exception {
        long id = 2099799435994071041L;
        createBabyWithId(id, "小满");
        record(id, "2026-08-01", 68.0, 8.2);

        JsonNode list = getJson(BASE + "?babyId=" + id);

        assertThat(list).as("按原始 19 位标识应精确查到 1 条记录").hasSize(1);
        JsonNode row = list.get(0);
        assertThat(row.get("babyId").isTextual())
                .as("babyId 必须序列化为字符串，避免前端 Number 丢精度").isTrue();
        assertThat(row.get("babyId").asText())
                .as("回读的 babyId 必须与原始标识逐位一致")
                .isEqualTo("2099799435994071041");
        assertThat(row.get("id").isTextual())
                .as("记录主键同样必须是字符串").isTrue();

        // 模拟前端旧逻辑把末位取整（…040），应查不到任何记录而非串到别的宝宝
        JsonNode roundedHits = getJson(BASE + "?babyId=2099799435994071040");
        assertThat(roundedHits).as("被改写的标识绝不能回读到真实记录").hasSize(0);
    }

    @Test
    @DisplayName("规则：按宝宝隔离，切换宝宝后只能看到该宝宝自己的记录")
    void recordsAreIsolatedPerBaby() throws Exception {
        long babyA = createBaby("宝宝甲");
        long babyB = createBaby("宝宝乙");
        record(babyA, "2026-08-01", 68.0, 8.2);
        record(babyA, "2026-08-10", null, 8.5);
        record(babyB, "2026-08-02", 70.0, 9.0);

        JsonNode listA = getJson(BASE + "?babyId=" + babyA);
        JsonNode listB = getJson(BASE + "?babyId=" + babyB);

        assertThat(listA).as("宝宝甲只能查到自己的 2 条记录").hasSize(2);
        assertThat(listB).as("宝宝乙只能查到自己的 1 条记录").hasSize(1);
        for (JsonNode row : listA) {
            assertThat(row.get("babyId").asLong())
                    .as("宝宝甲结果中不得混入其他宝宝数据").isEqualTo(babyA);
        }
        assertThat(listB.get(0).get("babyId").asLong()).isEqualTo(babyB);
    }

    @Test
    @DisplayName("规则：日期范围按闭区间过滤，起止边界当天的记录都应包含")
    void dateRangeIsInclusiveOnBothEnds() throws Exception {
        long babyId = createBaby("区间宝");
        record(babyId, "2026-08-01", 60.0, 6.0);
        record(babyId, "2026-09-01", 65.0, 7.0);
        record(babyId, "2026-09-15", 66.0, 7.3);

        JsonNode september = getJson(BASE + "?babyId=" + babyId + "&start=2026-09-01&end=2026-09-30");
        assertThat(september).as("[09-01, 09-30] 闭区间应包含 09-01 与 09-15 共 2 条").hasSize(2);
        assertThat(september.get(0).get("recordedAt").asText()).isEqualTo("2026-09-01");
        assertThat(september.get(1).get("recordedAt").asText()).isEqualTo("2026-09-15");

        JsonNode throughAugust = getJson(BASE + "?babyId=" + babyId + "&end=2026-08-31");
        assertThat(throughAugust).as("end=08-31 不得包含 9 月记录").hasSize(1);
        assertThat(throughAugust.get(0).get("recordedAt").asText()).isEqualTo("2026-08-01");

        JsonNode fromMidSep = getJson(BASE + "?babyId=" + babyId + "&start=2026-09-15");
        assertThat(fromMidSep).as("start=09-15 应包含边界当天").hasSize(1);
    }

    @Test
    @DisplayName("规则：同日多条记录全部保留可回看；只记一项时另一项为 null，服务端不得补点")
    void sameDayMultipleRowsAndNullMetricArePreserved() throws Exception {
        long babyId = createBaby("同日宝");
        record(babyId, "2026-08-01", 68.0, 8.2);
        record(babyId, "2026-08-01", 68.5, 8.4);
        record(babyId, "2026-09-01", null, 9.0);

        JsonNode list = getJson(BASE + "?babyId=" + babyId);

        assertThat(list).as("同日两次记录必须都返回，旧值可回看").hasSize(3);

        JsonNode first = list.get(0);
        JsonNode second = list.get(1);
        assertThat(first.get("recordedAt").asText()).isEqualTo("2026-08-01");
        assertThat(second.get("recordedAt").asText()).isEqualTo("2026-08-01");
        assertThat(first.get("id").asText())
                .as("同日两条必须是不同记录")
                .isNotEqualTo(second.get("id").asText());
        assertThat(first.get("heightCm").asDouble())
                .as("同日记录按录入先后排序，旧值 68.0 在前").isEqualTo(68.0);
        assertThat(second.get("heightCm").asDouble())
                .as("新值 68.5 同样保留").isEqualTo(68.5);

        JsonNode weightOnly = list.get(2);
        assertThat(weightOnly.get("weightKg").asDouble()).isEqualTo(9.0);
        assertThat(weightOnly.has("heightCm") && weightOnly.get("heightCm").isNull())
                .as("只录体重时身高必须为 null，服务端不得用相邻值补点").isTrue();
    }

    @Test
    @DisplayName("规则：未建档宝宝查询返回 200 空数组，属于正常空态而非服务器错误")
    void unknownBabyReturnsEmptyListWith200() throws Exception {
        MvcResult result = get(BASE + "?babyId=999999999999999999");
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());

        assertThat(result.getResponse().getStatus())
                .as("查询不存在的宝宝必须是 200，而不是 500").isEqualTo(200);
        assertThat(body.isArray()).as("空态响应体必须是数组").isTrue();
        assertThat(body).as("未建档宝宝没有记录").hasSize(0);
    }

    @Test
    @DisplayName("规则：参数格式错误必须返回 400 与标准错误体，前端据此与空态区分")
    void malformedParametersReturn400() throws Exception {
        MvcResult badDate = get(BASE + "?start=not-a-date");
        assertThat(badDate.getResponse().getStatus())
                .as("非法日期必须返回 400，不能伪装成 200 空结果").isEqualTo(400);
        JsonNode dateError = objectMapper.readTree(badDate.getResponse().getContentAsString());
        assertThat(dateError.get("success").asBoolean()).isFalse();
        assertThat(dateError.get("code").asText()).isEqualTo("VALIDATION_FAILED");

        MvcResult badBabyId = get(BASE + "?babyId=abc");
        assertThat(badBabyId.getResponse().getStatus())
                .as("非法 babyId 必须返回 400").isEqualTo(400);
    }

    @Test
    @DisplayName("规则：不传任何过滤参数时保持原有行为，返回全部记录")
    void noParametersReturnsAllRecords() throws Exception {
        long babyA = createBaby("全量甲");
        long babyB = createBaby("全量乙");
        record(babyA, "2026-08-01", 68.0, 8.2);
        record(babyB, "2026-08-02", 70.0, 9.0);

        JsonNode all = getJson(BASE);
        assertThat(all.size())
                .as("无参查询是原有行为，至少包含本用例写入的 2 条记录")
                .isGreaterThanOrEqualTo(2);
    }
}
