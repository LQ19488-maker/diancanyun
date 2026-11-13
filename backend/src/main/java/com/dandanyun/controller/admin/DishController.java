package com.dandanyun.controller.admin;

import com.dandanyun.catalog.DishRequest;
import com.dandanyun.catalog.DishService;
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
@RequestMapping("/admin/dish")
public class DishController {

    private final DishService dishService;

    public DishController(DishService dishService) {
        this.dishService = dishService;
    }

    @GetMapping("/page")
    public Result<PageResult<Map<String, Object>>> page(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        return Result.ok(dishService.page(name, categoryId, status, page, pageSize));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody DishRequest request) {
        return Result.ok(dishService.create(request));
    }

    @PutMapping
    public Result<Map<String, Object>> update(@RequestBody DishRequest request) {
        return Result.ok(dishService.update(request));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.ok(dishService.delete(id));
    }

    @PutMapping("/{id}/status")
    public Result<Boolean> changeStatus(@PathVariable Long id, @RequestParam int status) {
        return Result.ok(dishService.changeStatus(id, status));
    }
}
