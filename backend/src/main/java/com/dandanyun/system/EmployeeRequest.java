package com.dandanyun.system;

public record EmployeeRequest(
        Long id,
        String username,
        String password,
        String name,
        String phone,
        String role,
        Integer status
) {
}
