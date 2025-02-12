// 监听页面加载
function init() {
  console.log('BOSS直聘助手已加载');
  
  // 等待页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInsertButton);
  } else {
    tryInsertButton();
  }
}

// 等待元素出现的辅助函数
function waitForElement(selectors) {
  if (typeof selectors === 'string') {
    selectors = [selectors];
  }

  return new Promise(resolve => {
    // 检查是否已存在任何一个选择器对应的元素
    for (const selector of selectors) {
      let element;
      if (selector.startsWith('/')) {
        // XPath
        element = document.evaluate(
          selector,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
      } else {
        // CSS 选择器
        element = document.querySelector(selector);
      }
      if (element) {
        return resolve(element);
      }
    }

    const observer = new MutationObserver(mutations => {
      for (const selector of selectors) {
        let element;
        if (selector.startsWith('/')) {
          // XPath
          element = document.evaluate(
            selector,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
        } else {
          // CSS 选择器
          element = document.querySelector(selector);
        }
        if (element) {
          observer.disconnect();
          resolve(element);
          break;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

// 插入过滤按钮
function insertFilterButton() {
  // 创建按钮样式
  if (!document.querySelector('#hr-filter-style')) {
    const style = document.createElement('style');
    style.id = 'hr-filter-style';
    style.textContent = `
      .hr-filter-btn {
        display: inline-block;
        margin-left: 10px;
        padding: 0 12px;
        height: 32px;
        line-height: 32px;
        color: #fff;
        background-color: #00b38a;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        border: none;
      }
      .hr-filter-btn.active {
        background-color: #ff6b6b;
      }
    `;
    document.head.appendChild(style);
  }

  // 如果按钮已存在，则不重复创建
  if (document.querySelector('.hr-filter-btn')) {
    return true;
  }

  // 创建过滤按钮
  const filterBtn = document.createElement('button');
  filterBtn.className = 'hr-filter-btn';
  filterBtn.textContent = '只看在线HR';
  
  // 使用清空筛选条件按钮来定位
  const clearFilterBtn = document.evaluate(
    '/html/body/div[1]/div[2]/div[1]/div[2]/a',
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (!clearFilterBtn) {
    console.log('未找到清空筛选按钮，插入按钮失败');
    return false;
  }

  // 将按钮插入到清空筛选按钮的旁边
  clearFilterBtn.parentNode.insertBefore(filterBtn, clearFilterBtn);

  // 从storage获取之前的过滤状态
  chrome.storage.local.get(['filterOnlineOnly'], function(result) {
    if (result.filterOnlineOnly) {
      filterBtn.classList.add('active');
      filterOfflineHR();
    }
  });

  // 添加点击事件
  filterBtn.addEventListener('click', function() {
    const isActive = filterBtn.classList.toggle('active');
    
    // 保存设置到storage
    chrome.storage.local.set({
      filterOnlineOnly: isActive
    });

    if (isActive) {
      filterOfflineHR();
    } else {
      showAllHR();
    }
  });

  return true;
}

// 过滤不在线的HR
function filterOfflineHR() {
  const jobItems = document.querySelectorAll('.job-list-box .job-card-wrapper');
  jobItems.forEach(item => {
    // 查找在线标签
    const onlineTag = item.querySelector('.boss-online-tag');
    if (!onlineTag) {
      // 如果没有在线标签，则隐藏整个职位卡片
      item.style.display = 'none';
    }
  });
}

// 显示所有HR
function showAllHR() {
  const jobItems = document.querySelectorAll('.job-list-box .job-card-wrapper');
  jobItems.forEach(item => {
    item.style.display = '';
  });
}

// 修改等待元素的逻辑
function tryInsertButton() {
  if (!insertFilterButton()) {
    // 等待清空筛选按钮出现
    waitForElement(['/html/body/div[1]/div[2]/div[1]/div[2]/a']).then(() => {
      insertFilterButton();
    });
  }
}

// 初始化
init();

// 监听页面变化（因为BOSS直聘可能使用了动态加载）
const observer = new MutationObserver(function(mutations) {
  // 检查是否需要重新插入按钮
  if (!document.querySelector('.hr-filter-btn')) {
    insertFilterButton();
  }
  
  // 如果过滤是激活的，对新加载的内容进行过滤
  chrome.storage.local.get(['filterOnlineOnly'], function(result) {
    if (result.filterOnlineOnly) {
      filterOfflineHR();
    }
  });
});

// 开始观察页面变化
observer.observe(document.body, {
  childList: true,
  subtree: true
}); 