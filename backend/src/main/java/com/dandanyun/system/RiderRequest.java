package com.dandanyun.system;

public record RiderRequest(
        Long id,
        String username,
        String name,
        String phone,
        String area,
        String vehicle,
        Integer status,
        Integer online
) {
}
