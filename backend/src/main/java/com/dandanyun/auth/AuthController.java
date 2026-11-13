package com.dandanyun.auth;

import com.dandanyun.common.Result;
import com.dandanyun.common.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping({"/auth/admin/login", "/admin/login"})
    public Result<LoginResponse> adminLogin(@RequestBody LoginRequest request) {
        try {
            return Result.ok(authService.login(request, UserRole.ADMIN));
        } catch (AuthenticationException e) {
            return Result.fail(2001, e.getMessage());
        }
    }

    @PostMapping({"/auth/user/login", "/user/login"})
    public Result<LoginResponse> userLogin(@RequestBody LoginRequest request) {
        return Result.ok(authService.login(request, UserRole.STAFF));
    }
}
