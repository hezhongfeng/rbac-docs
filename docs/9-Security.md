# Security

Security 是 spring boot 提供的安全认证方面的集合，对于一个管理端，想要完成的有以下方面：

1. 登录：登录成功后，后端颁发访问的凭证
2. 登录认证：除了部分公开的接口和登录接口，大部分接口访问都必须先登录(比如查询当前登录用户的信息)
3. 权限认证：一些 API 接口除了必须登录外，必须具有某些权限才可以访问（比如必须具有 admin 权限才可以访问管理的接口）

## Security 依赖

在 build.gradle 添加 `implementation 'org.springframework.boot:spring-boot-starter-security'` 添加完成后，重新启动，访问`http://localhost:8080/api/admin/v1/permissions` 查看权限列表

这时候发现跳转到了一个登录的页面，这就表明 security 已经起作用了，不让我们直接访问接口了

我们查看调试信息，会发现一条类似的信息`Using generated security password: 472484f7-6f6b-4f8f-b9dc-10598ae31bb2`，把这个密码和用户名`user`填上就可以继续访问刚才的接口了

## Security 配置

Spring Boot 2.7.0 刚刚发布，Spring Security 也升级到了 5.7.1，目前 WebSecurityConfigurerAdapter 已经弃用了，不推荐继承它来进行配置

新用法是通过生成 SecurityFilterChainBean 的方法来进行配置：

在 `src/main/java/com/example/rbac/security` 新建配置文件 `SecurityConfig.java`：

```
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {

    http.authorizeRequests(authorizeRequests -> authorizeRequests
        // 对根路由放行
        .antMatchers("/").permitAll()
        // 其他所有的请求都必须经过认证，这里就是登录
        .anyRequest().authenticated());

    // 开启默认的表单登录
    http.formLogin();

    return http.build();
  }

  @Bean
  UserDetailsService users() {
    // 开发环境使用的内存用户
    UserDetails user = User.withDefaultPasswordEncoder().username("user").password("password")
        .roles("USER").build();
    return new InMemoryUserDetailsManager(user);
  }
}

```

这样配置后，我们尝试访问 `http://localhost:8080/` 已经允许我们访问了，只是会报错说没有配置路由，这里可以配置下路由看看效果

然后再访问 `http://localhost:8080/api/admin/v1/permissions` 这时候跳转到了登录页，输入上面的帐户 user 和密码 password 后，又跳回了我们的接口地址，可以访问了，说明我们输入上面配置的帐户密码后变为了认证通过

## jwt

接下来想通过 jwt 完成认证，这里先简单介绍下：

> jwt 是 Json Web Token 的缩写，也就是我们可以把一些 json 数据加密成为 token，这种加密是可以解密到原 json 数据的

jwt 是有有效期的，过期了就无法通过验证。一般来讲，jwt 是无状态的认证机制，不需要像 session 一样存在后端，可以说一经颁发在有效期内就会永久有效。

jjwt 的[项目地址](https://github.com/jwtk/jjwt)

到这里需要我们添加生成和验证 jwt 所需的依赖 `implementation 'io.jsonwebtoken:jjwt:0.9.1'`，然后在 `application.yml` 添加如下的配置：

```
jwt:
  # header: Authorization: Bearer XXXXXX
  # 有效期7天(单位:秒)  60*60*24*7
  expire: 604800
  # secret: 秘钥(普通字符串)
  secret: aHR0cHM6Ly9teS5vc2NoaW5hLm5ldC91LzM2ODE4Njg=
  # 默认存放token的请求头
  requestHeader: Authorization
  # 默认token前缀
  tokenPrefix: Bearer
```

添加完这两个依赖之后，下一节我们要完成整个认证体系
