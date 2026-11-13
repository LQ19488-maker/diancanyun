package com.dandanyun.system;

import com.dandanyun.auth.PasswordService;
import com.dandanyun.auth.UserRole;
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
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RiderService {

    private static final String DEFAULT_PASSWORD = "rider123456";
    /** 基础配送费：骑手收入口径里唯一的价格基准 */
    private static final BigDecimal BASE_DELIVERY_PRICE = new BigDecimal("5.00");
    private static final BigDecimal SUBSIDY_RAIN = new BigDecimal("2.00");
    private static final BigDecimal SUBSIDY_NIGHT = new BigDecimal("2.00");
    private static final BigDecimal SUBSIDY_MORNING_PEAK = new BigDecimal("1.50");

    private final NamedParameterJdbcTemplate jdbc;
    private final PasswordService passwordService;

    public RiderService(NamedParameterJdbcTemplate jdbc, PasswordService passwordService) {
        this.jdbc = jdbc;
        this.passwordService = passwordService;
    }

    public PageResult<Map<String, Object>> page(
            String name,
            String code,
            String area,
            Integer online,
            Integer status,
            int page,
            int pageSize
    ) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE role = 'RIDER'");
        if (hasText(name)) {
            where.append(" AND display_name LIKE :name");
            params.addValue("name", "%" + name.trim() + "%");
        }
        if (hasText(code)) {
            where.append(" AND rider_code LIKE :code");
            params.addValue("code", "%" + code.trim() + "%");
        }
        if (hasText(area)) {
            where.append(" AND area = :area");
            params.addValue("area", area.trim());
        }
        if (online != null) {
            where.append(" AND online = :online");
            params.addValue("online", normalizeFlag(online, "在线状态"));
        }
        if (status != null) {
            where.append(" AND status = :status");
            params.addValue("status", normalizeFlag(status, "账号状态"));
        }
        long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sys_user " + where,
                params,
                Long.class
        );
        params.addValue("limit", safeSize).addValue("offset", (safePage - 1) * safeSize);
        List<Map<String, Object>> records = jdbc.query(
                "SELECT id, rider_code, username, display_name, phone, area, vehicle, status, "
                        + "online, today_done, total_done, rating, updated_at "
                        + "FROM sys_user " + where
                        + " ORDER BY updated_at DESC, id DESC LIMIT :limit OFFSET :offset",
                params,
                (rs, rowNum) -> riderMap(rs)
        );
        for (Map<String, Object> rider : records) {
            long riderId = ((Number) rider.get("id")).longValue();
            rider.put("onTheWay", onTheWay(riderId));
            rider.put("doneCount", doneCount(riderId));
        }
        return new PageResult<>(total, records, safePage, safeSize);
    }

    @Transactional
    public Map<String, Object> create(RiderRequest request) {
        validate(request, false);
        String username = request.username().trim();
        KeyHolder keyHolder = new GeneratedKeyHolder();
        try {
            jdbc.update(
                    "INSERT INTO sys_user(username, display_name, password_hash, role, status, phone, "
                            + "area, vehicle, online) VALUES(:username, :name, :passwordHash, 'RIDER', "
                            + ":status, :phone, :area, :vehicle, :online)",
                    baseParams(request)
                            .addValue("username", username)
                            .addValue("passwordHash", passwordService.hash(DEFAULT_PASSWORD)),
                    keyHolder,
                    new String[]{"id"}
            );
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(4001, "骑手账号已存在");
        }
        long id = keyHolder.getKey().longValue();
        jdbc.update(
                "UPDATE sys_user SET rider_code = :code WHERE id = :id",
                Map.of("id", id, "code", "R" + String.format("%04d", id))
        );
        return find(id);
    }

    @Transactional
    public Map<String, Object> update(RiderRequest request) {
        if (request == null || request.id() == null) {
            throw new BusinessException(1001, "缺少骑手 ID");
        }
        find(request.id());
        validate(request, true);
        int changed = jdbc.update(
                "UPDATE sys_user SET display_name = :name, phone = :phone, area = :area, "
                        + "vehicle = :vehicle, status = :status, online = :online, "
                        + "updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = 'RIDER'",
                baseParams(request).addValue("id", request.id())
        );
        if (changed == 0) {
            throw new BusinessException(4004, "骑手不存在");
        }
        return find(request.id());
    }

    public boolean delete(Long id) {
        Map<String, Object> rider = find(id);
        if (onTheWay(id) > 0) {
            throw new BusinessException(4001, "该骑手有在途订单，不能删除");
        }
        int changed = jdbc.update(
                "DELETE FROM sys_user WHERE id = :id AND role = 'RIDER'",
                Map.of("id", id)
        );
        if (changed == 0) {
            throw new BusinessException(4004, "骑手不存在");
        }
        return true;
    }

    public boolean changeStatus(Long id, int status) {
        normalizeFlag(status, "账号状态");
        find(id);
        int changed = jdbc.update(
                "UPDATE sys_user SET status = :status, online = CASE WHEN :status = 0 THEN 0 ELSE online END, "
                        + "updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = 'RIDER'",
                Map.of("id", id, "status", status)
        );
        if (changed == 0) {
            throw new BusinessException(4004, "骑手不存在");
        }
        return true;
    }

    public boolean changeOnline(Long id, int online) {
        normalizeFlag(online, "在线状态");
        Map<String, Object> rider = find(id);
        if (Number.class.cast(rider.get("status")).intValue() == 0 && online == 1) {
            throw new BusinessException(4001, "停用账号不能上线接单");
        }
        jdbc.update(
                "UPDATE sys_user SET online = :online, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = :id AND role = 'RIDER'",
                Map.of("id", id, "online", online)
        );
        return true;
    }

    public Map<String, Object> find(Long id) {
        List<Map<String, Object>> rows = jdbc.query(
                "SELECT id, rider_code, username, display_name, phone, area, vehicle, status, "
                        + "online, today_done, total_done, rating, updated_at "
                        + "FROM sys_user WHERE id = :id AND role = 'RIDER'",
                Map.of("id", id),
                (rs, rowNum) -> riderMap(rs)
        );
        if (rows.isEmpty()) {
            throw new BusinessException(4004, "骑手不存在");
        }
        Map<String, Object> rider = rows.getFirst();
        rider.put("onTheWay", onTheWay(id));
        rider.put("doneCount", doneCount(id));
        return rider;
    }

    public Map<String, Object> stats(Long id) {
        Map<String, Object> rider = find(id);
        int availableTasks = jdbc.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE status = 'ACCEPTED' AND rider_id IS NULL",
                Map.of(),
                Integer.class
        );
        int todayDone = doneToday(id);
        BigDecimal baseIncome = BASE_DELIVERY_PRICE.multiply(BigDecimal.valueOf((long) doneTotal(id)))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal subsidyPer = subsidyPer();
        BigDecimal todaySubsidy = subsidyPer.multiply(BigDecimal.valueOf((long) todayDone))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalIncome = baseIncome.add(todaySubsidy).setScale(2, RoundingMode.HALF_UP);
        BigDecimal balance = totalIncome.subtract(withdrawnTotal(id)).setScale(2, RoundingMode.HALF_UP);
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("online", rider.get("online"));
        stats.put("todayDone", todayDone);
        stats.put("onTheWay", rider.get("onTheWay"));
        stats.put("rating", rider.get("rating"));
        stats.put("totalDone", rider.get("totalDone"));
        stats.put("income", totalIncome);
        stats.put("baseIncome", baseIncome);
        stats.put("todaySubsidy", todaySubsidy);
        stats.put("subsidyPer", subsidyPer);
        stats.put("balance", balance);
        stats.put("availableTasks", availableTasks);
        return stats;
    }

    /**
     * 钱包：收入 = 完成单数 × 基础配送费 + 当日完成单数 × 天气补贴；
     * 可提现余额 = 累计收入 − 已提现。工作台卡片、钱包页、提现校验都读这一份数据。
     */
    public Map<String, Object> wallet(Long riderId) {
        int doneTotal = doneTotal(riderId);
        int todayDone = doneToday(riderId);
        BigDecimal baseIncome = BASE_DELIVERY_PRICE.multiply(BigDecimal.valueOf((long) doneTotal))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal todayBase = BASE_DELIVERY_PRICE.multiply(BigDecimal.valueOf((long) todayDone))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal subsidyPer = subsidyPer();
        BigDecimal todaySubsidy = subsidyPer.multiply(BigDecimal.valueOf((long) todayDone))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalIncome = baseIncome.add(todaySubsidy).setScale(2, RoundingMode.HALF_UP);
        BigDecimal todayIncome = todayBase.add(todaySubsidy).setScale(2, RoundingMode.HALF_UP);
        BigDecimal withdrawn = withdrawnTotal(riderId);
        BigDecimal balance = totalIncome.subtract(withdrawn).setScale(2, RoundingMode.HALF_UP);
        Map<String, Object> wallet = new LinkedHashMap<>();
        wallet.put("balance", balance);
        wallet.put("totalIncome", totalIncome);
        wallet.put("baseIncome", baseIncome);
        wallet.put("todayIncome", todayIncome);
        wallet.put("todaySubsidy", todaySubsidy);
        wallet.put("subsidyPer", subsidyPer);
        wallet.put("withdrawn", withdrawn);
        wallet.put("basePrice", BASE_DELIVERY_PRICE);
        wallet.put("records", withdrawRecords(riderId));
        return wallet;
    }

    /**
     * 天气：演示环境没有外部天气源，这里返回固定的城市与天气，补贴只按时段计算
     * （早高峰 1.5 元、夜间 2 元）。雨天补贴规则保留，接入真实天气后把 rainy 换成实况即可。
     */
    public Map<String, Object> weather(Long riderId) {
        Map<String, Object> rider = find(riderId);
        int hour = LocalTime.now().getHour();
        boolean rainy = false;
        BigDecimal amount = BigDecimal.ZERO;
        String reason = "当前时段没有补贴";
        if (rainy) {
            amount = SUBSIDY_RAIN;
            reason = "雨天配送补贴";
        } else if (hour >= 21 || hour < 5) {
            amount = SUBSIDY_NIGHT;
            reason = "夜间配送补贴（21:00–05:00）";
        } else if (hour >= 7 && hour < 9) {
            amount = SUBSIDY_MORNING_PEAK;
            reason = "早高峰补贴（07:00–09:00）";
        }
        Map<String, Object> subsidy = new LinkedHashMap<>();
        subsidy.put("active", amount.signum() > 0);
        subsidy.put("amount", amount);
        subsidy.put("reason", reason);
        Map<String, Object> weather = new LinkedHashMap<>();
        weather.put("city", "北京");
        weather.put("condition", rainy ? "小雨" : "晴");
        weather.put("icon", rainy ? "rain" : "sunny");
        weather.put("temperature", rainy ? 15 : 18);
        weather.put("feelsLike", rainy ? 14 : 17);
        weather.put("wind", "东南风 2 级");
        weather.put("humidity", rainy ? 82 : 46);
        weather.put("tomorrow", rainy ? "阴 12~19℃" : "多云 12~20℃");
        weather.put("subsidy", subsidy);
        weather.put("updateTime", LocalDateTime.now().withSecond(0).withNano(0));
        weather.put("area", rider.get("area"));
        return weather;
    }

    /** 提现：校验 1 ≤ 金额 ≤ 可提现余额，成功后余额扣减并留一条记录 */
    @Transactional
    public Map<String, Object> withdraw(Long riderId, BigDecimal amount, String channel) {
        if (amount == null || amount.compareTo(BigDecimal.ONE) < 0) {
            throw new BusinessException(1001, "提现金额至少 1 元");
        }
        BigDecimal normalized = amount.setScale(2, RoundingMode.HALF_UP);
        String resolvedChannel = channel == null || channel.isBlank() ? "微信" : channel.trim();
        if (resolvedChannel.length() > 32) {
            throw new BusinessException(1001, "提现渠道名称过长");
        }
        // 锁住骑手记录，避免并发提现把余额提成负数
        jdbc.queryForList("SELECT id FROM sys_user WHERE id = :id FOR UPDATE", Map.of("id", riderId));
        BigDecimal balance = walletBalance(riderId);
        if (normalized.compareTo(balance) > 0) {
            throw new BusinessException(4001, "超过可提现余额 ¥" + balance);
        }
        jdbc.update(
                "INSERT INTO wallet_record(rider_id, type, amount, channel, status, created_at) "
                        + "VALUES(:riderId, 'WITHDRAW', :amount, :channel, 'DONE', :createdAt)",
                new MapSqlParameterSource()
                        .addValue("riderId", riderId)
                        .addValue("amount", normalized)
                        .addValue("channel", resolvedChannel)
                        .addValue("createdAt", LocalDateTime.now())
        );
        return wallet(riderId);
    }

    /** 当前时段的每单补贴，天气页、钱包页与收入口径共用 */
    public BigDecimal subsidyPer() {
        int hour = LocalTime.now().getHour();
        if (hour >= 21 || hour < 5) {
            return SUBSIDY_NIGHT.setScale(2, RoundingMode.HALF_UP);
        }
        if (hour >= 7 && hour < 9) {
            return SUBSIDY_MORNING_PEAK.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal walletBalance(Long riderId) {
        int todayDone = doneToday(riderId);
        BigDecimal totalIncome = BASE_DELIVERY_PRICE
                .multiply(BigDecimal.valueOf((long) doneTotal(riderId)))
                .add(subsidyPer().multiply(BigDecimal.valueOf((long) todayDone)))
                .setScale(2, RoundingMode.HALF_UP);
        return totalIncome.subtract(withdrawnTotal(riderId)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal withdrawnTotal(Long riderId) {
        BigDecimal withdrawn = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM wallet_record "
                        + "WHERE rider_id = :id AND type = 'WITHDRAW' AND status = 'DONE'",
                Map.of("id", riderId),
                BigDecimal.class
        );
        return withdrawn == null ? BigDecimal.ZERO : withdrawn.setScale(2, RoundingMode.HALF_UP);
    }

    private List<Map<String, Object>> withdrawRecords(Long riderId) {
        List<Map<String, Object>> records = jdbc.query(
                "SELECT id, amount, channel, status, created_at FROM wallet_record "
                        + "WHERE rider_id = :id ORDER BY created_at DESC, id DESC LIMIT 20",
                Map.of("id", riderId),
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("amount", rs.getBigDecimal("amount"));
                    row.put("channel", rs.getString("channel"));
                    row.put("status", rs.getString("status"));
                    row.put("createdAt", toLocalDateTime(rs.getTimestamp("created_at")));
                    return row;
                }
        );
        return records == null ? new ArrayList<>() : records;
    }

    private int doneTotal(Long riderId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE rider_id = :id AND status = 'DONE'",
                Map.of("id", riderId),
                Integer.class
        );
        return count == null ? 0 : count;
    }

    private int doneToday(Long riderId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE rider_id = :id AND status = 'DONE' "
                        + "AND DATE(updated_at) = CURRENT_DATE",
                Map.of("id", riderId),
                Integer.class
        );
        return count == null ? 0 : count;
    }

    public int onTheWay(Long riderId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE rider_id = :id AND status = 'DELIVERING'",
                Map.of("id", riderId),
                Integer.class
        );
        return count == null ? 0 : count;
    }

    public int doneCount(Long riderId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE rider_id = :id AND status = 'DONE'",
                Map.of("id", riderId),
                Integer.class
        );
        return count == null ? 0 : count;
    }

    private Map<String, Object> riderMap(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("code", rs.getString("rider_code"));
        row.put("username", rs.getString("username"));
        row.put("name", rs.getString("display_name"));
        row.put("phone", rs.getString("phone"));
        row.put("area", rs.getString("area"));
        row.put("vehicle", rs.getString("vehicle"));
        row.put("status", rs.getInt("status"));
        row.put("online", rs.getInt("online"));
        row.put("todayDone", rs.getInt("today_done"));
        row.put("totalDone", rs.getInt("total_done"));
        row.put("rating", rs.getBigDecimal("rating"));
        row.put("updateTime", toLocalDateTime(rs.getTimestamp("updated_at")));
        return row;
    }

    private MapSqlParameterSource baseParams(RiderRequest request) {
        return new MapSqlParameterSource()
                .addValue("name", request.name().trim())
                .addValue("phone", request.phone().trim())
                .addValue("area", request.area().trim())
                .addValue("vehicle", request.vehicle())
                .addValue("status", request.status() == null ? 1 : normalizeFlag(request.status(), "账号状态"))
                .addValue("online", request.online() == null ? 0 : normalizeFlag(request.online(), "在线状态"));
    }

    private void validate(RiderRequest request, boolean edit) {
        if (request == null) {
            throw new BusinessException(1001, "请求不能为空");
        }
        if (!edit && !hasText(request.username())) {
            throw new BusinessException(1001, "骑手账号不能为空");
        }
        if (!hasText(request.name())) {
            throw new BusinessException(1001, "骑手姓名不能为空");
        }
        if (!hasText(request.phone())) {
            throw new BusinessException(1001, "手机号不能为空");
        }
        if (!hasText(request.area())) {
            throw new BusinessException(1001, "所属站点不能为空");
        }
        if (!hasText(request.vehicle())) {
            throw new BusinessException(1001, "车型不能为空");
        }
    }

    private int normalizeFlag(int value, String label) {
        if (value != 0 && value != 1) {
            throw new BusinessException(1001, label + "只能是 0 或 1");
        }
        return value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
