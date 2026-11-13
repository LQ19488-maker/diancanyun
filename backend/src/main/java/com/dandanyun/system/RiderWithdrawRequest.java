package com.dandanyun.system;

import java.math.BigDecimal;

/**
 * 提现请求体：金额与渠道。
 */
public record RiderWithdrawRequest(BigDecimal amount, String channel) {
}
