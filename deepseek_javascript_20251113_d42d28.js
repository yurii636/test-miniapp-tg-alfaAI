const tg = window.Telegram.WebApp;

// Инициализация
tg.expand();
tg.ready();

let chatHistory = [];

// Функция отправки сообщения
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Добавляем сообщение пользователя в чат
    addMessage(message, 'user');
    input.value = '';
    
    // Показываем индикатор загрузки
    showLoading(true);
    
    try {
        // Отправляем сообщение в ваш n8n workflow
        const response = await sendToBot(message);
        
        // Добавляем ответ бота
        addMessage(response, 'bot');
        
    } catch (error) {
        addMessage('⚠️ Произошла ошибка. Попробуйте еще раз.', 'bot');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Функция отправки на бэкенд (n8n)
async function sendToBot(message) {
    // ВРЕМЕННО: заглушка для тестирования
    // Замените на ваш n8n webhook URL
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `Это ответ от AI ассистента на ваше сообщение: "${message}". В реальной версии здесь будет ответ от DeepSeek через n8n.`;
    
    /*
    // РЕАЛЬНАЯ РЕАЛИЗАЦИЯ (раскомментируйте когда настроите n8n):
    const response = await fetch('YOUR_N8N_WEBHOOK_URL_HERE', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            chatId: tg.initDataUnsafe.user?.id || 'mini-app-user',
            platform: 'telegram_mini_app'
        })
    });
    
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    return data.response || data.text || data.message;
    */
}

// Добавление сообщения в чат
function addMessage(text, sender) {
    const chat = document.getElementById('chat');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    chat.appendChild(messageDiv);
    
    // Сохраняем в историю
    chatHistory.push({ text, sender, timestamp: new Date() });
    
    // Прокрутка вниз
    chat.scrollTop = chat.scrollHeight;
}

// Показать/скрыть индикатор загрузки
function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}

// Отправка по Enter
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Инициализация при загрузке
addMessage('👋 Привет! Я ваш AI ассистент. Задайте любой вопрос!', 'bot');