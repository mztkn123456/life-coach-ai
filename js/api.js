/**
 * api.js - 负责处理与后端服务器的API通信
 * 包含发送消息到AI服务的函数和处理响应的逻辑
 */

// 导入配置
import config from './config.js';

// API通信相关常量
const API_ENDPOINT = config.apiEndpoint;

/**
 * 发送消息到AI服务
 * @param {Array} messages - 消息历史数组，包含用户和AI的对话
 * @param {Object} options - 配置选项，如温度、是否流式输出等
 * @param {Function} onChunk - 处理流式响应的回调函数
 * @param {Function} onComplete - 响应完成的回调函数
 * @returns {Promise} - 返回Promise对象
 */
export async function sendMessageToAI(messages, options = {}, onChunk = null, onComplete = null) {
    try {
        // 默认配置
        const defaultOptions = {
            temperature: 0.6,
            stream: true
        };
        
        // 合并用户配置
        const finalOptions = { ...defaultOptions, ...options };
        
        // 准备请求数据
        const requestData = {
            messages,
            temperature: finalOptions.temperature,
            stream: finalOptions.stream
        };
        
        // 如果是流式输出且提供了回调函数
        if (finalOptions.stream && onChunk) {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            // 检查响应状态
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let completeResponse = '';
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }
                
                // 解码二进制数据
                const chunk = decoder.decode(value, { stream: true });
                
                // 处理SSE格式的数据
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    // 检查是否是数据行
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        
                        // 检查是否是[DONE]标记
                        if (data === '[DONE]') {
                            continue;
                        }
                        
                        try {
                            // 解析JSON数据
                            const jsonData = JSON.parse(data);
                            // 提取消息内容
                            if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                                // 调用回调处理当前块
                                onChunk(jsonData.choices[0].delta.content);
                            }
                        } catch (e) {
                            console.error('解析流式数据时出错:', e, data);
                        }
                    }
                }
                completeResponse += chunk;
                
                // 不再直接传递原始chunk，而是在上面的循环中已经提取并传递了有效内容
            }
            
            // 响应完成回调
            if (onComplete) {
                onComplete(completeResponse);
            }
            
            return completeResponse;
        } else {
            // 非流式输出
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            // 检查响应状态
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 响应完成回调
            if (onComplete) {
                onComplete(data);
            }
            
            return data;
        }
    } catch (error) {
        console.error('发送消息时出错:', error);
        throw error;
    }
}