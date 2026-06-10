import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // General
    appName: 'Corporate HR Portal',
    employeeCode: 'Employee Code',
    login: 'Login',
    employeeLogin: 'Employee Login',
    adminLogin: 'HR Administration Login',
    adminLoginBtn: 'HR Admin Login',
    logout: 'Logout',
    email: 'Email Address',
    password: 'Password',
    switchLanguage: 'العربية',
    rtlToggle: 'RTL',
    welcome: 'Welcome back',
    welcomeAdmin: 'Welcome Admin',
    home: 'Home',
    cancel: 'Cancel',
    save: 'Save Changes',
    loading: 'Loading...',
    allFieldsRequired: 'Please fill in all required fields.',
    successAction: 'Action completed successfully.',
    errorAction: 'Something went wrong. Please check your data.',
    searchPlaceholder: 'Search by employee name, code, or department...',
    department: 'Department',
    jobTitle: 'Job Title',
    mobile: 'Mobile Number',
    address: 'Physical Address',
    status: 'Status',
    createdAt: 'Created At',
    actions: 'Actions',
    notes: 'Notes',
    adminNotes: 'Admin Response Notes',
    attachment: 'Attachment File',
    optional: 'Optional',
    category: 'Category',
    subject: 'Subject',
    details: 'Details / Description',
    noData: 'No records found',
    noNotifications: 'You are all caught up!',
    recentNotifications: 'Recent Notifications',
    markAllRead: 'Mark all as read',
    auditTrail: 'Platform Activity Audit Tail',
    systemAlert: 'Notification',

    // Themes
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',

    // Statuses
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',

    // Portal Sides
    employeePortal: 'Employee Self-Service Portal',
    hrPortal: 'HR Administration Dashboard',

    // Requests Lists
    salary_advance: 'Salary Advance Request',
    salary_certificate: 'Salary Certificate Request',
    uniform_size: 'Uniform Size Registration',
    leave: 'Annual Leave Request',
    sick_leave: 'Sick Leave Request',
    prescription: 'Medical Prescription Upload',
    medical_report: 'Medical Report Upload',
    suggestion: 'Complaints & Suggestions',
    personal_data_update: 'Personal Data Update',
    my_requests: 'My Request Registry',

    // Employee Services Details
    reqAmount: 'Requested Amount ($)',
    reqReason: 'Reason for Request',
    submitRequest: 'Submit Request',
    oneClickCert: 'Generate & Request Certificate',
    certHelper: 'Clicking here sends an immediate request to HR. After approval, you will be able to download your signed digital salary certificate directly from this screen.',
    shirtSize: 'Shirt Size',
    pantsSize: 'Pants Size',
    shoeSize: 'Shoe Size',
    heightCm: 'Height (cm)',
    weightKg: 'Weight (kg)',
    uniformHelper: 'Register or update your corporate uniform sizes for active cataloging.',
    startDate: 'Start Date',
    endDate: 'End Date',
    medicalProvider: 'Clinic or Hospital Name',
    reportDate: 'Report / Visit Date',
    restDays: 'Recommended Rest Days',
    dragDropFile: 'Drag & drop file or click to upload',
    fileTypeHelper: 'Supports PDF, JPG, JPEG, PNG (Max 10MB)',
    complaintCat: 'Service Category',
    complaintCat1: 'Suggestion',
    complaintCat2: 'Complaint',
    complaintCat3: 'Facility Issue',
    complaintArName: 'Complaint/Suggestion',

    // HR Controls
    totalEmployees: 'Total Workforce',
    totalRequests: 'Total Requests',
    pendingRequests: 'Pending Requests',
    approvedRequests: 'Approved Requests',
    rejectedRequests: 'Rejected Requests',
    sickLeaveStats: 'Active Sick Leaves',
    salaryAdvanceStats: 'Total Salary Advances',
    chartsAnalytics: 'HR Command Center Analytics',
    workforceByDept: 'Workforce Distribution by Department',
    requestsTimeline: 'Request Volume & Submissions',
    
    // HR Management Tabs
    tabEmployees: 'Employee Database',
    tabRequests: 'Request Management',
    tabMedical: 'Medical File Center',
    tabUniforms: 'Uniform Inventories',
    tabLogs: 'HR Audit Trails',

    // Employee Form Buttons
    addEmployeeBtn: 'Add New Employee',
    editEmployee: 'Edit Employee Information',
    deleteEmployee: 'Remove Employee',
    importExcel: 'Import Excel / CSV File',
    exportExcel: 'Export Master Sheet',
    uploadSample: 'Load Demonstration Workforce',
    
    // Filters & Subtotals
    filterAll: 'All Categories',
    filterType: 'Filter Request Type',
    filterStatus: 'Filter Status',
    approveBtn: 'Approve Request',
    rejectBtn: 'Reject Request',
    downloadCertificate: 'Download Salary Certificate',
    viewsAllFiles: 'View File Content',
    searchPatient: 'Filter by employee name or code...',
    medicalFilesHeader: 'Digital Employee Health Registry',
    exportUniforms: 'Export Uniform Manifesto',
    downloadReport: 'Download PDF Report',

    // Alerts
    loginFailed: 'Invalid credentials. For Employee, please use existing Code. For HR, use professional email/password.',
    codeRequired: 'Please enter a valid employee code.',
    codePlaceholder: 'e.g., EMP-101 (or run DEMO below)',
    demoNote: 'Demo Access Codes: EMP-101 (Workforce) or admin@company.com / admin123 (HR Admin)',
    requestSubmitted: 'Your request has been successfully queued and HR has been notified.',
    requestStatusUpdated: 'The request status has been updated and the employee has been notified.'
  },
  ar: {
    // General
    appName: 'بوابة الموارد البشرية للشركة',
    employeeCode: 'كود الموظف',
    login: 'تسجيل الدخول',
    employeeLogin: 'تسجيل دخول الموظف',
    adminLogin: 'تسجيل دخول إدارة الموارد البشرية',
    adminLoginBtn: 'دخول مسؤول HR',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    switchLanguage: 'English',
    rtlToggle: 'من اليمين لليسار',
    welcome: 'مرحباً بعودتك',
    welcomeAdmin: 'مرحباً، المسؤول',
    home: 'الرئيسية',
    cancel: 'إلغاء',
    save: 'حفظ التغييرات',
    loading: 'جاري التحميل...',
    allFieldsRequired: 'يرجى ملء جميع الحقول المطلوبة.',
    successAction: 'تمت العملية بنجاح.',
    errorAction: 'حدث خطأ ما. يرجى مراجعة البيانات المدخلة.',
    searchPlaceholder: 'البحث باسم الموظف، الكود، أو القسم...',
    department: 'القسم',
    jobTitle: 'المسمى الوظيفي',
    mobile: 'رقم الهاتف',
    address: 'العنوان السكني',
    status: 'الحالة',
    createdAt: 'تاريخ الإنشاء',
    actions: 'الإجراءات',
    notes: 'ملاحظات',
    adminNotes: 'ملاحظات رد الإدارة',
    attachment: 'الملف المرفق',
    optional: 'اختياري',
    category: 'الفئة',
    subject: 'الموضوع',
    details: 'التفاصيل / الوصف',
    noData: 'لا توجد سجلات متوفرة',
    noNotifications: 'أنت مطلع على كافة الإشعارات!',
    recentNotifications: 'الإشعارات الأخيرة',
    markAllRead: 'تحديد الكل كمقروء',
    auditTrail: 'سجل تدقيق الأنشطة على المنصة',
    systemAlert: 'إشعار نظام',

    // Themes
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع المضيء',

    // Statuses
    pending: 'قيد الانتظار',
    approved: 'تمت الموافقة',
    rejected: 'مرفوض',

    // Portal Sides
    employeePortal: 'بوابة الموظف للخدمات الذاتية',
    hrPortal: 'لوحة التحكم لإدارة الموارد البشرية',

    // Requests Lists
    salary_advance: 'طلب سلفة مالية على الراتب',
    salary_certificate: 'طلب شهادة تعريف بالراتب',
    uniform_size: 'تسجيل مقاسات الزي الرسمي',
    leave: 'طلب إجازة سنوية',
    sick_leave: 'طلب إجازة مرضية',
    prescription: 'رفع وصفة طبية',
    medical_report: 'رفع تقرير طبي معتمد',
    suggestion: 'الشكاوى والاقتراحات',
    personal_data_update: 'تحديث البيانات الشخصية',
    my_requests: 'سجل طلباتي المقدمة',

    // Employee Services Details
    reqAmount: 'المبلغ المطلوب ($)',
    reqReason: 'سبب الطلب المالي',
    submitRequest: 'ارسال الطلب للإدارة',
    oneClickCert: 'إنشاء طلب شهادة الراتب',
    certHelper: 'النقر هنا يرسل طلباً فورياً للموارد البشرية. بعد الموافقة، ستتمكن من تحميل نسخة رقمية موقعة لشهادة راتبك مباشرة من هذه الشاشة.',
    shirtSize: 'مقاس القميص',
    pantsSize: 'مقاس البنطال',
    shoeSize: 'مقاس الحذاء',
    heightCm: 'الطول (سم)',
    weightKg: 'الوزن (كجم)',
    uniformHelper: 'قم بتسجيل أو تحديث مقاسات الزي الرسمي الخاص بك لتسهيل حصر التوزيع الخاص بالموارد البشرية.',
    startDate: 'تاريخ بداية الإجازة',
    endDate: 'تاريخ نهاية الإجازة',
    medicalProvider: 'اسم المرفق الطبي / المستشفى',
    reportDate: 'تاريخ الكشف / التقرير',
    restDays: 'أيام الراحة الموصى بها',
    dragDropFile: 'اسحب وأفلت الملف هنا أو انقر للرفع',
    fileTypeHelper: 'يدعم صيغ PDF، JPG، JPEG، PNG (الحد الأقصى ١٠ ميجابايت)',
    complaintCat: 'فئة الخدمة',
    complaintCat1: 'اقتراح',
    complaintCat2: 'شكوى',
    complaintCat3: 'مشكلة فنية بالمرافق',
    complaintArName: 'الشكاوى والاقتراح',

    // HR Controls
    totalEmployees: 'إجمالي القوى العاملة',
    totalRequests: 'إجمالي الطلبات المستلمة',
    pendingRequests: 'الطلبات قيد الانتظار',
    approvedRequests: 'طلبات تمت الموافقة عليها',
    rejectedRequests: 'طلبات تم رفضها',
    sickLeaveStats: 'الإجازات المرضية النشطة',
    salaryAdvanceStats: 'إجمالي السلف المعتمدة',
    chartsAnalytics: 'تحليلات مركز قيادة الموارد البشرية',
    workforceByDept: 'توزيع القوى العاملة حسب الأقسام',
    requestsTimeline: 'حجم الطلبات وإحصاءات التقديم',

    // HR Management Tabs
    tabEmployees: 'قاعدة بيانات الموظفين',
    tabRequests: 'إدارة الطلبات والاعتمادات',
    tabMedical: 'الملف الطبي الرقمي للموظفين',
    tabUniforms: 'إدارة مقاسات الزي الرسمي',
    tabLogs: 'سجلات تدقيق الإدارة',

    // Employee Form Buttons
    addEmployeeBtn: 'إضافة موظف جديد',
    editEmployee: 'تعديل بيانات الموظف',
    deleteEmployee: 'استبقاء الموظف و حذفه',
    importExcel: 'استيراد ملف Excel / CSV',
    exportExcel: 'تصدير ورقة البيانات الرئيسية',
    uploadSample: 'تحميل بيانات تجريبية للموظفين',

    // Filters & Subtotals
    filterAll: 'كافة التصنيفات',
    filterType: 'حسب نوع الطلب',
    filterStatus: 'حسب الحالة',
    approveBtn: 'الموافقة على الطلب',
    rejectBtn: 'رفض وممانعة الطلب',
    downloadCertificate: 'تحميل كشف راتب معتمد',
    viewsAllFiles: 'عرض محتوى المستند المرفق',
    searchPatient: 'البحث باسم الموظف أو الكود الطبي...',
    medicalFilesHeader: 'السجل الصحي الرقمي للقوى العاملة',
    exportUniforms: 'تصدير بيان مقاسات الزي الرسمي',
    downloadReport: 'إصدار تقرير PDF الرقمي',

    // Alerts
    loginFailed: 'فشل بالتحقق من البيانات. الموظف: استخدم الكود الصحيح، الإداري: البريد وكلمة المرور.',
    codeRequired: 'الرجاء إدخال كود الموظف للاستمرار.',
    codePlaceholder: 'مثال: EMP-101 (أو اضغط زر البيانات التجريبية)',
    demoNote: 'الوصول السريع التجريبي: كود الموظف EMP-101 أو بريد الموارد البشرية admin@company.com / الباسورد admin123',
    requestSubmitted: 'تم تقديم طلبك بنجاح للموارد البشرية وتم إرسال الإشعار التلقائي.',
    requestStatusUpdated: 'تم تحديث حالة طلب الخدمة وإرسال إشعار للموظف ذي الصلة.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('hr_portal_lang');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('hr_portal_lang', language);
    // Sync browser direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translationSet = translations[language];
    return translationSet[key] || translations['en'][key] || key;
  };

  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
