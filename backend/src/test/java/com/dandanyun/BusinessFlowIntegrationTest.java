package com.dandanyun;

import com.dandanyun.support.TestDatabase;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 真实连库的集成测试：登录 → 下单 → 满减 → 商家接单 → 骑手抢单/送达，以及契约字段类型。
 * 本机没有 MySQL 时整体跳过（见 {@link TestDatabase#mysqlAvailable()}）。
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@EnabledIf("mysqlAvailable")
class BusinessFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    static boolean mysqlAvailable() {
        return TestDatabase.mysqlAvailable();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", TestDatabase::url);
        registry.add("spring.datasource.username", () -> TestDatabase.USER);
        registry.add("spring.datasource.password", () -> TestDatabase.PASSWORD);
        registry.add("spring.sql.init.mode", () -> "always");
        registry.add("app.upload-dir", () -> "target/test-uploads");
    }

    @Test
    @Order(1)
    void loginReturnsContractShape() throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"customer\",\"password\":\"customer1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn();

        var data = body(result).path("data");
        assertTrue(data.path("token").isTextual(), "登录必须返回 token");
        assertTrue(data.path("tokenType").isTextual());
        assertTrue(data.path("expiresInSeconds").isNumber());
        assertEquals("1004", data.path("user").path("id").asText(), "主键必须序列化成字符串");
        assertEquals("customer", data.path("user").path("username").asText());
        assertEquals("胡粤毫", data.path("user").path("name").asText());
        assertEquals("CUSTOMER", data.path("user").path("role").asText());
    }

    @Test
    @Order(2)
    void loginRejectsWrongPasswordWithBusinessCode() throws Exception {
        // 注意：AuthController 把 AuthenticationException 转成了 Result.fail(2001)，HTTP 仍是 200，
        // 前端必须按 code 判成功而不是只看 HTTP 状态。
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"customer\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(2001))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @Order(3)
    void readinessReportsDatabaseUp() throws Exception {
        mockMvc.perform(get("/health/ready"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @Order(4)
    void roleIsolationIsEnforcedBothWays() throws Exception {
        String merchant = login("merchant", "merchant1234");
        String rider = login("rider", "rider1234");
        String customer = login("customer", "customer1234");

        mockMvc.perform(get("/admin/order/page").header("Authorization", bearer(merchant)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/user/orders").header("Authorization", bearer(merchant)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/admin/rider/page").header("Authorization", bearer(rider)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/rider/tasks").header("Authorization", bearer(customer)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/rider/tasks").header("Authorization", bearer(rider)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/user/shops").header("Authorization", bearer(customer)))
                .andExpect(status().isOk());
    }

    @Test
    @Order(5)
    void countsAndPaginationSerializeAsNumbers() throws Exception {
        String merchant = login("merchant", "merchant1234");
        String customer = login("customer", "customer1234");

        var categoryPage = body(mockMvc.perform(get("/admin/category/page")
                        .header("Authorization", bearer(merchant)))
                .andExpect(status().isOk())
                .andReturn()).path("data");
        assertTrue(categoryPage.path("total").isNumber(), "total 应为数字");
        assertTrue(categoryPage.path("page").isNumber(), "page 应为数字");
        assertTrue(categoryPage.path("pageSize").isNumber(), "pageSize 应为数字");

        var statusCounts = body(mockMvc.perform(get("/admin/order/status-count")
                        .header("Authorization", bearer(merchant)))
                .andExpect(status().isOk())
                .andReturn()).path("data");
        statusCounts.properties().forEach(entry ->
                assertTrue(entry.getValue().isNumber(), entry.getKey() + " 计数应为数字"));

        var shops = body(mockMvc.perform(get("/user/shops").header("Authorization", bearer(customer)))
                .andExpect(status().isOk())
                .andReturn()).path("data");
        assertTrue(shops.path("total").isNumber());
    }

    @Test
    @Order(6)
    void orderTimestampsUseContractFormat() throws Exception {
        String customer = login("customer", "customer1234");
        long orderId = createOrder(customer, 3001, 1);

        var order = body(mockMvc.perform(get("/user/order/" + orderId)
                        .header("Authorization", bearer(customer)))
                .andExpect(status().isOk())
                .andReturn()).path("data");

        String pattern = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}";
        assertTrue(order.path("createdAt").asText().matches(pattern),
                "createdAt 必须匹配 yyyy-MM-dd HH:mm:ss，实际为 " + order.path("createdAt").asText());
        assertTrue(order.path("timeline").get(0).path("time").asText().matches(pattern));
        assertTrue(order.path("id").isTextual(), "订单号主键必须序列化成字符串");
    }

    @Test
    @Order(7)
    void orderAppliesShopFullReduction() throws Exception {
        String customer = login("customer", "customer1234");

        // 川味小馆：满 30 减 5，配送费 5
        var hit = detail(customer, createOrder(customer, 3001, 1));
        assertEquals(38.0, hit.path("amount").asDouble());
        assertEquals(5.0, hit.path("discount").asDouble(), "菜品小计 38 应触发满减 5");
        assertEquals(5.0, hit.path("deliveryFee").asDouble());
        assertEquals(38.0, hit.path("totalAmount").asDouble(), "38 - 5 + 0 + 5 = 38");

        var miss = detail(customer, createOrder(customer, 3006, 2));
        assertEquals(20.0, miss.path("amount").asDouble());
        assertEquals(0.0, miss.path("discount").asDouble(), "菜品小计 20 未达满减门槛");
        assertEquals(25.0, miss.path("totalAmount").asDouble(), "20 - 0 + 0 + 5 = 25");
    }

    @Test
    @Order(8)
    void menuExposesFullReductionConfig() throws Exception {
        String customer = login("customer", "customer1234");
        var shop = body(mockMvc.perform(get("/user/menu").param("shopId", "10001")
                        .header("Authorization", bearer(customer)))
                .andExpect(status().isOk())
                .andReturn()).path("data").path("shop");
        assertEquals(30.0, shop.path("fullAmount").asDouble());
        assertEquals(5.0, shop.path("reduceAmount").asDouble());
    }

    @Test
    @Order(9)
    void merchantCanUpdateFullReductionAndItAppliesImmediately() throws Exception {
        String merchant = login("merchant", "merchant1234");
        String customer = login("customer", "customer1234");

        var updated = body(mockMvc.perform(put("/admin/shop")
                        .header("Authorization", bearer(merchant))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullAmount\":20,\"reduceAmount\":4}"))
                .andExpect(status().isOk())
                .andReturn()).path("data");
        assertEquals(20.0, updated.path("fullAmount").asDouble());
        assertEquals(4.0, updated.path("reduceAmount").asDouble());

        var order = detail(customer, createOrder(customer, 3006, 2));
        assertEquals(4.0, order.path("discount").asDouble(), "改配置后 20 元订单应减 4");
        assertEquals(21.0, order.path("totalAmount").asDouble());

        // 非法配置：优惠额大于门槛
        mockMvc.perform(put("/admin/shop")
                        .header("Authorization", bearer(merchant))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullAmount\":10,\"reduceAmount\":20}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4001));

        // 非法配置：门槛为 0 但有优惠额
        mockMvc.perform(put("/admin/shop")
                        .header("Authorization", bearer(merchant))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullAmount\":0,\"reduceAmount\":5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4001));

        // 非法配置：修改别家店铺
        mockMvc.perform(put("/admin/shop")
                        .header("Authorization", bearer(merchant))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":10002,\"fullAmount\":10}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4001));

        // 恢复种子配置，避免影响其他用例与人工联调
        mockMvc.perform(put("/admin/shop")
                        .header("Authorization", bearer(merchant))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullAmount\":30,\"reduceAmount\":5}"))
                .andExpect(status().isOk());
    }

    @Test
    @Order(10)
    void orderRunsThroughMerchantAndRider() throws Exception {
        String merchant = login("merchant", "merchant1234");
        String rider = login("rider", "rider1234");
        String customer = login("customer", "customer1234");

        long orderId = createOrder(customer, 3001, 1);

        mockMvc.perform(put("/admin/order/" + orderId + "/status")
                        .header("Authorization", bearer(merchant))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));

        // PENDING 直接跳 DELIVERING 属于非法流转
        mockMvc.perform(put("/admin/order/" + orderId + "/status")
                        .header("Authorization", bearer(merchant))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERING\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/rider/tasks/" + orderId + "/grab")
                        .header("Authorization", bearer(rider)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DELIVERING"));

        mockMvc.perform(post("/rider/orders/" + orderId + "/finish")
                        .header("Authorization", bearer(rider)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DONE"));

        var order = body(mockMvc.perform(get("/admin/order/" + orderId)
                        .header("Authorization", bearer(merchant)))
                .andExpect(status().isOk())
                .andReturn()).path("data");
        assertEquals("DONE", order.path("status").asText());
        assertEquals("王小明", order.path("riderName").asText());
        assertEquals(4, order.path("timeline").size(), "应有 PENDING/ACCEPTED/DELIVERING/DONE 四条轨迹");
    }

    private String login(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return body(result).path("data").path("token").asText();
    }

    private long createOrder(String customerToken, long dishId, int quantity) throws Exception {
        String payload = "{\"shopId\":10001,\"addressId\":11001,\"tableNo\":\"\",\"remark\":\"集成测试\","
                + "\"items\":[{\"dishId\":" + dishId + ",\"quantity\":" + quantity + "}]}";
        MvcResult result = mockMvc.perform(post("/user/order")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();
        return Long.parseLong(body(result).path("data").path("id").asText());
    }

    private tools.jackson.databind.JsonNode detail(String customerToken, long orderId) throws Exception {
        return body(mockMvc.perform(get("/user/order/" + orderId)
                        .header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andReturn()).path("data");
    }

    private tools.jackson.databind.JsonNode body(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
