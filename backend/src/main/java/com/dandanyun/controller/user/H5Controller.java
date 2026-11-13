package com.dandanyun.controller.user;

import com.dandanyun.common.PageResult;
import com.dandanyun.common.Result;
import com.dandanyun.order.H5OrderRequest;
import com.dandanyun.order.OrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/user")
public class H5Controller {

    private final OrderService orderService;

    public H5Controller(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/menu")
    public Result<Map<String, Object>> menu(@RequestParam(required = false) String tableNo) {
        return Result.ok(orderService.menu(tableNo));
    }

    @PostMapping("/order")
    public Result<Map<String, Object>> submit(@RequestBody H5OrderRequest request) {
        return Result.ok(orderService.submit(request));
    }

    @GetMapping("/order/{id}")
    public Result<Map<String, Object>> order(@PathVariable Long id) {
        return Result.ok(orderService.find(id));
    }

    @GetMapping("/orders")
    public Result<PageResult<Map<String, Object>>> orders(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        return Result.ok(orderService.page(null, null, null, null, null, page, pageSize));
    }
}
