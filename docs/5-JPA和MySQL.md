上一节我们讲了 RBAC 的模型关系和优点，这节来完成数据库的添加和初始化

Spring Data JPA 是官方提出的 Java 持久化规范（也就是针对数据库的操作）， 它为 Java 开发人员提供了一种对象/关联映射工具来管理 Java 应用中的关系数据，可使开发者用极简的代码即可实现对数据的访问和操作。具体的Hibernate，TopLink，JDO 等 ORM框架可以自己选择，咱们这里就使用默认的 Hibernate，数据库用 MySQL

## 添加JPA和Mysql

在 build.gradle 文件添加

```
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
runtimeOnly 'mysql:mysql-connector-java'
```

## 添加数据库配置文件

添加配置文件之前需要我们先在本地创建一个 MySQL 数据库，要和下面的 url 参数对应上，用户名和密码换成自己的

删除 `src/main/resources`下的`application.properties`，新建文件`application.yml`，并根据自身情况添加如下配置内容：

```
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/rbac?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf-8 # 指定北京时间
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver # 数据库驱动

  jpa:
    open-in-view: false
    database: mysql
    show-sql: true # 默认false，在日志里显示执行的sql语句
    hibernate:
      ddl-auto: update # 指定为update，每次启动项目检测表结构有变化的时候会新增字段，表不存在时会新建
```

添加成功后启动项目，会发现启动的log增加了一些 JPA 相关的数据：

```
2022-06-08 14:28:05.012  INFO 5173 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : HHH000204: Processing PersistenceUnitInfo [name: default]
2022-06-08 14:28:05.064  INFO 5173 --- [           main] org.hibernate.Version                    : HHH000412: Hibernate ORM core version 5.6.9.Final
2022-06-08 14:28:05.220  INFO 5173 --- [           main] o.hibernate.annotations.common.Version   : HCANN000001: Hibernate Commons Annotations {5.1.2.Final}
2022-06-08 14:28:05.328  INFO 5173 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2022-06-08 14:28:05.509  INFO 5173 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2022-06-08 14:28:05.527  INFO 5173 --- [           main] org.hibernate.dialect.Dialect            : HHH000400: Using dialect: org.hibernate.dialect.MySQL57Dialect
2022-06-08 14:28:05.773  INFO 5173 --- [           main] o.h.e.t.j.p.i.JtaPlatformInitiator       : HHH000490: Using JtaPlatform implementation: [org.hibernate.engine.transaction.jta.platform.internal.NoJtaPlatform]
2022-06-08 14:28:05.782  INFO 5173 --- [           main] j.LocalContainerEntityManagerFactoryBean : Initialized JPA EntityManagerFactory for persistence unit 'default'
```

## 添加实体

在 `src/main/java/com/example/rbac/entity` 新建 Permission.java 文件，并写入下面的内容：
```
package com.example.rbac.entity;

import java.util.Date;
import java.util.Set;
import javax.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Entity
public class Permission {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // 注意，这里设置的unique只针对为创建的数据表有效，如果已经存在的表，需要手动修改下表的属性
  @Column(unique = true)
  private String name;

  // 注意，这里设置的unique只针对为创建的数据表有效，如果已经存在的表，需要手动修改下表的属性
  @Column(unique = true)
  private String keyName;

  @Column(columnDefinition = "text")
  private String description;

  @CreatedDate
  @CreationTimestamp
  private Date createdTime;

  @LastModifiedDate
  @UpdateTimestamp
  private Date updatedTime;

  /**
   * mappedBy 表明多对多的关系是通过 role 来维护的，而不是通过 permission 来维护的
   */
  @ManyToMany(mappedBy = "permissions")
  private Set<Role> roles;

  public Permission() {}

  public Permission(String name, String keyName, String description) {
    this.name = name;
    this.keyName = keyName;
    this.description = description;
  }

  public Long getId() {
    return this.id;
  }

  public void setId(Long id) {
    this.id = id;
  }

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

  public Date getCreatedTime() {
    return this.createdTime;
  }

  public void setCreatedTime(Date createdTime) {
    this.createdTime = createdTime;
  }

  public Date getUpdatedTime() {
    return this.updatedTime;
  }

  public void setUpdatedTime(Date updatedTime) {
    this.updatedTime = updatedTime;
  }

  public Set<Role> getRoles() {
    return this.roles;
  }

  public void setRoles(Set<Role> roles) {
    this.roles = roles;
  }

  @Override
  public String toString() {
    return "{" + " id='" + getId() + "'" + ", name='" + getName() + "'" + ", keyName='"
        + getKeyName() + "'" + ", description='" + getDescription() + "'" + ", createdTime='"
        + getCreatedTime() + "'" + ", updatedTime='" + getUpdatedTime() + "'" + ", roles='"
        + getRoles() + "'" + "}";
  }

}

```

注意上面构造函数、getter、setter和toString 都可以通过鼠标右键选择`JAVA CODE Generators` 去生成

> Role.java

```
package com.example.rbac.entity;

import java.util.Date;
import java.util.Set;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Entity
public class Role {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // 注意，这里设置的unique只针对为创建的数据表有效，如果已经存在的表，需要手动修改下表的属性
  @Column(unique = true)
  private String name;

  @Column(columnDefinition = "text")
  private String description;

  @CreatedDate
  @CreationTimestamp
  private Date createdTime;

  @LastModifiedDate
  @UpdateTimestamp
  private Date updatedTime;

  @ManyToMany(mappedBy = "roles")
  private Set<User> users;

  @ManyToMany()
  @JoinTable
  private Set<Permission> permissions;

  public Role() {}

  public Role(String name, String desc) {
    this.name = name;
    this.description = desc;
  }

  public Set<Permission> getPermissions() {
    return this.permissions;
  }

  public void setPermissions(Set<Permission> permissions) {
    this.permissions = permissions;
  }

  public Set<User> getUsers() {
    return this.users;
  }

  public void setUsers(Set<User> users) {
    this.users = users;
  }

  public Long getId() {
    return this.id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getName() {
    return this.name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return this.description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Date getCreatedTime() {
    return this.createdTime;
  }

  public void setCreatedTime(Date createdTime) {
    this.createdTime = createdTime;
  }

  public Date getUpdatedTime() {
    return this.updatedTime;
  }

  public void setUpdatedTime(Date updatedTime) {
    this.updatedTime = updatedTime;
  }

  @Override
  public String toString() {
    return "{" + " id='" + getId() + "'" + ", name='" + getName() + "'" + ", description='"
        + getDescription() + "'" + ", createdTime='" + getCreatedTime() + "'" + ", updatedTime='"
        + getUpdatedTime() + "'" + ", users='" + getUsers() + "'" + ", permissions='"
        + getPermissions() + "'" + "}";
  }

}
```

> User.java

```
package com.example.rbac.entity;

import java.util.Date;
import java.util.Set;
import javax.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Entity
public class User {
    @Id // 这是一个主键
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 自增
    private Long id;

    // 注意，这里设置的unique只针对为创建的数据表有效，如果已经存在的表，需要手动修改下表的属性
    @Column(unique = true)
    private String username;

    @Column
    private String password;

    @Column
    private String nickname;

    // 注意 ，不能用desc，因为desc是关键字
    @Column(columnDefinition = "text")
    private String description;

    // 默认加载是 LAZY,FetchType.EAGER 表示立即加载；当使用CascadeType.MERGE时，代表当父对象更新里的子对象更新时，更新操作会传递到子对象
    @ManyToMany(cascade = {CascadeType.MERGE})
    @JoinTable
    private Set<Role> roles;

    @CreatedDate
    @CreationTimestamp
    private Date createdTime;

    @LastModifiedDate
    @UpdateTimestamp
    private Date updatedTime;

    public User() {}

    public User(String username, String password, String email, String tel, String nickname,
            String description) {
        this.username = username;
        this.password = password;
        this.nickname = nickname;
        this.description = description;
    }

    public Long getId() {
        return this.id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return this.username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getNickname() {
        return this.nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getDescription() {
        return this.description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Date getCreatedTime() {
        return this.createdTime;
    }

    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime;
    }

    public Date getUpdatedTime() {
        return this.updatedTime;
    }

    public void setUpdatedTime(Date updatedTime) {
        this.updatedTime = updatedTime;
    }

    public Set<Role> getRoles() {
        return this.roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    @Override
    public String toString() {
        return "{" + " id='" + getId() + "'" + ", username='" + getUsername() + "'" + ", password='"
                + getPassword() + "'" + ", nickname='" + getNickname() + "'" + ", description='"
                + getDescription() + "'" + ", roles='" + getRoles() + "'" + ", createdTime='"
                + getCreatedTime() + "'" + ", updatedTime='" + getUpdatedTime() + "'" + "}";
    }

}

```

添加完毕后再次启动应用，这时候可以看看数据库，发现对应的表和中间表都已经创建好了，这是 JPA 帮我们创建的

![](https://s2.loli.net/2022/06/08/ykd9wC2u8IZD4JG.png)