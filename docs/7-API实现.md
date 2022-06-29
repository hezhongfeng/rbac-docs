在上一节我们设计了API，还有规范了一些通用的参数格式，这节我们来实现API

## 参数校验

在开始实现接口之前，我们先把参数校验依赖添加上，这样接口可以对请求的参数进行校验

在 build.gradle 文件添加`implementation 'org.springframework.boot:spring-boot-starter-validation'`

## 创建

首先，我们来完成权限的创建 API

根据之前权限实体的定义，我门创建的时候需要如下参数：
```
private String name;

private String keyName;

private String description;
```
在 `src/main/java/com/example/rbac/payload` 下创建文件 `CreatePermissionDto.java`，这个文件是规范创建权限所需的参数的，同时可以进行参数检查，不符合约定的参数，直接返回相应的信息：

```
package com.example.rbac.payload;

import javax.validation.constraints.NotNull;

public class CreatePermissionDto {

  @NotNull(message = "name 不能为空")
  private String name;

  @NotNull(message = "keyName 不能为空")
  private String keyName;

  private String description;

  public String getName() {
    return this.name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getKeyName() {
    return this.keyName;
  }

  public void setKeyName(String keyName) {
    this.keyName = keyName;
  }

  public String getDescription() {
    return this.description;
  }

  public void setDescription(String description) {
    this.description = description;
  }
}

```

## 增删改查接口

上面的 NotNull 就是参数校验依赖的功能，完成了创建的接口参数后 ，接下来开始完成接口

在`src/main/java/com/example/rbac/controller`下创建`AdminPermissionController.java`文件，表明这个Controller是给管理员使用的：

```
package com.example.rbac.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.rbac.config.RespResult;
import com.example.rbac.entity.Permission;
import com.example.rbac.payload.CreatePermissionDto;

@RestController
@RequestMapping("/api/admin/v1/permissions")
public class AdminPermissionController {

  @PostMapping
  public RespResult<Permission> createPermission(
      @RequestBody @Validated CreatePermissionDto permissionDto) {

    Permission permission = new Permission();
    return new RespResult<Permission>(200, "", permission);
  }

}

```

注意看 AdminPermissionController 上面的注释，表明了是一个 Restful 接口和监听`/api/admin/v1/permissions`这个路由，里面的第一个方法上的注释表明是接收的 POST 请求，同时前端传来的body中的部分数据，会用来给CreatePermissionDto赋值，这样就可以直接从permissionDto里面取值了，接下来补全一下：

```
package com.example.rbac.controller;

import org.springframework.data.domain.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.rbac.config.DeleteListRequest;
import com.example.rbac.config.ListRequest;
import com.example.rbac.config.ListResponse;
import com.example.rbac.config.RespResult;
import com.example.rbac.entity.Permission;
import com.example.rbac.payload.CreatePermissionDto;
import com.example.rbac.payload.UpdatePermissionDto;

@RestController
@RequestMapping("/api/admin/v1/permissions")
public class AdminPermissionController {

  @GetMapping
  public RespResult<ListResponse<Permission>> getPermissions(ListRequest listRequest) {

    Sort sort = Sort.by(Sort.Direction.DESC, "id");
    int pageIndex = 0;
    int pageSize = 10;
    if (listRequest.getPage() != null) {
      pageIndex = listRequest.getPage() - 1;
    }

    if (listRequest.getPageSize() != null) {
      pageSize = listRequest.getPageSize();
    }
    // 分页查询

    ListResponse<Permission> listResponse = new ListResponse<Permission>();
    return new RespResult<ListResponse<Permission>>(200, "", listResponse);
  }

  @PostMapping
  public RespResult<Permission> createPermission(
      @RequestBody @Validated CreatePermissionDto permissionDto) {

    Permission permission = new Permission();
    return new RespResult<Permission>(200, "", permission);
  }


  @GetMapping("/{id}")
  public RespResult<Object> getPermission(@PathVariable("id") Long id) {
    Permission permission = new Permission();

    return new RespResult<Object>(200, "", permission);
  }

  @PutMapping("/{id}")
  public RespResult<Object> updatePermission(
      @RequestBody @Validated UpdatePermissionDto permissionDto, @PathVariable("id") Long id) {

    return new RespResult<Object>(200, "", null);
  }

  @DeleteMapping()
  public RespResult<Object> deleteRoles(
      @RequestBody @Validated DeleteListRequest deleteListRequest) {

    return new RespResult<Object>(200, "", null);
  }

}
```

## API 文档

接口部分完成了，我们添加下API文档：

在 build.gradle 添加 `implementation 'org.springdoc:springdoc-openapi-ui:1.6.9'`

在`src/main/java/com/example/rbac/config`文件夹下新增文件`OpenApiConfig`:

```
package com.example.rbac.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

// 示例配置类
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI initOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("RBAC API").description("OpenAPI").version("v1.0"));
    }
}

```

然后在Controller添加针对文档的注释：

```
package com.example.rbac.controller;

import org.springframework.data.domain.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.rbac.config.DeleteListRequest;
import com.example.rbac.config.ListRequest;
import com.example.rbac.config.ListResponse;
import com.example.rbac.config.RespResult;
import com.example.rbac.entity.Permission;
import com.example.rbac.payload.CreatePermissionDto;
import com.example.rbac.payload.UpdatePermissionDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "权限", description = "权限相关CRUD接口")
@RestController
@RequestMapping("/api/admin/v1/permissions")
public class AdminPermissionController {

  @Operation(summary = "获取权限列表")
  @GetMapping
  public RespResult<ListResponse<Permission>> getPermissions(ListRequest listRequest) {

    Sort sort = Sort.by(Sort.Direction.DESC, "id");
    int pageIndex = 0;
    int pageSize = 10;
    if (listRequest.getPage() != null) {
      pageIndex = listRequest.getPage() - 1;
    }

    if (listRequest.getPageSize() != null) {
      pageSize = listRequest.getPageSize();
    }
    // 分页查询

    ListResponse<Permission> listResponse = new ListResponse<Permission>();
    return new RespResult<ListResponse<Permission>>(200, "", listResponse);
  }

  @Operation(summary = "创建权限")
  @PostMapping
  public RespResult<Permission> createPermission(
      @RequestBody @Validated CreatePermissionDto permissionDto) {

    Permission permission = new Permission();
    return new RespResult<Permission>(200, "", permission);
  }


  @Operation(summary = "查看权限")
  @GetMapping("/{id}")
  public RespResult<Object> getPermission(@PathVariable("id") Long id) {
    Permission permission = new Permission();

    return new RespResult<Object>(200, "", permission);
  }

  @Operation(summary = "更新权限")
  @PutMapping("/{id}")
  public RespResult<Object> updatePermission(
      @RequestBody @Validated UpdatePermissionDto permissionDto, @PathVariable("id") Long id) {

    return new RespResult<Object>(200, "", null);
  }

  @Operation(summary = "删除权限")
  @DeleteMapping()
  public RespResult<Object> deleteRoles(
      @RequestBody @Validated DeleteListRequest deleteListRequest) {

    return new RespResult<Object>(200, "", null);
  }

}

```

重新启动后访问`http://localhost:8080/swagger-ui/index.html#/` 即可进行查看

![](https://s2.loli.net/2022/06/09/LSz9dAEV13Jqwxr.png)

在这里我们只是完成了Controller和参数校验，并没有实际完成和数据库的交互，下一节我们来完成后续的部分