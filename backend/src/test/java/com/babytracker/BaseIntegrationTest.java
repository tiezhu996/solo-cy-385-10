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
        String response = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post(uri)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response);
    }

    /** 发起 GET 并返回完整结果，便于在断言中同时检查 HTTP 状态码与响应体。 */
    protected MvcResult get(String uri) throws Exception {
        return mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(uri))
                .andReturn();
    }
}
