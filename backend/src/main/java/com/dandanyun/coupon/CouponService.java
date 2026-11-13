package com.dandanyun.coupon;

import com.dandanyun.common.BusinessException;
import com.dandanyun.common.PageResult;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 优惠券：领券中心、我的券、下单核销。
 * 券的归属与可用性判定统一在这里，避免下单接口和列表接口各算一套。
 */
@Service
public class CouponService {

    private final NamedParameterJdbcTemplate jdbc;

    public CouponService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** 领券中心：在售模板 + 剩余数量 + 当前用户是否已有一张未使用的 */
    public PageResult<Map<String, Object>> templates(Long userId) {
        List<Map<String, Object>> records = jdbc.query(
                "SELECT t.id, t.title, t.threshold, t.amount, t.shop_id, t.description, t.total, "
                        + "(SELECT COUNT(*) FROM user_coupon c WHERE c.template_id = t.id) AS claimed_total, "
                        + "(SELECT COUNT(*) FROM user_coupon c WHERE c.template_id = t.id "
                        + "  AND c.user_id = :userId AND c.status = 'UNUSED' AND c.expire_at > NOW()) AS mine "
                        + "FROM coupon_template t WHERE t.status = 1 ORDER BY t.amount, t.id",
                Map.of("userId", userId),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("title", rs.getString("title"));
                    row.put("threshold", rs.getBigDecimal("threshold"));
                    row.put("amount", rs.getBigDecimal("amount"));
                    row.put("shopId", rs.getObject("shop_id"));
                    row.put("desc", rs.getString("description"));
                    int total = rs.getInt("total");
                    int claimed = rs.getInt("claimed_total");
                    row.put("left", Math.max(total - claimed, 0));
                    row.put("claimed", rs.getInt("mine") > 0);
                    return row;
                }
        );
        return new PageResult<>((long) records.size(), records, 1, records.size());
    }

    /** 领券：同一种券手上只能有一张未使用的，用过或过期后可以再领 */
    @Transactional
    public Map<String, Object> claim(Long userId, Long templateId) {
        List<Map<String, Object>> templates = jdbc.query(
                "SELECT id, title, threshold, amount, shop_id, total, expire_days, status "
                        + "FROM coupon_template WHERE id = :id",
                Map.of("id", templateId),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("title", rs.getString("title"));
                    row.put("threshold", rs.getBigDecimal("threshold"));
                    row.put("amount", rs.getBigDecimal("amount"));
                    row.put("shopId", rs.getObject("shop_id"));
                    row.put("total", rs.getInt("total"));
                    row.put("expireDays", rs.getInt("expire_days"));
                    row.put("status", rs.getInt("status"));
                    return row;
                }
        );
        if (templates.isEmpty() || ((Number) templates.getFirst().get("status")).intValue() != 1) {
            throw new BusinessException(4004, "优惠券不存在或已停止发放");
        }
        Map<String, Object> template = templates.getFirst();
        // 过期的未使用券先置为过期，否则会挡住再次领取
        jdbc.update(
                "UPDATE user_coupon SET status = 'EXPIRED' "
                        + "WHERE user_id = :userId AND template_id = :templateId "
                        + "AND status = 'UNUSED' AND expire_at < NOW()",
                new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("templateId", templateId)
        );
        Integer mine = jdbc.queryForObject(
                "SELECT COUNT(*) FROM user_coupon WHERE user_id = :userId "
                        + "AND template_id = :templateId AND status = 'UNUSED'",
                new MapSqlParameterSource().addValue("userId", userId).addValue("templateId", templateId),
                Integer.class
        );
        if (mine != null && mine > 0) {
            throw new BusinessException(4001, "这张券已经领过了，先用掉手上的再来");
        }
        Integer claimedTotal = jdbc.queryForObject(
                "SELECT COUNT(*) FROM user_coupon WHERE template_id = :templateId",
                new MapSqlParameterSource().addValue("templateId", templateId),
                Integer.class
        );
        if (claimedTotal != null && claimedTotal >= ((Number) template.get("total")).intValue()) {
            throw new BusinessException(4001, "这张券已经抢完了");
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expireAt = now.plusDays(((Number) template.get("expireDays")).longValue());
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("templateId", templateId)
                .addValue("title", template.get("title"))
                .addValue("threshold", template.get("threshold"))
                .addValue("amount", template.get("amount"))
                .addValue("shopId", template.get("shopId"))
                .addValue("claimedAt", now)
                .addValue("expireAt", expireAt);
        jdbc.update(
                "INSERT INTO user_coupon(user_id, template_id, title, threshold, amount, shop_id, "
                        + "status, claimed_at, expire_at) "
                        + "VALUES(:userId, :templateId, :title, :threshold, :amount, :shopId, "
                        + "'UNUSED', :claimedAt, :expireAt)",
                params
        );
        Long id = jdbc.queryForObject(
                "SELECT id FROM user_coupon WHERE user_id = :userId AND template_id = :templateId "
                        + "AND status = 'UNUSED' ORDER BY id DESC LIMIT 1",
                params,
                Long.class
        );
        return findMine(userId, id, null, null);
    }

    /** 我的券：传 orderAmount + shopId 时给出 usable，下单页据此过滤 */
    public PageResult<Map<String, Object>> mine(
            Long userId,
            String status,
            BigDecimal orderAmount,
            Long shopId
    ) {
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase();
        if (!normalizedStatus.isEmpty()
                && !List.of("UNUSED", "USED", "EXPIRED").contains(normalizedStatus)) {
            throw new BusinessException(1001, "券状态只能是 UNUSED、USED 或 EXPIRED");
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("status", normalizedStatus);
        String sql = "SELECT id, user_id, template_id, title, threshold, amount, shop_id, status, "
                + "used_at, expire_at FROM user_coupon WHERE user_id = :userId "
                + (normalizedStatus.isEmpty() ? "" : "AND status = :status ")
                + "ORDER BY status, expire_at";
        List<Map<String, Object>> records = jdbc.query(
                sql, params,
                (rs, rowNum) -> userCouponMap(rs)
        );
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map<String, Object> record : records) {
            rows.add(withUsable(record, orderAmount, shopId));
        }
        return new PageResult<>((long) rows.size(), rows, 1, rows.size());
    }

    /**
     * 下单核销：锁定该券，校验归属、状态、有效期、适用店铺与门槛后置为已使用。
     * 返回券的金额与标题，抵扣金额由调用方按「不超过菜品金额」再取小。
     */
    @Transactional
    public Map<String, Object> consume(Long userId, Long couponId, Long shopId, BigDecimal amount) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, user_id, title, threshold, amount, shop_id, status, expire_at "
                        + "FROM user_coupon WHERE id = :id AND user_id = :userId FOR UPDATE",
                new MapSqlParameterSource().addValue("id", couponId).addValue("userId", userId),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("title", rs.getString("title"));
                    row.put("threshold", rs.getBigDecimal("threshold"));
                    row.put("amount", rs.getBigDecimal("amount"));
                    row.put("shopId", rs.getObject("shop_id"));
                    row.put("status", rs.getString("status"));
                    row.put("expireAt", rs.getTimestamp("expire_at"));
                    return row;
                }
        );
        if (rows.isEmpty()) {
            throw new BusinessException(4001, "优惠券不存在或不属于当前账号");
        }
        Map<String, Object> coupon = rows.getFirst();
        if (!"UNUSED".equals(coupon.get("status"))) {
            throw new BusinessException(4001, "这张优惠券已经用掉了");
        }
        Timestamp expireAt = (Timestamp) coupon.get("expireAt");
        if (expireAt != null && expireAt.toLocalDateTime().isBefore(LocalDateTime.now())) {
            throw new BusinessException(4001, "这张优惠券已经过期");
        }
        Object couponShopId = coupon.get("shopId");
        if (couponShopId != null && !String.valueOf(couponShopId).equals(String.valueOf(shopId))) {
            throw new BusinessException(4001, "这张优惠券只能在下单店铺使用");
        }
        BigDecimal threshold = (BigDecimal) coupon.get("threshold");
        if (threshold != null && threshold.signum() > 0 && amount.compareTo(threshold) < 0) {
            throw new BusinessException(4001, "菜品金额未达到优惠券使用门槛 ¥" + threshold);
        }
        jdbc.update(
                "UPDATE user_coupon SET status = 'USED', used_at = :usedAt WHERE id = :id",
                new MapSqlParameterSource()
                        .addValue("id", coupon.get("id"))
                        .addValue("usedAt", LocalDateTime.now())
        );
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", coupon.get("id"));
        result.put("title", coupon.get("title"));
        result.put("amount", coupon.get("amount"));
        return result;
    }

    /** 下单成功后回填订单编号，便于顾客端在券详情里看到这笔券用在了哪一单 */
    public void bindOrder(Long couponId, Long orderId) {
        if (couponId == null) {
            return;
        }
        jdbc.update(
                "UPDATE user_coupon SET order_id = :orderId WHERE id = :id AND order_id IS NULL",
                new MapSqlParameterSource().addValue("orderId", orderId).addValue("id", couponId)
        );
    }

    private Map<String, Object> findMine(Long userId, Long id, BigDecimal orderAmount, Long shopId) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, user_id, template_id, title, threshold, amount, shop_id, status, used_at, expire_at "
                        + "FROM user_coupon WHERE id = :id AND user_id = :userId",
                new MapSqlParameterSource().addValue("id", id).addValue("userId", userId),
                (rs, rowNum) -> userCouponMap(rs)
        );
        if (rows.isEmpty()) {
            throw new BusinessException(4004, "优惠券不存在");
        }
        return withUsable(rows.getFirst(), orderAmount, shopId);
    }

    private Map<String, Object> userCouponMap(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("couponId", rs.getLong("template_id"));
        row.put("title", rs.getString("title"));
        row.put("threshold", rs.getBigDecimal("threshold"));
        row.put("amount", rs.getBigDecimal("amount"));
        row.put("shopId", rs.getObject("shop_id"));
        row.put("status", rs.getString("status"));
        row.put("usedAt", toLocalDateTime(rs.getTimestamp("used_at")));
        row.put("expireAt", toLocalDateTime(rs.getTimestamp("expire_at")));
        return row;
    }

    private Map<String, Object> withUsable(Map<String, Object> coupon, BigDecimal orderAmount, Long shopId) {
        Map<String, Object> row = new LinkedHashMap<>(coupon);
        if (orderAmount != null && shopId != null) {
            boolean usable = "UNUSED".equals(coupon.get("status"));
            Object couponShopId = coupon.get("shopId");
            if (couponShopId != null && !String.valueOf(couponShopId).equals(String.valueOf(shopId))) {
                usable = false;
            }
            BigDecimal threshold = (BigDecimal) coupon.get("threshold");
            if (threshold != null && orderAmount.compareTo(threshold) < 0) {
                usable = false;
            }
            LocalDateTime expireAt = (LocalDateTime) coupon.get("expireAt");
            if (expireAt != null && expireAt.isBefore(LocalDateTime.now())) {
                usable = false;
            }
            row.put("usable", usable);
        }
        return row;
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
