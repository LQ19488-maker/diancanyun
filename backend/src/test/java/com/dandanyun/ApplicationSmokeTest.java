package com.dandanyun;

import com.dandanyun.auth.AuthenticatedUser;
import com.dandanyun.auth.JwtTokenService;
import com.dandanyun.auth.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 不依赖数据库的冒烟测试：健康检查、统一返回结构、鉴权边界、主键序列化。
 * 需要真实数据的业务断言见 {@link BusinessFlowIntegrationTest}。
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApplicationSmokeTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenService tokenService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    void protectedEndpointRequiresToken() throws Exception {
        mockMvc.perform(get("/admin/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void longIdentifiersSerializeAsStrings() {
        String json = objectMapper.writeValueAsString(Map.of("id", 9007199254740993L));
        org.junit.jupiter.api.Assertions.assertEquals("{\"id\":\"9007199254740993\"}", json);
    }

    @Test
    void merchantTokenReachesAdminApiButNotCustomerApi() throws Exception {
        String merchantToken = tokenService.issue(
                new AuthenticatedUser(1001, "merchant", "刘添祺", UserRole.MERCHANT)
        ).value();

        mockMvc.perform(get("/admin/me").header("Authorization", "Bearer " + merchantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("MERCHANT"));

        mockMvc.perform(get("/user/me").header("Authorization", "Bearer " + merchantToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void riderTokenIsForbiddenOnAdminApi() throws Exception {
        String riderToken = tokenService.issue(
                new AuthenticatedUser(1002, "rider", "王小明", UserRole.RIDER)
        ).value();

        mockMvc.perform(get("/admin/rider/page").header("Authorization", "Bearer " + riderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    void businessErrorsKeepUnifiedShape() throws Exception {
        String merchantToken = tokenService.issue(
                new AuthenticatedUser(1001, "merchant", "刘添祺", UserRole.MERCHANT)
        ).value();

        mockMvc.perform(get("/admin/boom").header("Authorization", "Bearer " + merchantToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4001))
                .andExpect(jsonPath("$.data").doesNotExist());
    }
}
