const style = document.createElement('style');
style.textContent = `
    .save-url-button {
        bottom: 100px;
        right: 10px;
        padding: 5px 10px;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    .save-url-button-2 {
    position: absolute;
    bottom: 50px;
    right: 0px;
    z-index: 1000;
    padding: 5px 10px;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    }
    .save-url-button-3 {
    top: 20px;
    right: 100px;
    width: 200px;
    z-index: 1000;
    margin-top: 10px;
    padding: 5px 10px;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    }
`;

document.head.appendChild(style);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateButtons") {
        updateAllButtons();
    }
});
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.savedUrls) {
        updateAllButtons(); // Обновляем кнопки при изменении сохраненных URL
    }
});

function getSavedUrls(callback) {
    chrome.storage.local.get(['savedUrls'], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error accessing storage:", chrome.runtime.lastError);
            return;
        }
        callback(result.savedUrls || []);
    });
}

// Функция для обновления текста всех кнопок
function updateAllButtons() {
    // Получаем все кнопки на странице
    const buttons = document.querySelectorAll('button.save-url-button, button.save-url-button-2,button.save-url-button-3');
    // Проверяем, есть ли кнопки
    if (buttons.length === 0) {
        console.log('No buttons found to update.');
        return;
    }
    getSavedUrls((savedUrls) => {
        buttons.forEach(button => {
            const url = button.dataset.url; // Предполагаем, что URL хранится в data-атрибуте
            updateButtonState(button, url, savedUrls);
        });
    });
}

// Функция для обновления состояния кнопки
function updateButtonState(button, url, savedUrls) {
    const isSaved = savedUrls.includes(url);
    button.textContent = isSaved ? 'Remove' : 'Save';
    button.style.backgroundColor = isSaved ? 'red' : 'green';
}

function addButtonToAd(adElement, url, buttonType ) {
    
    if (adElement.querySelector('button.save-url-button, button.save-url-button-2,button.save-url-button-3')) {
        return;
    }

    const button = document.createElement('button');
    button.textContent = 'Save';
    button.dataset.url = url;

    if (buttonType === 'type1') {
        button.classList.add('save-url-button');
    } else if (buttonType === 'type2') {
        button.classList.add('save-url-button-2');
    }else if (buttonType === 'type3') {
        button.classList.add('save-url-button-3');
    }
    
    getSavedUrls((savedUrls) => {
        updateButtonState(button, url, savedUrls);
    });

    button.addEventListener('click', (e) => {
        e.stopPropagation()
        chrome.storage.local.get(['savedUrls'], (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error accessing storage:", chrome.runtime.lastError);
                return; // Прекращаем выполнение, если произошла ошибка
            }
            const savedUrls = result.savedUrls || [];
            const index = savedUrls.indexOf(url);
            if (index === -1) {
                savedUrls.push(url);
            } else {
                savedUrls.splice(index, 1);
            }
            chrome.storage.local.set({ savedUrls }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Error accessing storage:", chrome.runtime.lastError);
                    return; // Прекращаем выполнение, если произошла ошибка
                }
                updateButtonState(button, url, savedUrls);
                
            });
        });
    });

    // Добавляем кнопку в контейнер объявления
    adElement.appendChild(button);
}

// Функция для добавления кнопок в общий список объявлений
function addButtonsToList() {
    const adElements = document.querySelectorAll('[data-marker="bx-recommendations-block-item"]');
    adElements.forEach(adElement => {
        const linkElement = adElement.querySelector('a[itemprop="url"]');
        if (linkElement) {
            const url = linkElement.href;
            addButtonToAd(adElement, url, 'type1');
        } else {
            console.log('No link element found in ad element.');
        }
    });
}

// Функция для добавления кнопки в карточку объявления
function addButtonToCategory() {
    const adElements = document.querySelectorAll('[data-marker="item"]'); // Селектор для списка объявлений
    adElements.forEach(adElement => {
        const linkElement = adElement.querySelector('a[itemprop="url"]');
        if (linkElement) {
            const url = linkElement.href;
            addButtonToAd(adElement, url, 'type2');
        } else {
            console.log('No link element found in ad element.');
        }
    });
}
function addButtonToPage() {
    const adElement = document.querySelector('[data-marker="item-view/item-view-contacts"]'); // Селектор для списка объявлений
    if (!adElement) {
        return;
    }
    // Получаем URL текущей страницы
    const currentUrl = window.location.href;
    addButtonToAd(adElement, currentUrl, 'type3');
    ;
}
// Функция для наблюдения за изменениями в DOM
function observeDOMChanges() {
    const observer = new MutationObserver(() => {
        addButtonsToList(); // Добавляем кнопки при каждом изменении
        addButtonToCategory();
        addButtonToPage();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

observeDOMChanges();
