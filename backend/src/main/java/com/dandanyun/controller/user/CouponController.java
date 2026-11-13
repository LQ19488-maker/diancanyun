package com.dandanyun.controller.user;

import com.dandanyun.auth.AuthContext;
import com.dandanyun.common.PageResult;
import com.dandanyun.common.Result;
import com.dandanyun.coupon.CouponService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 顾客端优惠券：领券中心、领券、我的券。
 */
@RestController
@RequestMapping("/user")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping("/coupon/templates")
    public Result<PageResult<Map<String, Object>>> templates() {
        return Result.ok(couponService.templates(AuthContext.requireCustomer().id()));
    }

    @PostMapping("/coupon/{id}/claim")
    public Result<Map<String, Object>> claim(@PathVariable Long id) {
        return Result.ok(couponService.claim(AuthContext.requireCustomer().id(), id));
    }

    @GetMapping("/coupons")
    public Result<PageResult<Map<String, Object>>> mine(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) BigDecimal orderAmount,
            @RequestParam(required = false) Long shopId
    ) {
        return Result.ok(couponService.mine(
                AuthContext.requireCustomer().id(),
                status,
                orderAmount,
                shopId
        ));
    }
}
