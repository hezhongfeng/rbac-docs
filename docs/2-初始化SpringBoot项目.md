# 初始化 SpringBoot 项目

这节开始新建一个 SpringBoot 项目

## 新建项目

打开 `https://start.spring.io/` 我们按照如下信息填写

1. Project:Gradle Project
2. Language:Java
3. SpringBoot:2.7.0
4. Package:Jar
5. Java:11

如图：

![](https://s2.loli.net/2022/05/24/TY1pQ5weGKLJIsv.png)

然后点击下方的 `GENERATE` 按钮，下载生成的项目

## 导入项目

下载好我们在 `https://start.spring.io/` 生成的项目后，需要解压导入到 vscode，这里不再赘述

导入后，会自动下载所需的各种 Java 包

完成导入和下载后，我们需要运行一下刚才导入的项目

## 运行和调试

打开 vscode 的资源管理器，找到 JAVA PROJECTS，下面就有我门刚才导入的项目名称，右键可以选择 run 或者 debug

![](https://s2.loli.net/2022/06/07/2hDWaHzxKUVjLMw.png)

这里也可以使用 SpringBoot Dashboard，启动成功后会有如下的 log

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.7.0)

2022-06-08 08:41:47.136  INFO 84488 --- [           main] com.example.demo2.Demo2Application       : Starting Demo2Application using Java 11.0.14.1 on hezfmbp with PID 84488 (/Users/hezf/Desktop/java/demo2/bin/main started by hezf in /Users/hezf/Desktop/java/demo2)
2022-06-08 08:41:47.138  INFO 84488 --- [           main] com.example.demo2.Demo2Application       : No active profile set, falling back to 1 default profile: "default"
2022-06-08 08:41:47.567  INFO 84488 --- [           main] com.example.demo2.Demo2Application       : Started Demo2Application in 0.709 seconds (JVM running for 5.663)
```

由于我们只有最最基础的 SpringBoot，所以也只是完成了项目的启动，没有监听任何端口，启动成功后就结束了

我们可以在 main 函数（src/main/java/com/example/rbac）里面打印个 Hello RBAC! 来看下，也可以在调试模式下打断点

```
public static void main(String[] args) {
	System.out.println("Hello RBAC!");
	SpringApplication.run(RbacApplication.class, args);
}
```

这样会先打印出我们新加的字符串，然后才是启动信息

```
Hello RBAC!

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.7.0)
```

注意在 .vscode 中的 launch.json 最好配置上 `"console": "internalConsole"`，这样调试的时候可以启动调试控制台，看起来友好一点
