package com.dandanyun.auth;

import com.dandanyun.common.AuthenticationException;
import com.dandanyun.common.AccessDeniedException;

public final class AuthContext {

    private static final ThreadLocal<AuthenticatedUser> CURRENT = new ThreadLocal<>();

    private AuthContext() {
    }

    public static void set(AuthenticatedUser user) {
        CURRENT.set(user);
    }

    public static AuthenticatedUser require() {
        AuthenticatedUser user = CURRENT.get();
        if (user == null) {
            throw new AuthenticationException("请先登录");
        }
        return user;
    }

    public static AuthenticatedUser requireAdmin() {
        AuthenticatedUser user = require();
        if (user.role() != UserRole.ADMIN) {
            throw new AccessDeniedException("仅管理员可以执行该操作");
        }
        return user;
    }

    public static void clear() {
        CURRENT.remove();
    }
}
