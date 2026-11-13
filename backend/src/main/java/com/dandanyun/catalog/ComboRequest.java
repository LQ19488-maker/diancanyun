package com.dandanyun.catalog;

import java.math.BigDecimal;
import java.util.List;

public record ComboRequest(
        Long id,
        String name,
        Long categoryId,
        BigDecimal price,
        List<Long> dishIds,
        String image,
        String description,
        Integer status
) {
}
