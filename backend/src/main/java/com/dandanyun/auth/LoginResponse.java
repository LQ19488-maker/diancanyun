package com.dandanyun.auth;

public record LoginResponse(
        String token,
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        LoginUser user
) {
    public record LoginUser(
            long id,
            String username,
            String name,
            String displayName,
            UserRole role
    ) {
    }
}
