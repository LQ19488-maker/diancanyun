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

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CategoryService {

    private final NamedParameterJdbcTemplate jdbc;

    public CategoryService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public PageResult<Map<String, Object>> page(
            Integer type,
            String name,
            Integer status,
            int page,
            int pageSize
    ) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        if (type != null) {
            normalizeType(type);
            where.append(" AND c.type = :type");
            params.addValue("type", type);
        }
        if (hasText(name)) {
            where.append(" AND c.name LIKE :name");
            params.addValue("name", "%" + name.trim() + "%");
        }
        if (status != null) {
            normalizeStatus(status);
            where.append(" AND c.status = :status");
            params.addValue("status", status);
        }
        long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM category c " + where,
                params,
                Long.class
        );
        params.addValue("limit", safeSize).addValue("offset", (safePage - 1) * safeSize);
        List<Map<String, Object>> records = jdbc.query(
                "SELECT c.id, c.name, c.type, c.sort_no, c.status, c.updated_at, "
                        + "CASE WHEN c.type = 1 THEN "
                        + "(SELECT COUNT(*) FROM dish d WHERE d.category_id = c.id) "
                        + "ELSE (SELECT COUNT(*) FROM combo b WHERE b.category_id = c.id) END AS dish_count "
                        + "FROM category c " + where
                        + " ORDER BY c.type, c.sort_no, c.id LIMIT :limit OFFSET :offset",
                params,
                (rs, rowNum) -> categoryMap(rs)
        );
        return new PageResult<>(total, records, safePage, safeSize);
    }

    @Transactional
    public Map<String, Object> create(CategoryRequest request) {
        validate(request, false);
        KeyHolder keyHolder = new GeneratedKeyHolder();
        try {
            jdbc.update(
                    "INSERT INTO category(name, type, sort_no, status) VALUES(:name, :type, :sort, :status)",
                    new MapSqlParameterSource()
                            .addValue("name", request.name().trim())
                            .addValue("type", normalizeType(request.type()))
                            .addValue("sort", request.sort() == null ? 1 : request.sort())
                            .addValue("status", normalizeStatus(request.status() == null ? 1 : request.status())),
                    keyHolder,
                    new String[]{"id"}
            );
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(4001, "同类型下已存在同名分类");
        }
        Number id = keyHolder.getKey();
        if (id == null) {
            throw new BusinessException(5000, "创建分类失败");
        }
        return find(id.longValue());
    }

    @Transactional
    public Map<String, Object> update(CategoryRequest request) {
        if (request.id() == null) {
            throw new BusinessException(1001, "缺少分类 ID");
        }
        find(request.id());
        validate(request, true);
        try {
            int changed = jdbc.update(
                    "UPDATE category SET name = :name, sort_no = :sort, status = :status, "
                            + "updated_at = CURRENT_TIMESTAMP WHERE id = :id",
                    new MapSqlParameterSource()
                            .addValue("name", request.name().trim())
                            .addValue("sort", request.sort() == null ? 1 : request.sort())
                            .addValue("status", normalizeStatus(request.status() == null ? 1 : request.status()))
                            .addValue("id", request.id())
            );
            if (changed == 0) {
                throw new BusinessException(4004, "分类不存在");
            }
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(4001, "同类型下已存在同名分类");
        }
        return find(request.id());
    }

    public boolean delete(Long id) {
        CategoryCounts counts = counts(id);
        if (counts.dishes() > 0) {
            throw new BusinessException(4001, "该分类下还有 " + counts.dishes() + " 个菜品，无法删除");
        }
        if (counts.combos() > 0) {
            throw new BusinessException(4001, "该分类下还有 " + counts.combos() + " 个套餐，无法删除");
        }
        int changed = jdbc.update("DELETE FROM category WHERE id = :id", Map.of("id", id));
        if (changed == 0) {
            throw new BusinessException(4004, "分类不存在");
        }
        return true;
    }

    public List<Map<String, Object>> getFlavors(Long categoryId) {
        find(categoryId);
        List<Map<String, Object>> flavors = jdbc.query(
                "SELECT id, name FROM flavor WHERE category_id = :categoryId ORDER BY sort_no, id",
                Map.of("categoryId", categoryId),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("name", rs.getString("name"));
                    row.put("values", new ArrayList<Map<String, Object>>());
                    return row;
                }
        );
        for (Map<String, Object> flavor : flavors) {
            long flavorId = ((Number) flavor.get("id")).longValue();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> values = (List<Map<String, Object>>) flavor.get("values");
            values.addAll(jdbc.query(
                    "SELECT id, name FROM flavor_value WHERE flavor_id = :flavorId ORDER BY sort_no, id",
                    Map.of("flavorId", flavorId),
                    (rs, rowNum) -> {
                        Map<String, Object> value = new LinkedHashMap<>();
                        value.put("id", rs.getLong("id"));
                        value.put("name", rs.getString("name"));
                        return value;
                    }
            ));
        }
        return flavors;
    }

    @Transactional
    public List<Map<String, Object>> saveFlavors(Long categoryId, FlavorConfigRequest request) {
        find(categoryId);
        List<FlavorConfigRequest.FlavorConfig> flavors =
                request == null || request.flavors() == null ? List.of() : request.flavors();
        jdbc.update("DELETE FROM flavor WHERE category_id = :categoryId", Map.of("categoryId", categoryId));
        for (int i = 0; i < flavors.size(); i++) {
            FlavorConfigRequest.FlavorConfig flavor = flavors.get(i);
            if (flavor == null || !hasText(flavor.name())) {
                throw new BusinessException(1001, "口味名称不能为空");
            }
            KeyHolder flavorKey = new GeneratedKeyHolder();
            jdbc.update(
                    "INSERT INTO flavor(category_id, name, sort_no) VALUES(:categoryId, :name, :sort)",
                    new MapSqlParameterSource()
                            .addValue("categoryId", categoryId)
                            .addValue("name", flavor.name().trim())
                            .addValue("sort", i + 1),
                    flavorKey,
                    new String[]{"id"}
            );
            long flavorId = flavorKey.getKey().longValue();
            List<FlavorConfigRequest.FlavorValueConfig> values =
                    flavor.values() == null ? List.of() : flavor.values();
            if (values.isEmpty()) {
                throw new BusinessException(1001, "每个口味至少需要一个值");
            }
            for (int j = 0; j < values.size(); j++) {
                FlavorConfigRequest.FlavorValueConfig value = values.get(j);
                if (value == null || !hasText(value.name())) {
                    throw new BusinessException(1001, "口味值不能为空");
                }
                jdbc.update(
                        "INSERT INTO flavor_value(flavor_id, name, sort_no) VALUES(:flavorId, :name, :sort)",
                        new MapSqlParameterSource()
                                .addValue("flavorId", flavorId)
                                .addValue("name", value.name().trim())
                                .addValue("sort", j + 1)
                );
            }
        }
        return getFlavors(categoryId);
    }

    public Map<String, Object> find(Long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT c.id, c.name, c.type, c.sort_no, c.status, c.updated_at, "
                        + "CASE WHEN c.type = 1 THEN "
                        + "(SELECT COUNT(*) FROM dish d WHERE d.category_id = c.id) "
                        + "ELSE (SELECT COUNT(*) FROM combo b WHERE b.category_id = c.id) END AS dish_count "
                        + "FROM category c WHERE c.id = :id",
                Map.of("id", id),
                (rs, rowNum) -> categoryMap(rs)
        );
        if (rows.isEmpty()) {
            throw new BusinessException(4004, "分类不存在");
        }
        return rows.getFirst();
    }

    private CategoryCounts counts(Long id) {
        find(id);
        long dishes = jdbc.queryForObject(
                "SELECT COUNT(*) FROM dish WHERE category_id = :id",
                Map.of("id", id),
                Long.class
        );
        long combos = jdbc.queryForObject(
                "SELECT COUNT(*) FROM combo WHERE category_id = :id",
                Map.of("id", id),
                Long.class
        );
        return new CategoryCounts(dishes, combos);
    }

    private Map<String, Object> categoryMap(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("name", rs.getString("name"));
        row.put("type", rs.getInt("type"));
        row.put("sort", rs.getInt("sort_no"));
        row.put("status", rs.getInt("status"));
        row.put("dishCount", rs.getInt("dish_count"));
        row.put("updateTime", toLocalDateTime(rs.getTimestamp("updated_at")));
        return row;
    }

    private void validate(CategoryRequest request, boolean edit) {
        if (request == null || !hasText(request.name())) {
            throw new BusinessException(1001, "分类名称不能为空");
        }
        if (!edit) {
            normalizeType(request.type());
        }
        if (request.sort() != null && (request.sort() < 1 || request.sort() > 999)) {
            throw new BusinessException(1001, "排序号需要在 1 到 999 之间");
        }
        if (request.status() != null) {
            normalizeStatus(request.status());
        }
    }

    private int normalizeType(Integer type) {
        if (type == null || (type != 1 && type != 2)) {
            throw new BusinessException(1001, "分类类型只能是 1 或 2");
        }
        return type;
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

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private record CategoryCounts(long dishes, long combos) {
    }
}
