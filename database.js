// Database.js - Gerenciamento de dados com localStorage

class Database {
    constructor() {
        this.PATIENTS_KEY = 'medical_patients';
        this.APPOINTMENTS_KEY = 'medical_appointments';
        this.initializeDatabase();
    }

    initializeDatabase() {
        if (!localStorage.getItem(this.PATIENTS_KEY)) {
            localStorage.setItem(this.PATIENTS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.APPOINTMENTS_KEY)) {
            localStorage.setItem(this.APPOINTMENTS_KEY, JSON.stringify([]));
        }
    }

    // ==================== PACIENTES ====================

    createPatient(patient) {
        const patients = this.getPatients();
        const newPatient = {
            id: this.generateId(patients),
            ...patient,
            createdAt: new Date().toISOString()
        };
        patients.push(newPatient);
        localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
        return newPatient;
    }

    getPatients() {
        const data = localStorage.getItem(this.PATIENTS_KEY);
        return JSON.parse(data) || [];
    }

    getPatient(id) {
        const patients = this.getPatients();
        return patients.find(p => p.id === parseInt(id));
    }

    updatePatient(id, updatedData) {
        const patients = this.getPatients();
        const index = patients.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            patients[index] = {
                ...patients[index],
                ...updatedData,
                id: parseInt(id),
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
            return patients[index];
        }
        return null;
    }

    deletePatient(id) {
        const patients = this.getPatients();
        const filtered = patients.filter(p => p.id !== parseInt(id));
        localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(filtered));
        
        // Também remove consultas relacionadas
        const appointments = this.getAppointments();
        const filteredAppointments = appointments.filter(a => a.patientId !== parseInt(id));
        localStorage.setItem(this.APPOINTMENTS_KEY, JSON.stringify(filteredAppointments));
        
        return true;
    }

    searchPatients(query) {
        const patients = this.getPatients();
        const lowerQuery = query.toLowerCase();
        return patients.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            p.cpf.includes(query) ||
            (p.email && p.email.toLowerCase().includes(lowerQuery))
        );
    }

    // ==================== CONSULTAS ====================

    createAppointment(appointment) {
        const appointments = this.getAppointments();
        const newAppointment = {
            id: this.generateId(appointments),
            ...appointment,
            createdAt: new Date().toISOString()
        };
        appointments.push(newAppointment);
        localStorage.setItem(this.APPOINTMENTS_KEY, JSON.stringify(appointments));
        return newAppointment;
    }

    getAppointments() {
        const data = localStorage.getItem(this.APPOINTMENTS_KEY);
        return JSON.parse(data) || [];
    }

    getAppointment(id) {
        const appointments = this.getAppointments();
        return appointments.find(a => a.id === parseInt(id));
    }

    updateAppointment(id, updatedData) {
        const appointments = this.getAppointments();
        const index = appointments.findIndex(a => a.id === parseInt(id));
        if (index !== -1) {
            appointments[index] = {
                ...appointments[index],
                ...updatedData,
                id: parseInt(id),
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(this.APPOINTMENTS_KEY, JSON.stringify(appointments));
            return appointments[index];
        }
        return null;
    }

    deleteAppointment(id) {
        const appointments = this.getAppointments();
        const filtered = appointments.filter(a => a.id !== parseInt(id));
        localStorage.setItem(this.APPOINTMENTS_KEY, JSON.stringify(filtered));
        return true;
    }

    getAppointmentsByDate(date) {
        const appointments = this.getAppointments();
        return appointments.filter(a => a.date === date);
    }

    getAppointmentsBySpecialty(specialty) {
        const appointments = this.getAppointments();
        return appointments.filter(a => a.specialty === specialty);
    }

    getAppointmentsByPatient(patientId) {
        const appointments = this.getAppointments();
        return appointments.filter(a => a.patientId === parseInt(patientId));
    }

    getUpcomingAppointments(limit = 5) {
        const appointments = this.getAppointments();
        const now = new Date();
        
        return appointments
            .filter(a => {
                const appointmentDate = new Date(`${a.date}T${a.time}`);
                return appointmentDate >= now && a.status !== 'Cancelada';
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            })
            .slice(0, limit);
    }

    getTodayAppointments() {
        const today = new Date().toISOString().split('T')[0];
        return this.getAppointmentsByDate(today);
    }

    // ==================== UTILIDADES ====================

    generateId(array) {
        if (array.length === 0) return 1;
        const maxId = Math.max(...array.map(item => item.id || 0));
        return maxId + 1;
    }

    clearAllData() {
        localStorage.removeItem(this.PATIENTS_KEY);
        localStorage.removeItem(this.APPOINTMENTS_KEY);
        this.initializeDatabase();
    }

    exportData() {
        return {
            patients: this.getPatients(),
            appointments: this.getAppointments(),
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        if (data.patients) {
            localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(data.patients));
        }
        if (data.appointments) {
            localStorage.setItem(this.APPOINTMENTS_KEY, JSON.stringify(data.appointments));
        }
    }
}

// Exportar instância única do banco de dados
const db = new Database();
