package com.dandanyun.auth;

import com.dandanyun.common.AuthenticationException;
import com.dandanyun.common.AccessDeniedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenService tokenService;

    public AuthInterceptor(JwtTokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            throw new AuthenticationException("缺少 Bearer token");
        }

        JwtTokenService.ParsedToken token = tokenService.parse(
                authorization.substring(BEARER_PREFIX.length()).trim()
        );
        String path = request.getRequestURI().substring(request.getContextPath().length());
        UserRole requiredRole = null;
        if (path.startsWith("/admin")) {
            requiredRole = UserRole.MERCHANT;
        } else if (path.startsWith("/rider")) {
            requiredRole = UserRole.RIDER;
        } else if (path.startsWith("/user")) {
            requiredRole = UserRole.CUSTOMER;
        }
        if (requiredRole != null && token.role() != requiredRole) {
            throw new AccessDeniedException("当前身份不能访问该接口");
        }
        AuthContext.set(token.toUser());
        return true;
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex
    ) {
        AuthContext.clear();
    }
}
