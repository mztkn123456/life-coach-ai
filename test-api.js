/**
 * 测试API调用脚本
 * 用于检查与后端服务器的通信是否正常
 */

// 正确导入node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 测试API调用
async function testApiCall() {
  try {
    console.log('正在测试API调用...');
    
    const response = await fetch('http://localhost:3000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: '你好' }],
        temperature: 0.6,
        stream: false
      })
    });
    
    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data = await response.text();
    console.log('响应数据:', data);
  } catch (error) {
    console.error('测试API调用时出错:', error);
  }
}

// 执行测试
testApiCall();