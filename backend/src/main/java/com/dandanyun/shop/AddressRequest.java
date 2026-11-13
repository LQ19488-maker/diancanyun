package com.dandanyun.shop;

public record AddressRequest(
        Long id,
        String tag,
        String name,
        String phone,
        String detail,
        Integer isDefault
) {
}
