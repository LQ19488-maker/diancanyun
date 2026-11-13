package com.dandanyun.catalog;

import com.dandanyun.common.BusinessException;
import com.dandanyun.common.PageResult;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DishService {

    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final long merchantShopId;

    public DishService(
            NamedParameterJdbcTemplate jdbc,
            ObjectMapper objectMapper,
            @Value("${app.merchant-shop-id:10001}") long merchantShopId
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.merchantShopId = merchantShopId;
    }

    public PageResult<Map<String, Object>> page(
            String name,
            Long categoryId,
            Integer status,
            int page,
            int pageSize
    ) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 200);
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE d.shop_id = :merchantShopId");
        params.addValue("merchantShopId", merchantShopId);
        if (hasText(name)) {
            where.append(" AND d.name LIKE :name");
            params.addValue("name", "%" + name.trim() + "%");
        }
        if (categoryId != null) {
            where.append(" AND d.category_id = :categoryId");
            params.addValue("categoryId", categoryId);
        }
        if (status != null) {
            normalizeStatus(status);
            where.append(" AND d.status = :status");
            params.addValue("status", status);
        }
        long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM dish d " + where,
                params,
                Long.class
        );
        params.addValue("limit", safeSize).addValue("offset", (safePage - 1) * safeSize);
        List<Map<String, Object>> records = jdbc.query(
                "SELECT d.id, d.name, d.category_id, c.name AS category_name, d.price, "
                        + "d.image, d.description, d.status, d.flavors_json, d.updated_at "
                        + "FROM dish d JOIN category c ON c.id = d.category_id " + where
                        + " ORDER BY d.updated_at DESC, d.id DESC LIMIT :limit OFFSET :offset",
                params,
                (rs, rowNum) -> dishMap(rs)
        );
        return new PageResult<>(total, records, safePage, safeSize);
    }

    @Transactional
    public Map<String, Object> create(DishRequest request) {
        validate(request);
        ensureDishCategory(request.categoryId());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(
                "INSERT INTO dish(name, category_id, shop_id, price, image, description, status, flavors_json) "
                        + "VALUES(:name, :categoryId, :shopId, :price, :image, :description, :status, :flavorsJson)",
                params(request).addValue("shopId", merchantShopId),
                keyHolder,
                new String[]{"id"}
        );
        return find(keyHolder.getKey().longValue());
    }

    @Transactional
    public Map<String, Object> update(DishRequest request) {
        if (request == null || request.id() == null) {
            throw new BusinessException(1001, "缺少菜品 ID");
        }
        find(request.id());
        validate(request);
        ensureDishCategory(request.categoryId());
        int changed = jdbc.update(
                "UPDATE dish SET name = :name, category_id = :categoryId, price = :price, "
                        + "image = :image, description = :description, status = :status, "
                        + "flavors_json = :flavorsJson, updated_at = CURRENT_TIMESTAMP WHERE id = :id",
                params(request).addValue("id", request.id())
        );
        if (changed == 0) {
            throw new BusinessException(4004, "菜品不存在");
        }
        return find(request.id());
    }

    public boolean delete(Long id) {
        int changed;
        try {
            changed = jdbc.update(
                    "DELETE FROM dish WHERE id = :id AND shop_id = :shopId",
                    Map.of("id", id, "shopId", merchantShopId)
            );
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(4001, "该菜品已被套餐引用，无法删除");
        }
        if (changed == 0) {
            throw new BusinessException(4004, "菜品不存在");
        }
        return true;
    }

    public boolean changeStatus(Long id, int status) {
        normalizeStatus(status);
        int changed = jdbc.update(
                "UPDATE dish SET status = :status, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = :id AND shop_id = :shopId",
                Map.of("id", id, "status", status, "shopId", merchantShopId)
        );
        if (changed == 0) {
            throw new BusinessException(4004, "菜品不存在");
        }
        return true;
    }

    public Map<String, Object> find(Long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT d.id, d.name, d.category_id, c.name AS category_name, d.price, "
                        + "d.image, d.description, d.status, d.flavors_json, d.updated_at "
                        + "FROM dish d JOIN category c ON c.id = d.category_id "
                        + "WHERE d.id = :id AND d.shop_id = :shopId",
                Map.of("id", id, "shopId", merchantShopId),
                (rs, rowNum) -> dishMap(rs)
        );
        if (rows.isEmpty()) {
            throw new BusinessException(4004, "菜品不存在");
        }
        return rows.getFirst();
    }

    private Map<String, Object> dishMap(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("name", rs.getString("name"));
        row.put("categoryId", rs.getLong("category_id"));
        row.put("categoryName", rs.getString("category_name"));
        row.put("price", rs.getBigDecimal("price"));
        row.put("image", rs.getString("image"));
        row.put("description", rs.getString("description"));
        row.put("status", rs.getInt("status"));
        row.put("flavors", readFlavors(rs.getString("flavors_json")));
        row.put("updateTime", toLocalDateTime(rs.getTimestamp("updated_at")));
        return row;
    }

    private List<Map<String, Object>> readFlavors(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            throw new BusinessException(5000, "菜品口味数据损坏");
        }
    }

    private MapSqlParameterSource params(DishRequest request) {
        List<Map<String, Object>> normalizedFlavors = new ArrayList<>();
        if (request.flavors() != null) {
            for (DishRequest.DishFlavor flavor : request.flavors()) {
                if (flavor == null || !hasText(flavor.name())) {
                    continue;
                }
                List<String> values = flavor.values() == null
                        ? List.of()
                        : flavor.values().stream().filter(DishService::hasText).toList();
                if (!values.isEmpty()) {
                    normalizedFlavors.add(Map.of("name", flavor.name().trim(), "values", values));
                }
            }
        }
        try {
            return new MapSqlParameterSource()
                    .addValue("name", request.name().trim())
                    .addValue("categoryId", request.categoryId())
                    .addValue("price", request.price())
                    .addValue("image", blankToEmpty(request.image()))
                    .addValue("description", blankToEmpty(request.description()))
                    .addValue("status", normalizeStatus(request.status() == null ? 1 : request.status()))
                    .addValue("flavorsJson", objectMapper.writeValueAsString(normalizedFlavors));
        } catch (Exception e) {
            throw new BusinessException(1001, "菜品口味格式不正确");
        }
    }

    private void ensureDishCategory(Long categoryId) {
        if (categoryId == null) {
            throw new BusinessException(1001, "请选择菜品分类");
        }
        List<Integer> types = jdbc.query(
                "SELECT type FROM category WHERE id = :id",
                Map.of("id", categoryId),
                (rs, rowNum) -> rs.getInt("type")
        );
        if (types.isEmpty() || types.getFirst() != 1) {
            throw new BusinessException(1001, "请选择有效的菜品分类");
        }
    }

    private void validate(DishRequest request) {
        if (request == null || !hasText(request.name())) {
            throw new BusinessException(1001, "菜品名称不能为空");
        }
        if (request.price() == null || request.price().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(1001, "菜品价格必须大于 0");
        }
        if (request.price().scale() > 2) {
            throw new BusinessException(1001, "菜品价格最多保留两位小数");
        }
        if (request.status() != null) {
            normalizeStatus(request.status());
        }
    }

    private int normalizeStatus(int status) {
        if (status != 0 && status != 1) {
            throw new BusinessException(1001, "状态只能是 0 或 1");
        }
        return status;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
