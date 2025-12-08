// App.js - Controlador principal da aplicação

// ==================== VARIÁVEIS GLOBAIS ====================
let currentSection = 'dashboard';
let editingPatientId = null;
let editingAppointmentId = null;

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboard();
    loadPatients();
    loadAppointments();
});

function initializeApp() {
    console.log('🏥 Sistema de Agenda Médica iniciado!');
    updateStats();
}

function setupEventListeners() {
    // Busca de pacientes
    document.getElementById('patient-search').addEventListener('input', function(e) {
        const query = e.target.value;
        if (query.length > 0) {
            const results = db.searchPatients(query);
            renderPatients(results);
        } else {
            loadPatients();
        }
    });

    // Filtros de consultas
    document.getElementById('filter-date').addEventListener('change', filterAppointments);
    document.getElementById('filter-specialty').addEventListener('change', filterAppointments);
}

// ==================== NAVEGAÇÃO ====================
function showSection(sectionId) {
    // Atualizar seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // Atualizar tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

    currentSection = sectionId;

    // Recarregar dados da seção
    if (sectionId === 'dashboard') {
        loadDashboard();
    } else if (sectionId === 'patients') {
        loadPatients();
    } else if (sectionId === 'appointments') {
        loadAppointments();
    }
}

// ==================== DASHBOARD ====================
function loadDashboard() {
    updateStats();
    loadUpcomingAppointments();
}

function updateStats() {
    const patients = db.getPatients();
    const appointments = db.getAppointments();
    const todayAppointments = db.getTodayAppointments();
    const weekAppointments = getWeekAppointments();

    document.getElementById('total-patients').textContent = patients.length;
    document.getElementById('today-appointments').textContent = todayAppointments.length;
    document.getElementById('week-appointments').textContent = weekAppointments.length;
    document.getElementById('total-appointments').textContent = appointments.length;
}

function getWeekAppointments() {
    const appointments = db.getAppointments();
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return appointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return appointmentDate >= today && appointmentDate <= weekFromNow;
    });
}

function loadUpcomingAppointments() {
    const upcoming = db.getUpcomingAppointments(5);
    const container = document.getElementById('upcoming-appointments');

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p class="empty-state-text">Nenhuma consulta agendada</p>
            </div>
        `;
        return;
    }

    const html = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Data/Hora</th>
                        <th>Paciente</th>
                        <th>Especialidade</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${upcoming.map(app => {
                        const patient = db.getPatient(app.patientId);
                        return `
                            <tr>
                                <td>${formatDate(app.date)} às ${app.time}</td>
                                <td>${patient ? patient.name : 'Paciente não encontrado'}</td>
                                <td>${getSpecialtyIcon(app.specialty)} ${app.specialty}</td>
                                <td><span class="badge badge-${getStatusClass(app.status)}">${app.status}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

// ==================== PACIENTES ====================
function loadPatients() {
    const patients = db.getPatients();
    renderPatients(patients);
}

function renderPatients(patients) {
    const tbody = document.getElementById('patients-table-body');

    if (patients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <p class="empty-state-text">Nenhum paciente encontrado</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = patients.map(patient => `
        <tr>
            <td>#${formatId(patient.id)}</td>
            <td>${patient.name}</td>
            <td>${patient.cpf}</td>
            <td>${patient.phone}</td>
            <td>${patient.email || '-'}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-secondary" onclick="editPatient(${patient.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deletePatient(${patient.id})">🗑️ Excluir</button>
            </td>
        </tr>
    `).join('');
}

function openPatientModal() {
    editingPatientId = null;
    document.getElementById('patient-modal-title').textContent = 'Novo Paciente';
    document.getElementById('patient-form').reset();
    document.getElementById('patient-id').value = '';
    document.getElementById('patient-modal').classList.add('active');
}

function closePatientModal() {
    document.getElementById('patient-modal').classList.remove('active');
    editingPatientId = null;
}

function editPatient(id) {
    const patient = db.getPatient(id);
    if (!patient) return;

    editingPatientId = id;
    document.getElementById('patient-modal-title').textContent = 'Editar Paciente';
    document.getElementById('patient-id').value = patient.id;
    document.getElementById('patient-name').value = patient.name;
    document.getElementById('patient-cpf').value = patient.cpf;
    document.getElementById('patient-birth').value = patient.birthDate;
    document.getElementById('patient-phone').value = patient.phone;
    document.getElementById('patient-email').value = patient.email || '';
    document.getElementById('patient-address').value = patient.address || '';
    document.getElementById('patient-notes').value = patient.notes || '';
    
    document.getElementById('patient-modal').classList.add('active');
}

function savePatient(event) {
    event.preventDefault();

    const patientData = {
        name: document.getElementById('patient-name').value,
        cpf: document.getElementById('patient-cpf').value,
        birthDate: document.getElementById('patient-birth').value,
        phone: document.getElementById('patient-phone').value,
        email: document.getElementById('patient-email').value,
        address: document.getElementById('patient-address').value,
        notes: document.getElementById('patient-notes').value
    };

    if (editingPatientId) {
        db.updatePatient(editingPatientId, patientData);
        alert('✅ Paciente atualizado com sucesso!');
    } else {
        db.createPatient(patientData);
        alert('✅ Paciente cadastrado com sucesso!');
    }

    closePatientModal();
    loadPatients();
    updateStats();
}

function deletePatient(id) {
    const patient = db.getPatient(id);
    if (!patient) return;

    if (confirm(`Tem certeza que deseja excluir o paciente "${patient.name}"?\n\nEsta ação também excluirá todas as consultas relacionadas.`)) {
        db.deletePatient(id);
        alert('✅ Paciente excluído com sucesso!');
        loadPatients();
        updateStats();
    }
}

// ==================== CONSULTAS ====================
function loadAppointments() {
    const appointments = db.getAppointments();
    renderAppointments(appointments);
    loadPatientSelect();
}

function renderAppointments(appointments) {
    const tbody = document.getElementById('appointments-table-body');

    if (appointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <p class="empty-state-text">Nenhuma consulta encontrada</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Ordenar por data e hora
    const sorted = appointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB - dateA;
    });

    tbody.innerHTML = sorted.map(appointment => {
        const patient = db.getPatient(appointment.patientId);
        const whatsappButton = appointment.status === 'Confirmada' ? 
            `<button class="btn btn-sm btn-success" onclick="sendWhatsAppConfirmation(${appointment.id})" title="Enviar confirmação por WhatsApp">📱 WhatsApp</button>` : '';
        
        return `
            <tr>
                <td>#${formatId(appointment.id)}</td>
                <td>${formatDate(appointment.date)} às ${appointment.time}</td>
                <td>${patient ? patient.name : 'Paciente não encontrado'}</td>
                <td>${getSpecialtyIcon(appointment.specialty)} ${appointment.specialty}</td>
                <td><span class="badge badge-${getStatusClass(appointment.status)}">${appointment.status}</span></td>
                <td class="table-actions">
                    ${whatsappButton}
                    <button class="btn btn-sm btn-secondary" onclick="editAppointment(${appointment.id})">✏️ Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAppointment(${appointment.id})">🗑️ Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAppointments() {
    const date = document.getElementById('filter-date').value;
    const specialty = document.getElementById('filter-specialty').value;

    let appointments = db.getAppointments();

    if (date) {
        appointments = appointments.filter(a => a.date === date);
    }

    if (specialty) {
        appointments = appointments.filter(a => a.specialty === specialty);
    }

    renderAppointments(appointments);
}

function loadPatientSelect() {
    const select = document.getElementById('appointment-patient');
    const patients = db.getPatients();

    select.innerHTML = '<option value="">Selecione um paciente</option>';
    patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = patient.name;
        select.appendChild(option);
    });
}

function openAppointmentModal() {
    editingAppointmentId = null;
    document.getElementById('appointment-modal-title').textContent = 'Nova Consulta';
    document.getElementById('appointment-form').reset();
    document.getElementById('appointment-id').value = '';
    
    // Definir data padrão como hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
    
    loadPatientSelect();
    document.getElementById('appointment-modal').classList.add('active');
}

function closeAppointmentModal() {
    document.getElementById('appointment-modal').classList.remove('active');
    editingAppointmentId = null;
}

function editAppointment(id) {
    const appointment = db.getAppointment(id);
    if (!appointment) return;

    editingAppointmentId = id;
    document.getElementById('appointment-modal-title').textContent = 'Editar Consulta';
    document.getElementById('appointment-id').value = appointment.id;
    
    loadPatientSelect();
    
    document.getElementById('appointment-patient').value = appointment.patientId;
    document.getElementById('appointment-date').value = appointment.date;
    document.getElementById('appointment-time').value = appointment.time;
    document.getElementById('appointment-specialty').value = appointment.specialty;
    document.getElementById('appointment-status').value = appointment.status;
    document.getElementById('appointment-notes').value = appointment.notes || '';
    
    document.getElementById('appointment-modal').classList.add('active');
}

function saveAppointment(event) {
    event.preventDefault();

    const appointmentData = {
        patientId: parseInt(document.getElementById('appointment-patient').value),
        date: document.getElementById('appointment-date').value,
        time: document.getElementById('appointment-time').value,
        specialty: document.getElementById('appointment-specialty').value,
        status: document.getElementById('appointment-status').value,
        notes: document.getElementById('appointment-notes').value
    };

    if (editingAppointmentId) {
        db.updateAppointment(editingAppointmentId, appointmentData);
        alert('✅ Consulta atualizada com sucesso!');
        
        // Enviar WhatsApp se status for Confirmada
        if (appointmentData.status === 'Confirmada') {
            sendWhatsAppConfirmation(editingAppointmentId);
        }
    } else {
        const newAppointment = db.createAppointment(appointmentData);
        alert('✅ Consulta agendada com sucesso!');
        
        // Enviar WhatsApp se status for Confirmada
        if (appointmentData.status === 'Confirmada') {
            sendWhatsAppConfirmation(newAppointment.id);
        }
    }

    closeAppointmentModal();
    loadAppointments();
    updateStats();
    if (currentSection === 'dashboard') {
        loadUpcomingAppointments();
    }
}

function sendWhatsAppConfirmation(appointmentId) {
    const appointment = db.getAppointment(appointmentId);
    if (!appointment) return;

    const patient = db.getPatient(appointment.patientId);
    if (!patient) return;

    // Remover caracteres não numéricos do telefone
    const phone = patient.phone.replace(/\D/g, '');
    
    // Formatar a mensagem
    const message = `🏥 *CONFIRMAÇÃO DE CONSULTA*

Olá *${patient.name}*!

Sua consulta foi confirmada! ✅

📅 *Data:* ${formatDate(appointment.date)}
⏰ *Horário:* ${appointment.time}
👨‍⚕️ *Especialidade:* ${appointment.specialty}

${appointment.notes ? `📋 *Observações:* ${appointment.notes}\n\n` : ''}Por favor, chegue com 15 minutos de antecedência.

Em caso de dúvidas, entre em contato conosco.

_Agenda Médica - Sistema de Gestão_`;

    // Abrir WhatsApp Web com a mensagem
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    
    if (confirm(`📱 Deseja enviar confirmação por WhatsApp para ${patient.name}?\n\nTelefone: ${patient.phone}`)) {
        window.open(whatsappUrl, '_blank');
    }
}

function deleteAppointment(id) {
    const appointment = db.getAppointment(id);
    if (!appointment) return;

    if (confirm('Tem certeza que deseja excluir esta consulta?')) {
        db.deleteAppointment(id);
        alert('✅ Consulta excluída com sucesso!');
        loadAppointments();
        updateStats();
    }
}

// ==================== FUNÇÕES AUXILIARES ====================
function formatId(id) {
    return String(id).padStart(3, '0');
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

function getSpecialtyIcon(specialty) {
    const icons = {
        'Psicólogo': '🧠',
        'Psiquiatra': '💊',
        'Clínico Geral': '🩺',
        'Ortopedista': '🦴',
        'Ginecologista': '👩‍⚕️'
    };
    return icons[specialty] || '🏥';
}

function getStatusClass(status) {
    const classes = {
        'Agendada': 'info',
        'Confirmada': 'success',
        'Realizada': 'success',
        'Cancelada': 'danger'
    };
    return classes[status] || 'info';
}

// Fechar modais ao clicar fora
window.onclick = function(event) {
    const patientModal = document.getElementById('patient-modal');
    const appointmentModal = document.getElementById('appointment-modal');
    
    if (event.target === patientModal) {
        closePatientModal();
    }
    if (event.target === appointmentModal) {
        closeAppointmentModal();
    }
}
