package com.dandanyun;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class ApiContractRoutesTest {

    @Autowired
    private RequestMappingHandlerMapping mappings;

    @Test
    void exposesFrontendContractRoutes() {
        Set<String> actual = new HashSet<>();
        mappings.getHandlerMethods().forEach((info, handler) -> {
            Set<String> methods = info.getMethodsCondition().getMethods().stream()
                    .map(Enum::name)
                    .collect(java.util.stream.Collectors.toSet());
            if (methods.isEmpty()) {
                methods = Set.of("*");
            }
            for (String pattern : info.getPatternValues()) {
                for (String method : methods) {
                    actual.add(method + " " + pattern);
                }
            }
        });

        Set<String> expected = Set.of(
                "POST /auth/login",
                "GET /auth/me",
                "GET /admin/rider/page",
                "POST /admin/rider",
                "PUT /admin/rider",
                "DELETE /admin/rider/{id}",
                "PUT /admin/rider/{id}/status",
                "PUT /admin/rider/{id}/online",
                "GET /admin/category/page",
                "POST /admin/category",
                "PUT /admin/category",
                "DELETE /admin/category/{id}",
                "GET /admin/flavor/{categoryId}",
                "PUT /admin/flavor/{categoryId}",
                "GET /admin/dish/page",
                "POST /admin/dish",
                "PUT /admin/dish",
                "DELETE /admin/dish/{id}",
                "PUT /admin/dish/{id}/status",
                "GET /admin/combo/page",
                "GET /admin/combo/{id}",
                "POST /admin/combo",
                "PUT /admin/combo",
                "DELETE /admin/combo/{id}",
                "PUT /admin/combo/{id}/status",
                "GET /admin/order/status-count",
                "GET /admin/order/page",
                "GET /admin/order/{id}",
                "PUT /admin/order/{id}/status",
                "GET /admin/statistics/overview",
                "POST /admin/upload",
                "GET /admin/shop",
                "PUT /admin/shop",
                "GET /user/shops",
                "GET /user/shop/{id}",
                "GET /user/menu",
                "GET /user/addresses",
                "POST /user/address",
                "PUT /user/address",
                "PUT /user/address/{id}/default",
                "DELETE /user/address/{id}",
                "POST /user/order",
                "GET /user/order/{id}",
                "GET /user/orders",
                "GET /user/coupon/templates",
                "POST /user/coupon/{id}/claim",
                "GET /user/coupons",
                "GET /rider/me",
                "GET /rider/stats",
                "PUT /rider/online",
                "GET /rider/tasks",
                "POST /rider/tasks/{orderId}/grab",
                "GET /rider/orders",
                "POST /rider/orders/{orderId}/finish",
                "GET /rider/weather",
                "GET /rider/wallet",
                "POST /rider/withdraw"
        );

        Set<String> missing = new HashSet<>(expected);
        missing.removeAll(actual);
        assertTrue(missing.isEmpty(), "Missing frontend contract routes: " + missing);
    }
}
