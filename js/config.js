/**
 * config.js - 配置文件
 * 用于管理不同环境下的配置参数
 */

// 判断当前环境
const isProduction = window.location.hostname !== 'localhost' && 
                    !window.location.hostname.includes('127.0.0.1');

// 配置对象
const config = {
    // API端点
    apiEndpoint: isProduction 
        ? 'https://life-coach-ai-nine.vercel.app/chat' // Vercel部署的API地址
        : 'http://localhost:3000/chat', // 开发环境API地址
    
    // 其他配置参数
    defaultTemperature: 0.6,
    defaultStreamOutput: true
};

// 导出配置
export default config;