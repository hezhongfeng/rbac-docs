# API 设计和规范

在上一节我们完成了，“用户-角色-权限”的实体创建，以及 JPA 自动为我们创建的数据库中的表，这节我们来设计下 Restful API，用来管理“用户-角色-权限”

## 创建

| 实体 | 方法 | URI                       |
| ---- | ---- | ------------------------- |
| 权限 | POST | /api/admin/v1/permissions |
| 角色 | POST | /api/admin/v1/roles       |
| 用户 | POST | /api/admin/v1/users       |

1. 创建权限的时候，把权限实体所需的属性准备好了，直接放在 body 中就可以
2. 创建角色的时候，需要选择该角色所需的权限，所以需要一个 permissionIds 数组，用来存储所需的权限 Id
3. 同上，创建的时候需要选择用户的角色，需要一个 roleIds 数组

## 列表查询

| 实体 | 方法 | URI                       |
| ---- | ---- | ------------------------- |
| 权限 | GET  | /api/admin/v1/permissions |
| 角色 | GET  | /api/admin/v1/roles       |
| 用户 | GET  | /api/admin/v1/users       |

列表查询这里需要考虑翻页

## 单个查询

| 实体 | 方法 | URI                           |
| ---- | ---- | ----------------------------- |
| 权限 | GET  | /api/admin/v1/permissions/:id |
| 角色 | GET  | /api/admin/v1/roles/:id       |
| 用户 | GET  | /api/admin/v1/users/:id       |

## 编辑

| 实体 | 方法 | URI                           |
| ---- | ---- | ----------------------------- |
| 权限 | PUT  | /api/admin/v1/permissions/:id |
| 角色 | PUT  | /api/admin/v1/roles/:id       |
| 用户 | PUT  | /api/admin/v1/users/:id       |

## 删除

| 实体 | 方法   | URI                       |
| ---- | ------ | ------------------------- |
| 权限 | DELETE | /api/admin/v1/permissions |
| 角色 | DELETE | /api/admin/v1/roles       |
| 用户 | DELETE | /api/admin/v1/users       |

删除这里需要考虑检查所删除的对象，有没有被使用：比如想删除某个角色，如果这个角色还仍然被某个用户使用，那么就不应该被删除

## 统一响应结构

无论是什么请求，我们都应该返回同一个结构响应体，这样有利于规范接口和前端的统一处理，所有响应除了权限的问题外统一返回 200 状态码

响应体格式：

```
{
  code: 200,
  data: [], // 用来装载数据，可能是数组或者对象
  message: ''
}
```

在 `src/main/java/com/example/rbac/config` 目录下新建 RespResult.java，我们所有的返回都返回这个格式的数据

```
package com.example.rbac.config;

public class RespResult<T> {
  private int code;
  private String message;
  private T data;

  public RespResult() {}

  public RespResult(int code, String message, T data) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  public static <T> RespResult<T> success(T data) {
    RespResult<T> resultData = new RespResult<>();
    resultData.setCode(200);
    resultData.setMessage("");
    resultData.setData(data);
    return resultData;
  }

  public int getCode() {
    return this.code;
  }

  public void setCode(int code) {
    this.code = code;
  }

  public String getMessage() {
    return this.message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public T getData() {
    return this.data;
  }

  public void setData(T data) {
    this.data = data;
  }
}

```

## 统一列表查询参数

一般的列表查询，需要使用翻页和排序等，我们来统一规范下：

在上一步相同的目录新建 `ListRequest.java` 文件：

```
package com.example.rbac.config;

public class ListRequest {
  private Integer page;
  private Integer pageSize;
  private String sortBy;

  public ListRequest() {}

  public ListRequest(Integer page, Integer pageSize, String sortBy) {
    this.page = page;
    this.pageSize = pageSize;
    this.sortBy = sortBy;
  }

  public Integer getPage() {
    return this.page;
  }

  public void setPage(Integer page) {
    this.page = page;
  }

  public Integer getPageSize() {
    return this.pageSize;
  }

  public void setPageSize(Integer pageSize) {
    this.pageSize = pageSize;
  }

  public String getSortBy() {
    return this.sortBy;
  }

  public void setSortBy(String sortBy) {
    this.sortBy = sortBy;
  }

  public ListRequest page(Integer page) {
    setPage(page);
    return this;
  }

  public ListRequest pageSize(Integer pageSize) {
    setPageSize(pageSize);
    return this;
  }

  public ListRequest sortBy(String sortBy) {
    setSortBy(sortBy);
    return this;
  }


  @Override
  public String toString() {
    return "{" + " page='" + getPage() + "'" + ", pageSize='" + getPageSize() + "'" + ", sortBy='"
        + getSortBy() + "'" + "}";
  }
}
```

## 统一列表查询返回结构

列表查询的请求，我门在上一步做了参数的约定，那么返回也需要约定一下：

相同目录新建文件 `ListResponse.java` :

```
package com.example.rbac.config;

import java.util.List;

public class ListResponse<T> {
  private long count;
  private List<T> list;

  public ListResponse() {}

  public ListResponse(long count, List<T> list) {
    this.count = count;
    this.list = list;
  }

  public long getCount() {
    return this.count;
  }

  public void setCount(long count) {
    this.count = count;
  }

  public List<T> getList() {
    return this.list;
  }

  public void setList(List<T> list) {
    this.list = list;
  }

  @Override
  public String toString() {
    return "{" + " count='" + getCount() + "'" + ", list='" + getList() + "'" + "}";
  }
}

```

## 统一删除参数

删除的时候传给后端`ids:[]`作为参数，这样前端可以单个删除，也可以多个一起删除

```
package com.example.rbac.config;

import java.util.List;
import javax.validation.constraints.NotNull;

public class DeleteListRequest {

  @NotNull(message = "ids 不能为空")
  private List<Long> ids;

  public DeleteListRequest() {}

  public DeleteListRequest(List<Long> ids) {
    this.ids = ids;
  }

  public List<Long> getIds() {
    return this.ids;
  }

  public void setIds(List<Long> ids) {
    this.ids = ids;
  }

  @Override
  public String toString() {
    return "{" + " ids='" + getIds() + "'" + "}";
  }

}

```

下一节我们来具体实现各个接口
