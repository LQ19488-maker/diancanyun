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

    public static AuthenticatedUser requireMerchant() {
        AuthenticatedUser user = require();
        if (user.role() != UserRole.MERCHANT) {
            throw new AccessDeniedException("仅商家可以执行该操作");
        }
        return user;
    }

    public static AuthenticatedUser requireRider() {
        AuthenticatedUser user = require();
        if (user.role() != UserRole.RIDER) {
            throw new AccessDeniedException("仅骑手可以执行该操作");
        }
        return user;
    }

    public static AuthenticatedUser requireCustomer() {
        AuthenticatedUser user = require();
        if (user.role() != UserRole.CUSTOMER) {
            throw new AccessDeniedException("仅顾客可以执行该操作");
        }
        return user;
    }

    public static void clear() {
        CURRENT.remove();
    }
}
