package com.dandanyun.order;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatisticsService {

    private final NamedParameterJdbcTemplate jdbc;

    public StatisticsService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> overview() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(29);
        Map<String, Object> params = Map.of(
                "start", startDate.atStartOfDay(),
                "end", endDate.plusDays(1).atStartOfDay()
        );

        Map<String, Object> totals = jdbc.queryForMap(
                "SELECT "
                        + "COALESCE(SUM(CASE WHEN status = 'DONE' THEN total_amount ELSE 0 END), 0) AS turnover, "
                        + "SUM(CASE WHEN status <> 'CANCELED' THEN 1 ELSE 0 END) AS order_count, "
                        + "SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) AS done_count, "
                        + "COUNT(*) AS all_count "
                        + "FROM orders WHERE created_at >= :start AND created_at < :end",
                params
        );
        BigDecimal turnover = decimal(totals.get("turnover"));
        long orderTotal = number(totals.get("order_count"));
        long doneCount = number(totals.get("done_count"));
        long allCount = number(totals.get("all_count"));
        int orderCount = (int) orderTotal;
        BigDecimal avgPrice = orderCount == 0
                ? BigDecimal.ZERO
                : turnover.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP);
        BigDecimal finishRate = allCount == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(doneCount)
                .divide(BigDecimal.valueOf(allCount), 4, RoundingMode.HALF_UP);

        Map<LocalDate, Map<String, Object>> trendByDate = new LinkedHashMap<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", date.toString());
            row.put("turnover", BigDecimal.ZERO);
            row.put("orderCount", 0);
            trendByDate.put(date, row);
        }
        jdbc.query(
                "SELECT DATE(created_at) AS day, "
                        + "COALESCE(SUM(CASE WHEN status = 'DONE' THEN total_amount ELSE 0 END), 0) AS turnover, "
                        + "SUM(CASE WHEN status <> 'CANCELED' THEN 1 ELSE 0 END) AS order_count "
                        + "FROM orders WHERE created_at >= :start AND created_at < :end "
                        + "GROUP BY DATE(created_at)",
                params,
                rs -> {
                    LocalDate day = rs.getDate("day").toLocalDate();
                    Map<String, Object> row = trendByDate.get(day);
                    if (row != null) {
                        row.put("turnover", rs.getBigDecimal("turnover"));
                        row.put("orderCount", rs.getInt("order_count"));
                    }
                }
        );

        List<Map<String, Object>> statusDist = jdbc.query(
                "SELECT status, COUNT(*) AS amount FROM orders "
                        + "WHERE created_at >= :start AND created_at < :end GROUP BY status",
                params,
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("status", rs.getString("status"));
                    row.put("count", rs.getInt("amount"));
                    return row;
                }
        );
        List<Map<String, Object>> hotDishes = jdbc.query(
                "SELECT oi.dish_name AS name, SUM(oi.quantity) AS count, SUM(oi.amount) AS amount "
                        + "FROM order_item oi JOIN orders o ON o.id = oi.order_id "
                        + "WHERE o.created_at >= :start AND o.created_at < :end AND o.status <> 'CANCELED' "
                        + "GROUP BY oi.dish_name ORDER BY count DESC, amount DESC LIMIT 8",
                params,
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", rs.getString("name"));
                    row.put("count", rs.getInt("count"));
                    row.put("amount", rs.getBigDecimal("amount"));
                    return row;
                }
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("turnover", turnover);
        result.put("orderCount", orderCount);
        result.put("avgPrice", avgPrice);
        result.put("finishRate", finishRate);
        result.put("trend", new ArrayList<>(trendByDate.values()));
        result.put("statusDist", statusDist);
        result.put("hotDishes", hotDishes);
        return result;
    }

    private static BigDecimal decimal(Object value) {
        return value instanceof BigDecimal decimal ? decimal : new BigDecimal(String.valueOf(value));
    }

    private static long number(Object value) {
        return value == null ? 0 : ((Number) value).longValue();
    }
}
