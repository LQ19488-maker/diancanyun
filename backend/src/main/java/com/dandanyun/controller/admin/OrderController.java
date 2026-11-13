package com.dandanyun.controller.admin;

import com.dandanyun.common.PageResult;
import com.dandanyun.common.Result;
import com.dandanyun.order.OrderService;
import com.dandanyun.order.OrderStatusRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/order")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/status-count")
    public Result<Map<String, Object>> statusCount() {
        return Result.ok(orderService.statusCount());
    }

    @GetMapping("/page")
    public Result<PageResult<Map<String, Object>>> page(
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        return Result.ok(orderService.page(orderNo, phone, status, startTime, endTime, page, pageSize));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(orderService.find(id));
    }

    @PutMapping("/{id}/status")
    public Result<Map<String, Object>> changeStatus(
            @PathVariable Long id,
            @RequestBody OrderStatusRequest request
    ) {
        return Result.ok(orderService.merchantChangeStatus(id, request == null ? null : request.status()));
    }
}
