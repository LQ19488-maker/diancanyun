package com.dandanyun;

import com.dandanyun.auth.AuthenticatedUser;
import com.dandanyun.auth.JwtTokenService;
import com.dandanyun.auth.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
    void readinessFailsClearlyWithoutDatabase() throws Exception {
        mockMvc.perform(get("/health/ready"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value(503));
    }

    @Test
    void longIdentifiersSerializeAsStrings() {
        String json = objectMapper.writeValueAsString(Map.of("id", 9007199254740993L));
        org.junit.jupiter.api.Assertions.assertEquals("{\"id\":\"9007199254740993\"}", json);
    }

    @Test
    void frontendCompatibilityPathsArePublic() throws Exception {
        mockMvc.perform(get("/user/shops"))
                .andExpect(status().isServiceUnavailable());
        mockMvc.perform(get("/user/menu"))
                .andExpect(status().isServiceUnavailable());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"merchant\",\"password\":\"merchant1234\"}"))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void riderTokenCanReachRiderPortal() throws Exception {
        String riderToken = tokenService.issue(
                new AuthenticatedUser(1002, "rider", "王小明", UserRole.RIDER)
        ).value();

        mockMvc.perform(get("/rider/tasks")
                        .header("Authorization", "Bearer " + riderToken))
                .andExpect(status().isServiceUnavailable());

        mockMvc.perform(get("/admin/rider/page")
                        .header("Authorization", "Bearer " + riderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void enforcesAdminAuthenticationAndH5PublicBoundary() throws Exception {
        String merchantToken = tokenService.issue(
                new AuthenticatedUser(1001, "merchant", "刘添祺", UserRole.MERCHANT)
        ).value();

        mockMvc.perform(get("/admin/me").header("Authorization", "Bearer " + merchantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("MERCHANT"));

        mockMvc.perform(get("/user/me").header("Authorization", "Bearer " + merchantToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        mockMvc.perform(get("/admin/boom").header("Authorization", "Bearer " + merchantToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4001));
    }
}
