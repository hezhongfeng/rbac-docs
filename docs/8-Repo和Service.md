上一节我们完成了基础的Controller，还有接口文档的自动生成，现在我们来完成接下来的操作：

## 创建权限

在创建权限的时候，我们通过注释来描述接口

```
  @Operation(summary = "创建权限")
  @PostMapping
  public RespResult<Permission> createPermission(
      @RequestBody @Validated CreatePermissionDto permissionDto) {

  }
```

首先需要检查下权限的名称和keyName，是否已经存在了，存在了的话，就要把相关信息返回给前端：

```
if (permissionRepo.existsByName(permissionDto.getName())) {
  return new RespResult<Permission>(201, "无法创建，权限名已存在", null);
}

if (permissionRepo.existsByKeyName(permissionDto.getKeyName())) {
  return new RespResult<Permission>(201, "无法创建，keyName已存在", null);
}
```
CreatePermissionDto里面是我们创建权限所需的所有属性，只要把所需要的属性取出来就好了：

```
  @Operation(summary = "创建权限")
  @PostMapping
  public RespResult<Permission> createPermission(
      @RequestBody @Validated CreatePermissionDto permissionDto) {

    if (permissionRepo.existsByName(permissionDto.getName())) {
      return new RespResult<Permission>(201, "无法创建，权限名已存在", null);
    }

    if (permissionRepo.existsByKeyName(permissionDto.getKeyName())) {
      return new RespResult<Permission>(201, "无法创建，keyName已存在", null);
    }

    Permission permission = new Permission();
    permission.setName(permissionDto.getName());
    permission.setKeyName(permissionDto.getKeyName());
    permission.setDescription(permissionDto.getDescription());

    permissionRepo.save(permission);

    permission.setRoles(new HashSet<>());
    return new RespResult<Permission>(200, "", permission);
  }
```

注意上面我们使用了 `permissionRepo` ，它是做什么的呢？

## Repo

在前面我们先是定义了 Permission，启动后JPA帮我们创建了对应的表，那么怎么操作这个表呢，permissionRepo就是用来直接操作这个表的，JPA认为所有的数据其实都是对象，直接通过操作ORM对象就可以了：

```
package com.example.rbac.repo;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.example.rbac.entity.Permission;

@Repository
public interface PermissionRepo extends JpaRepository<Permission, Long> {

  Permission findByName(String name);

  Boolean existsByName(String name);

  Boolean existsByKeyName(String keyName);

  @EntityGraph(value = "permission-with-roles")
  @Query(value = "SELECT permission FROM Permission permission WHERE permission.id = ?1")
  Permission findWithRoles(Number id);

}

```
JpaRepository提供了 CRUD 操作的 API，以及用于分页和排序的 API，而且还可以定义新的方法名字来实现一些简单的扩展，在上面的createPermission方法，直接就可以将一个Permission对象给保存到了数据库里面。

## Service

很多时候，都可以直接使用PermissionRepo完成针对数据库的操作，但是有些复杂的逻辑，不能都放在controller里面，我们可以尝试着将这些复杂的逻辑处理封装在Service里面：

比如在删除权限之前，我们需要检查是否有角色绑定了这个权限，这部分逻辑可以封装成如下：

```
@Override
public Boolean canDelete(List<Long> ids) {
  // 只要有一个在使用就不允许删除
  for (Long id : ids) {
    Permission permission = permissionRepo.findWithRoles(id);
    if (permission.getRoles().size() > 0) {
      return false;
    }
}
return true;
}
```

这样在删除的时候就会方便很多：

```
@Operation(summary = "删除权限")
@DeleteMapping()
public RespResult<Object> deleteRoles(
  @RequestBody @Validated DeleteListRequest deleteListRequest) {

if (!permissionService.canDelete(deleteListRequest.getIds())) {
  return new RespResult<Object>(201, "无法删除，权限已绑定角色", null);
}

// 执行删除
permissionService.deletePermissions(deleteListRequest.getIds());
return new RespResult<Object>(200, "", null);
}
```

按照思路完成了接口之后，可以试着访问`http://localhost:8080/api/admin/v1/permissions` 这时候返回来个数组，表明我们的接口已经正常工作了

然后再按照相关逻辑完成角色和用户的增删改查，这时候想到一个问题，这个接口不能所有人都能访问啊，那样不就相当于把数据库的操作权限都给出去了吗？所以应该是只有管理员才能操作这些数据，下一节我们认识下Security
