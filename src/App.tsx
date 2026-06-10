import React, { useState, useEffect } from 'react';
import { 
  LanguageProvider, useLanguage 
} from './components/LanguageContext';
import { 
  Employee, Admin, RequestRecord, Notification, ActivityLog, RequestType 
} from './types';
import { 
  initLocalStorageData 
} from './data/mockData';
import { EmployeePortal } from './components/EmployeePortal';
import { AdminPortal } from './components/AdminPortal';
import { 
  ShieldAlert, LogOut, Sun, Moon, Clock, Mail, Globe, Cpu, AlertCircle, Sparkles, Building2,
  ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Email Dispatch Logs interface
interface ResendEmailLog {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  htmlContent: string;
  timestamp: string;
}

function MainApp() {
  const { t, language, setLanguage, isRtl } = useLanguage();

  // Theme support state (default Light corporate mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('hr_portal_dark_mode') === 'true';
  });

  // Current session roles
  const [currentUserType, setCurrentUserType] = useState<'guest' | 'employee' | 'admin'>('guest');
  const [activeSessionEmployee, setActiveSessionEmployee] = useState<Employee | null>(null);
  const [activeSessionAdmin, setActiveSessionAdmin] = useState<Admin | null>(null);

  // Core records database loaded states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Simulation Email Logs
  const [emailLogs, setEmailLogs] = useState<ResendEmailLog[]>([]);
  const [showEmailLogsDrawer, setShowEmailLogsDrawer] = useState<boolean>(false);

  // Running local clock
  const [systemTime, setSystemTime] = useState<string>(new Date().toLocaleTimeString());

  // Logins inputs
  const [loginCode, setLoginCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [guestSubView, setGuestSubView] = useState<'employee' | 'admin'>('employee');

  // Initialize and Seed mock database
  useEffect(() => {
    initLocalStorageData();
    reloadDatabaseFromStorage();
    
    // Web clock ticker
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, [language]);

  // Sync Dark mode styles
  useEffect(() => {
    localStorage.setItem('hr_portal_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const reloadDatabaseFromStorage = () => {
    const rawEmps = localStorage.getItem('hr_employees');
    const rawAdmins = localStorage.getItem('hr_admins');
    const rawReqs = localStorage.getItem('hr_requests');
    const rawNotifs = localStorage.getItem('hr_notifications');
    const rawLogs = localStorage.getItem('hr_logs');

    if (rawEmps) {
      try {
        const parsed = JSON.parse(rawEmps) as Employee[];
        const isDeptText = (text: string): boolean => {
          if (!text) return false;
          const t = text.toLowerCase();
          return t.includes('إدارة') || t.includes('ادارة') || t.includes('قسم') || t.includes('ورشة') || t.includes('ورشه') || t.includes('خدمة') || t.includes('الادارة') || t.includes('الإدارة') || t.includes('department') || t.includes('dept') || t.includes('العليا');
        };
        let wasModified = false;
        const migrated = parsed.map(emp => {
          if (emp.name_ar && isDeptText(emp.name_ar)) {
            wasModified = true;
            return {
              ...emp,
              name: '',
              name_ar: '',
            };
          }
          return emp;
        });
        if (wasModified) {
          localStorage.setItem('hr_employees', JSON.stringify(migrated));
        }
        setEmployees(migrated);
      } catch (e) {
        console.error("Error loading employees:", e);
      }
    }
    if (rawAdmins) setAdmins(JSON.parse(rawAdmins));
    if (rawReqs) setRequests(JSON.parse(rawReqs));
    if (rawNotifs) setNotifications(JSON.parse(rawNotifs));
    if (rawLogs) setLogs(JSON.parse(rawLogs));
  };

  // Helper trigger to log activity
  const appendActivityLog = (name: string, type: 'employee' | 'admin', actEn: string, actAr: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      user_name: name,
      user_type: type,
      action: actEn,
      action_ar: actAr,
      created_at: new Date().toISOString()
    };
    const updated = [newLog, ...logs];
    localStorage.setItem('hr_logs', JSON.stringify(updated));
    setLogs(updated);
  };

  // Helper trigger to simulation Resend emails dispatch logs
  const dispatchResendSimulatedEmail = (recipient: string, subject: string, htmlContent: string) => {
    const newMailLog: ResendEmailLog = {
      id: `mail-${Date.now()}-${Math.floor(100+Math.random()*900)}`,
      sender: ' Corporate HR Portal <noreply@company-hr.com>',
      recipient,
      subject,
      htmlContent,
      timestamp: new Date().toLocaleTimeString()
    };
    setEmailLogs(prev => [newMailLog, ...prev]);
  };

  // 1. Employee Session Login
  const handleEmployeeLogin = (codeToTest?: string) => {
    const testedCode = codeToTest || loginCode;
    if (!testedCode.trim()) {
      setLoginError(t('codeRequired'));
      return;
    }

    const employeeMatch = employees.find(
      e => e.employee_code.trim().toUpperCase() === testedCode.trim().toUpperCase()
    );

    if (employeeMatch) {
      setActiveSessionEmployee(employeeMatch);
      setCurrentUserType('employee');
      setLoginError(null);
      setLoginCode('');
      appendActivityLog(
        employeeMatch.name,
        'employee',
        'Signed in to Self-Service Portal successfully.',
        'سجل الدخول بنجاح إلى بوابة الخدمات الذاتية.'
      );
    } else {
      setLoginError(t('loginFailed'));
    }
  };

  // 2. HR Admin Session Login
  const handleAdminLogin = (mockEmail?: string, mockPass?: string) => {
    const emailToTest = mockEmail || adminEmail;
    const passToTest = mockPass || adminPassword;

    if (!emailToTest || !passToTest) {
      setLoginError(t('allFieldsRequired'));
      return;
    }

    const adminMatch = admins.find(
      a => a.email.toLowerCase() === emailToTest.toLowerCase() && a.password === passToTest
    );

    if (adminMatch) {
      setActiveSessionAdmin(adminMatch);
      setCurrentUserType('admin');
      setLoginError(null);
      setAdminEmail('');
      setAdminPassword('');
      appendActivityLog(
        adminMatch.name,
        'admin',
        'Logged in to HR Administration panel.',
        'سجل الدخول كمسؤول في لوحة تحكم الموارد البشرية.'
      );
    } else {
      setLoginError(t('loginFailed'));
    }
  };

  // 3. Simple Log-out
  const handleLogout = () => {
    const userName = currentUserType === 'employee' ? activeSessionEmployee?.name : activeSessionAdmin?.name;
    const userRole = currentUserType === 'employee' ? 'employee' as const : 'admin' as const;
    
    appendActivityLog(
      userName || 'User',
      userRole,
      'Signed out of their session securely.',
      'قام بتسجيل الخروج الآمن من جلسة العمل الخاصة به.'
    );

    setCurrentUserType('guest');
    setActiveSessionEmployee(null);
    setActiveSessionAdmin(null);
    setLoginError(null);
    setGuestSubView('employee');
  };

  // 4. Employee Submits Service Request
  const handleEmployeeSubmitRequest = (requestType: RequestType, details: any, attachment?: { name: string; data: string }) => {
    if (!activeSessionEmployee) return;

    const newRequest: RequestRecord = {
      id: `req-${Date.now()}`,
      employee_id: activeSessionEmployee.id,
      request_type: requestType,
      details,
      attachmentName: attachment?.name,
      attachmentData: attachment?.data,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const updatedRequests = [newRequest, ...requests];
    localStorage.setItem('hr_requests', JSON.stringify(updatedRequests));
    setRequests(updatedRequests);

    // Create System Notif for HR Admin
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      user_id: 'hr',
      title: `New ${t(requestType)} submitted`,
      title_ar: `تقديم طلب جديد: ${t(requestType)}`,
      message: `${activeSessionEmployee.name} submitted a new request. Details: ${details.reason || details.subject || 'Review queued details'}`,
      message_ar: `قدم ${activeSessionEmployee.name_ar} طلباً جديداً. التفاصيل: ${details.reason || details.subject || 'الرجاء مراجعة البيانات قيد الانتظار'}`,
      is_read: false,
      created_at: new Date().toISOString()
    };

    const updatedNotifs = [newNotif, ...notifications];
    localStorage.setItem('hr_notifications', JSON.stringify(updatedNotifs));
    setNotifications(updatedNotifs);

    // Append to Audit Logs
    appendActivityLog(
      activeSessionEmployee.name,
      'employee',
      `Submitted request for: ${requestType}`,
      `قدم طلب خدمة: ${requestType}`
    );

    // Simulated Resend Dispatch to HR Specialist
    dispatchResendSimulatedEmail(
      'admin@company.com',
      `[HR PORTAL] New Request Submitted - ${activeSessionEmployee.name} (${activeSessionEmployee.employee_code})`,
      `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
        <h2 style="color: #DC2626; border-bottom: 2px solid #DC2626; padding-bottom: 10px;">New Request Alert</h2>
        <p><strong>Employee Details:</strong> ${activeSessionEmployee.name} (${activeSessionEmployee.employee_code})</p>
        <p><strong>Department:</strong> ${activeSessionEmployee.department}</p>
        <p><strong>Service Type:</strong> ${requestType.toUpperCase().replace('_', ' ')}</p>
        <p><strong>Submission Time:</strong> ${new Date().toLocaleString()}</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p><strong>Details Provided:</strong></p>
          <p>${details.reason || details.details || 'General request parameters submitted'}</p>
        </div>
        <p>Please log in to the Corporate HR Administration Dashboard to review and approve/reject this request.</p>
        <br/>
        <footer style="font-size: 11px; color: #777;">Corporate HR System Security Daemon</footer>
      </div>
      `
    );

    alert(t('requestSubmitted'));
  };

  // 5. HR Admin Approves/Rejects Requests
  const handleAdminUpdateStatus = (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!activeSessionAdmin) return;

    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        // Carry out side-effects for Personal Data Update requests if approved
        if (req.request_type === 'personal_data_update' && status === 'approved') {
          updateEmployeeRecordsOnApproval(req.employee_id, req.details);
        }
        return { ...req, status, admin_notes: notes };
      }
      return req;
    });

    localStorage.setItem('hr_requests', JSON.stringify(updatedRequests));
    setRequests(updatedRequests);

    // Retrieve corresponding employee details
    const originalRequest = requests.find(r => r.id === requestId);
    if (!originalRequest) return;

    const targetEmployee = employees.find(e => e.id === originalRequest.employee_id);
    if (targetEmployee) {
      // Create user notification on status update
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        user_id: targetEmployee.id,
        title: `Your ${t(originalRequest.request_type)} has been ${status === 'approved' ? 'APPROVED' : 'REJECTED'}`,
        title_ar: `طلبك للخدمة "${t(originalRequest.request_type)}" قد تمّ ${status === 'approved' ? 'الموافقة عليه' : 'ممانعته ورفضه'}`,
        message: notes || `Direct decision updated by HR Admin`,
        message_ar: notes || `تم تحديث القرار مباشرة من قبل مسؤول الموارد البشرية`,
        is_read: false,
        created_at: new Date().toISOString()
      };

      const updatedNotifs = [newNotif, ...notifications];
      localStorage.setItem('hr_notifications', JSON.stringify(updatedNotifs));
      setNotifications(updatedNotifs);

      // Append Audit Logs
      appendActivityLog(
        activeSessionAdmin.name,
        'admin',
        `${status === 'approved' ? 'Approved' : 'Rejected'} request ${requestId} for ${targetEmployee.name}`,
        `قاما بـ ${status === 'approved' ? 'الموافقة' : 'الرفض'} على الطلب ${requestId} التابع للموظف ${targetEmployee.name_ar}`
      );

      // Simulated Resend email notification dispatch to Employee
      dispatchResendSimulatedEmail(
        targetEmployee.email,
        `[HR PORTAL] Request Updated: ${t(originalRequest.request_type)} - STATUS: ${status.toUpperCase()}`,
        `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
          <h2 style="color: ${status === 'approved' ? '#10B981' : '#DC2626'}; border-bottom: 2px solid ${status === 'approved' ? '#10B981' : '#DC2626'}; padding-bottom: 10px;">
            Request Decision: ${status.toUpperCase()}
          </h2>
          <p>Dear ${targetEmployee.name},</p>
          <p>We would like to inform you that your HR inquiry details submitted on <strong>${new Date(originalRequest.created_at).toLocaleDateString()}</strong> have been actioned by HR Administration.</p>
          <p><strong>Service:</strong> ${originalRequest.request_type.toUpperCase().replace('_', ' ')}</p>
          <p><strong>Status Decision:</strong> <span style="font-weight: bold; color: ${status === 'approved' ? '#10B981' : '#DC2626'};">${status.toUpperCase()}</span></p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>HR response comments:</strong></p>
            <p>${notes || 'No administrative notes appended.'}</p>
          </div>
          <p>Thank you for using the corporate self-service portal.</p>
          <br/>
          <p>Saeed, Director of Corporate Human Resources</p>
        </div>
        `
      );
    }

    alert(t('requestStatusUpdated'));
    reloadDatabaseFromStorage();
  };

  // Side-effect: Applies Approved Employee info updates parameters
  const updateEmployeeRecordsOnApproval = (employeeId: string, updatedDetails: any) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          mobile: updatedDetails.mobile || emp.mobile,
          email: updatedDetails.email || emp.email,
          address: updatedDetails.address || emp.address
        };
      }
      return emp;
    });
    localStorage.setItem('hr_employees', JSON.stringify(updatedEmployees));
    setEmployees(updatedEmployees);
  };

  // 6. HR Add employee
  const handleAddEmployee = (empPayload: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...empPayload,
      id: `emp-${Date.now()}`
    };
    const updated = [...employees, newEmp];
    localStorage.setItem('hr_employees', JSON.stringify(updated));
    setEmployees(updated);

    appendActivityLog(
      activeSessionAdmin?.name || 'Admin',
      'admin',
      `Registered a new employee: ${newEmp.name}`,
      `سجل موظف جديد بجدول القوات العاملة: ${newEmp.name_ar}`
    );
  };

  // 7. HR Edit Employee details
  const handleEditEmployee = (empPayload: Employee) => {
    const updated = employees.map(e => e.id === empPayload.id ? empPayload : e);
    localStorage.setItem('hr_employees', JSON.stringify(updated));
    setEmployees(updated);

    appendActivityLog(
      activeSessionAdmin?.name || 'Admin',
      'admin',
      `Updated profile parameters of ${empPayload.name}`,
      `قام بتعديل ملف الموظف: ${empPayload.name_ar}`
    );
  };

  // 8. HR Delete Employee details
  const handleDeleteEmployee = (id: string) => {
    const target = employees.find(e => e.id === id);
    const updated = employees.filter(e => e.id !== id);
    localStorage.setItem('hr_employees', JSON.stringify(updated));
    setEmployees(updated);

    appendActivityLog(
      activeSessionAdmin?.name || 'Admin',
      'admin',
      `Deleted profiles archive for employee ID: ${id} (${target?.name})`,
      `حذف ملف الموظف ذي المعرف الرقمي: ${id} (${target?.name_ar})`
    );
  };

  // 9. Bulk Import spreadsheet
  const handleImportEmployees = (importedArray: Array<Omit<Employee, 'id'>>) => {
    let updatedEmployees = [...employees];
    let updatedCount = 0;
    let addedCount = 0;

    importedArray.forEach((importedEmp, index) => {
      const existingIndex = updatedEmployees.findIndex(
        emp => emp.employee_code.trim().toLowerCase() === importedEmp.employee_code.trim().toLowerCase()
      );

      if (existingIndex !== -1) {
        // Update existing employee
        updatedEmployees[existingIndex] = {
          ...updatedEmployees[existingIndex],
          name: importedEmp.name,
          name_ar: importedEmp.name_ar || importedEmp.name,
          department: importedEmp.department || updatedEmployees[existingIndex].department,
          department_ar: importedEmp.department_ar || updatedEmployees[existingIndex].department_ar
        };
        updatedCount++;
      } else {
        // Add as new employee
        updatedEmployees.push({
          ...importedEmp,
          id: `emp-imported-${Date.now()}-${index}`,
          name_ar: importedEmp.name_ar || importedEmp.name
        });
        addedCount++;
      }
    });

    localStorage.setItem('hr_employees', JSON.stringify(updatedEmployees));
    setEmployees(updatedEmployees);

    appendActivityLog(
      activeSessionAdmin?.name || 'Admin',
      'admin',
      `Imported employees: added ${addedCount}, updated ${updatedCount}.`,
      `استيراد الموظفين: تمت إضافة ${addedCount} وتحديث ${updatedCount}.`
    );
  };

  // 10. Mark notifications read on click
  const handleMarkNotificationsRead = (userId: string) => {
    const updated = notifications.map(n => n.user_id === userId ? { ...n, is_read: true } : n);
    localStorage.setItem('hr_notifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  // Reset to seed templates
  const handleSeedReset = () => {
    localStorage.removeItem('hr_employees');
    localStorage.removeItem('hr_requests');
    localStorage.removeItem('hr_notifications');
    localStorage.removeItem('hr_logs');
    initLocalStorageData();
    reloadDatabaseFromStorage();
    appendActivityLog(
      activeSessionAdmin?.name || 'Admin',
      'admin',
      'Refreshed and seeded database to original demonstration state.',
      'قام بإعادة ضبط وبذر قاعدة البيانات التجريبية لحالتها الأولى.'
    );
    alert('Mock Database seeded back to perfect initial demo state!');
  };

  return (
    <div className={`min-h-screen relative font-sans antialiased transition-colors duration-200 overflow-x-hidden ${
      isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'
    }`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-red-500/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-[200px] -left-[200px] w-[600px] h-[600px] rounded-full bg-red-600/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute top-[200px] -right-[250px] w-[700px] h-[700px] rounded-full bg-red-600/[0.02] blur-[150px] pointer-events-none" />

      {/* --- CORPORATE EMBELLISHED TOPBAR --- */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md shadow-sm transition-colors duration-150 ${
        isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-900/95 text-white border-zinc-950'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left side: Brand Title */}
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-red-600 rounded-xl text-white font-extrabold flex items-center justify-center shadow-lg shadow-red-600/10">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight flex items-center gap-1">
                  CORPORATE <span className="text-xs font-bold text-red-500 uppercase tracking-widest hidden sm:inline">HR SYSTEMS</span>
                </h1>
                <p className="text-[10px] text-zinc-400 font-medium">Employee Self-Service & Admin Portal</p>
              </div>
            </div>

            {/* Right side: Helpers & Toggles */}
            <div className="flex items-center gap-3.5">
              
              {/* Simulation logs toggle button if email is active */}
              {emailLogs.length > 0 && (
                <button
                  onClick={() => setShowEmailLogsDrawer(true)}
                  className="relative p-1.5 border border-zinc-700 hover:border-red-600 rounded-lg text-white hover:text-red-500 transition bg-zinc-800"
                  title="View simulated email dispatches"
                >
                  <Mail className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                </button>
              )}

              {/* Language Switch */}
              <button
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-1 text-xs font-bold hover:text-red-500 border border-zinc-700 hover:border-red-600 px-3 py-1.5 rounded-lg transition bg-zinc-800 text-white"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t('switchLanguage')}</span>
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 border border-zinc-700 hover:border-red-600 rounded-lg text-white hover:text-red-500 transition bg-zinc-800"
                aria-label="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Log out option if logged in */}
              {currentUserType !== 'guest' && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-lg transition shadow-md"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Under-banner solid RED brand strip */}
        <div className="h-1 bg-gradient-to-r from-red-600 via-red-800 to-zinc-900" />
      </header>

      {/* --- MAIN PAGE GRAPHICS WRAPPER --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">

        <AnimatePresence mode="wait">
          {currentUserType === 'guest' ? (
            /* ========================================================
               STREAMLINED GUEST PORTAL - EMPLOYEE FIRST OR ADMIN VIEW
               ======================================================== */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 max-w-md mx-auto py-8 sm:py-12"
            >
              {guestSubView === 'employee' ? (
                /* ---------------- EMPLOYEE LOGIN VIEW ---------------- */
                <div className={`p-8 sm:p-10 rounded-3xl border transition-all duration-300 shadow-2xl relative overflow-hidden ${
                  isDarkMode 
                    ? 'bg-zinc-900/40 border-zinc-805/80 backdrop-blur-md shadow-black/40' 
                    : 'bg-white border-zinc-150/90 shadow-gray-200/50'
                }`} dir="rtl">
                  
                  {/* Glowing decorative indicator */}
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

                  <div className="text-center space-y-3 mb-8">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black tracking-wider uppercase bg-red-500/10 text-red-600 dark:text-red-400 rounded-full select-none">
                      <Sparkles className="w-3 h-3 animate-pulse text-red-600" />
                      نظام الموارد البشرية والخدمات الذاتية
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-950 dark:text-white">
                      بوابة الموظفين الرقمية
                    </h2>
                    <p className={`text-xs font-semibold leading-relaxed max-w-sm mx-auto ${
                      isDarkMode ? 'text-zinc-400' : 'text-gray-500'
                    }`}>
                      سجل دخولك برقمك الكودي لطلب السلف، الأوراق الرسمية، ورفع التقارير الطبية فوراً وبسرية.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 mb-5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-550/10 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span className="font-bold">{loginError}</span>
                    </div>
                  )}

                  {/* Employee Login form container (Only Employee Code and Red Login Button) */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-extrabold block text-gray-450 dark:text-zinc-500 text-right">
                        كود الموظف الخاص بك
                      </label>
                      <input
                        type="text"
                        value={loginCode}
                        onChange={(e) => setLoginCode(e.target.value)}
                        placeholder="أدخل كود الموظف هنا (مثال: 1025)"
                        className="w-full bg-transparent border border-zinc-250 dark:border-zinc-800 rounded-xl p-3 text-sm font-mono text-center outline-none transition-all focus:border-red-600 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500 font-bold"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleEmployeeLogin(); }}
                      />
                    </div>

                    <button
                      onClick={() => handleEmployeeLogin()}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold p-3.5 rounded-xl text-sm shadow-lg shadow-red-650/10 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-1.5 hover:brightness-110 cursor-pointer"
                    >
                      <span>🔴 تسجيل الدخول الآمن</span>
                    </button>
                  </div>

                  {/* CRITICAL CENTERING ADMIN FOOTER LINK */}
                  <div className="mt-10 pt-6 border-t border-dashed dark:border-zinc-805 border-zinc-150 flex flex-col items-center space-y-2">
                    <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                      <span>🔒 مخصص لمسؤولي النظام فقط</span>
                    </span>
                    <button
                      onClick={() => {
                        setGuestSubView('admin');
                        setLoginError(null);
                      }}
                      className="text-xs font-black text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline transition-all"
                    >
                      دخول إدارة الموارد البشرية (HR Admin)
                    </button>
                  </div>
                </div>
              ) : (
                /* ---------------- ADMIN LOGIN VIEW ---------------- */
                <div className={`p-8 sm:p-10 rounded-3xl border transition-all duration-300 shadow-2xl relative overflow-hidden ${
                  isDarkMode 
                    ? 'bg-zinc-900/40 border-zinc-805/80 backdrop-blur-md shadow-black/40' 
                    : 'bg-white border-zinc-150/90 shadow-gray-200/50'
                }`} dir="rtl">
                  
                  {/* Glowing decorative indicator */}
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-zinc-950 to-transparent" />

                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-red-600 dark:text-red-500 uppercase">
                      OneHR Admin
                    </h2>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                      تسجيل دخول الموارد البشرية
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                      أدخل بريدك الإلكتروني الإداري وكلمة المرور للمتابعة
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 mb-5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-550/10 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span className="font-bold">{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wider font-extrabold block text-gray-450 dark:text-zinc-500 text-right">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@company.com"
                        className="w-full bg-transparent border border-zinc-250 dark:border-zinc-800 rounded-xl p-3 text-sm text-center outline-none transition-all focus:border-red-600 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500 font-bold"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wider font-extrabold block text-gray-450 dark:text-zinc-500 text-right">
                        كلمة المرور الإدارية
                      </label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent border border-zinc-250 dark:border-zinc-800 rounded-xl p-3 text-sm text-center outline-none transition-all focus:border-red-600 dark:focus:border-red-500 focus:ring-1 focus:ring-red-500 font-bold font-mono"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                      />
                    </div>

                    <button
                      onClick={() => handleAdminLogin()}
                      className="w-full mt-2 bg-zinc-950 hover:bg-neutral-900 text-white font-extrabold p-3.5 rounded-xl text-sm border border-zinc-800 hover:border-red-600 hover:shadow-lg hover:shadow-red-600/5 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer dark:bg-zinc-950/80"
                    >
                      <span>🔴 تسجيل دخـول المسؤول</span>
                    </button>
                  </div>

                  {/* RETURN BACK FOR GUESTS */}
                  <div className="mt-8 pt-4 border-t border-dashed dark:border-zinc-805 border-zinc-150 text-center">
                    <button
                      onClick={() => {
                        setGuestSubView('employee');
                        setLoginError(null);
                      }}
                      className="text-xs font-black text-gray-450 hover:text-red-500 hover:underline transition-all"
                    >
                      ← الرجوع لبوابة الموظفين الرئيسية
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : currentUserType === 'employee' && activeSessionEmployee ? (
            /* ========================================================
               EMPLOYEE LOGGED IN SERVICES VIEW
               ======================================================== */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmployeePortal
                employee={activeSessionEmployee}
                requests={requests}
                notifications={notifications}
                onSubmitRequest={handleEmployeeSubmitRequest}
                onMarkNotificationsRead={handleMarkNotificationsRead}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          ) : (
            /* ========================================================
               HR ADMIN LOGGED IN CONTROLS VIEW
               ======================================================== */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPortal
                admin={activeSessionAdmin!}
                employees={employees}
                requests={requests}
                notifications={notifications}
                logs={logs}
                onAddEmployee={handleAddEmployee}
                onEditEmployee={handleEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onImportEmployees={handleImportEmployees}
                onUpdateRequestStatus={handleAdminUpdateStatus}
                onMarkNotificationsRead={handleMarkNotificationsRead}
                onSeedDemoData={handleSeedReset}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* --- FLOATING EMAILS SIMULATION DRAWER (RESEND LOGS) --- */}
      <AnimatePresence>
        {showEmailLogsDrawer && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-900 border-l border-zinc-800 text-stone-100 shadow-2xl flex flex-col h-full transform transition-all">
            {/* Header */}
            <div className="p-4 border-b border-zinc-805 flex justify-between items-center bg-zinc-950">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-650 rounded text-white font-bold"><Cpu className="w-4 h-4" /></div>
                <div>
                  <h4 className="text-xs font-bold font-mono">Resend API Simulation</h4>
                  <p className="text-[9px] text-gray-500">Live platform dispatch auditing log</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowEmailLogsDrawer(false)}
                className="text-stone-400 hover:text-white border border-zinc-800 hover:border-red-600 p-1.5 rounded transition"
                aria-label="Close logs panel"
              >
                ✕
              </button>
            </div>

            {/* Logs Body */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 text-xs font-mono">
              <p className="text-[10px] text-gray-500 leading-normal">
                This console simulates background emails routed dynamically through the **Resend** service when requests are created, reviewed, or authorized. Clear transparency aligns with server-side audit trails:
              </p>

              {emailLogs.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 text-zinc-500">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No dispatches registered yet</p>
                  <p className="text-[10px] opacity-70">Submit or approve requests to trigger mail logs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emailLogs.map((mail, idx) => (
                    <div key={mail.id} className="p-3 bg-zinc-950 rounded border border-zinc-800 space-y-1 text-[10px]">
                      <div className="flex justify-between items-start text-red-500 font-bold border-b border-zinc-850 pb-1 mb-1">
                        <span>DISPATCHED #{emailLogs.length - idx}</span>
                        <span>{mail.timestamp}</span>
                      </div>
                      <p><strong>From:</strong> {mail.sender}</p>
                      <p><strong>To:</strong> {mail.recipient}</p>
                      <p><strong>Subject:</strong> {mail.subject}</p>
                      
                      {/* Email template content view frame */}
                      <details className="mt-2 text-zinc-400">
                        <summary className="cursor-pointer text-[9px] text-zinc-500 hover:text-red-500 py-1 select-none">View HTML Content Template</summary>
                        <div 
                          className="mt-1.5 p-2.5 bg-white text-zinc-900 rounded font-sans text-xs leading-normal max-h-48 overflow-y-auto border border-zinc-350"
                          dangerouslySetInnerHTML={{ __html: mail.htmlContent }}
                        />
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Logs footer button */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-900 flex justify-end gap-2">
              <button
                onClick={() => setEmailLogs([])}
                className="text-[10px] font-bold text-zinc-400 hover:text-white px-3 py-1.5 hover:bg-zinc-900 rounded transition"
              >
                Reset Ledger
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- BACK TO WORKSPACE CREDIT FOOTER --- */}
      <footer className="py-6 border-t border-dashed dark:border-gray-800 border-gray-250 text-center text-xs text-gray-500 space-y-1.5">
        <p>© 2026 HR Platforms. All rights reserved.</p>
        <div className="flex justify-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[10px] font-mono">Red Black and White Premium corporate Theme</span>
          <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-500 dark:text-zinc-405 rounded text-[10px] font-mono">Arabic RTL & English Bilingual Systems supported</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
