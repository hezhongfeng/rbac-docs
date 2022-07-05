export default {
  title: 'SpringBoot RBAC',
  description: '基础文档',
  themeConfig: {
    sidebar: [
      {
        text: '准备工作',
        items: [{ text: '开发环境准备', link: '/1-开发环境准备' }]
      },
      {
        text: '开发',
        items: [
          { text: '初始化SpringBoot项目', link: '/2-初始化SpringBoot项目' },
          { text: '添加web依赖', link: '/3-添加web依赖' },
          { text: '详解RBAC', link: '/4-详解RBAC' },
          { text: 'JPA和MySQL', link: '/5-JPA和MySQL' },
          { text: 'API设计和规范', link: '/6-API设计和规范' },
          { text: 'API实现', link: '/7-API实现' },
          { text: 'Repo和Service', link: '/8-Repo和Service' },
          { text: 'Security', link: '/9-Security' },
          { text: 'Security 认证过程', link: '/10-Security 认证过程' },
          { text: '多对多关系', link: '/11-多对多关系' }
        ]
      },
      {
        text: '部署',
        items: [{ text: '部署上线', link: '/12-部署' }]
      }
    ]
  }
};
