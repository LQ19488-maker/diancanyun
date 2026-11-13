package com.dandanyun.controller.admin;

import com.dandanyun.auth.AuthContext;
import com.dandanyun.common.PageResult;
import com.dandanyun.common.Result;
import com.dandanyun.system.EmployeeRequest;
import com.dandanyun.system.EmployeeService;
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
@RequestMapping("/admin/employee")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/me")
    public Result<Map<String, Object>> me() {
        return Result.ok(employeeService.current(AuthContext.require().id()));
    }

    @GetMapping("/page")
    public Result<PageResult<Map<String, Object>>> page(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        AuthContext.requireAdmin();
        return Result.ok(employeeService.page(name, username, role, status, page, pageSize));
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody EmployeeRequest request) {
        AuthContext.requireAdmin();
        return Result.ok(employeeService.create(request));
    }

    @PutMapping
    public Result<Map<String, Object>> update(@RequestBody EmployeeRequest request) {
        AuthContext.requireAdmin();
        return Result.ok(employeeService.update(request));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        AuthContext.requireAdmin();
        return Result.ok(employeeService.delete(id));
    }

    @PutMapping("/{id}/status")
    public Result<Boolean> changeStatus(@PathVariable Long id, @RequestParam int status) {
        AuthContext.requireAdmin();
        return Result.ok(employeeService.changeStatus(id, status));
    }
}
