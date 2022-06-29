上一节我们给部分 API 接口加了需要认证的限制，需要使用内存用户登录后才可以通过认证，接下来我们把内存用户换成真正的用户，使用 jwt 来进行认证：

## 登录

登录需要完成两件事：

1. 帐户密码校验
2. 颁发 jwt

在 `src/main/java/com/example/rbac/login/controller` 新建登录接口 `LoginController.java`

```
  @PostMapping("/login")
  public RespResult<LoginResult> login(@RequestBody LoginRequest login) {

    String username = login.getUsername();
    String password = login.getPassword();

    User user = userRepo.findByUsername(username);

    if (user == null || !(new BCryptPasswordEncoder().matches(password, user.getPassword()))) {
      // 认证失败，返回错误信息
      return new RespResult<LoginResult>(201, "帐户或密码错误", null);
    }

    // 获取完整用户信息
    CurrentResult currentUser = userService.getCurrentUser(login.getUsername());

    // 使用用户 Id 做 subject和使用权限生成token
    String token = JWTProvider.generateToken(Long.toString(currentUser.getUserId()),
        currentUser.getPermissions());

    return new RespResult<LoginResult>(200, "登录成功",
        new LoginResult(token, currentUser.getUserId()));
  }
```

看上面的代码，首先验证帐户和密码，然后通过 JWTProvider 把关键信息加密到 jwt，这个  generateToken的逻辑是这样的：

```
public static String generateToken(String subject, List<String> permissions) {

	long currentTimeMillis = System.currentTimeMillis();
	Date expirationDate = new Date(currentTimeMillis + jwtExpirationInMs * 1000);

	return Jwts.builder().setSubject(subject).claim("permissions", String.join(",", permissions))
			.signWith(SignatureAlgorithm.HS512, jwtSecret).setExpiration(expirationDate).compact();
}
```

这里把权限 List 给合并成了一个字符串，中间逗号分割，然后加密成了jwt，到这里登录的部分完成了

## 登录认证

除了部分公开的接口和登录接口，大部分接口访问都必须先登录(比如查询当前登录用户的信息)

### 配置认证流程

首先配置下认证过滤器

```
  @Bean
  SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {

    http.authorizeHttpRequests((authorize) -> authorize.anyRequest().authenticated());

    // 错误处理
    http.exceptionHandling()
        // 未登录
        .authenticationEntryPoint(new MyAuthenticationEntryPoint())
        // 权限不足
        .accessDeniedHandler(new MyAccessDeniedHandler());

    // 通过 CustomDsl 来配置自定义的过滤器
    http.apply(customDsl());

    return http.build();
  }
```

新版的 security 需要使用自定义 Dsl 来添加过滤器：

```
public class CustomDsl extends AbstractHttpConfigurer<CustomDsl, HttpSecurity> {

  @Override
  public void configure(HttpSecurity http) throws Exception {
    // 添加我们的 jwt 过滤器，在表单验证之前
    http.addFilterBefore(new JWTFilter(), UsernamePasswordAuthenticationFilter.class);
  }

  public static CustomDsl customDsl() {
    return new CustomDsl();
  }
}
```

我们在表单验证之前添加了对 jwt 的过滤：

```
@Component
public class JWTFilter extends OncePerRequestFilter {

  private static final Logger LOGGER = LoggerFactory.getLogger(JWTFilter.class);

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    // 这部分出错后，直接返回401，不再走后面的filter
    try {
      // 从请求头中获取jwt
      String jwt = getJwtFromRequest(request);

      // 校验 jwt 是否有效，包含了过期的验证
      if (StringUtils.hasText(jwt) && JWTProvider.validateToken(jwt)) {

        // 通过 jwt 获取认证信息
        Authentication authentication = JWTProvider.getAuthentication(jwt);

        // 将认证信息存入 Security 上下文中，可以取出来使用
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    } catch (Exception ex) {
      LOGGER.error("Could not set user authentication in security context", ex);
    }

    filterChain.doFilter(request, response);
  }

  private String getJwtFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");

    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7, bearerToken.length());
    }
    return null;
  }
}
```

doFilterInternal 是我们执行认证过滤的具体函数，在这里我们获取 jwt 和对 jwt 进行校验：

```
public static boolean validateToken(String authToken) {
	try {
		Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
		return true;
	} catch (SignatureException ex) {
		LOGGER.error("Invalid JWT signature");
	} catch (MalformedJwtException ex) {
		LOGGER.error("Invalid JWT token");
	} catch (ExpiredJwtException ex) {
		LOGGER.error("Expired JWT token");
	} catch (UnsupportedJwtException ex) {
		LOGGER.error("Unsupported JWT token");
	} catch (IllegalArgumentException ex) {
		LOGGER.error("JWT claims string is empty");
	}
	return false;
}
```

校验这里可以分辨出是不是合法的 jwt，也可以判断是否过期，校验失败就转入了 authenticationEntryPoint(未登录)的具体处理方法：

```
@Component
public class MyAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private static ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public void commence(HttpServletRequest request, HttpServletResponse response,
      AuthenticationException authException) throws IOException, ServletException {
    response.setContentType("application/json;charset=utf-8");

    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

    response.setContentType("application/json;charset=utf-8");
    RespResult<String> resp = new RespResult<String>(201, "未登录，请先登录", null);
    objectMapper.writeValue(response.getWriter(), resp);
  }
}
```

认证成功了，就把解析 jwt 得到的 authentication 存到 security 上下文中，供后续的filter 使用，到这里登录认证的整个过程就完成了

## 权限认证

在上一步认证通过的前提下，每个 API 接口所需要的权限是不一样的，那么在每次访问的时候就需要获取当前用户的权限列表，然后通过匹配，确定这个用户是否具有访问的权限。

在 SecurityConfig 添加配置

```
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
  //...
}
```

在 AdminRoleController 添加权限限制

```
@PreAuthorize("@rbacAuthorityService.hasPermissions('admin')") // 必须具有 admin 权限才能访问
public class AdminRoleController {
 //...
}
```

上面的意思是在访问controller之前，通过权限验证处理器去验证当前用户是否具有这个权限：

```
@Component("rbacAuthorityService")
public class RbacAuthorityService {

  public boolean hasPermissions(String... permissions) {
    // 拿到上一步设置的所有权限
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    // 用户所具有的所有权限
    Set<String> set = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
        .collect(Collectors.toSet());

    // 接口需要的所有权限，只要有一个满足就可以访问
    for (String permission : permissions) {
      if (set.contains(permission)) {
        return true;
      }
    }

    return false;
  }
}
```
验证失败后会到accessDeniedHandler（权限不足）的处理方法：

```
@Component
public class MyAccessDeniedHandler implements AccessDeniedHandler {

  private static ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public void handle(HttpServletRequest request, HttpServletResponse response,
      AccessDeniedException accessDeniedException) throws IOException, ServletException {

    response.setContentType("application/json;charset=utf-8");

    response.setStatus(HttpServletResponse.SC_FORBIDDEN);

    response.setContentType("application/json;charset=utf-8");
    RespResult<String> resp = new RespResult<String>(201, "没有对应的权限", null);
    objectMapper.writeValue(response.getWriter(), resp);
  }
}
```

到这一步基本上所有的认证都添加完成了，下面来添加权限、角色和用户来实验下,在 `src/test/java/com/example/rbac` 的测试类中增加下面的测试方法：

```
@Test
@Rollback(false)
void addAdmin() {
	// 新增admin权限
	if (!permissionRepo.existsByKeyName("admin")) {
		Permission permission = new Permission();
		permission.setKeyName("admin");
		permission.setName("管理权限");
		permission.setDescription("管理的权限，属于这个系统的管理员才可以具有的权限");
		permissionRepo.save(permission);
	}

	// 新增管理员角色
	if (!roleRepo.existsByName("管理员角色")) {
		Permission permission = permissionRepo.findByKeyName("admin");
		Set<Permission> permissions = new HashSet<>();
		permissions.add(permission);

		Role role = new Role();
		role.setName("管理员角色");
		role.setDescription("管理员角色，可以管理所有权限");
		role.setPermissions(permissions);
		roleRepo.save(role);
	}

	// 新增管理员用户
	if (!userRepo.existsByUsername("admin")) {
		Role role = roleRepo.findByName("管理员角色");
		Set<Role> roles = new HashSet<>();

		roles.add(role);
		User user = new User();
		user.setUsername("admin");
		user.setPassword(new BCryptPasswordEncoder().encode("password"));
		user.setRoles(roles);
		user.setNickname("管理员");
		user.setDescription("管理员帐户，可以管理其他用户u、角色和权限");
		userRepo.save(user);
	}

	// 新增普通用户
	if (!userRepo.existsByUsername("normal")) {
		Set<Role> roles = new HashSet<>();
		User user = new User();
		user.setUsername("normal");
		user.setPassword(new BCryptPasswordEncoder().encode("password"));
		user.setRoles(roles);
		user.setNickname("普通用户");
		user.setDescription("我是一个普通用户");
		userRepo.save(user);
	}
}
```

会创建一个具有 admin 权限的用户 和一个没有权限的普通用户

本节代码变化很多，不涉及核心的改动这里没有讲，建议大家自行下载本节代码进行验证，这时候使用 Talend API Tester  、postman 等工具，先用这俩帐户登录：

![](https://s2.loli.net/2022/06/17/HTWyEFBviIYLVmd.png)

分别拿到jwt后，再继续访问 `/api/v1/current` 和 `/api/admin/v1/permissions` 这些接口，通过修改和切换 jwt 验证下登录认证和权限认证

![](https://s2.loli.net/2022/06/17/1G5DvBtxcqiwjug.png)
