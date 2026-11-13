package com.dandanyun.order;

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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderService {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Map<String, Set<String>> TRANSITIONS = Map.of(
            "PENDING", Set.of("ACCEPTED", "CANCELED"),
            "ACCEPTED", Set.of("DELIVERING", "CANCELED"),
            "DELIVERING", Set.of("DONE"),
            "DONE", Set.of(),
            "CANCELED", Set.of()
    );

    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public OrderService(NamedParameterJdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> menu(String tableNo) {
        List<Map<String, Object>> categories = jdbc.query(
                "SELECT id, name FROM category WHERE type = 1 AND status = 1 ORDER BY sort_no, id",
                Map.of(),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("name", rs.getString("name"));
                    return row;
                }
        );
        List<Map<String, Object>> dishes = jdbc.query(
                "SELECT d.id, d.name, d.category_id, d.price, d.image, d.description, d.flavors_json "
                        + "FROM dish d JOIN category c ON c.id = d.category_id "
                        + "WHERE d.status = 1 AND c.status = 1 AND c.type = 1 ORDER BY c.sort_no, d.id",
                Map.of(),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("name", rs.getString("name"));
                    row.put("categoryId", rs.getLong("category_id"));
                    row.put("price", rs.getBigDecimal("price"));
                    row.put("image", rs.getString("image"));
                    row.put("description", rs.getString("description"));
                    row.put("flavors", readFlavors(rs.getString("flavors_json")));
                    return row;
                }
        );
        return Map.of("categories", categories, "dishes", dishes, "tableNo", tableNo == null ? "" : tableNo);
    }

    @Transactional
    public Map<String, Object> submit(H5OrderRequest request) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new BusinessException(1001, "订单里没有有效菜品");
        }
        String tableNo = hasText(request.tableNo()) ? request.tableNo().trim() : "3 号桌";
        List<Map<String, Object>> items = new ArrayList<>();
        BigDecimal amount = BigDecimal.ZERO;
        for (H5OrderRequest.Item item : request.items()) {
            if (item == null || item.dishId() == null) {
                continue;
            }
            int quantity = item.quantity() == null ? 1 : item.quantity();
            if (quantity < 1 || quantity > 20) {
                throw new BusinessException(1001, "菜品数量需要在 1 到 20 之间");
            }
            List<Map<String, Object>> dishes = jdbc.query(
                    "SELECT id, name, price FROM dish WHERE id = :id AND status = 1",
                    Map.of("id", item.dishId()),
                    (rs, rowNum) -> Map.of(
                            "id", rs.getLong("id"),
                            "name", rs.getString("name"),
                            "price", rs.getBigDecimal("price")
                    )
            );
            if (dishes.isEmpty()) {
                throw new BusinessException(4001, "菜品已下架或不存在");
            }
            Map<String, Object> dish = dishes.getFirst();
            BigDecimal unitPrice = (BigDecimal) dish.get("price");
            BigDecimal itemAmount = unitPrice.multiply(BigDecimal.valueOf(quantity))
                    .setScale(2, RoundingMode.HALF_UP);
            amount = amount.add(itemAmount);
            List<String> flavors = new ArrayList<>();
            if (item.flavors() != null) {
                for (H5OrderRequest.Flavor flavor : item.flavors()) {
                    if (flavor != null && hasText(flavor.name()) && hasText(flavor.value())) {
                        flavors.add(flavor.name().trim() + ":" + flavor.value().trim());
                    }
                }
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("dishId", dish.get("id"));
            row.put("dishName", dish.get("name"));
            row.put("quantity", quantity);
            row.put("unitPrice", unitPrice);
            row.put("amount", itemAmount);
            row.put("flavors", flavors);
            items.add(row);
        }
        if (items.isEmpty()) {
            throw new BusinessException(1001, "订单里没有有效菜品");
        }
        amount = amount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal packFee = tableNo.contains("打包") ? new BigDecimal("2.00") : BigDecimal.ZERO;
        BigDecimal totalAmount = amount.add(packFee).setScale(2, RoundingMode.HALF_UP);
        LocalDateTime now = LocalDateTime.now();
        String orderNo = "DC" + now.format(DateTimeFormatter.ofPattern("yyMMddHHmmss"))
                + String.format("%03d", ThreadLocalRandom.current().nextInt(1000));
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(
                "INSERT INTO orders(order_no, user_name, phone, table_no, address, amount, pack_fee, "
                        + "total_amount, remark, pay_status, status, created_at, updated_at) "
                        + "VALUES(:orderNo, '顾客', '13800000000', :tableNo, '', :amount, :packFee, "
                        + ":totalAmount, :remark, 'UNPAID', 'PENDING', :createdAt, :createdAt)",
                new MapSqlParameterSource()
                        .addValue("orderNo", orderNo)
                        .addValue("tableNo", tableNo)
                        .addValue("amount", amount)
                        .addValue("packFee", packFee)
                        .addValue("totalAmount", totalAmount)
                        .addValue("remark", blankToEmpty(request.remark()))
                        .addValue("createdAt", now),
                keyHolder,
                new String[]{"id"}
        );
        long orderId = keyHolder.getKey().longValue();
        for (Map<String, Object> item : items) {
            jdbc.update(
                    "INSERT INTO order_item(order_id, dish_id, dish_name, quantity, unit_price, amount, flavors_json) "
                            + "VALUES(:orderId, :dishId, :dishName, :quantity, :unitPrice, :amount, :flavorsJson)",
                    new MapSqlParameterSource()
                            .addValue("orderId", orderId)
                            .addValue("dishId", item.get("dishId"))
                            .addValue("dishName", item.get("dishName"))
                            .addValue("quantity", item.get("quantity"))
                            .addValue("unitPrice", item.get("unitPrice"))
                            .addValue("amount", item.get("amount"))
                            .addValue("flavorsJson", writeFlavors((List<String>) item.get("flavors")))
            );
        }
        addTimeline(orderId, "PENDING", now);
        return find(orderId);
    }

    public PageResult<Map<String, Object>> page(
            String orderNo,
            String phone,
            String status,
            String startTime,
            String endTime,
            int page,
            int pageSize
    ) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 500);
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        if (hasText(orderNo)) {
            where.append(" AND o.order_no LIKE :orderNo");
            params.addValue("orderNo", "%" + orderNo.trim() + "%");
        }
        if (hasText(phone)) {
            where.append(" AND o.phone LIKE :phone");
            params.addValue("phone", "%" + phone.trim() + "%");
        }
        if (hasText(status)) {
            validateStatus(status);
            where.append(" AND o.status = :status");
            params.addValue("status", status);
        }
        if (hasText(startTime)) {
            where.append(" AND o.created_at >= :startTime");
            params.addValue("startTime", parseDateTime(startTime, false));
        }
        if (hasText(endTime)) {
            where.append(" AND o.created_at <= :endTime");
            params.addValue("endTime", parseDateTime(endTime, true));
        }
        long total = jdbc.queryForObject("SELECT COUNT(*) FROM orders o " + where, params, Long.class);
        params.addValue("limit", safeSize).addValue("offset", (safePage - 1) * safeSize);
        List<Map<String, Object>> records = jdbc.query(
                "SELECT o.id FROM orders o " + where
                        + " ORDER BY o.created_at DESC, o.id DESC LIMIT :limit OFFSET :offset",
                params,
                (rs, rowNum) -> Map.of("id", rs.getLong("id"))
        );
        List<Map<String, Object>> fullRecords = records.stream()
                .map(row -> find(((Number) row.get("id")).longValue()))
                .toList();
        return new PageResult<>(total, fullRecords, safePage, safeSize);
    }

    public Map<String, Object> statusCount() {
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("ALL", 0L);
        for (String status : List.of("PENDING", "ACCEPTED", "DELIVERING", "DONE", "CANCELED")) {
            counts.put(status, 0L);
        }
        jdbc.query(
                "SELECT status, COUNT(*) AS amount FROM orders GROUP BY status",
                Map.of(),
                rs -> {
                    String status = rs.getString("status");
                    long amount = rs.getLong("amount");
                    counts.put(status, amount);
                    counts.put("ALL", ((Number) counts.get("ALL")).longValue() + amount);
                }
        );
        return counts;
    }

    @Transactional
    public Map<String, Object> changeStatus(Long id, String nextStatus) {
        validateStatus(nextStatus);
        List<String> currentRows = jdbc.query(
                "SELECT status FROM orders WHERE id = :id",
                Map.of("id", id),
                (rs, rowNum) -> rs.getString("status")
        );
        if (currentRows.isEmpty()) {
            throw new BusinessException(4004, "订单不存在");
        }
        String current = currentRows.getFirst();
        if (!TRANSITIONS.getOrDefault(current, Set.of()).contains(nextStatus)) {
            throw new BusinessException(4001, "订单当前状态（" + current + "）不允许流转到 " + nextStatus);
        }
        int changed = jdbc.update(
                "UPDATE orders SET status = :nextStatus, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = :id AND status = :current",
                Map.of("id", id, "current", current, "nextStatus", nextStatus)
        );
        if (changed == 0) {
            throw new BusinessException(4001, "订单状态已变化，请刷新后重试");
        }
        addTimeline(id, nextStatus, LocalDateTime.now());
        return find(id);
    }

    public Map<String, Object> find(Long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, order_no, user_name, phone, table_no, address, amount, pack_fee, "
                        + "total_amount, remark, pay_status, status, created_at FROM orders WHERE id = :id",
                Map.of("id", id),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("orderNo", rs.getString("order_no"));
                    row.put("userName", rs.getString("user_name"));
                    row.put("phone", rs.getString("phone"));
                    row.put("tableNo", rs.getString("table_no"));
                    row.put("address", rs.getString("address"));
                    row.put("amount", rs.getBigDecimal("amount"));
                    row.put("packFee", rs.getBigDecimal("pack_fee"));
                    row.put("totalAmount", rs.getBigDecimal("total_amount"));
                    row.put("remark", rs.getString("remark"));
                    row.put("payStatus", rs.getString("pay_status"));
                    row.put("status", rs.getString("status"));
                    row.put("createdAt", toLocalDateTime(rs.getTimestamp("created_at")));
                    return row;
                }
        );
        if (rows.isEmpty()) {
            throw new BusinessException(4004, "订单不存在");
        }
        Map<String, Object> order = rows.getFirst();
        order.put("items", jdbc.query(
                "SELECT dish_id, dish_name, quantity, unit_price, amount, flavors_json "
                        + "FROM order_item WHERE order_id = :id ORDER BY id",
                Map.of("id", id),
                (rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("dishId", rs.getLong("dish_id"));
                    item.put("dishName", rs.getString("dish_name"));
                    item.put("quantity", rs.getInt("quantity"));
                    item.put("unitPrice", rs.getBigDecimal("unit_price"));
                    item.put("amount", rs.getBigDecimal("amount"));
                    item.put("flavors", readStringList(rs.getString("flavors_json")));
                    return item;
                }
        ));
        order.put("timeline", jdbc.query(
                "SELECT status, created_at FROM order_timeline WHERE order_id = :id ORDER BY created_at, id",
                Map.of("id", id),
                (rs, rowNum) -> Map.of(
                        "status", rs.getString("status"),
                        "time", toLocalDateTime(rs.getTimestamp("created_at"))
                )
        ));
        return order;
    }

    private void addTimeline(Long orderId, String status, LocalDateTime time) {
        jdbc.update(
                "INSERT INTO order_timeline(order_id, status, created_at) VALUES(:orderId, :status, :createdAt)",
                new MapSqlParameterSource()
                        .addValue("orderId", orderId)
                        .addValue("status", status)
                        .addValue("createdAt", time)
        );
    }

    private List<Map<String, Object>> readFlavors(String json) {
        if (!hasText(json)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            throw new BusinessException(5000, "菜品口味数据损坏");
        }
    }

    private List<String> readStringList(String json) {
        if (!hasText(json)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            throw new BusinessException(5000, "订单口味数据损坏");
        }
    }

    private String writeFlavors(List<String> flavors) {
        try {
            return objectMapper.writeValueAsString(flavors);
        } catch (Exception e) {
            throw new BusinessException(1001, "订单口味格式不正确");
        }
    }

    private LocalDateTime parseDateTime(String value, boolean endOfDay) {
        try {
            if (value.length() == 10) {
                LocalDate date = LocalDate.parse(value);
                return endOfDay ? date.atTime(23, 59, 59) : date.atStartOfDay();
            }
            return LocalDateTime.parse(value.replace('T', ' '), DATE_TIME);
        } catch (DateTimeParseException e) {
            throw new BusinessException(1001, "时间格式应为 yyyy-MM-dd HH:mm:ss");
        }
    }

    private void validateStatus(String status) {
        if (status == null || !TRANSITIONS.containsKey(status)) {
            throw new BusinessException(1001, "无效的订单状态");
        }
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
