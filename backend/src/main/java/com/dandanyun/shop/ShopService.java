package com.dandanyun.shop;

import com.dandanyun.common.BusinessException;
import com.dandanyun.common.PageResult;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ShopService {

    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public ShopService(NamedParameterJdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public PageResult<Map<String, Object>> shops(String keyword, int page, int pageSize) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = "";
        if (keyword != null && !keyword.isBlank()) {
            where = " WHERE name LIKE :keyword OR tags_json LIKE :keyword";
            params.addValue("keyword", "%" + keyword.trim() + "%");
        }
        long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM shop" + where,
                params,
                Long.class
        );
        params.addValue("limit", safeSize).addValue("offset", (safePage - 1) * safeSize);
        List<Map<String, Object>> records = jdbc.query(
                "SELECT id, name, image, rating, monthly_sales, min_price, delivery_fee, "
                        + "delivery_time, distance, notice, status, open_menu, tags_json "
                        + "FROM shop" + where + " ORDER BY status DESC, rating DESC, id "
                        + "LIMIT :limit OFFSET :offset",
                params,
                (rs, rowNum) -> shopMap(rs)
        );
        return new PageResult<>(total, records, safePage, safeSize);
    }

    public Map<String, Object> shop(Long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, name, image, rating, monthly_sales, min_price, delivery_fee, "
                        + "delivery_time, distance, notice, status, open_menu, tags_json "
                        + "FROM shop WHERE id = :id",
                Map.of("id", id),
                (rs, rowNum) -> shopMap(rs)
        );
        if (rows.isEmpty()) {
            throw new BusinessException(4004, "店铺不存在");
        }
        return rows.getFirst();
    }

    public List<Map<String, Object>> addresses(Long userId) {
        return jdbc.query(
                "SELECT id, tag, name, phone, detail, is_default, updated_at "
                        + "FROM address WHERE user_id = :userId "
                        + "ORDER BY is_default DESC, updated_at DESC, id DESC",
                Map.of("userId", userId),
                (rs, rowNum) -> addressMap(rs)
        );
    }

    @Transactional
    public Map<String, Object> createAddress(Long userId, AddressRequest request) {
        validateAddress(request);
        boolean makeDefault = request.isDefault() != null && request.isDefault() == 1;
        if (makeDefault) {
            jdbc.update(
                    "UPDATE address SET is_default = 0 WHERE user_id = :userId",
                    Map.of("userId", userId)
            );
        }
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(
                "INSERT INTO address(user_id, tag, name, phone, detail, is_default) "
                        + "VALUES(:userId, :tag, :name, :phone, :detail, :isDefault)",
                addressParams(userId, request).addValue("isDefault", makeDefault ? 1 : 0),
                keyHolder,
                new String[]{"id"}
        );
        ensureSingleDefault(userId);
        return findAddress(userId, keyHolder.getKey().longValue());
    }

    @Transactional
    public Map<String, Object> updateAddress(Long userId, AddressRequest request) {
        if (request == null || request.id() == null) {
            throw new BusinessException(1001, "缺少地址 ID");
        }
        findAddress(userId, request.id());
        validateAddress(request);
        boolean makeDefault = request.isDefault() != null && request.isDefault() == 1;
        if (makeDefault) {
            jdbc.update(
                    "UPDATE address SET is_default = 0 WHERE user_id = :userId",
                    Map.of("userId", userId)
            );
        }
        jdbc.update(
                "UPDATE address SET tag = :tag, name = :name, phone = :phone, detail = :detail, "
                        + "is_default = :isDefault, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = :id AND user_id = :userId",
                addressParams(userId, request)
                        .addValue("id", request.id())
                        .addValue("isDefault", makeDefault ? 1 : 0)
        );
        ensureSingleDefault(userId);
        return findAddress(userId, request.id());
    }

    @Transactional
    public Map<String, Object> setDefault(Long userId, Long id) {
        findAddress(userId, id);
        jdbc.update("UPDATE address SET is_default = 0 WHERE user_id = :userId", Map.of("userId", userId));
        jdbc.update(
                "UPDATE address SET is_default = 1, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = :id AND user_id = :userId",
                Map.of("id", id, "userId", userId)
        );
        return findAddress(userId, id);
    }

    public boolean removeAddress(Long userId, Long id) {
        int changed = jdbc.update(
                "DELETE FROM address WHERE id = :id AND user_id = :userId",
                Map.of("id", id, "userId", userId)
        );
        if (changed == 0) {
            throw new BusinessException(4004, "地址不存在");
        }
        ensureSingleDefault(userId);
        return true;
    }

    public Map<String, Object> findAddress(Long userId, Long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, tag, name, phone, detail, is_default, updated_at "
                        + "FROM address WHERE id = :id AND user_id = :userId",
                Map.of("id", id, "userId", userId),
                (rs, rowNum) -> addressMap(rs)
        );
        if (rows.isEmpty()) {
            throw new BusinessException(4004, "地址不存在");
        }
        return rows.getFirst();
    }

    private void ensureSingleDefault(Long userId) {
        List<Long> defaults = jdbc.query(
                "SELECT id FROM address WHERE user_id = :userId AND is_default = 1 ORDER BY updated_at DESC",
                Map.of("userId", userId),
                (rs, rowNum) -> rs.getLong("id")
        );
        if (defaults.isEmpty()) {
            List<Long> any = jdbc.query(
                    "SELECT id FROM address WHERE user_id = :userId ORDER BY updated_at DESC LIMIT 1",
                    Map.of("userId", userId),
                    (rs, rowNum) -> rs.getLong("id")
            );
            if (!any.isEmpty()) {
                jdbc.update("UPDATE address SET is_default = 1 WHERE id = :id", Map.of("id", any.getFirst()));
            }
        } else if (defaults.size() > 1) {
            for (int i = 1; i < defaults.size(); i++) {
                jdbc.update("UPDATE address SET is_default = 0 WHERE id = :id", Map.of("id", defaults.get(i)));
            }
        }
    }

    private MapSqlParameterSource addressParams(Long userId, AddressRequest request) {
        return new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("tag", blankDefault(request.tag(), "其他"))
                .addValue("name", request.name().trim())
                .addValue("phone", request.phone().trim())
                .addValue("detail", request.detail().trim());
    }

    private void validateAddress(AddressRequest request) {
        if (request == null
                || request.name() == null || request.name().isBlank()
                || request.phone() == null || request.phone().isBlank()
                || request.detail() == null || request.detail().isBlank()) {
            throw new BusinessException(1001, "收货人、手机号和详细地址不能为空");
        }
    }

    private Map<String, Object> shopMap(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("name", rs.getString("name"));
        row.put("image", rs.getString("image"));
        row.put("rating", rs.getBigDecimal("rating"));
        row.put("monthlySales", rs.getInt("monthly_sales"));
        row.put("minPrice", rs.getBigDecimal("min_price"));
        row.put("deliveryFee", rs.getBigDecimal("delivery_fee"));
        row.put("deliveryTime", rs.getInt("delivery_time"));
        row.put("distance", rs.getString("distance"));
        row.put("notice", rs.getString("notice"));
        row.put("status", rs.getInt("status"));
        row.put("openMenu", rs.getInt("open_menu") == 1);
        row.put("tags", readTags(rs.getString("tags_json")));
        return row;
    }

    private Object readTags(String json) {
        try {
            return objectMapper.readValue(json == null ? "[]" : json, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private Map<String, Object> addressMap(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("tag", rs.getString("tag"));
        row.put("name", rs.getString("name"));
        row.put("phone", rs.getString("phone"));
        row.put("detail", rs.getString("detail"));
        row.put("isDefault", rs.getInt("is_default"));
        row.put("updateTime", rs.getTimestamp("updated_at") == null
                ? null
                : rs.getTimestamp("updated_at").toLocalDateTime());
        return row;
    }

    private static String blankDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
