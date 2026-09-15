package com.babytracker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

/**
 * 全栈集成测试基类：真实 Spring 容器 + MockMvc + H2(MySQL 模式)。
 * 每个测试方法运行在独立事务中，结束自动回滚，用例之间数据互不污染，可连续重复运行。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    /** 以 JSON 发起 POST，返回响应对象。 */
    protected JsonNode postJson(String uri, Object body) throws Exception {
        return readJson(post(uri, body));
    }

    /** 以 JSON 发起 POST 并返回完整结果，便于同时断言状态码与错误体。 */
    protected MvcResult post(String uri, Object body) throws Exception {
        return mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post(uri)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn();
    }

    /** 以原始字符串作为请求体发起 POST，用于发送空体或损坏的 JSON。 */
    protected MvcResult postRaw(String uri, String rawBody) throws Exception {
        var request = org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .post(uri)
                .contentType(MediaType.APPLICATION_JSON);
        if (rawBody != null) {
            request.content(rawBody);
        }
        return mockMvc.perform(request).andReturn();
    }

    /** 发起 GET 并返回完整结果，便于在断言中同时检查 HTTP 状态码与响应体。 */
    protected MvcResult get(String uri) throws Exception {
        return mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(uri))
                .andReturn();
    }

    /**
     * 按原始字节（UTF-8）解析响应，避免 MockMvc 默认 ISO-8859-1 读取导致中文提示乱码。
     */
    protected JsonNode readJson(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsByteArray());
    }
}
