package com.dandanyun.catalog;

import com.dandanyun.common.BusinessException;
import com.dandanyun.common.PageResult;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ComboService {

    private final NamedParameterJdbcTemplate jdbc;

    public ComboService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
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
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        if (hasText(name)) {
            where.append(" AND b.name LIKE :name");
            params.addValue("name", "%" + name.trim() + "%");
        }
        if (categoryId != null) {
            where.append(" AND b.category_id = :categoryId");
            params.addValue("categoryId", categoryId);
        }
        if (status != null) {
            normalizeStatus(status);
            where.append(" AND b.status = :status");
            params.addValue("status", status);
        }
        long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM combo b " + where,
                params,
                Long.class
        );
        params.addValue("limit", safeSize).addValue("offset", (safePage - 1) * safeSize);
        List<Map<String, Object>> records = jdbc.query(
                "SELECT b.id, b.name, b.category_id, c.name AS category_name, b.price, "
                        + "b.image, b.description, b.status, b.updated_at "
                        + "FROM combo b JOIN category c ON c.id = b.category_id " + where
                        + " ORDER BY b.updated_at DESC, b.id DESC LIMIT :limit OFFSET :offset",
                params,
                (rs, rowNum) -> comboMap(rs)
        );
        for (Map<String, Object> combo : records) {
            appendDishes(combo, ((Number) combo.get("id")).longValue());
        }
        return new PageResult<>(total, records, safePage, safeSize);
    }

    @Transactional
    public Map<String, Object> create(ComboRequest request) {
        validate(request);
        ensureComboCategory(request.categoryId());
        ensureDishes(request.dishIds());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(
                "INSERT INTO combo(name, category_id, price, image, description, status) "
                        + "VALUES(:name, :categoryId, :price, :image, :description, :status)",
                comboParams(request),
                keyHolder,
                new String[]{"id"}
        );
        long id = keyHolder.getKey().longValue();
        saveDishes(id, request.dishIds());
        return find(id);
    }

    @Transactional
    public Map<String, Object> update(ComboRequest request) {
        if (request == null || request.id() == null) {
            throw new BusinessException(1001, "缺少套餐 ID");
        }
        find(request.id());
        validate(request);
        ensureComboCategory(request.categoryId());
        ensureDishes(request.dishIds());
        int changed = jdbc.update(
                "UPDATE combo SET name = :name, category_id = :categoryId, price = :price, "
                        + "image = :image, description = :description, status = :status, "
                        + "updated_at = CURRENT_TIMESTAMP WHERE id = :id",
                comboParams(request).addValue("id", request.id())
        );
        if (changed == 0) {
            throw new BusinessException(4004, "套餐不存在");
        }
        jdbc.update("DELETE FROM combo_dish WHERE combo_id = :id", Map.of("id", request.id()));
        saveDishes(request.id(), request.dishIds());
        return find(request.id());
    }

    public boolean delete(Long id) {
        int changed;
        try {
            changed = jdbc.update("DELETE FROM combo WHERE id = :id", Map.of("id", id));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(4001, "该套餐已被订单使用，无法删除");
        }
        if (changed == 0) {
            throw new BusinessException(4004, "套餐不存在");
        }
        return true;
    }

    public boolean changeStatus(Long id, int status) {
        normalizeStatus(status);
        int changed = jdbc.update(
                "UPDATE combo SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id",
                Map.of("id", id, "status", status)
        );
        if (changed == 0) {
            throw new BusinessException(4004, "套餐不存在");
        }
        return true;
    }

    public Map<String, Object> find(Long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT b.id, b.name, b.category_id, c.name AS category_name, b.price, "
                        + "b.image, b.description, b.status, b.updated_at "
                        + "FROM combo b JOIN category c ON c.id = b.category_id WHERE b.id = :id",
                Map.of("id", id),
                (rs, rowNum) -> comboMap(rs)
        );
        if (rows.isEmpty()) {
            throw new BusinessException(4004, "套餐不存在");
        }
        Map<String, Object> combo = rows.getFirst();
        appendDishes(combo, id);
        return combo;
    }

    private void appendDishes(Map<String, Object> combo, long comboId) {
        List<Map<String, Object>> dishes = jdbc.query(
                "SELECT d.id, d.name, d.price FROM combo_dish cd "
                        + "JOIN dish d ON d.id = cd.dish_id WHERE cd.combo_id = :comboId "
                        + "ORDER BY cd.sort_no, d.id",
                Map.of("comboId", comboId),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("name", rs.getString("name"));
                    row.put("price", rs.getBigDecimal("price"));
                    return row;
                }
        );
        combo.put("dishes", dishes);
        combo.put("dishIds", dishes.stream().map(row -> row.get("id")).toList());
        combo.put("dishCount", dishes.size());
        BigDecimal originPrice = dishes.stream()
                .map(row -> (BigDecimal) row.get("price"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        combo.put("originPrice", originPrice);
    }

    private void saveDishes(Long comboId, List<Long> dishIds) {
        for (int i = 0; i < dishIds.size(); i++) {
            jdbc.update(
                    "INSERT INTO combo_dish(combo_id, dish_id, sort_no) VALUES(:comboId, :dishId, :sort)",
                    new MapSqlParameterSource()
                            .addValue("comboId", comboId)
                            .addValue("dishId", dishIds.get(i))
                            .addValue("sort", i + 1)
            );
        }
    }

    private void ensureDishes(List<Long> dishIds) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM dish WHERE id IN (:ids)",
                Map.of("ids", dishIds),
                Long.class
        );
        if (count == null || count != dishIds.size()) {
            throw new BusinessException(1001, "套餐中包含不存在的菜品");
        }
    }

    private void ensureComboCategory(Long categoryId) {
        if (categoryId == null) {
            throw new BusinessException(1001, "请选择套餐分类");
        }
        List<Integer> types = jdbc.query(
                "SELECT type FROM category WHERE id = :id",
                Map.of("id", categoryId),
                (rs, rowNum) -> rs.getInt("type")
        );
        if (types.isEmpty() || types.getFirst() != 2) {
            throw new BusinessException(1001, "请选择有效的套餐分类");
        }
    }

    private Map<String, Object> comboMap(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("name", rs.getString("name"));
        row.put("categoryId", rs.getLong("category_id"));
        row.put("categoryName", rs.getString("category_name"));
        row.put("price", rs.getBigDecimal("price"));
        row.put("image", rs.getString("image"));
        row.put("description", rs.getString("description"));
        row.put("status", rs.getInt("status"));
        row.put("updateTime", toLocalDateTime(rs.getTimestamp("updated_at")));
        return row;
    }

    private MapSqlParameterSource comboParams(ComboRequest request) {
        return new MapSqlParameterSource()
                .addValue("name", request.name().trim())
                .addValue("categoryId", request.categoryId())
                .addValue("price", request.price())
                .addValue("image", blankToEmpty(request.image()))
                .addValue("description", blankToEmpty(request.description()))
                .addValue("status", normalizeStatus(request.status() == null ? 1 : request.status()));
    }

    private void validate(ComboRequest request) {
        if (request == null || !hasText(request.name())) {
            throw new BusinessException(1001, "套餐名称不能为空");
        }
        if (request.price() == null || request.price().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(1001, "套餐价格必须大于 0");
        }
        if (request.price().scale() > 2) {
            throw new BusinessException(1001, "套餐价格最多保留两位小数");
        }
        if (request.dishIds() == null || request.dishIds().isEmpty()) {
            throw new BusinessException(1001, "套餐至少需要选择一个菜品");
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
