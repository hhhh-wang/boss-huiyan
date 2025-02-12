document.addEventListener('DOMContentLoaded', function() {
  const filterCheckbox = document.getElementById('onlineFilter');
  
  // 从 storage 中获取之前的设置
  chrome.storage.local.get(['filterOnlineOnly'], function(result) {
    filterCheckbox.checked = result.filterOnlineOnly || false;
  });

  // 监听复选框变化
  filterCheckbox.addEventListener('change', function() {
    const isChecked = filterCheckbox.checked;
    
    // 保存设置到 storage
    chrome.storage.local.set({
      filterOnlineOnly: isChecked
    });

    // 向 content script 发送消息
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleFilter',
        filterOnlineOnly: isChecked
      });
    });
  });
}); 