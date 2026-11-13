package com.dandanyun.controller.admin;

import com.dandanyun.auth.AuthContext;
import com.dandanyun.catalog.ComboRequest;
import com.dandanyun.catalog.ComboService;
import com.dandanyun.common.PageResult;
import com.dandanyun.common.Result;
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
@RequestMapping("/admin/combo")
public class ComboController {

    private final ComboService comboService;

    public ComboController(ComboService comboService) {
        this.comboService = comboService;
    }

    @GetMapping("/page")
    public Result<PageResult<Map<String, Object>>> page(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        AuthContext.requireAdmin();
        return Result.ok(comboService.page(name, categoryId, status, page, pageSize));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        AuthContext.requireAdmin();
        return Result.ok(comboService.find(id));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody ComboRequest request) {
        AuthContext.requireAdmin();
        return Result.ok(comboService.create(request));
    }

    @PutMapping
    public Result<Map<String, Object>> update(@RequestBody ComboRequest request) {
        AuthContext.requireAdmin();
        return Result.ok(comboService.update(request));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        AuthContext.requireAdmin();
        return Result.ok(comboService.delete(id));
    }

    @PutMapping("/{id}/status")
    public Result<Boolean> changeStatus(@PathVariable Long id, @RequestParam int status) {
        AuthContext.requireAdmin();
        return Result.ok(comboService.changeStatus(id, status));
    }
}
