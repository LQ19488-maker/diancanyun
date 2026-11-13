package com.dandanyun.controller.user;

import com.dandanyun.auth.AuthContext;
import com.dandanyun.common.PageResult;
import com.dandanyun.common.Result;
import com.dandanyun.order.OrderService;
import com.dandanyun.system.RiderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/rider")
public class RiderPortalController {

    private final RiderService riderService;
    private final OrderService orderService;

    public RiderPortalController(RiderService riderService, OrderService orderService) {
        this.riderService = riderService;
        this.orderService = orderService;
    }

    @GetMapping("/me")
    public Result<Map<String, Object>> me() {
        return Result.ok(riderService.find(AuthContext.requireRider().id()));
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        return Result.ok(riderService.stats(AuthContext.requireRider().id()));
    }

    @PutMapping("/online")
    public Result<Map<String, Object>> online(@RequestParam int online) {
        Long riderId = AuthContext.requireRider().id();
        riderService.changeOnline(riderId, online);
        return Result.ok(riderService.find(riderId));
    }

    @GetMapping("/tasks")
    public Result<PageResult<Map<String, Object>>> tasks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        AuthContext.requireRider();
        return Result.ok(orderService.riderTasks(page, pageSize));
    }

    @PostMapping("/tasks/{orderId}/grab")
    public Result<Map<String, Object>> grab(@PathVariable Long orderId) {
        return Result.ok(orderService.riderGrab(AuthContext.requireRider().id(), orderId));
    }

    @GetMapping("/orders")
    public Result<PageResult<Map<String, Object>>> orders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return Result.ok(orderService.riderOrders(
                AuthContext.requireRider().id(),
                status,
                page,
                pageSize
        ));
    }

    @PostMapping("/orders/{orderId}/finish")
    public Result<Map<String, Object>> finish(@PathVariable Long orderId) {
        return Result.ok(orderService.riderFinish(AuthContext.requireRider().id(), orderId));
    }
}
