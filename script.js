// ========== НАСТРОЙКИ ==========
const ADMIN_EMAIL = 'kh_rakhmatullaev@mail.ru';
const MAX_SLOTS_PER_DAY = 5;
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// ========== ПЕРЕВОДЫ ==========
const translations = { ru: {}, uz: {
    "Ваше здоровье — наша забота": "Sog'ligingiz — bizning g'amxo'rimiz",
    "📝 Запись на прием": "📝 Qabulga yozilish",
    "📋 Прайс-лист": "📋 Narxlar",
    "👨‍⚕️ Наши врачи": "👨‍⚕️ Shifokorlar",
    "Терапевт, стаж 21 год": "Terapevt, 21 yillik tajriba",
    "Врач-УЗИ, стаж 8 лет": "UTT-shifokori, 8 yillik tajriba",
    "Челюстно-лицевой хирург, стаж 12 лет": "Yuz-jag' jarroxi, 12 yillik tajriba",
    "Пластический хирург, стаж 6 лет": "Plastik jarroh, 6 yillik tajriba",
    "Хирург, стаж 6 лет": "Jarroh, 6 yillik tajriba",
    "Хирург-ассистент, стаж 1 год": "Jarroh-assistent, 1 yillik tajriba",
    "Хирург-ассистент": "Jarroh-assistent",
    "📞 Администратор / Запись": "📞 Administrator / Yozilish",
    "👤 Ваше имя": "👤 Ismingiz",
    "📞 Номер телефона": "📞 Telefon raqamingiz",
    "🔄 Какой это прием?": "🔄 Nechanchi qabul?",
    "1-й прием (первичный)": "1-qabul (birlamchi)",
    "2-й прием (повторный)": "2-qabul (takroriy)",
    "3-й прием": "3-qabul",
    "4-й прием": "4-qabul",
    "5-й прием": "5-qabul",
    "6 и более": "6 va undan ko'p",
    "👨‍⚕️ Выберите врача": "👨‍⚕️ Shifokorni tanlang",
    "📅 Выберите дату": "📅 Sanani tanlang",
    "⏰ Выберите время": "⏰ Vaqtni tanlang",
    "📨 Записаться на прием": "📨 Qabulga yozilish"
}};

let currentLang = 'ru';
function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-ru][data-uz]').forEach(el => { 
        const text = el.getAttribute(`data-${lang}`); 
        if (text) { 
            if (el.tagName === 'INPUT' && el.placeholder !== undefined) el.placeholder = text; 
            else if (el.tagName === 'OPTION') el.textContent = text; 
            else el.textContent = text; 
        } 
    });
    document.querySelectorAll('.lang-btn').forEach(btn => { 
        if (btn.dataset.lang === lang) btn.classList.add('active'); 
        else btn.classList.remove('active'); 
    });
    localStorage.setItem('preferredLang', lang);
}
document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
const savedLang = localStorage.getItem('preferredLang');
if (savedLang && (savedLang === 'ru' || savedLang === 'uz')) setLanguage(savedLang);

// ========== РАБОТА С ЗАПИСЯМИ ==========
function getAppointments() { return JSON.parse(localStorage.getItem('appointments') || '[]'); }
function saveAppointments(appointments) { localStorage.setItem('appointments', JSON.stringify(appointments)); }
function getSlotCount(doctor, date, time) { return getAppointments().filter(a => a.doctor === doctor && a.date === date && a.time === time).length; }
function getDailyCount(doctor, date) { return getAppointments().filter(a => a.doctor === doctor && a.date === date).length; }
function isSlotAvailable(doctor, date, time) { return getSlotCount(doctor, date, time) < MAX_SLOTS_PER_DAY; }

function updateAvailableSlots() {
    const doctor = document.getElementById('doctorSelect').value;
    const date = document.getElementById('datePicker').value;
    const timeSelect = document.getElementById('timeSelect');
    const slotsInfo = document.getElementById('slotsInfo');
    if (!doctor || !date) { 
        timeSelect.innerHTML = '<option value="">-- Сначала выберите дату --</option>'; 
        slotsInfo.innerHTML = ''; 
        return; 
    }
    const dailyCount = getDailyCount(doctor, date);
    const remainingSlots = MAX_SLOTS_PER_DAY - dailyCount;
    if (remainingSlots <= 0) { 
        slotsInfo.innerHTML = `<span style="color:#ff6666;">❌ На эту дату уже нет свободных мест (максимум ${MAX_SLOTS_PER_DAY} записей)</span>`; 
        timeSelect.innerHTML = '<option value="">❌ Нет свободных мест</option>'; 
        timeSelect.disabled = true; 
        return; 
    }
    slotsInfo.innerHTML = `<span style="color:#1a6e2a;">✅ Свободно мест: ${remainingSlots} из ${MAX_SLOTS_PER_DAY}</span>`;
    timeSelect.disabled = false;
    let options = '<option value="">-- Выберите время --</option>';
    for (const time of TIME_SLOTS) { 
        if (getSlotCount(doctor, date, time) < MAX_SLOTS_PER_DAY) 
            options += `<option value="${time}">${time}</option>`; 
    }
    if (options === '<option value="">-- Выберите время --</option>') { 
        options = '<option value="">❌ На этот день нет свободных слотов</option>'; 
        timeSelect.disabled = true; 
    }
    timeSelect.innerHTML = options;
}

// ========== ОТПРАВКА НА ПОЧТУ ==========
async function sendToEmail(appointment) {
    const formData = new FormData();
    formData.append('name', appointment.name);
    formData.append('phone', appointment.phone);
    formData.append('visit_count', appointment.visitText);
    formData.append('doctor', appointment.doctor);
    formData.append('date', appointment.date);
    formData.append('time', appointment.time);
    formData.append('_subject', `📋 Новая запись в Nafis Med от ${appointment.name}`);
    formData.append('_template', 'table');
    try { 
        const response = await fetch(`https://formsubmit.co/${ADMIN_EMAIL}`, { method: 'POST', body: formData }); 
        return response.ok; 
    } catch(e) { 
        console.error(e); 
        return false; 
    }
}

async function sendDailyReport() {
    const appointments = getAppointments();
    const today = new Date().toLocaleDateString('ru-RU');
    const todayAppointments = appointments.filter(a => new Date(a.date).toLocaleDateString('ru-RU') === today);
    if (todayAppointments.length === 0) return;
    let reportText = `📊 ОТЧЕТ ПО ЗАПИСЯМ ЗА ${today}\n\nВсего записей: ${todayAppointments.length}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    todayAppointments.forEach((app, i) => { 
        reportText += `${i+1}. 👤 Имя: ${app.name}\n   📞 Телефон: ${app.phone}\n   🔄 Прием: ${app.visitText}\n   👨‍⚕️ Врач: ${app.doctor}\n   📅 Дата: ${app.date}\n   ⏰ Время: ${app.time}\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`; 
    });
    const formData = new FormData(); 
    formData.append('report', reportText); 
    formData.append('_subject', `📊 Дневной отчет Nafis Med за ${today}`); 
    formData.append('_template', 'table');
    try { 
        const response = await fetch(`https://formsubmit.co/${ADMIN_EMAIL}`, { method: 'POST', body: formData }); 
        if (response.ok) localStorage.setItem('lastReportSent', new Date().toISOString()); 
    } catch(e) { console.error(e); }
}

function checkAndSendReport() {
    const now = new Date(), tashkentTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
    const hours = tashkentTime.getHours(), minutes = tashkentTime.getMinutes();
    const lastSent = localStorage.getItem('lastReportSent'), lastSentDate = lastSent ? new Date(lastSent) : null;
    const isReportTime = (hours === 20 && minutes <= 5), notSentToday = !lastSentDate || lastSentDate.toLocaleDateString('ru-RU') !== tashkentTime.toLocaleDateString('ru-RU');
    if (isReportTime && notSentToday) sendDailyReport();
}
function sendManualReport() { sendDailyReport(); alert(currentLang === 'ru' ? '📧 Отчет отправлен на почту!' : '📧 Hisobot pochtaga yuborildi!'); }

// ========== ЭКСПОРТ CSV ==========
function exportAppointments() {
    const appointments = getAppointments();
    if (appointments.length === 0) { alert('Нет сохраненных заявок'); return; }
    let csvContent = '\uFEFF"ID","Имя","Телефон","Какой прием","Врач","Дата","Время"\n';
    appointments.forEach(a => { 
        csvContent += `"${a.id}","${a.name}","${a.phone}","${a.visitText || 'не указано'}","${a.doctor}","${a.date}","${a.time}"\n`; 
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `nafis_med_appointments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click(); URL.revokeObjectURL(link.href);
}

// ========== АДМИН-ПАНЕЛЬ ==========
function showAdminPanel() {
    const records = getAppointments();
    const container = document.getElementById('adminRecords');
    if (records.length === 0) container.innerHTML = '<p style="text-align:center;color:#999;">📭 Нет записей</p>';
    else { 
        container.innerHTML = `<table><thead><tr><th>#</th><th>Имя</th><th>Телефон</th><th>Какой прием</th><th>Врач</th><th>Дата</th><th>Время</th></tr></thead><tbody>${records.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.visitText || 'не указано')}</td><td>${escapeHtml(r.doctor)}</td><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.time)}</td></tr>`).join('')}</tbody></table>`; 
    }
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('adminOverlay').style.display = 'block';
}
function closeAdminPanel() { document.getElementById('adminPanel').style.display = 'none'; document.getElementById('adminOverlay').style.display = 'none'; }
function clearAllAppointments() { if (confirm('⚠️ Удалить ВСЕ записи?')) { localStorage.removeItem('appointments'); showAdminPanel(); alert('✅ Все записи удалены'); } }
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// ========== ОБРАБОТКА ФОРМЫ ==========
function showMessage(text, type) { 
    const msg = document.getElementById('formMessage'); 
    msg.className = `form-message ${type}`; 
    msg.textContent = text; 
    msg.style.display = 'block'; 
    setTimeout(() => msg.style.display = 'none', 4000); 
}

const form = document.getElementById('appointmentForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const visitCountSelect = document.getElementById('visitCountSelect');
        const visitCount = visitCountSelect.value;
        const visitText = visitCountSelect.options[visitCountSelect.selectedIndex].text;
        const doctor = document.getElementById('doctorSelect').value;
        const date = document.getElementById('datePicker').value;
        const time = document.getElementById('timeSelect').value;
        
        if (!name || !phone || !doctor || !date || !time) { 
            showMessage('❌ Заполните все поля', 'error'); 
            return; 
        }
        if (phone.replace(/\D/g, '').length < 9) { 
            showMessage('❌ Введите корректный номер', 'error'); 
            return; 
        }
        if (!isSlotAvailable(doctor, date, time)) { 
            showMessage('❌ Это время уже занято', 'error'); 
            updateAvailableSlots(); 
            return; 
        }
        
        const appointment = { 
            id: Date.now(), 
            name, 
            phone, 
            visitCount: visitCount,
            visitText: visitText,
            doctor, 
            date, 
            time, 
            created: new Date().toLocaleString('ru-RU') 
        };
        
        const appointments = getAppointments();
        appointments.push(appointment);
        saveAppointments(appointments);
        
        showMessage('⏳ Отправка...', 'success');
        await sendToEmail(appointment);
        showMessage('✅ Вы успешно записаны! Мы свяжемся с вами.', 'success');
        
        form.reset();
        document.getElementById('timeSelect').innerHTML = '<option value="">-- Сначала выберите дату --</option>';
        document.getElementById('slotsInfo').innerHTML = '';
    });
}

// ========== ВКЛАДКИ ПРАЙСА ==========
document.querySelectorAll('.price-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.price-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.price-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
});

// ========== СЛУШАТЕЛИ ==========
document.getElementById('doctorSelect').addEventListener('change', updateAvailableSlots);
document.getElementById('datePicker').addEventListener('change', updateAvailableSlots);
document.getElementById('datePicker').min = new Date().toISOString().split('T')[0];

// ========== ПЛАВНАЯ ПРОКРУТКА ==========
document.querySelectorAll('.nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
    });
});

// ========== ОТЧЕТ В 20:00 ==========
setInterval(checkAndSendReport, 60000);
setTimeout(checkAndSendReport, 5000);

// ========== КЛИКИ ПО ЛОГОТИПУ ==========
let clickCount = 0, clickTimer;
const logo = document.querySelector('.logo h1');
if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
        if (clickCount === 3) { exportAppointments(); clickCount = 0; }
        else if (clickCount === 5) { showAdminPanel(); clickCount = 0; }
    });
}

// ========== СТАТИСТИКА В КОНСОЛИ ==========
console.log('🏥 Nafis Med - Статистика:');
console.log(`📊 Всего записей: ${getAppointments().length}`);
console.log('💡 3 клика по логотипу → CSV | 5 кликов → Админ-панель');
console.log('💡 Вкладки прайса: PRP, Эстетическая хирургия, Лазер, Анализы, Прочее');
