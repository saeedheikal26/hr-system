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

  const codesToErase = ['1025', 'EMP-102', 'EMP-103', 'EMP-104', 'EMP-105'];
  const idsToErase = ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5'];

  if (storedEmployees) {
    try {
      const emps = JSON.parse(storedEmployees);
      if (Array.isArray(emps)) {
        const filtered = emps.filter((e: any) => !codesToErase.includes(e.employee_code) && !idsToErase.includes(e.id));
        localStorage.setItem('hr_employees', JSON.stringify(filtered));
      }
    } catch (e) {
      localStorage.setItem('hr_employees', JSON.stringify([]));
    }
  } else {
    localStorage.setItem('hr_employees', JSON.stringify([]));
  }

  if (storedRequests) {
    try {
      const reqs = JSON.parse(storedRequests);
      if (Array.isArray(reqs)) {
        const filtered = reqs.filter((r: any) => !idsToErase.includes(r.employee_id));
        localStorage.setItem('hr_requests', JSON.stringify(filtered));
      }
    } catch (e) {
      localStorage.setItem('hr_requests', JSON.stringify([]));
    }
  } else {
    localStorage.setItem('hr_requests', JSON.stringify([]));
  }

  if (storedNotifications) {
    try {
      const notifs = JSON.parse(storedNotifications);
      if (Array.isArray(notifs)) {
        const filtered = notifs.filter((n: any) => !idsToErase.includes(n.user_id) && !codesToErase.some(code => n.message?.includes(code) || n.message_ar?.includes(code)));
        localStorage.setItem('hr_notifications', JSON.stringify(filtered));
      }
    } catch (e) {
      localStorage.setItem('hr_notifications', JSON.stringify([]));
    }
  } else {
    localStorage.setItem('hr_notifications', JSON.stringify([]));
  }

  if (storedLogs) {
    try {
      const logs = JSON.parse(storedLogs);
      if (Array.isArray(logs)) {
        const mockNames = ['Abdel-Rahman Hegazi', 'Saeed Heikal', 'Sarah Rahman', 'Tarek Hassan', 'Yasmin El-Sherbiny', 'Mohamed Galal', 'عبد الرحمن حجازي', 'سعيد هيكل', 'سارة عبد الرحمن', 'طارق حسن', 'ياسمين الشربيني', 'محمد جلال'];
        const filtered = logs.filter((l: any) => !mockNames.includes(l.user_name));
        localStorage.setItem('hr_logs', JSON.stringify(filtered));
      }
    } catch (e) {
      localStorage.setItem('hr_logs', JSON.stringify([]));
    }
  } else {
    localStorage.setItem('hr_logs', JSON.stringify([]));
  }
};
