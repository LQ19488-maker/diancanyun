package com.dandanyun.catalog;

public record CategoryRequest(
        Long id,
        String name,
        Integer type,
        Integer sort,
        Integer status
) {
}
