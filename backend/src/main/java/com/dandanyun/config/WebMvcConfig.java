package com.dandanyun.config;

import com.dandanyun.auth.AuthInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

/**
 * Web 基础配置：跨域与管理员/用户两套鉴权拦截。
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final AppCorsProperties corsProperties;
    private final AuthInterceptor authInterceptor;
    private final Path uploadDirectory;

    public WebMvcConfig(
            AppCorsProperties corsProperties,
            AuthInterceptor authInterceptor,
            @Value("${app.upload-dir:./uploads}") String uploadDirectory
    ) {
        this.corsProperties = corsProperties;
        this.authInterceptor = authInterceptor;
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(corsProperties.getAllowedOriginPatterns().toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("X-Request-Id")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns(
                        "/admin/**",
                        "/rider/**",
                        "/auth/me",
                        "/user/orders",
                        "/user/order",
                        "/user/order/**",
                        "/user/addresses",
                        "/user/address/**",
                        "/user/coupons",
                        "/user/coupon/**"
                )
                .excludePathPatterns("/admin/login");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = uploadDirectory.toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler("/upload/**")
                .addResourceLocations(location);
    }
}
