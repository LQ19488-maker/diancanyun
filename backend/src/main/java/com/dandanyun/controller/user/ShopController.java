package com.dandanyun.controller.user;

import com.dandanyun.auth.AuthContext;
import com.dandanyun.common.PageResult;
import com.dandanyun.common.Result;
import com.dandanyun.shop.AddressRequest;
import com.dandanyun.shop.ShopService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/user")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    @GetMapping("/shops")
    public Result<PageResult<Map<String, Object>>> shops(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        return Result.ok(shopService.shops(keyword, page, pageSize));
    }

    @GetMapping("/shop/{id}")
    public Result<Map<String, Object>> shop(@PathVariable Long id) {
        return Result.ok(shopService.shop(id));
    }

    @GetMapping("/addresses")
    public Result<Map<String, Object>> addresses() {
        Long userId = AuthContext.requireCustomer().id();
        return Result.ok(Map.of("records", shopService.addresses(userId)));
    }

    @PostMapping("/address")
    public Result<Map<String, Object>> createAddress(@RequestBody AddressRequest request) {
        return Result.ok(shopService.createAddress(AuthContext.requireCustomer().id(), request));
    }

    @PutMapping("/address")
    public Result<Map<String, Object>> updateAddress(@RequestBody AddressRequest request) {
        return Result.ok(shopService.updateAddress(AuthContext.requireCustomer().id(), request));
    }

    @PutMapping("/address/{id}/default")
    public Result<Map<String, Object>> setDefault(@PathVariable Long id) {
        return Result.ok(shopService.setDefault(AuthContext.requireCustomer().id(), id));
    }

    @DeleteMapping("/address/{id}")
    public Result<Boolean> removeAddress(@PathVariable Long id) {
        return Result.ok(shopService.removeAddress(AuthContext.requireCustomer().id(), id));
    }
}
