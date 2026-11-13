package com.dandanyun.controller.admin;

import com.dandanyun.auth.AuthContext;
import com.dandanyun.common.PageResult;
import com.dandanyun.common.Result;
import com.dandanyun.system.RiderRequest;
import com.dandanyun.system.RiderService;
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
@RequestMapping("/admin/rider")
public class RiderAdminController {

    private final RiderService riderService;

    public RiderAdminController(RiderService riderService) {
        this.riderService = riderService;
    }

    @GetMapping("/page")
    public Result<PageResult<Map<String, Object>>> page(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) Integer online,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        AuthContext.requireMerchant();
        return Result.ok(riderService.page(name, code, area, online, status, page, pageSize));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody RiderRequest request) {
        AuthContext.requireMerchant();
        return Result.ok(riderService.create(request));
    }

    @PutMapping
    public Result<Map<String, Object>> update(@RequestBody RiderRequest request) {
        AuthContext.requireMerchant();
        return Result.ok(riderService.update(request));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        AuthContext.requireMerchant();
        return Result.ok(riderService.delete(id));
    }

    @PutMapping("/{id}/status")
    public Result<Boolean> changeStatus(@PathVariable Long id, @RequestParam int status) {
        AuthContext.requireMerchant();
        return Result.ok(riderService.changeStatus(id, status));
    }

    @PutMapping("/{id}/online")
    public Result<Boolean> changeOnline(@PathVariable Long id, @RequestParam int online) {
        AuthContext.requireMerchant();
        return Result.ok(riderService.changeOnline(id, online));
    }
}
