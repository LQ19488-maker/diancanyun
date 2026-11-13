package com.dandanyun.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ext.javatime.ser.LocalDateSerializer;
import tools.jackson.databind.ext.javatime.ser.LocalDateTimeSerializer;
import tools.jackson.databind.ext.javatime.ser.LocalTimeSerializer;
import tools.jackson.databind.module.SimpleModule;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * 统一接口出参的形状，与 docs/api-contract.md 对齐：
 * 1. Long 主键序列化成字符串，避免前端 JavaScript 大整数精度丢失；
 * 2. LocalDateTime / LocalDate / LocalTime 固定成契约里的格式，
 *    Jackson 3 默认会输出 ISO 的 "2026-11-13T19:23:43"，前端表格直接显示会带 T。
 */
@Configuration
public class JacksonConfig {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm:ss");

    @Bean
    JsonMapperBuilderCustomizer apiResponseShapeCustomizer() {
        return builder -> {
            SimpleModule module = new SimpleModule("api-response-shape");
            module.addSerializer(Long.class, ToStringSerializer.instance);
            module.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(DATE_TIME));
            module.addSerializer(LocalDate.class, new LocalDateSerializer(DATE));
            module.addSerializer(LocalTime.class, new LocalTimeSerializer(TIME));
            builder.addModule(module);
        };
    }
}
