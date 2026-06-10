import { Employee, Admin, RequestRecord, Notification, ActivityLog } from '../types';

export const initialEmployees: Employee[] = [];

export const initialAdmins: Admin[] = [
  {
    id: 'admin-1',
    name: 'Saeed Heikal',
    email: 'saeedheikal16@gmail.com',
    password: '123456789ss',
    role: 'admin'
  },
  {
    id: 'admin-2',
    name: 'HR Specialist',
    email: 'hr@company.com',
    password: 'hr123',
    role: 'hr'
  }
];

export const initialRequests: RequestRecord[] = [];

export const initialNotifications: Notification[] = [];
export const initialLogs: ActivityLog[] = [];

// Initialize global state triggers in LocalStorage if not set
export const initLocalStorageData = () => {
  const storedAdmins = localStorage.getItem('hr_admins');
  const storedEmployees = localStorage.getItem('hr_employees');
  const storedRequests = localStorage.getItem('hr_requests');
  const storedNotifications = localStorage.getItem('hr_notifications');
  const storedLogs = localStorage.getItem('hr_logs');

  if (!storedAdmins) {
    localStorage.setItem('hr_admins', JSON.stringify(initialAdmins));
  }

  // Force-clear and reset if there are legacy mock employees (e.g. employee Saeed Heikal with id emp-1, or Sarah Rahman)
  let clearLegacy = false;
  if (storedEmployees) {
    try {
      const emps = JSON.parse(storedEmployees);
      if (Array.isArray(emps)) {
        const containsMock = emps.some(e => e.id === 'emp-1' || e.name === 'Sarah Rahman');
        if (containsMock) {
          clearLegacy = true;
        }
      }
    } catch (e) {
      clearLegacy = true;
    }
  }

  if (!storedEmployees || clearLegacy) {
    localStorage.setItem('hr_employees', JSON.stringify(initialEmployees));
    localStorage.setItem('hr_requests', JSON.stringify(initialRequests));
    localStorage.setItem('hr_notifications', JSON.stringify(initialNotifications));
    localStorage.setItem('hr_logs', JSON.stringify(initialLogs));
  } else {
    try {
      const emps = JSON.parse(storedEmployees);
      if (!Array.isArray(emps)) {
        localStorage.setItem('hr_employees', JSON.stringify(initialEmployees));
      }
    } catch (e) {
      localStorage.setItem('hr_employees', JSON.stringify(initialEmployees));
    }
  }

  if (!storedRequests || clearLegacy) {
    localStorage.setItem('hr_requests', JSON.stringify(initialRequests));
  } else {
    try {
      const reqs = JSON.parse(storedRequests);
      if (!Array.isArray(reqs)) {
        localStorage.setItem('hr_requests', JSON.stringify(initialRequests));
      }
    } catch (e) {
      localStorage.setItem('hr_requests', JSON.stringify(initialRequests));
    }
  }

  if (!storedNotifications || clearLegacy) {
    localStorage.setItem('hr_notifications', JSON.stringify(initialNotifications));
  }

  if (!storedLogs || clearLegacy) {
    localStorage.setItem('hr_logs', JSON.stringify(initialLogs));
  }
};

