package com.dandanyun.controller.admin;

import com.dandanyun.auth.AuthContext;
import com.dandanyun.common.Result;
import com.dandanyun.shop.ShopRequest;
import com.dandanyun.shop.ShopService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 商家端店铺设置：本系统按单商家建模，商家店铺固定为 app.merchant-shop-id。
 */
@RestController
@RequestMapping("/admin")
public class ShopAdminController {

    private final ShopService shopService;
    private final long merchantShopId;

    public ShopAdminController(
            ShopService shopService,
            @Value("${app.merchant-shop-id:10001}") long merchantShopId
    ) {
        this.shopService = shopService;
        this.merchantShopId = merchantShopId;
    }

    @GetMapping("/shop")
    public Result<Map<String, Object>> detail() {
        AuthContext.requireMerchant();
        return Result.ok(shopService.shop(merchantShopId));
    }

    @PutMapping("/shop")
    public Result<Map<String, Object>> update(@RequestBody ShopRequest request) {
        AuthContext.requireMerchant();
        return Result.ok(shopService.updateSettings(merchantShopId, request));
    }
}
