/**
 * @description 显示操作结果
 * @param {string} message - 要显示的消息
 * @param {boolean} isError - 是否是错误消息
 */
function showResult(message, isError = false) {
  const resultDiv = document.getElementById('result');
  resultDiv.style.color = isError ? 'red' : 'green';
  resultDiv.innerHTML = message;
}

/**
 * @description 清空抓取的数据
 * @returns {Promise<void>}
 */
async function clearCapturedData() {
  try {
    await chrome.storage.local.remove(['rankedData', 'tableData', 'creatorsData', 'dataType', 'totalRows', 'totalRankedRows', 'totalCreatorsRows']);
    console.log('已清空抓取的数据');
  } catch (error) {
    console.error('清空数据失败：', error);
  }
}

/**
 * @description 初始化扩展弹出窗口的功能
 */
document.addEventListener('DOMContentLoaded', function() {
  const exportButton = document.getElementById('exportData');
  const captureTableButton = document.getElementById('captureTable');
  const captureRankedButton = document.getElementById('captureRankedCreators');
  const clearDataButton = document.getElementById('clearDataBtn');
  const resultDiv = document.getElementById('result');
  
  // 新增：创作者导出按钮
  const captureCreatorsButton = document.getElementById('captureCreators');

  /**
   * @description 检查content script是否已注入
   * @param {number} tabId - 标签页ID
   * @returns {Promise<boolean>} 是否已注入
   */
  async function checkContentScriptInjected(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @description 注入content script
   * @param {number} tabId - 标签页ID
   */
  async function injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      showResult('已注入抓取脚本');
    } catch (error) {
      showResult(`注入脚本失败：${error.message}`, true);
      throw error;
    }
  }

  /**
   * @description 抓取表格数据的处理函数
   */
  captureTableButton.addEventListener('click', async () => {
    try {
      // 先清空之前抓取的数据
      await clearCapturedData();
      
      showResult('正在获取当前标签页...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('tiktok.com')) {
        showResult('请在TikTok页面使用此扩展', true);
        return;
      }

      showResult('正在检查脚本状态...');
      const isInjected = await checkContentScriptInjected(tab.id);
      if (!isInjected) {
        showResult('正在注入抓取脚本...');
        await injectContentScript(tab.id);
      }

      showResult('正在抓取表格数据...');
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'captureTable' });
      if (response && response.data && response.data.length > 0) {
        // 显示抓取到的数据条数
        showResult(`表格数据抓取成功！共抓取到 ${response.data.length} 条数据`);
        
        // 存储数据量信息
        await chrome.storage.local.set({ 
          tableData: response.data,
          totalRows: response.totalRows,
          dataType: 'table' // 标记数据类型为表格
        });
      } else {
        showResult('未找到表格数据，请确保在正确的页面', true);
      }
    } catch (error) {
      showResult(`错误：${error.message}`, true);
    }
  });

  /**
   * @description 抓取排名达人的处理函数
   */
  captureRankedButton.addEventListener('click', async () => {
    try {
      // 先清空之前抓取的数据
      await clearCapturedData();
      
      showResult('正在获取当前标签页...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('tiktok.com')) {
        showResult('请在TikTok页面使用此扩展', true);
        return;
      }

      showResult('正在检查脚本状态...');
      const isInjected = await checkContentScriptInjected(tab.id);
      if (!isInjected) {
        showResult('正在注入抓取脚本...');
        await injectContentScript(tab.id);
      }

      showResult('正在抓取排名达人数据...');
      // 不再限制固定数量，让脚本自动抓取页面上的所有达人
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'captureRankedCreators'
        // 不指定count参数，使用默认值
      });
      
      if (response && response.data && response.data.length > 0) {
        // 显示抓取到的数据条数及详细信息
        if (response.message) {
          showResult(response.message);
        } else {
          showResult(`排名达人数据抓取成功！共抓取到 ${response.data.length} 个达人`);
        }
        
        // 存储数据
        await chrome.storage.local.set({ 
          rankedData: response.data,
          totalRankedRows: response.data.length,
          dataType: 'ranked' // 标记数据类型为排名达人
        });
        
        // 显示达人列表
        if (response.data.length <= 20) {
          // 如果达人数量不多，直接显示所有达人名称
          const usernames = response.data.map(creator => creator.username).join(', ');
          showResult(`抓取的达人: ${usernames}`);
        } else {
          // 如果达人数量很多，只显示前10个
          const usernames = response.data.slice(0, 10).map(creator => creator.username).join(', ');
          showResult(`抓取的达人(前10个): ${usernames}... 等共 ${response.data.length} 个`);
        }
      } else {
        showResult('未找到排名达人数据，请确保在正确的页面。请确认页面上有如 "mingkdwv90o" 这样的达人名称。', true);
      }
    } catch (error) {
      showResult(`错误：${error.message}`, true);
    }
  });

  /**
   * @description 抓取创作者数据的处理函数
   */
  if (captureCreatorsButton) {
    captureCreatorsButton.addEventListener('click', async () => {
      try {
        // 先清空之前抓取的数据
        await clearCapturedData();
        
        showResult('正在获取当前标签页...');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('tiktok.com')) {
          showResult('请在TikTok页面使用此扩展', true);
          return;
        }

        showResult('正在检查脚本状态...');
        const isInjected = await checkContentScriptInjected(tab.id);
        if (!isInjected) {
          showResult('正在注入抓取脚本...');
          await injectContentScript(tab.id);
        }

        showResult('正在抓取创作者数据...');
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'captureCreators' });
        
        if (response && response.data && response.data.length > 0) {
          // 显示抓取到的数据条数及详细信息
          if (response.message) {
            showResult(response.message);
          } else {
            showResult(`创作者数据抓取成功！共抓取到 ${response.data.length} 个创作者`);
          }
          
          // 存储数据
          await chrome.storage.local.set({ 
            creatorsData: response.data,
            totalCreatorsRows: response.data.length,
            dataType: 'creators' // 标记数据类型为创作者
          });
          
          // 显示创作者列表
          if (response.data.length <= 20) {
            // 如果创作者数量不多，直接显示所有创作者名称
            const usernames = response.data.map(creator => creator.username).join(', ');
            showResult(`抓取的创作者: ${usernames}`);
          } else {
            // 如果创作者数量很多，只显示前10个
            const usernames = response.data.slice(0, 10).map(creator => creator.username).join(', ');
            showResult(`抓取的创作者(前10个): ${usernames}... 等共 ${response.data.length} 个`);
          }
        } else {
          showResult('未找到创作者数据，请确保在正确的页面。', true);
        }
      } catch (error) {
        showResult(`错误：${error.message}`, true);
      }
    });
  }

  /**
   * @description 导出数据的处理函数
   */
  exportButton.addEventListener('click', async () => {
    try {
      showResult('正在获取数据...');
      const data = await chrome.storage.local.get(['rankedData', 'tableData', 'creatorsData', 'dataType']);
      
      if (!data.rankedData && !data.tableData && !data.creatorsData) {
        showResult('没有可导出的数据', true);
        return;
      }

      // 确定要导出的数据类型
      let exportData;
      let dataType = data.dataType || 'table'; // 默认为表格数据
      
      if (dataType === 'ranked' && data.rankedData) {
        exportData = data.rankedData;
        showResult('将导出排名达人数据...');
      } else if (dataType === 'creators' && data.creatorsData) {
        exportData = data.creatorsData;
        showResult('将导出创作者数据...');
      } else if (data.tableData) {
        exportData = data.tableData;
        showResult('将导出表格数据...');
      } else {
        showResult('没有找到匹配的数据类型', true);
        return;
      }

      // 验证数据
      if (!exportData || exportData.length === 0) {
        showResult('数据为空，请先抓取数据', true);
        return;
      }

      // 添加 BOM 头，确保Excel正确识别中文
      const addBom = (content) => '\ufeff' + content;
      
      // 处理数据，只保留用户名
      const processDataForExport = (items) => {
        const result = [];
        items.forEach(item => {
          // 确保只导出用户名字段
          if (item.username) {
            result.push({
              username: item.username
            });
          }
        });
        return result;
      };
      
      // 处理数据，确保只包含用户名
      const processedData = processDataForExport(exportData);
      
      // 将数据行转换为CSV行
      const convertToCsvRow = (creator) => {
        // 处理可能包含逗号的字段
        const escapeCsvField = (field) => {
          if (field === null || field === undefined) return '""';
          const stringField = String(field);
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        };

        // 只返回用户名字段
        return escapeCsvField(creator.username) + '\n';
      };
      
      // 导出CSV文件函数
      const exportCsvFile = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      };

      // 表头
      const headers = '用户名\n';
      const now = new Date();
      const dateStr = now.getFullYear() + 
                     ('0' + (now.getMonth() + 1)).slice(-2) + 
                     ('0' + now.getDate()).slice(-2) + 
                     ('0' + now.getHours()).slice(-2) + 
                     ('0' + now.getMinutes()).slice(-2) + 
                     ('0' + now.getSeconds()).slice(-2);
      const totalRows = processedData.length;
      
      showResult('正在准备导出文件...');
      
      // 根据数据类型确定分割阈值
      const chunkThreshold = dataType === 'creators' ? 100 : 50;
      
      // 判断是否需要分表格
      if (totalRows > chunkThreshold) {
        showResult(`数据量超过${chunkThreshold}条(共 ${totalRows} 条)，将分成多个文件导出...`);
        
        // 计算需要分成几个文件
        const chunkSize = chunkThreshold;
        const chunks = [];
        
        // 分割数据
        for (let i = 0; i < totalRows; i += chunkSize) {
          chunks.push(processedData.slice(i, i + chunkSize));
        }
        
        // 显示分割信息
        showResult(`数据将分成 ${chunks.length} 个文件导出，每个文件最多 ${chunkThreshold} 条数据`);
        
        // 确定文件前缀
        let filePrefix = 'TikTok用户名列表';
        if (dataType === 'ranked') {
          filePrefix = 'TikTok排名达人';
        } else if (dataType === 'creators') {
          filePrefix = 'TikTok创作者';
        }
        
        // 逐个导出分割后的数据
        chunks.forEach((chunk, index) => {
          let csvContent = addBom(headers);
          
          // 添加数据行
          chunk.forEach(creator => {
            csvContent += convertToCsvRow(creator);
          });
          
          // 生成文件序号，从1开始，如果有多个文件，确保序号格式一致（如01、02、03...）
          let fileNumber = String(index + 1);
          if (chunks.length >= 10 && fileNumber.length === 1) {
            fileNumber = '0' + fileNumber; // 补零，保持一致的长度
          }
          
          const filename = `${filePrefix}_${dateStr}_${fileNumber}.csv`;
          exportCsvFile(csvContent, filename);
        });
        
        // 导出成功后清空缓存数据
        await clearCapturedData();
        
        showResult(`数据导出成功！共分 ${chunks.length} 个文件保存，每个文件最多包含${chunkThreshold}条数据`);
      } else {
        // 单个文件导出
        showResult(`数据量不超过${chunkThreshold}条，将导出为单个文件`);
        
        let csvContent = addBom(headers);
        
        // 添加数据行
        processedData.forEach(creator => {
          csvContent += convertToCsvRow(creator);
        });
        
        // 确定文件前缀
        let filePrefix = 'TikTok用户名列表';
        if (dataType === 'ranked') {
          filePrefix = 'TikTok排名达人';
        } else if (dataType === 'creators') {
          filePrefix = 'TikTok创作者';
        }
        
        // 导出CSV文件
        exportCsvFile(csvContent, `${filePrefix}_${dateStr}.csv`);
        
        // 导出成功后清空缓存数据
        await clearCapturedData();
        
        showResult(`数据导出成功！共导出 ${totalRows} 条数据到单个文件`);
      }
    } catch (error) {
      showResult(`导出错误：${error.message}`, true);
    }
  });

  /**
   * @description 清空数据按钮点击事件处理
   */
  clearDataButton.addEventListener('click', async () => {
    try {
      // 确认是否有数据
      const data = await chrome.storage.local.get(['rankedData', 'tableData', 'creatorsData']);
      
      if (!data.rankedData && !data.tableData && !data.creatorsData) {
        showResult('没有数据需要清空');
        return;
      }
      
      // 清空数据
      await clearCapturedData();
      showResult('数据已成功清空！');
    } catch (error) {
      showResult(`清空数据失败：${error.message}`, true);
    }
  });
}); 