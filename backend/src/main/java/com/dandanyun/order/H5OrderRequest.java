package com.dandanyun.order;

import java.util.List;

public record H5OrderRequest(
        Long shopId,
        Long addressId,
        Long couponId,
        String tableNo,
        String remark,
        List<Item> items
) {
    public record Item(Long dishId, Integer quantity, List<Flavor> flavors) {
    }

    public record Flavor(String name, String value) {
    }
}
