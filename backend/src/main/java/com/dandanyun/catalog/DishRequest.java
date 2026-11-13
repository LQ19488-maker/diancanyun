package com.dandanyun.catalog;

import java.math.BigDecimal;
import java.util.List;

public record DishRequest(
        Long id,
        String name,
        Long categoryId,
        BigDecimal price,
        String image,
        String description,
        Integer status,
        List<DishFlavor> flavors
) {
    public record DishFlavor(String name, List<String> values) {
    }
}
