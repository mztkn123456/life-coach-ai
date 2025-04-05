# Life Coach AI 部署指南

本文档提供将Life Coach AI项目部署到公网的详细步骤。

## 准备工作

1. 注册一个云服务提供商账号，如：
   - [Heroku](https://www.heroku.com/)
   - [Vercel](https://vercel.com/)
   - [Netlify](https://www.netlify.com/)
   - [阿里云](https://www.aliyun.com/)
   - [腾讯云](https://cloud.tencent.com/)

2. 确保你的本地环境已安装：
   - Node.js (v14或更高版本)
   - npm或yarn
   - Git

## 部署步骤

### 1. 准备项目

项目已经进行了以下修改，以支持公网部署：

- 添加了`.env`文件用于环境变量配置
- 修改了服务器代码以使用环境变量
- 创建了前端配置文件，支持不同环境的API端点
- 更新了前端代码，使用ES模块格式

### 2. 部署后端服务

#### 使用Heroku部署

1. 安装Heroku CLI并登录
   ```bash
   npm install -g heroku
   heroku login
   ```

2. 在项目根目录创建Heroku应用
   ```bash
   heroku create life-coach-ai-backend
   ```

3. 设置环境变量
   ```bash
   heroku config:set API_KEY=your_api_key
   heroku config:set API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
   heroku config:set MODEL=doubao-1-5-pro-32k-250115
   heroku config:set ALLOWED_ORIGIN=https://your-frontend-domain.com
   ```

4. 部署应用
   ```bash
   git push heroku main
   ```

#### 使用其他云服务

如果使用其他云服务，请参考相应的部署文档，确保设置了所有必要的环境变量。

### 3. 部署前端

#### 使用Netlify或Vercel部署

1. 修改`js/config.js`文件中的生产环境API地址
   ```javascript
   apiEndpoint: isProduction 
       ? 'https://your-backend-domain.com/chat' // 替换为你的后端服务地址
       : 'http://localhost:3000/chat',
   ```

2. 登录Netlify或Vercel并创建新项目

3. 连接到你的Git仓库或上传项目文件

4. 配置构建设置（通常不需要特殊配置，因为这是静态网站）

5. 部署项目

### 4. 配置自定义域名（可选）

1. 在你的域名注册商处添加DNS记录，指向你的云服务提供商

2. 在云服务提供商的控制面板中配置自定义域名

3. 等待DNS生效（可能需要几小时）

## 测试部署

1. 访问你的前端网站URL

2. 测试对话功能，确保能够正常与AI交互

3. 检查控制台是否有任何错误

## 故障排除

### 常见问题

1. **前端无法连接到后端**
   - 检查`config.js`中的API端点是否正确
   - 确认后端服务是否正常运行
   - 检查CORS设置是否正确

2. **后端服务启动失败**
   - 检查环境变量是否正确设置
   - 查看服务器日志以获取详细错误信息

3. **API调用失败**
   - 确认API密钥是否有效
   - 检查API URL是否正确
   - 验证请求格式是否符合API要求

## 维护与更新

1. 定期检查依赖包更新
   ```bash
   npm outdated
   npm update
   ```

2. 监控服务器性能和错误日志

3. 根据用户反馈持续改进应用

## 安全建议

1. 使用HTTPS确保通信安全

2. 不要在前端代码中暴露API密钥

3. 考虑添加用户认证机制

4. 定期更新依赖包以修复安全漏洞

---

如有任何部署问题，请参考各云服务提供商的官方文档或联系技术支持。