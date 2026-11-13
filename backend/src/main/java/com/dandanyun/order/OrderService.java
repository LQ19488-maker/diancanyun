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

    public Map<String, Object> menu(Long shopId) {
        Long resolvedShopId = shopId;
        if (resolvedShopId == null) {
            List<Long> ids = jdbc.query(
                    "SELECT id FROM shop WHERE status = 1 AND open_menu = 1 ORDER BY rating DESC LIMIT 1",
                    Map.of(),
                    (rs, rowNum) -> rs.getLong("id")
            );
            resolvedShopId = ids.isEmpty() ? null : ids.getFirst();
        }
        if (resolvedShopId == null) {
            throw new BusinessException(4004, "暂无可点餐店铺");
        }
        Map<String, Object> params = Map.of("shopId", resolvedShopId);
        Map<String, Object> shop = jdbc.queryForMap(
                "SELECT id, name, delivery_fee, delivery_time, status, open_menu FROM shop WHERE id = :shopId",
                params
        );
        if (((Number) shop.get("status")).intValue() != 1
                || ((Number) shop.get("open_menu")).intValue() != 1) {
            throw new BusinessException(4001, "该店铺暂时无法点餐");
        }
        List<Map<String, Object>> categories = jdbc.query(
                "SELECT DISTINCT c.id, c.name, c.sort_no FROM category c "
                        + "JOIN dish d ON d.category_id = c.id "
                        + "WHERE d.shop_id = :shopId AND c.status = 1 AND d.status = 1 "
                        + "ORDER BY c.sort_no, c.id",
                params,
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
                        + "WHERE d.shop_id = :shopId AND d.status = 1 AND c.status = 1 "
                        + "ORDER BY c.sort_no, d.id",
                params,
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
        return Map.of(
                "shop", shopMap(shop),
                "categories", categories,
                "dishes", dishes
        );
    }

    @Transactional
    public Map<String, Object> submit(Long customerId, H5OrderRequest request) {
        if (request == null || request.shopId() == null || request.addressId() == null) {
            throw new BusinessException(1001, "请选择店铺和收货地址");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new BusinessException(1001, "订单里没有有效菜品");
        }
        Map<String, Object> shop = jdbc.queryForMap(
                "SELECT id, name, min_price, delivery_fee, status, open_menu FROM shop WHERE id = :id",
                Map.of("id", request.shopId())
        );
        if (((Number) shop.get("status")).intValue() != 1
                || ((Number) shop.get("open_menu")).intValue() != 1) {
            throw new BusinessException(4001, "该店铺暂时无法点餐");
        }
        Map<String, Object> address = jdbc.queryForMap(
                "SELECT id, tag, name, phone, detail FROM address "
                        + "WHERE id = :id AND user_id = :userId",
                Map.of("id", request.addressId(), "userId", customerId)
        );
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
                    "SELECT id, name, price FROM dish "
                            + "WHERE id = :id AND shop_id = :shopId AND status = 1",
                    Map.of("id", item.dishId(), "shopId", request.shopId()),
                    (rs, rowNum) -> Map.of(
                            "id", rs.getLong("id"),
                            "name", rs.getString("name"),
                            "price", rs.getBigDecimal("price")
                    )
            );
            if (dishes.isEmpty()) {
                throw new BusinessException(4001, "菜品已下架或不属于该店铺");
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
        BigDecimal minPrice = (BigDecimal) shop.get("min_price");
        if (amount.compareTo(minPrice) < 0) {
            throw new BusinessException(4001, "未达到店铺起送价 ¥" + minPrice);
        }
        BigDecimal deliveryFee = (BigDecimal) shop.get("delivery_fee");
        BigDecimal totalAmount = amount.add(deliveryFee).setScale(2, RoundingMode.HALF_UP);
        LocalDateTime now = LocalDateTime.now();
        String orderNo = "DC" + now.format(DateTimeFormatter.ofPattern("yyMMddHHmmss"))
                + String.format("%03d", ThreadLocalRandom.current().nextInt(1000));
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(
                "INSERT INTO orders(order_no, user_name, phone, customer_id, shop_id, shop_name, "
                        + "address, address_name, address_phone, address_detail, address_tag, "
                        + "amount, delivery_fee, pack_fee, total_amount, remark, pay_status, status, "
                        + "created_at, updated_at) VALUES(:orderNo, :userName, :phone, :customerId, "
                        + ":shopId, :shopName, :address, :addressName, :addressPhone, :addressDetail, "
                        + ":addressTag, :amount, :deliveryFee, 0, :totalAmount, :remark, 'PAID', "
                        + "'PENDING', :createdAt, :createdAt)",
                new MapSqlParameterSource()
                        .addValue("orderNo", orderNo)
                        .addValue("userName", address.get("name"))
                        .addValue("phone", address.get("phone"))
                        .addValue("customerId", customerId)
                        .addValue("shopId", shop.get("id"))
                        .addValue("shopName", shop.get("name"))
                        .addValue("address", address.get("detail"))
                        .addValue("addressName", address.get("name"))
                        .addValue("addressPhone", address.get("phone"))
                        .addValue("addressDetail", address.get("detail"))
                        .addValue("addressTag", address.get("tag"))
                        .addValue("amount", amount)
                        .addValue("deliveryFee", deliveryFee)
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
        return queryPage(orderNo, phone, status, startTime, endTime, null, null, page, pageSize);
    }

    public PageResult<Map<String, Object>> customerOrders(Long customerId, int page, int pageSize) {
        return queryPage(null, null, null, null, null, customerId, null, page, pageSize);
    }

    public PageResult<Map<String, Object>> riderTasks(int page, int pageSize) {
        return queryPage(null, null, "ACCEPTED", null, null, null, "UNASSIGNED", page, pageSize);
    }

    public PageResult<Map<String, Object>> riderOrders(Long riderId, String status, int page, int pageSize) {
        return queryPage(null, null, status, null, null, null, "RIDER:" + riderId, page, pageSize);
    }

    private PageResult<Map<String, Object>> queryPage(
            String orderNo,
            String phone,
            String status,
            String startTime,
            String endTime,
            Long customerId,
            String riderFilter,
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
        if (customerId != null) {
            where.append(" AND o.customer_id = :customerId");
            params.addValue("customerId", customerId);
        }
        if ("UNASSIGNED".equals(riderFilter)) {
            where.append(" AND o.rider_id IS NULL");
        } else if (riderFilter != null && riderFilter.startsWith("RIDER:")) {
            where.append(" AND o.rider_id = :riderId");
            params.addValue("riderId", Long.parseLong(riderFilter.substring(6)));
        }
        long total = jdbc.queryForObject("SELECT COUNT(*) FROM orders o " + where, params, Long.class);
        params.addValue("limit", safeSize).addValue("offset", (safePage - 1) * safeSize);
        List<Long> ids = jdbc.query(
                "SELECT o.id FROM orders o " + where
                        + " ORDER BY o.created_at DESC, o.id DESC LIMIT :limit OFFSET :offset",
                params,
                (rs, rowNum) -> rs.getLong("id")
        );
        List<Map<String, Object>> records = ids.stream().map(this::find).toList();
        return new PageResult<>(total, records, safePage, safeSize);
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
    public Map<String, Object> merchantChangeStatus(Long id, String nextStatus) {
        if (!Set.of("ACCEPTED", "CANCELED").contains(nextStatus)) {
            throw new BusinessException(4001, "商家端仅可以接单或取消订单");
        }
        return transition(id, nextStatus, null);
    }

    @Transactional
    public Map<String, Object> riderGrab(Long riderId, Long orderId) {
        Map<String, Object> rider = jdbc.queryForMap(
                "SELECT id, display_name, phone, status, online FROM sys_user "
                        + "WHERE id = :id AND role = 'RIDER'",
                Map.of("id", riderId)
        );
        if (((Number) rider.get("status")).intValue() != 1
                || ((Number) rider.get("online")).intValue() != 1) {
            throw new BusinessException(4001, "骑手当前未上线接单");
        }
        int changed = jdbc.update(
                "UPDATE orders SET rider_id = :riderId, rider_name = :riderName, "
                        + "rider_phone = :riderPhone, status = 'DELIVERING', updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = :orderId AND status = 'ACCEPTED' AND rider_id IS NULL",
                new MapSqlParameterSource()
                        .addValue("riderId", riderId)
                        .addValue("riderName", rider.get("display_name"))
                        .addValue("riderPhone", rider.get("phone"))
                        .addValue("orderId", orderId)
        );
        if (changed == 0) {
            throw new BusinessException(4001, "订单已被其他骑手抢走或状态不允许");
        }
        addTimeline(orderId, "DELIVERING", LocalDateTime.now());
        return find(orderId);
    }

    @Transactional
    public Map<String, Object> riderFinish(Long riderId, Long orderId) {
        int changed = jdbc.update(
                "UPDATE orders SET status = 'DONE', updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = :orderId AND rider_id = :riderId AND status = 'DELIVERING'",
                Map.of("orderId", orderId, "riderId", riderId)
        );
        if (changed == 0) {
            throw new BusinessException(4001, "订单不属于该骑手或状态不允许送达");
        }
        jdbc.update(
                "UPDATE sys_user SET today_done = today_done + 1, total_done = total_done + 1 "
                        + "WHERE id = :riderId AND role = 'RIDER'",
                Map.of("riderId", riderId)
        );
        addTimeline(orderId, "DONE", LocalDateTime.now());
        return find(orderId);
    }

    private Map<String, Object> transition(Long id, String nextStatus, Long riderId) {
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
                "SELECT id, order_no, user_name, phone, customer_id, shop_id, shop_name, table_no, "
                        + "address, address_name, address_phone, address_detail, address_tag, "
                        + "amount, delivery_fee, pack_fee, total_amount, remark, pay_status, status, "
                        + "rider_id, rider_name, rider_phone, created_at FROM orders WHERE id = :id",
                Map.of("id", id),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("orderNo", rs.getString("order_no"));
                    row.put("userName", rs.getString("user_name"));
                    row.put("phone", rs.getString("phone"));
                    row.put("customerId", rs.getObject("customer_id"));
                    row.put("shopId", rs.getObject("shop_id"));
                    row.put("shopName", rs.getString("shop_name"));
                    row.put("tableNo", rs.getString("table_no"));
                    row.put("address", rs.getString("address"));
                    row.put("addressInfo", Map.of(
                            "name", rs.getString("address_name"),
                            "phone", rs.getString("address_phone"),
                            "detail", rs.getString("address_detail"),
                            "tag", rs.getString("address_tag")
                    ));
                    row.put("amount", rs.getBigDecimal("amount"));
                    row.put("deliveryFee", rs.getBigDecimal("delivery_fee"));
                    row.put("packFee", rs.getBigDecimal("pack_fee"));
                    row.put("totalAmount", rs.getBigDecimal("total_amount"));
                    row.put("remark", rs.getString("remark"));
                    row.put("payStatus", rs.getString("pay_status"));
                    row.put("status", rs.getString("status"));
                    row.put("riderId", rs.getObject("rider_id"));
                    row.put("riderName", rs.getString("rider_name"));
                    row.put("riderPhone", rs.getString("rider_phone"));
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

    private Map<String, Object> shopMap(Map<String, Object> row) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", row.get("id"));
        result.put("name", row.get("name"));
        result.put("deliveryFee", row.get("delivery_fee"));
        result.put("deliveryTime", row.get("delivery_time"));
        return result;
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
