package com.dandanyun.controller.admin;

import com.dandanyun.auth.AuthContext;
import com.dandanyun.catalog.CategoryRequest;
import com.dandanyun.catalog.CategoryService;
import com.dandanyun.catalog.FlavorConfigRequest;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/category/page")
    public Result<PageResult<Map<String, Object>>> page(
            @RequestParam(required = false) Integer type,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        AuthContext.requireAdmin();
        return Result.ok(categoryService.page(type, name, status, page, pageSize));
    }

    @PostMapping("/category")
    public Result<Map<String, Object>> create(@RequestBody CategoryRequest request) {
        AuthContext.requireAdmin();
        return Result.ok(categoryService.create(request));
    }

    @PutMapping("/category")
    public Result<Map<String, Object>> update(@RequestBody CategoryRequest request) {
        AuthContext.requireAdmin();
        return Result.ok(categoryService.update(request));
    }

    @DeleteMapping("/category/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        AuthContext.requireAdmin();
        return Result.ok(categoryService.delete(id));
    }

    @GetMapping("/flavor/{categoryId}")
    public Result<Map<String, Object>> getFlavors(@PathVariable Long categoryId) {
        AuthContext.requireAdmin();
        return Result.ok(Map.of("flavors", categoryService.getFlavors(categoryId)));
    }

    @PutMapping("/flavor/{categoryId}")
    public Result<Map<String, Object>> saveFlavors(
            @PathVariable Long categoryId,
            @RequestBody FlavorConfigRequest request
    ) {
        AuthContext.requireAdmin();
        return Result.ok(Map.of("flavors", categoryService.saveFlavors(categoryId, request)));
    }
}
