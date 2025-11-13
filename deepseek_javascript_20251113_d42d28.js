const tg = window.Telegram.WebApp;

// Инициализация
tg.expand();
tg.ready();

let chatHistory = [];
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Функция отправки текстового сообщения
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
    
    const responses = [
        `Отличный вопрос! "${message}" - это интересная тема для обсуждения.`,
        `Спасибо за сообщение! По поводу "${message}" я могу рассказать подробнее.`,
        `Я получил ваш вопрос: "${message}". Давайте разберем его детально!`,
        `Интересный запрос! "${message}" - давайте обсудим это более подробно.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
    
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

// Функция начала записи голоса
async function startVoiceRecording() {
    try {
        // Запрашиваем доступ к микрофону
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            } 
        });
        
        // Создаем MediaRecorder
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        audioChunks = [];
        
        // Собираем данные записи
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        // При завершении записи
        mediaRecorder.onstop = processAudioRecording;
        
        // Начинаем запись
        mediaRecorder.start(100); // Собираем данные каждые 100мс
        isRecording = true;
        
        // Показываем интерфейс записи
        document.getElementById('voiceRecording').style.display = 'flex';
        
        // Авто-остановка через 30 секунд
        setTimeout(() => {
            if (isRecording) {
                stopVoiceRecording();
            }
        }, 30000);
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        addMessage('❌ Не удалось получить доступ к микрофону. Проверьте разрешения браузера.', 'bot');
    }
}

// Функция остановки записи
function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        // Останавливаем все треки микрофона
        if (mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        // Скрываем интерфейс записи
        document.getElementById('voiceRecording').style.display = 'none';
    }
}

// Обработка записанного аудио
async function processAudioRecording() {
    try {
        // Показываем сообщение о обработке
        addMessage('🎤 Голосовое сообщение...', 'user');
        showLoading(true);
        
        if (audioChunks.length === 0) {
            throw new Error('No audio recorded');
        }
        
        // Создаем Blob из записанных данных
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // ВРЕМЕННО: заглушка для тестирования
        // В реальной версии здесь будет отправка на сервер для распознавания
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Имитация распознанного текста
        const sampleTexts = [
            "Привет! Это тестовое голосовое сообщение из мини-приложения.",
            "Сегодня прекрасная погода для разработки новых функций!",
            "Голосовые сообщения очень удобны для быстрого общения.",
            "Это демонстрация работы голосового ввода в Telegram Mini App."
        ];
        
        const recognizedText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        
        // Добавляем распознанный текст в чат как сообщение пользователя
        addMessage(`🎤 ${recognizedText}`, 'user');
        
        // Отправляем распознанный текст в бот
        const botResponse = await sendToBot(recognizedText);
        addMessage(botResponse, 'bot');
        
    } catch (error) {
        console.error('Error processing audio:', error);
        addMessage('❌ Ошибка обработки голосового сообщения. Попробуйте еще раз.', 'bot');
    } finally {
        showLoading(false);
        audioChunks = [];
    }
}

// РЕАЛЬНАЯ ФУНКЦИЯ для отправки аудио на сервер (когда настроите n8n)
async function sendAudioToServer(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-message.webm');
    formData.append('chatId', tg.initDataUnsafe.user?.id || 'mini-app-user');
    formData.append('platform', 'telegram_mini_app');
    
    const response = await fetch('YOUR_N8N_VOICE_WEBHOOK_URL', {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) throw new Error('Audio upload failed');
    const data = await response.json();
    return data.text; // Распознанный текст
}

// Добавление сообщения в чат
function addMessage(text, sender) {
    const chat = document.getElementById('chat');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Добавляем иконку для голосовых сообщений
    if (text.includes('🎤')) {
        messageDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 8px;">
            <span>🎤</span>
            <span>${text.replace('🎤', '')}</span>
        </div>`;
    } else {
        messageDiv.textContent = text;
    }
    
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

// Закрытие голосовой записи по клику вне области
document.getElementById('voiceRecording').addEventListener('click', function(e) {
    if (e.target === this) {
        stopVoiceRecording();
    }
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    addMessage('👋 Привет! Я ваш AI ассистент. Задайте вопрос текстом или нажмите 🎤 для голосового сообщения!', 'bot');
    
    // Проверяем поддержку MediaRecorder
    if (!navigator.mediaDevices || !window.MediaRecorder) {
        console.warn('MediaRecorder not supported');
        document.querySelector('.voice-btn').style.display = 'none';
        document.getElementById('messageInput').placeholder = 'Введите сообщение...';
    }
});
