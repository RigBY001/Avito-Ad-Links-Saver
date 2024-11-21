document.addEventListener('DOMContentLoaded', () => {
    const linksList = document.getElementById('links-list');
    const copyAllButton = document.getElementById('copy-all');
    const clearAllButton = document.getElementById('clear-all');
  
    function loadLinks() {
      chrome.storage.local.get(['savedUrls'], (result) => {
        const savedUrls = result.savedUrls || [];
        linksList.innerHTML = '';
        savedUrls.forEach(url => {
          const li = document.createElement('li');
          li.textContent = url;
          linksList.appendChild(li);
        });
      });
    }
  
    copyAllButton.addEventListener('click', () => {
      chrome.storage.local.get(['savedUrls'], (result) => {
        if (chrome.runtime.lastError) {
          console.error("Error accessing storage:", chrome.runtime.lastError);
          return; 
        }
        const savedUrls = result.savedUrls || [];
        const urlsText = savedUrls.join('\n');
        navigator.clipboard.writeText(urlsText).then(() => {
          alert('All links copied to clipboard');
        });
      });
    });
  
    clearAllButton.addEventListener('click', () => {
      // Очищаем сохраненные URL в хранилище
      chrome.storage.local.set({ savedUrls: [] }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error accessing storage:", chrome.runtime.lastError);
          return;
        }
          updateLinksList();
          // Отправляем сообщение контентному скрипту для обновления кнопок
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, { action: "updateButtons" });
          });
      });
  });
  
  function updateLinksList() {
    const linksList = document.getElementById('links-list');
    linksList.innerHTML = ''; // Очищаем текущий список

    chrome.storage.local.get(['savedUrls'], (result) => {
        if (chrome.runtime.lastError) {
          console.error("Error accessing storage:", chrome.runtime.lastError);
          return; // Прекращаем выполнение, если произошла ошибка
        }
        const savedUrls = result.savedUrls || [];
        savedUrls.forEach(url => {
            const listItem = document.createElement('li');
            listItem.textContent = url;
            linksList.appendChild(listItem);
        });
    });
  }
    loadLinks();
  });
  