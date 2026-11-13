package com.dandanyun.shop;

import java.math.BigDecimal;

/**
 * 商家端店铺设置请求。字段传 null 表示保持不变；id 仅作校验，必须等于商家自己的店铺。
 */
public record ShopRequest(
        Long id,
        String name,
        BigDecimal minPrice,
        BigDecimal deliveryFee,
        BigDecimal fullAmount,
        BigDecimal reduceAmount,
        Integer status,
        Integer openMenu
) {
}
