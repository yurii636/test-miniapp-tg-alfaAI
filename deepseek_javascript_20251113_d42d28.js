const tg = window.Telegram.WebApp;

// Инициализация
tg.expand();
tg.ready();

let chatHistory = [];
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Webhook URL из n8n - ЗАМЕНИТЕ НА ВАШ URL
const N8N_WEBHOOK_URL = 'https://yupppqw.app.n8n.cloud/webhook/miniapp';

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
        // Отправляем сообщение в n8n webhook
        const response = await sendToN8N(message);
        
        // Добавляем ответ бота
        addMessage(response, 'bot');
        
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('⚠️ Произошла ошибка. Попробуйте еще раз.', 'bot');
    } finally {
        showLoading(false);
    }
}

// Функция отправки в n8n webhook
async function sendToN8N(message) {
    const requestBody = {
        message: message,
        userId: tg.initDataUnsafe.user?.id || 'mini-app-user',
        platform: 'telegram_mini_app'
    };
    
    const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Обрабатываем разные форматы ответа от n8n
    return data.response || data.text || data.message || data.output || 'Ответ получен';
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
        mediaRecorder.start(100);
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
        
        // В Mini App отправляем текстовое сообщение о голосовом вводе
        const voiceMessageText = "🎤 [Голосовое сообщение]";
        
        // Отправляем специальное сообщение о голосовом вводе
        const response = await sendToN8N(voiceMessageText);
        addMessage(response, 'bot');
        
    } catch (error) {
        console.error('Error processing audio:', error);
        addMessage('❌ Ошибка обработки голосового сообщения. Попробуйте еще раз.', 'bot');
    } finally {
        showLoading(false);
        audioChunks = [];
    }
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
    addMessage('👋 Привет! Я ваш AI ассистент. Теперь я интегрирован с n8n и использую того же DeepSeek AI, что и в основном боте!', 'bot');
    
    // Проверяем поддержку MediaRecorder
    if (!navigator.mediaDevices || !window.MediaRecorder) {
        console.warn('MediaRecorder not supported');
        document.querySelector('.voice-btn').style.display = 'none';
        document.getElementById('messageInput').placeholder = 'Введите сообщение...';
    }
});

// Функция для отладки - проверка соединения с n8n
async function testN8NConnection() {
    try {
        const testResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'test',
                userId: 'test-user',
                platform: 'test'
            })
        });
        console.log('N8N Connection Test:', testResponse.status);
        return testResponse.ok;
    } catch (error) {
        console.error('N8N Connection Test Failed:', error);
        return false;
    }
}

// Запускаем тест при загрузке (опционально)
// testN8NConnection();
