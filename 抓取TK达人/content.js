/**
 * @description 解码文本内容
 * @param {string} text - 需要解码的文本
 * @returns {string} 解码后的文本
 */
function decodeText(text) {
  try {
    // 尝试多种解码方式
    return decodeURIComponent(escape(text)) || text;
  } catch (e) {
    try {
      return text ? text.replace(/[\ufffd]/g, '') : '';
    } catch (e2) {
      return text || '';
    }
  }
}

/**
 * @description 显示日志信息
 * @param {string} message - 要显示的消息
 */
function showLog(message) {
  console.log(`[TikTok] ${message}`);
  
  const logDiv = document.createElement('div');
  logDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 15px;
    background: rgba(254, 44, 85, 0.9);
    color: white;
    border-radius: 5px;
    z-index: 9999;
    max-width: 80%;
    max-height: 200px;
    overflow-y: auto;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    animation: fadeIn 0.3s ease;
  `;
  
  // 添加一个简单的动画
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(styleEl);
  
  logDiv.textContent = decodeText(message);
  document.body.appendChild(logDiv);
  
  // 3秒后自动移除
  setTimeout(() => {
    logDiv.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      logDiv.remove();
      // 清理style元素
      styleEl.remove();
    }, 300);
  }, 3000);
}

/**
 * @description 显示详细的调试信息
 * @param {string} message - 要显示的消息
 * @param {boolean} isError - 是否是错误消息
 */
function showDebugInfo(message, isError = false) {
  console.log(`[TikTok Debug] ${message}`);
  
  // 避免同时显示太多调试窗口 - 检查是否已有调试窗口
  const existingDebug = document.querySelector('#tikTokDebugInfo');
  if (existingDebug) {
    // 如果现有的是错误，但新消息不是错误，保留错误消息
    if (existingDebug.classList.contains('error') && !isError) {
      return;
    }
    
    // 更新现有窗口内容
    existingDebug.textContent = message;
    
    // 更新错误状态
    if (isError) {
      existingDebug.classList.add('error');
      existingDebug.style.background = 'rgba(255, 0, 0, 0.9)';
    } else {
      existingDebug.classList.remove('error');
      existingDebug.style.background = 'rgba(0, 0, 0, 0.9)';
    }
    
    // 重置自动关闭计时器
    clearTimeout(existingDebug.dataset.timeoutId);
    existingDebug.dataset.timeoutId = setTimeout(() => {
      existingDebug.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        existingDebug.remove();
      }, 300);
    }, 15000);
    
    return;
  }
  
  // 创建调试信息区域
  const debugDiv = document.createElement('div');
  debugDiv.id = 'tikTokDebugInfo';
  if (isError) {
    debugDiv.classList.add('error');
  }
  
  debugDiv.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 15px;
    background: ${isError ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.9)'};
    color: white;
    border-radius: 5px;
    z-index: 10000;
    max-width: 80%;
    max-height: 300px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: fadeIn 0.3s ease;
  `;
  
  // 添加关闭按钮
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: white;
    font-size: 16px;
    cursor: pointer;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeButton.onclick = () => {
    debugDiv.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      debugDiv.remove();
    }, 300);
  };
  
  debugDiv.textContent = message;
  debugDiv.appendChild(closeButton);
  document.body.appendChild(debugDiv);
  
  // 15秒后自动移除
  const timeoutId = setTimeout(() => {
    debugDiv.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      debugDiv.remove();
    }, 300);
  }, 15000);
  
  // 存储timeoutId以便需要时清除
  debugDiv.dataset.timeoutId = timeoutId;
}

/**
 * @description 抓取表格中的达人数据
 * @returns {Object} 表格中的达人信息
 */
function captureTableData() {
  try {
    showLog('开始抓取表格数据...');
    showDebugInfo('开始抓取表格数据，尝试多种选择器...');
    
    // 尝试多个可能的选择器来找到表格行
    const selectors = [
      'tr',
      '.arco-table-tr',
      'tr[class*="table"]',
      'tbody tr',
      '.table-row',
      '[role="row"]',
      'div[class*="table-row"]',
      'div[role="row"]',
      '.list-item',
      '.item-row'
    ];
    
    let rows = null;
    let usedSelector = '';
    
    // 尝试找到表格行
    for (const selector of selectors) {
      rows = document.querySelectorAll(selector);
      showDebugInfo(`使用选择器 "${selector}" 找到行数: ${rows.length}`);
      if (rows.length > 0) {
        usedSelector = selector;
        break;
      }
    }
    
    // 如果没找到表格行，尝试查找表格元素，然后再查找行
    if (!rows || rows.length === 0) {
      const tableSelectors = [
        'table',
        '.table',
        'div[role="table"]',
        'div[class*="table"]',
        '.list',
        '.data-list',
        '.list-container'
      ];
      
      for (const tableSelector of tableSelectors) {
        const tables = document.querySelectorAll(tableSelector);
        showDebugInfo(`尝试找表格: 使用选择器 "${tableSelector}" 找到表格数: ${tables.length}`);
        
        if (tables.length > 0) {
          // 找到表格后再查找行
          for (const table of tables) {
            for (const rowSelector of selectors) {
              const foundRows = table.querySelectorAll(rowSelector);
              if (foundRows.length > 0) {
                rows = foundRows;
                usedSelector = `${tableSelector} ${rowSelector}`;
                showDebugInfo(`在表格中找到 ${rows.length} 行数据，使用选择器: "${usedSelector}"`);
                break;
              }
            }
            if (rows && rows.length > 0) break;
          }
        }
        
        if (rows && rows.length > 0) break;
      }
    }
    
    // 如果仍然没找到行，尝试基于外观特征来识别可能的表格行
    if (!rows || rows.length === 0) {
      showDebugInfo('使用特征识别方法查找可能的表格行...');
      
      // 查找在同一水平线上排列的多个div或span元素组
      const containerElements = document.querySelectorAll('div[class*="container"], div[class*="list"], div[class*="content"]');
      
      for (const container of containerElements) {
        const children = container.children;
        
        // 检查子元素是否有足够数量且结构类似（可能是表格行）
        if (children.length >= 3) { // 至少有3个看起来像行的元素
          let similarStructureCount = 0;
          let firstChildCellCount = 0;
          
          // 检查第一个子元素有多少个单元格
          if (children[0]) {
            firstChildCellCount = children[0].querySelectorAll('div, span').length;
          }
          
          // 检查有多少子元素具有相似的结构
          for (let i = 1; i < children.length; i++) {
            const cellCount = children[i].querySelectorAll('div, span').length;
            // 如果单元格数量相近，认为结构类似
            if (Math.abs(cellCount - firstChildCellCount) <= 2) {
              similarStructureCount++;
            }
          }
          
          // 如果大部分子元素结构类似，可能是表格行
          if (similarStructureCount >= Math.min(5, children.length * 0.7)) {
            rows = children;
            usedSelector = '基于特征识别的可能表格行';
            showDebugInfo(`通过特征识别找到 ${rows.length} 个可能的表格行`);
            break;
          }
        }
      }
    }
    
    if (!rows || rows.length === 0) {
      showLog('未找到表格数据，请确保在正确的页面');
      showDebugInfo('未找到表格数据结构，尝试了所有可能的选择器');
      return null;
    }

    const creators = [];
    // 计算有效的数据行总数（跳过无单元格的行）
    let validTotalRows = 0;
    for (let i = 0; i < rows.length; i++) {
      // 尝试找到单元格元素
      const cells = rows[i].querySelectorAll('td, th, div[role="cell"], div[class*="cell"], span[class*="cell"]');
      if (cells && cells.length > 0) {
        validTotalRows++;
      }
    }
    
    showLog(`总共找到 ${rows.length} 行数据，其中有效行数: ${validTotalRows}`);
    showDebugInfo(`使用选择器 "${usedSelector}" 找到 ${validTotalRows} 行有效数据`);
    
    // 处理所有行数据，不限制行数
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // 获取所有单元格 - 尝试多种可能的单元格选择器
        const cellSelectors = [
          'td',
          'th',
          'div[role="cell"]',
          'div[class*="cell"]',
          'span[class*="cell"]',
          'div.column',
          'div:not(:empty)',
          'span:not(:empty)'
        ];
        
        let cells = null;
        
        // 尝试每个单元格选择器
        for (const cellSelector of cellSelectors) {
          const foundCells = row.querySelectorAll(cellSelector);
          if (foundCells && foundCells.length > 0) {
            cells = foundCells;
            break;
          }
        }
        
        if (!cells || cells.length === 0) {
          // 如果没有找到单元格，跳过此行
          continue;
        }

        showDebugInfo(`处理第 ${i + 1} 行，找到 ${cells.length} 个单元格`);

        // 尝试多种选择器获取用户名元素
        const usernameSelectors = [
          'span[data-e2e$="-1b37"]', 
          'span[class*="name"]', 
          'div[class*="name"]',
          'span[class*="username"]',
          'div[class*="username"]',
          'a[href*="/user/"]',
          'a[href*="/@"]'
        ];
        
        let username = '';
        
        // 首先尝试在第一个单元格中查找用户名
        for (const selector of usernameSelectors) {
          const usernameElement = cells[0]?.querySelector(selector);
          if (usernameElement && usernameElement.textContent) {
            username = decodeText(usernameElement.textContent.trim());
            if (username) break;
          }
        }
        
        // 如果第一个单元格没找到，尝试整行查找
        if (!username) {
          for (const selector of usernameSelectors) {
            const usernameElement = row.querySelector(selector);
            if (usernameElement && usernameElement.textContent) {
              username = decodeText(usernameElement.textContent.trim());
              if (username) break;
            }
          }
        }
        
        // 如果仍然没找到，直接使用第一个单元格的文本
        if (!username && cells[0]) {
          username = decodeText(cells[0].textContent?.trim() || '');
        }

        // 尝试提取粉丝数和其他数据
        // 粉丝数可能在第二个单元格，但有时候也可能有不同的位置
        const followersSelectors = [
          'span[data-e2e$="-6932"]',
          'span[class*="follower"]',
          'div[class*="follower"]',
          'span',
          'div'
        ];
        
        let followersCount = '0';
        
        // 尝试在第二个单元格中查找粉丝数
        for (const selector of followersSelectors) {
          const followersElement = cells[1]?.querySelector(selector);
          if (followersElement && followersElement.textContent && 
              (followersElement.textContent.includes('粉丝') || 
               /\d+/.test(followersElement.textContent))) {
            followersCount = decodeText(followersElement.textContent.trim());
            // 从文本中提取数字
            const matches = followersCount.match(/\d+/);
            if (matches) {
              followersCount = matches[0];
            }
            if (followersCount !== '0') break;
          }
        }
        
        // 如果第二个单元格没找到，尝试整行查找
        if (followersCount === '0') {
          for (const selector of followersSelectors) {
            const followersElement = row.querySelector(selector);
            if (followersElement && followersElement.textContent && 
                (followersElement.textContent.includes('粉丝') || 
                 /\d+/.test(followersElement.textContent))) {
              followersCount = decodeText(followersElement.textContent.trim());
              // 从文本中提取数字
              const matches = followersCount.match(/\d+/);
              if (matches) {
                followersCount = matches[0];
              }
              if (followersCount !== '0') break;
            }
          }
        }
        
        // 如果仍然没找到，直接使用第二个单元格的文本（如果存在）
        if (followersCount === '0' && cells[1]) {
          followersCount = decodeText(cells[1].textContent?.trim() || '0');
          // 从文本中提取数字
          const matches = followersCount.match(/\d+/);
          if (matches) {
            followersCount = matches[0];
          }
        }

        // 创建达人对象，尝试从剩余单元格获取更多数据
        const creator = {
          username: username,
          stats: {
            followers: followersCount,
            gmv: cells[2] ? decodeText(cells[2].textContent?.trim() || '0') : '0',
            salesRevenue: cells[3] ? decodeText(cells[3].textContent?.trim() || '0') : '0',
            engagementViews: cells[4] ? decodeText(cells[4].textContent?.trim() || '0') : '0',
            earnings: cells[6] ? decodeText(cells[6].textContent?.trim() || '฿0.00') : '฿0.00',
            totalEarnings: cells[7] ? decodeText(cells[7].textContent?.trim() || '฿0.00') : '฿0.00',
            views: cells[8] ? decodeText(cells[8].textContent?.trim() || '0') : '0',
            comments: cells[9] ? decodeText(cells[9].textContent?.trim() || '0') : '0',
            averageEarnings: cells[10] ? decodeText(cells[10].textContent?.trim() || '฿0.00') : '฿0.00'
          },
          status: cells[11] ? decodeText(cells[11].textContent?.trim() || '') : '',
          captureTime: new Date().toISOString()
        };

        // 验证数据是否有效 - 主要检查用户名
        if (creator.username) {
          // 过滤掉不是用户名的内容
          if (creator.username.length > 50 || 
              creator.username.includes('\n') || 
              /^\s*$/.test(creator.username)) {
            continue;
          }
          
          const notUsernameTexts = ['首页', '搜索', '消息', '我', '登录', '注册', '发布', '关注', '粉丝', '获赞',
                                 '查看', '更多', '设置', '帮助', '关于', '条款', '隐私', '举报',
                                 '用户名', '账号', '姓名', 'username', 'name'];
          
          if (notUsernameTexts.includes(creator.username)) {
            continue;
          }
          
          showLog(`成功提取第 ${i + 1} 行数据：${creator.username}`);
          creators.push(creator);
        }
      } catch (error) {
        showDebugInfo(`处理第 ${i + 1} 行时出错: ${error.message}`, true);
      }
    }
    
    showLog(`总共成功处理 ${creators.length} 条数据`);
    
    // 返回处理结果以及总数据条数信息
    return {
      data: creators.length > 0 ? creators : null,
      totalRows: creators.length
    };
  } catch (error) {
    showDebugInfo(`抓取表格数据时出错：${error.message}`, true);
    return null;
  }
}

/**
 * @description 抓取排名达人数据
 * @param {number} maxCount - 最大抓取数量，默认100（实际会抓取页面上所有找到的达人）
 * @returns {Object} 排名达人信息
 */
function captureRankedCreators(maxCount = 100) {
  try {
    showLog('开始抓取排名达人数据...');
    showDebugInfo('开始抓取排名达人数据，将尝试抓取页面上所有达人...');
    
    // 专门针对用户提供的HTML结构处理方法
    try {
      showDebugInfo('尝试直接查找用户提供的HTML结构...');
      // 查找示例中的特定结构：<div class="text-body-m-regular text-neutral-text1">mingkdwv90o</div>
      // 使用更宽泛的选择器，捕获更多可能的结构
      const usernameDivSelectors = [
        'div.text-body-m-regular.text-neutral-text1',
        'div[class*="text-body-m-regular"]',
        'div[class*="text-neutral-text1"]',
        'span[class*="text-body-m-regular"]',
        'span[class*="text-neutral-text1"]',
        'div[class*="username"]',
        'span[class*="username"]',
        'a[class*="username"]'
      ];
      
      let usernameDivs = [];
      let successSelector = '';
      
      // 尝试每个选择器
      for (const selector of usernameDivSelectors) {
        const elements = document.querySelectorAll(selector);
        showDebugInfo(`使用选择器 "${selector}" 找到元素数量: ${elements.length}`);
        
        if (elements && elements.length > 0) {
          usernameDivs = Array.from(elements);
          successSelector = selector;
          break;
        }
      }
      
      if (usernameDivs && usernameDivs.length > 0) {
        showDebugInfo(`使用选择器 "${successSelector}" 找到 ${usernameDivs.length} 个匹配的用户名元素，将抓取所有元素`);
        
        const creators = [];
        let processedCount = 0;
        
        // 使用循环而不是固定数量限制，抓取所有找到的达人
        for (let i = 0; i < usernameDivs.length && processedCount < maxCount; i++) {
          try {
            const div = usernameDivs[i];
            const username = div.textContent.trim();
            
            if (username && username.length > 0 && username.length < 50) {
              showDebugInfo(`成功提取用户名: ${username}`);
              
              // 避免重复
              if (!creators.some(c => c.username === username)) {
                creators.push({
                  username: username,
                  captureTime: new Date().toISOString()
                });
                processedCount++;
                showLog(`成功提取第 ${processedCount} 个达人: ${username}`);
              }
            }
          } catch (err) {
            showDebugInfo(`提取用户名发生错误: ${err.message}`);
          }
        }
        
        if (creators.length > 0) {
          showLog(`总共成功处理 ${creators.length} 个排名达人`);
          return {
            data: creators,
            totalRows: creators.length,
            message: `已使用选择器 "${successSelector}" 抓取到 ${creators.length} 个排名达人`
          };
        }
      } else {
        showDebugInfo('未找到匹配的用户名div元素，尝试其他方法');
      }
    } catch (specificError) {
      showDebugInfo(`特定结构处理失败: ${specificError.message}`);
    }
    
    // 先查找基于提供HTML示例的特定结构
    const cardSelectors = [
      'div.ml-8',
      'div[class*="creator-card"]',
      'div[class*="user-card"]',
      'div[class*="profile-card"]',
      'div[data-e2e*="user-card"]',
      'div[data-e2e*="creator-card"]'
    ];
    
    let creatorCards = [];
    let cardSelector = '';
    
    // 尝试每个选择器
    for (const selector of cardSelectors) {
      const cards = document.querySelectorAll(selector);
      showDebugInfo(`使用卡片选择器 "${selector}" 找到元素数量: ${cards.length}`);
      
      if (cards && cards.length > 0) {
        creatorCards = Array.from(cards);
        cardSelector = selector;
        break;
      }
    }
    
    showDebugInfo(`找到 ${creatorCards.length} 个可能的达人卡片元素，将抓取所有元素`);
    
    if (creatorCards.length > 0) {
      // 找到卡片结构，尝试提取用户名
      const creators = [];
      let processedCount = 0;
      
      // 抓取所有卡片
      for (let i = 0; i < creatorCards.length && processedCount < maxCount; i++) {
        try {
          const card = creatorCards[i];
          
          // 尝试找到用户名元素
          // 尝试多个可能的包含用户名的元素选择器
          const nameSelectors = [
            '.text-body-m-regular.text-neutral-text1',
            '.text-body-m-regular',
            '[class*="username"]',
            '[class*="name"]',
            'span', 
            'div'
          ];
          
          let nameElement = null;
          
          // 尝试每个选择器找到用户名元素
          for (const selector of nameSelectors) {
            const element = card.querySelector(selector);
            if (element && element.textContent && element.textContent.trim()) {
              nameElement = element;
              break;
            }
          }
          
          if (nameElement && nameElement.textContent) {
            const creatorName = nameElement.textContent.trim();
            showDebugInfo(`从卡片中提取到达人名称: ${creatorName}`);
            
            // 避免重复，过滤掉明显不是用户名的内容
            if (creatorName && 
                creatorName.length < 50 && 
                !creatorName.includes('\n') && 
                !creators.some(c => c.username === creatorName)) {
              showLog(`成功提取第 ${processedCount + 1} 个达人: ${creatorName}`);
              creators.push({
                username: creatorName,
                captureTime: new Date().toISOString()
              });
              processedCount++;
            }
          } else {
            // 如果找不到特定的用户名元素，尝试获取卡片中的所有文本
            const allText = card.textContent.trim();
            showDebugInfo(`卡片内容: ${allText.substring(0, 100)}...`);
            
            // 尝试从文本中提取可能的用户名（第一行文本）
            const lines = allText.split('\n');
            if (lines.length > 0) {
              const possibleName = lines[0].trim();
              if (possibleName && 
                  possibleName.length < 50 && 
                  !possibleName.includes(' ') && 
                  !creators.some(c => c.username === possibleName)) {
                showLog(`成功从卡片文本提取第 ${processedCount + 1} 个达人: ${possibleName}`);
                creators.push({
                  username: possibleName,
                  captureTime: new Date().toISOString()
                });
                processedCount++;
              }
            }
          }
        } catch (error) {
          showDebugInfo(`处理卡片元素时出错: ${error.message}`, true);
        }
      }
      
      if (creators.length > 0) {
        showLog(`总共成功处理 ${creators.length} 个排名达人`);
        return {
          data: creators,
          totalRows: creators.length,
          message: `已通过卡片选择器 "${cardSelector}" 抓取到 ${creators.length} 个排名达人`
        };
      }
    }
    
    // 如果没有找到卡片结构或无法提取用户名，尝试更通用的方法
    showDebugInfo('未能从卡片提取用户名，尝试其他方法...');
    
    // 尝试多种选择器来找到达人名称元素
    const selectors = [
      '.text-body-m-regular.text-neutral-text1',
      '.text-body-m-regular',
      'a[href*="/user/"]', 
      'a[data-e2e*="user-card"]',
      'a[href*="/@"]',
      'font[style="vertical-align: inherit;"]',
      'div.text-body-m-regular',
      'div[class*="username"]',
      'span[class*="username"]',
      '[class*="creator-name"]',
      '[class*="user-name"]'
    ];
    
    let creatorElements = [];
    let usedSelector = '';
    
    // 尝试每个选择器，找到元素
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      showDebugInfo(`使用选择器 "${selector}" 找到元素数量: ${elements.length}`);
      
      if (elements && elements.length > 0) {
        creatorElements = Array.from(elements);
        usedSelector = selector;
        break;
      }
    }
    
    // 如果还是没找到，尝试一个更通用的方法
    if (creatorElements.length === 0) {
      showDebugInfo('尝试查找任何可能的用户名...');
      
      // 尝试查找页面上任何可能包含用户名的元素
      const allDivs = document.querySelectorAll('div');
      const possibleUsernames = [];
      
      allDivs.forEach(div => {
        const text = div.textContent?.trim();
        if (text && text.length > 0 && text.length < 50 && !text.includes(' ')) {
          // 假设简短无空格的文本可能是用户名
          possibleUsernames.push(div);
        }
      });
      
      if (possibleUsernames.length > 0) {
        creatorElements = possibleUsernames;
        showDebugInfo(`找到 ${creatorElements.length} 个可能的用户名元素，将抓取所有元素`);
      }
    }
    
    if (creatorElements.length === 0) {
      // 尝试使用正则表达式方法 - 查找多种可能的HTML结构
      try {
        const pageHTML = document.body.innerHTML;
        const usernamePatterns = [
          /<div class="text-body-m-regular text-neutral-text1">(.*?)<\/div>/g,
          /<div class="[^"]*text-body-m-regular[^"]*">(.*?)<\/div>/g,
          /<div class="[^"]*text-neutral-text1[^"]*">(.*?)<\/div>/g,
          /<span class="[^"]*username[^"]*">(.*?)<\/span>/g,
          /<div class="[^"]*username[^"]*">(.*?)<\/div>/g
        ];
        
        const manuallyExtractedNames = [];
        
        // 尝试每个正则表达式模式
        for (const pattern of usernamePatterns) {
          let match;
          // 重置正则表达式
          pattern.lastIndex = 0;
          
          // 尝试提取所有匹配的名称
          while ((match = pattern.exec(pageHTML)) !== null && manuallyExtractedNames.length < maxCount) {
            if (match[1] && match[1].trim()) {
              const extractedName = match[1].trim();
              
              // 检查是否已存在
              if (!manuallyExtractedNames.some(item => item.username === extractedName)) {
                manuallyExtractedNames.push({
                  username: extractedName,
                  captureTime: new Date().toISOString()
                });
              }
            }
          }
          
          // 如果找到足够多的用户名，退出循环
          if (manuallyExtractedNames.length > 0) {
            break;
          }
        }
        
        if (manuallyExtractedNames.length > 0) {
          showDebugInfo(`通过正则表达式提取到 ${manuallyExtractedNames.length} 个用户名`);
          return {
            data: manuallyExtractedNames,
            totalRows: manuallyExtractedNames.length,
            message: `已通过正则表达式抓取到 ${manuallyExtractedNames.length} 个排名达人`
          };
        }
      } catch (regexError) {
        showDebugInfo(`正则表达式提取失败: ${regexError.message}`);
      }
      
      // 尝试最后的元素扫描方法 - 寻找任何短文本内容
      try {
        showDebugInfo('尝试全页面元素扫描方法...');
        
        // 获取页面上所有的元素
        const allElements = document.querySelectorAll('*');
        showDebugInfo(`页面上总共有 ${allElements.length} 个元素`);
        
        const possibleUsernames = [];
        
        // 遍历所有元素，查找可能的用户名
        for (let i = 0; i < allElements.length && possibleUsernames.length < maxCount; i++) {
          const element = allElements[i];
          
          // 只获取元素自身的文本，不包括子元素
          let ownText = '';
          for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              ownText += node.textContent;
            }
          }
          
          ownText = ownText.trim();
          
          // 过滤可能的用户名 - 长度适中且没有空格的文本
          if (ownText && 
              ownText.length > 2 && 
              ownText.length < 30 && 
              !ownText.includes(' ') &&
              !possibleUsernames.some(item => item.username === ownText)) {
            
            // 额外检查 - 排除明显不是用户名的文本
            const notUsernameTexts = ['首页', '搜索', '消息', '我', '登录', '注册', '发布', '关注', '粉丝', '获赞',
                                     '查看', '更多', '设置', '帮助', '关于', '条款', '隐私', '举报'];
            
            if (!notUsernameTexts.includes(ownText)) {
              possibleUsernames.push({
                username: ownText,
                captureTime: new Date().toISOString()
              });
            }
          }
        }
        
        if (possibleUsernames.length > 0) {
          showDebugInfo(`通过全页面扫描找到 ${possibleUsernames.length} 个可能的用户名`);
          return {
            data: possibleUsernames,
            totalRows: possibleUsernames.length,
            message: `已通过全页面扫描抓取到 ${possibleUsernames.length} 个可能的排名达人`
          };
        }
      } catch (scanError) {
        showDebugInfo(`全页面扫描失败: ${scanError.message}`);
      }
      
      showDebugInfo('未找到达人名称元素，请确保在正确的页面', true);
      
      // 打印页面信息以帮助调试
      const pageStructure = `
页面URL: ${window.location.href}
页面标题: ${document.title}
页面结构片段: 
${document.body.innerHTML.substring(0, 1000)}...
      `;
      showDebugInfo(pageStructure, true);
      
      return null;
    }
    
    showLog(`找到 ${creatorElements.length} 个可能的达人元素，将处理所有找到的元素`);
    
    const creators = [];
    let processedCount = 0;
    
    // 遍历并处理达人元素
    for (let i = 0; i < creatorElements.length && processedCount < maxCount; i++) {
      try {
        const element = creatorElements[i];
        let creatorName = '';
        
        // 尝试获取元素文本内容
        if (element.textContent) {
          creatorName = element.textContent.trim();
          
          // 过滤掉明显不是用户名的内容
          if (creatorName.length > 30 || creatorName.includes('\n') || /^\s*$/.test(creatorName)) {
            continue;
          }
          
          // 额外检查 - 排除明显不是用户名的文本
          const notUsernameTexts = ['首页', '搜索', '消息', '我', '登录', '注册', '发布', '关注', '粉丝', '获赞',
                                   '查看', '更多', '设置', '帮助', '关于', '条款', '隐私', '举报'];
          
          if (notUsernameTexts.includes(creatorName)) {
            continue;
          }
        }
        
        // 如果成功获取到名称，添加到结果中
        if (creatorName && !creators.some(c => c.username === creatorName)) {
          showLog(`成功提取第 ${processedCount + 1} 个达人: ${creatorName}`);
          creators.push({
            username: creatorName,
            captureTime: new Date().toISOString()
          });
          processedCount++;
        }
      } catch (error) {
        showDebugInfo(`处理达人元素时出错: ${error.message}`, true);
      }
    }
    
    showLog(`总共成功处理 ${creators.length} 个排名达人`);
    
    return {
      data: creators.length > 0 ? creators : null,
      totalRows: creators.length,
      message: `已通过选择器 "${usedSelector}" 抓取到 ${creators.length} 个排名达人`
    };
  } catch (error) {
    showDebugInfo(`抓取排名达人数据时出错：${error.message}`, true);
    return null;
  }
}

/**
 * @description 抓取创作者数据
 * @returns {Object} 创作者信息
 */
function captureCreators() {
  try {
    showLog('开始抓取创作者数据...');
    showDebugInfo('开始抓取创作者数据，尝试更精确的选择器...');
    
    // 尝试查找创作者用户名元素 - 使用更精确的选择器
    const creatorSelectors = [
      // 最精确的选择器 - 基于提供的HTML结构
      '.text-head-s.text-neutral-text1 div[style*="-webkit-line-clamp: 1"]',
      '.arco-table-tr .text-head-s div[style*="-webkit-line-clamp: 1"]',
      // 备用选择器
      '.ml-8 .text-head-s div[style*="-webkit-line-clamp: 1"]',
      '.arco-table-td:first-child div[style*="-webkit-line-clamp: 1"]'
    ];
    
    let creatorElements = [];
    let usedSelector = '';
    
    // 尝试每个选择器
    for (const selector of creatorSelectors) {
      const elements = document.querySelectorAll(selector);
      showDebugInfo(`使用选择器 "${selector}" 找到元素数量: ${elements.length}`);
      
      if (elements && elements.length > 0) {
        // 验证找到的元素是否可能是用户名
        const validElements = Array.from(elements).filter(el => {
          const text = el.textContent?.trim();
          return text && text.length > 0 && text.length < 30 && !text.includes('\n');
        });
        
        if (validElements.length > 0) {
          creatorElements = validElements;
          usedSelector = selector;
          showDebugInfo(`使用选择器 "${selector}" 找到有效元素数量: ${validElements.length}`);
          break;
        }
      }
    }
    
    // 如果没有找到创作者元素，尝试更具体的方法
    if (creatorElements.length === 0) {
      showDebugInfo('使用更具体的方法查找创作者...');
      
      // 尝试使用更具体的选择器组合
      try {
        // 首先找到表格行
        const rows = document.querySelectorAll('tr.arco-table-tr');
        showDebugInfo(`找到表格行数量: ${rows.length}`);
        
        if (rows.length > 0) {
          // 从每行中查找第一个单元格，然后查找用户名元素
          for (const row of rows) {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell) {
              // 在第一个单元格中查找用户名元素
              const usernameDiv = firstCell.querySelector('div[style*="-webkit-line-clamp: 1"]');
              if (usernameDiv && usernameDiv.textContent?.trim()) {
                creatorElements.push(usernameDiv);
              }
            }
          }
          
          if (creatorElements.length > 0) {
            usedSelector = '表格行中的第一个单元格中的用户名元素';
            showDebugInfo(`使用表格行方法找到创作者数量: ${creatorElements.length}`);
          }
        }
      } catch (error) {
        showDebugInfo(`使用具体方法查找时出错: ${error.message}`);
      }
    }
    
    // 如果仍然没找到，尝试直接使用提供的选择器，但进行更严格的过滤
    if (creatorElements.length === 0) {
      const exactSelector = 'div[style="-webkit-line-clamp: 1; width: 100%; display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; word-break: break-all;"]';
      const allElements = document.querySelectorAll(exactSelector);
      showDebugInfo(`使用精确选择器找到元素数量: ${allElements.length}`);
      
      // 只保留在表格行中的元素
      const tableRows = document.querySelectorAll('tr.arco-table-tr');
      if (tableRows.length > 0) {
        const filteredElements = Array.from(allElements).filter(el => {
          // 检查元素是否在表格行内
          let parent = el.parentElement;
          while (parent) {
            if (parent.tagName === 'TR' && parent.classList.contains('arco-table-tr')) {
              return true;
            }
            parent = parent.parentElement;
          }
          return false;
        });
        
        if (filteredElements.length > 0) {
          creatorElements = filteredElements;
          usedSelector = '在表格行中的精确样式元素';
          showDebugInfo(`过滤后的元素数量: ${filteredElements.length}`);
        }
      }
    }
    
    if (creatorElements.length === 0) {
      showLog('未找到创作者数据，请确保在正确的页面');
      showDebugInfo('未找到创作者元素，尝试了所有可能的选择器');
      return null;
    }
    
    showLog(`找到 ${creatorElements.length} 个可能的创作者元素`);
    
    const creators = [];
    let processedCount = 0;
    
    // 处理所有找到的创作者元素
    for (let i = 0; i < creatorElements.length; i++) {
      try {
        const element = creatorElements[i];
        let username = '';
        
        // 获取元素文本内容作为用户名
        if (element.textContent) {
          username = decodeText(element.textContent.trim());
          
          // 过滤掉明显不是用户名的内容
          if (username.length > 30 || username.includes('\n') || /^\s*$/.test(username)) {
            continue;
          }
          
          // 额外检查 - 排除明显不是用户名的文本
          const notUsernameTexts = ['首页', '搜索', '消息', '我', '登录', '注册', '发布', '关注', '粉丝', '获赞',
                                   '查看', '更多', '设置', '帮助', '关于', '条款', '隐私', '举报', '用户名', '账号'];
          
          if (notUsernameTexts.includes(username)) {
            continue;
          }
        }
        
        // 如果成功获取到用户名，添加到结果中
        if (username && !creators.some(c => c.username === username)) {
          showLog(`成功提取第 ${processedCount + 1} 个创作者: ${username}`);
          creators.push({
            username: username,
            captureTime: new Date().toISOString()
          });
          processedCount++;
        }
      } catch (error) {
        showDebugInfo(`处理创作者元素时出错: ${error.message}`, true);
      }
    }
    
    showLog(`总共成功处理 ${creators.length} 个创作者`);
    
    return {
      data: creators.length > 0 ? creators : null,
      totalRows: creators.length,
      message: `已通过选择器 "${usedSelector}" 抓取到 ${creators.length} 个创作者`
    };
  } catch (error) {
    showDebugInfo(`抓取创作者数据时出错：${error.message}`, true);
    return null;
  }
}

/**
 * @description 监听来自popup的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
    return true;
  }
  
  if (request.action === 'captureTable') {
    const tableResult = captureTableData();
    if (tableResult && tableResult.data) {
      chrome.storage.local.set({ 
        tableData: tableResult.data,
        totalRows: tableResult.totalRows
      }, () => {
        sendResponse(tableResult);
      });
    } else {
      sendResponse({ error: '无法抓取表格数据' });
    }
    return true;
  } else if (request.action === 'captureRankedCreators') {
    // 不再使用固定的计数，而是让函数自动抓取所有可以找到的达人
    const rankedResult = captureRankedCreators();
    if (rankedResult && rankedResult.data) {
      chrome.storage.local.set({ 
        rankedData: rankedResult.data,
        totalRankedRows: rankedResult.totalRows,
        dataType: 'ranked' // 标记数据类型为排名达人
      }, () => {
        sendResponse(rankedResult);
      });
    } else {
      sendResponse({ error: '无法抓取排名达人数据' });
    }
    return true;
  } else if (request.action === 'captureCreators') {
    // 新增：抓取创作者数据
    const creatorsResult = captureCreators();
    if (creatorsResult && creatorsResult.data) {
      chrome.storage.local.set({ 
        creatorsData: creatorsResult.data,
        totalCreatorsRows: creatorsResult.totalRows,
        dataType: 'creators' // 标记数据类型为创作者
      }, () => {
        sendResponse(creatorsResult);
      });
    } else {
      sendResponse({ error: '无法抓取创作者数据' });
    }
    return true;
  }
}); 