package com.babytracker.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 雪花算法生成的 Long 型主键（最多 19 位）超出 JavaScript Number.MAX_SAFE_INTEGER，
 * 直接以 JSON 数字下发会在前端丢失末位精度。统一把 Long/long 序列化为字符串，
 * 前端按原始标识回传即可精确定位记录；反序列化时 Jackson 可自动把字符串转回 Long。
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer longToStringCustomizer() {
        SimpleModule module = new SimpleModule();
        module.addSerializer(Long.class, ToStringSerializer.instance);
        module.addSerializer(Long.TYPE, ToStringSerializer.instance);
        return builder -> builder.modulesToInstall(module);
    }
}
