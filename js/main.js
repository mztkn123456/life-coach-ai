/**
 * main.js - 前端主要逻辑
 * 负责处理用户界面交互和对话管理
 */

// 导入配置和API函数
import config from './config.js';
import { sendMessageToAI } from './api.js';

// DOM元素
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const voiceButton = document.getElementById('voice-button');

// 从配置中获取默认参数
const defaultTemperature = config.defaultTemperature;
const defaultStreamOutput = config.defaultStreamOutput;

// 对话历史
let messageHistory = [
    { role: 'system', content: '你是一个专业的Life Coach，你的目标是通过对话帮助用户成长，给予用户有建设性的建议和指导。你应该关注用户的个人发展、目标设定、时间管理、情绪管理等方面。保持友好、积极的态度，提供实用的建议。' }
];

// 当前正在进行的请求标志
let isRequestInProgress = false;

// 语音识别相关变量
let recognition = null;
let isListening = false;

// 语音合成相关变量
let speechSynthesis = window.speechSynthesis;
let isSpeaking = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 设置发送按钮事件
    sendButton.addEventListener('click', sendMessage);
    
    // 设置输入框回车发送
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 设置语音按钮事件
    voiceButton.addEventListener('click', toggleVoiceInput);
    
    // 初始化语音识别（如果浏览器支持）
    initSpeechRecognition();
});

/**
 * 初始化语音识别
 */
function initSpeechRecognition() {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN'; // 设置语言为中文
        recognition.continuous = false; // 设置为非连续模式
        recognition.interimResults = true; // 设置为返回中间结果，以便检测停顿
        
        // 用于检测语音停顿的变量
        let silenceTimer = null;
        const silenceThreshold = 500; // 0.5秒无声自动停止
        
        // 监听语音识别中间结果事件
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            // 不再显示识别到的文字到输入框
            // 但仍然需要保存识别结果用于发送
            let recognizedText = transcript;
            
            // 每次有新的语音输入，重置计时器
            if (silenceTimer) {
                clearTimeout(silenceTimer);
            }
            
            // 设置新的计时器，如果0.5秒内没有新的语音输入，则自动停止
            silenceTimer = setTimeout(() => {
                if (isListening) {
                    recognition.stop();
                    // 自动发送识别到的消息
                    if (recognizedText.trim() !== '') {
                        // 在发送前将识别的文字设置到输入框，但不显示给用户
                        userInput.value = recognizedText;
                        sendMessage();
                    }
                }
            }, silenceThreshold);
        };
        
        // 监听结束事件
        recognition.onend = () => {
            isListening = false;
            voiceButton.classList.remove('listening');
            // 清除任何剩余的计时器
            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }
        };
        
        // 监听错误事件
        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            isListening = false;
            voiceButton.classList.remove('listening');
            // 清除任何剩余的计时器
            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }
        };
    } else {
        console.warn('浏览器不支持语音识别');
        voiceButton.style.display = 'none'; // 隐藏语音按钮
    }
}

/**
 * 切换语音输入状态
 */
function toggleVoiceInput() {
    if (!recognition) {
        alert('您的浏览器不支持语音识别功能');
        return;
    }
    
    if (isListening) {
        // 停止语音识别
        recognition.stop();
        isListening = false;
        voiceButton.classList.remove('listening');
    } else {
        // 开始语音识别
        recognition.start();
        isListening = true;
        voiceButton.classList.add('listening');
        // 清空输入框
        userInput.value = '';
    }
}

/**
 * 使用语音合成朗读文本
 * @param {string} text - 要朗读的文本
 */
function speakText(text) {
    // 检查浏览器是否支持语音合成
    if (!speechSynthesis) {
        console.warn('浏览器不支持语音合成');
        return;
    }
    
    // 如果正在朗读，先停止
    if (isSpeaking) {
        speechSynthesis.cancel();
    }
    
    // 创建语音合成实例
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN'; // 设置语言为中文
    utterance.rate = 1.0; // 设置语速
    utterance.pitch = 1.0; // 设置音调
    
    // 监听开始事件
    utterance.onstart = () => {
        isSpeaking = true;
    };
    
    // 监听结束事件
    utterance.onend = () => {
        isSpeaking = false;
    };
    
    // 监听错误事件
    utterance.onerror = (event) => {
        console.error('语音合成错误:', event);
        isSpeaking = false;
    };
    
    // 开始朗读
    speechSynthesis.speak(utterance);
}

/**
 * 发送用户消息
 */
async function sendMessage() {
    // 获取用户输入
    const userMessage = userInput.value.trim();
    
    // 检查是否有输入内容和是否有请求正在进行
    if (userMessage === '' || isRequestInProgress) {
        return;
    }
    
    try {
        // 设置请求进行中标志
        isRequestInProgress = true;
        
        // 清空输入框
        userInput.value = '';
        
        // 添加用户消息到界面
        addMessageToChat('user', userMessage);
        
        // 添加用户消息到历史
        messageHistory.push({ role: 'user', content: userMessage });
        
        // 显示AI正在输入的指示器
        const aiMessageElement = addTypingIndicator();
        
        // 使用默认设置选项
        const options = {
            temperature: defaultTemperature,
            stream: defaultStreamOutput
        };
        
        // 创建一个变量存储完整的AI回复
        let fullAIResponse = '';
        
        // 发送消息到AI
        await sendMessageToAI(
            messageHistory,
            options,
            // 流式输出回调
            (chunk) => {
                // 更新AI回复内容
                fullAIResponse += chunk;
                updateAIMessage(aiMessageElement, fullAIResponse);
            },
            // 完成回调
            (response) => {
                // 移除输入指示器
                removeTypingIndicator(aiMessageElement);
                
                // 如果不是流式输出，直接显示完整回复
                if (!options.stream) {
                    const aiContent = response.choices[0].message.content;
                    fullAIResponse = aiContent;
                    addMessageToChat('ai', aiContent);
                }
                
                // 添加AI回复到历史
                messageHistory.push({ role: 'assistant', content: fullAIResponse });
                
                // 如果是通过语音输入的，则自动朗读AI回复
                if (isListening) {
                    speakText(fullAIResponse);
                }
                
                // 滚动到最新消息
                scrollToBottom();
            }
        );
    } catch (error) {
        console.error('发送消息时出错:', error);
        // 显示错误消息
        addMessageToChat('ai', '抱歉，发生了一些错误，请稍后再试。');
    } finally {
        // 重置请求进行中标志
        isRequestInProgress = false;
        // 移除输入指示器（以防万一）
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.parentElement.remove();
        }
    }
}

/**
 * 添加消息到聊天界面
 * @param {string} role - 消息角色（'user' 或 'ai'）
 * @param {string} content - 消息内容
 * @returns {HTMLElement} - 创建的消息元素
 */
function addMessageToChat(role, content) {
    // 创建消息容器
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    // 创建消息内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // 设置消息内容
    const paragraph = document.createElement('p');
    paragraph.textContent = content;
    contentDiv.appendChild(paragraph);
    
    // 组装消息元素
    messageDiv.appendChild(contentDiv);
    
    // 添加到聊天区域
    chatMessages.appendChild(messageDiv);
    
    // 添加一个小延迟，确保动画效果正常显示
    setTimeout(() => {
        // 滚动到最新消息，使用平滑滚动效果
        scrollToBottom();
    }, 50);
    
    return messageDiv;
}

/**
 * 添加AI正在输入的指示器
 * @returns {HTMLElement} - 创建的指示器元素
 */
function addTypingIndicator() {
    // 创建消息容器
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    
    // 创建消息内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // 创建输入指示器
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    
    // 添加指示器点
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        indicator.appendChild(dot);
    }
    
    // 组装元素
    contentDiv.appendChild(indicator);
    messageDiv.appendChild(contentDiv);
    
    // 添加到聊天区域
    chatMessages.appendChild(messageDiv);
    
    // 滚动到最新消息
    scrollToBottom();
    
    return messageDiv;
}

/**
 * 更新AI消息内容
 * @param {HTMLElement} messageElement - 消息元素
 * @param {string} content - 新的消息内容
 */
function updateAIMessage(messageElement, content) {
    // 获取消息内容容器
    const contentDiv = messageElement.querySelector('.message-content');
    
    // 如果存在输入指示器，移除它
    const indicator = contentDiv.querySelector('.typing-indicator');
    if (indicator) {
        contentDiv.removeChild(indicator);
    }
    
    // 如果已经有段落元素，更新它；否则创建新的
    let paragraph = contentDiv.querySelector('p');
    if (!paragraph) {
        paragraph = document.createElement('p');
        contentDiv.appendChild(paragraph);
    }
    
    // 更新内容
    paragraph.textContent = content;
    
    // 滚动到最新消息
    scrollToBottom();
}

/**
 * 移除输入指示器并显示完整消息
 * @param {HTMLElement} messageElement - 消息元素
 */
function removeTypingIndicator(messageElement) {
    // 获取消息内容容器
    const contentDiv = messageElement.querySelector('.message-content');
    
    // 移除输入指示器
    const indicator = contentDiv.querySelector('.typing-indicator');
    if (indicator) {
        contentDiv.removeChild(indicator);
    }
}

/**
 * 滚动聊天区域到底部
 */
function scrollToBottom() {
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
}