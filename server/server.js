/**
 * server.js - Node.js后端服务器
 * 用于处理前端API请求并转发到火山方舟Doubao API
 * 解决CORS跨域问题
 */

const http = require('http');
const https = require('https');
const url = require('url');

// 火山方舟API配置
const API_KEY = '3c0dce54-3f69-4e45-b7b6-4b1a4ac9bd7f';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const MODEL = 'doubao-1-5-pro-32k-250115';

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 设置CORS头，允许跨域请求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // 只处理POST请求和/chat路径
    if (req.method === 'POST' && req.url === '/chat') {
        let body = '';
        
        // 接收请求数据
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        
        // 处理完整请求
        req.on('end', () => {
            try {
                // 解析请求数据
                const requestData = JSON.parse(body);
                const { messages, temperature = 0.6, stream = true } = requestData;
                
                // 准备发送到火山方舟API的数据
                const apiRequestData = {
                    model: MODEL,
                    messages,
                    temperature,
                    stream
                };
                
                // 准备请求选项
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    timeout: 60000 // 60秒超时设置
                };
                
                // 创建请求到火山方舟API
                const apiReq = https.request(API_URL, options, (apiRes) => {
                    // 设置响应头
                    res.writeHead(apiRes.statusCode, {
                        'Content-Type': apiRes.headers['content-type']
                    });
                    
                    // 流式传输响应
                    apiRes.on('data', (chunk) => {
                        res.write(chunk);
                    });
                    
                    // 结束响应
                    apiRes.on('end', () => {
                        res.end();
                    });
                });
                
                // 处理请求错误
                apiReq.on('error', (error) => {
                    console.error('API请求错误:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '服务器内部错误' }));
                });
                
                // 发送请求数据
                apiReq.write(JSON.stringify(apiRequestData));
                apiReq.end();
                
            } catch (error) {
                console.error('处理请求时出错:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '无效的请求数据' }));
            }
        });
    } else {
        // 处理不支持的请求
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未找到请求的资源' }));
    }
});

// 设置服务器端口
const PORT = process.env.PORT || 3000;

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('使用 Ctrl+C 停止服务器');
});