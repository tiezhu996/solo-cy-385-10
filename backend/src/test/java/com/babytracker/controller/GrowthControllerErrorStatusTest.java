package com.babytracker.controller;

import com.babytracker.exception.GlobalExceptionHandler;
import com.babytracker.service.GrowthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

/**
 * 服务层发生未预期异常时，全局处理器必须返回真正的 500 状态码和标准错误体，
 * 前端才能把“服务器错误”与“200 空数组的正常空态”区分开。
 * 使用独立 MockMvc，不依赖数据库与 Spring 全容器。
 */
class GrowthControllerErrorStatusTest {

    private GrowthService growthService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        growthService = mock(GrowthService.class);
        mockMvc = standaloneSetup(new GrowthController(growthService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("规则：服务内部异常必须返回 HTTP 500，而不是 HTTP 200 的错误体")
    void serviceFailureReturns500() throws Exception {
        when(growthService.list(any(), any(), any()))
                .thenThrow(new RuntimeException("database down"));

        mockMvc.perform(get("/api/growth").param("start", "2026-09-01"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("服务器内部错误"));
    }

    @Test
    @DisplayName("规则：参数类型不匹配必须返回 400，前端据此提示而非当成空态")
    void malformedParameterReturns400() throws Exception {
        mockMvc.perform(get("/api/growth").param("babyId", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}
