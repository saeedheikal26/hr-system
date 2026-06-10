import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useLanguage } from './LanguageContext';
import { Employee, Admin, RequestRecord, Notification, ActivityLog } from '../types';
import { 
  Users, Layers, Clock, CheckCircle, AlertTriangle, FileText, Plus, Search,
  Edit2, Trash2, ArrowUpRight, ArrowDownLeft, Download, Upload, ShieldCheck, Shirt, Eye, X
} from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPortalProps {
  admin: Admin;
  employees: Employee[];
  requests: RequestRecord[];
  notifications: Notification[];
  logs: ActivityLog[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onImportEmployees: (imported: Array<Omit<Employee, 'id'>>) => void;
  onUpdateRequestStatus: (requestId: string, status: 'approved' | 'rejected', notes?: string) => void;
  onMarkNotificationsRead: (userId: string) => void;
  onSeedDemoData: () => void;
  isDarkMode: boolean;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  admin,
  employees,
  requests,
  notifications,
  logs,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onImportEmployees,
  onUpdateRequestStatus,
  onMarkNotificationsRead,
  onSeedDemoData,
  isDarkMode
}) => {
  const { t, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'employees' | 'requests' | 'medical' | 'uniform' | 'logs'>('requests');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [requestFilterType, setRequestFilterType] = useState('all');
  const [requestFilterStatus, setRequestFilterStatus] = useState('all');
  const [medicalSearchQuery, setMedicalSearchQuery] = useState('');

  // Modals / Form states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRequestActionModal, setShowRequestActionModal] = useState<RequestRecord | null>(null);
  const [adminActionNotes, setAdminActionNotes] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; data: string } | null>(null);

  const downloadAttachment = (base64Data: string, fileName: string) => {
    try {
      const arr = base64Data.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
      // Fallback: trigger standard open
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = base64Data;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }
  };

  // Add/Edit Employee Form fields
  const [empCode, setEmpCode] = useState('');
  const [empName, setEmpName] = useState('');
  const [empNameAr, setEmpNameAr] = useState('');
  const [empDept, setEmpDept] = useState('Information Technology');
  const [empDeptAr, setEmpDeptAr] = useState('تكنولوجيا المعلومات');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptEn, setCustomDeptEn] = useState('');
  const [customDeptAr, setCustomDeptAr] = useState('');
  const [empTitle, setEmpTitle] = useState('');
  const [empTitleAr, setEmpTitleAr] = useState('');
  const [empMobile, setEmpMobile] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empAddr, setEmpAddr] = useState('');
  const [empAddrAr, setEmpAddrAr] = useState('');
  const [empSalary, setEmpSalary] = useState<string>('10000');

  // CSV Import States
  const [csvContentText, setCsvContentText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parsedEmployees, setParsedEmployees] = useState<Array<Omit<Employee, 'id'>>>([]);
  const csvFileRef = useRef<HTMLInputElement>(null);

  // Mark all administration requests read on mount/render
  const unreadHrNotifications = notifications.filter(n => n.user_id === 'hr' && !n.is_read);

  // Statistics Calculations
  const totalEmployees = employees.length;
  const totalRequestsCount = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');
  
  const sickLeaveRequests = requests.filter(r => r.request_type === 'sick_leave');
  const salaryAdvanceRequests = requests.filter(r => r.request_type === 'salary_advance');

  // Multi-department options helper
  const departmentsList = [
    { en: 'Information Technology', ar: 'تكنولوجيا المعلومات (IT)' },
    { en: 'Human Resources', ar: 'الموارد البشرية (HR)' },
    { en: 'Engineering', ar: 'الإدارة الهندسية والإنشاءات' },
    { en: 'Operations', ar: 'إدارة العمليات والتشغيل' },
    { en: 'Finance', ar: 'الإدارة المالية والحسابات' },
    { en: 'Sales & Marketing', ar: 'إدارة المبيعات والتسويق' },
    { en: 'Procurement & Stores', ar: 'المشتريات والمخازن' },
    { en: 'Transportation & Support Services', ar: 'الحركة والخدمات والمعاونة' },
    { en: 'Quality Control', ar: 'إدارة الجودة والتطوير' },
    { en: 'Security, Health & Safety', ar: 'الأمن والسلامة والصحة المهنية' },
    { en: 'Legal Affairs', ar: 'الشؤون القانونية' },
    { en: 'Public Relations & Media', ar: 'العلاقات العامة والإعلام' },
    { en: 'Production & Manufacturing', ar: 'إدارة الإنتاج والتصنيع' },
    { en: 'Custom / Other', ar: 'أخرى (إدخال يدوي مخصص)' }
  ];

  // Employee CRUD Form triggers
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setEmpCode(`${Math.floor(1000 + Math.random() * 9000)}`);
    setEmpName('');
    setEmpNameAr('');
    setEmpTitle('');
    setEmpTitleAr('');
    setEmpMobile('');
    setEmpEmail('');
    setEmpAddr('');
    setEmpAddrAr('');
    setEmpSalary('10000');
    setEmpDept(departmentsList[0].en);
    setEmpDeptAr(departmentsList[0].ar);
    setIsCustomDept(false);
    setCustomDeptEn('');
    setCustomDeptAr('');
    setShowEmployeeModal(true);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpCode(emp.employee_code);
    setEmpName(emp.name);
    setEmpNameAr(emp.name_ar || '');
    setEmpTitle(emp.job_title || '');
    setEmpTitleAr(emp.job_title_ar || '');
    setEmpMobile(emp.mobile || '');
    setEmpEmail(emp.email || '');
    setEmpAddr(emp.address || '');
    setEmpAddrAr(emp.address_ar || '');
    setEmpSalary(String(emp.salary || 10000));
    
    const predefinedObj = departmentsList.find(d => d.en === emp.department && d.en !== 'Custom / Other');
    if (predefinedObj) {
      setEmpDept(emp.department || departmentsList[0].en);
      setEmpDeptAr(emp.department_ar || departmentsList[0].ar);
      setIsCustomDept(false);
      setCustomDeptEn('');
      setCustomDeptAr('');
    } else {
      setEmpDept('Custom / Other');
      setEmpDeptAr('أخرى (إدخال يدوي مخصص)');
      setCustomDeptEn(emp.department || '');
      setCustomDeptAr(emp.department_ar || '');
      setIsCustomDept(true);
    }
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empCode || !empName) {
      alert("الرمز والاسم مطلوبان / Code and Name are required");
      return;
    }

    let finalDept = empDept;
    let finalDeptAr = empDeptAr;

    if (empDept === 'Custom / Other') {
      finalDept = customDeptEn.trim() || 'Custom';
      finalDeptAr = customDeptAr.trim() || 'قسم مخصص';
    } else {
      const deptObject = departmentsList.find(d => d.en === empDept);
      if (deptObject) {
        finalDeptAr = deptObject.ar;
      }
    }

    const dataPayload = {
      employee_code: empCode.trim(),
      name: empName.trim(),
      name_ar: (empNameAr || empName).trim(),
      department: finalDept,
      department_ar: finalDeptAr,
      job_title: empTitle || 'Employee',
      job_title_ar: empTitleAr || 'موظف',
      mobile: empMobile || 'N/A',
      email: empEmail || 'N/A',
      address: empAddr || '',
      address_ar: empAddrAr || '',
      salary: parseFloat(empSalary) || 10000
    };

    if (editingEmployee) {
      onEditEmployee({ ...dataPayload, id: editingEmployee.id });
    } else {
      onAddEmployee(dataPayload);
    }
    setShowEmployeeModal(false);
  };

  // CSV/TSV/Excel Clipboard Row Parser helper
  const parseWorkforceData = (rawText: string): Array<Omit<Employee, 'id'>> => {
    const lines = rawText.split('\n');
    const importedRecords: Array<Omit<Employee, 'id'>> = [];
    if (lines.length === 0) return [];

    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('code') || firstLineLower.includes('كود') || firstLineLower.includes('name') || firstLineLower.includes('اسم');
    const startIndex = hasHeader ? 1 : 0;

    const isDeptText = (text: string): boolean => {
      if (!text) return false;
      const t = text.toLowerCase();
      return t.includes('إدارة') || t.includes('ادارة') || t.includes('قسم') || t.includes('ورشة') || t.includes('ورشه') || t.includes('خدمة') || t.includes('الادارة') || t.includes('الإدارة') || t.includes('department') || t.includes('dept') || t.includes('العليا');
    };

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Excel clipboard uses tabs '\t'. CSV standard uses ',' or ';'
      let sep = ',';
      if (line.includes('\t')) sep = '\t';
      else if (line.includes(';')) sep = ';';

      const cols = line.split(sep).map(s => s.replace(/^["']|["']$/g, '').trim());
      if (cols.length === 0) continue;

      const codeVal = cols[0];
      if (!codeVal || codeVal.toLowerCase().includes('code') || codeVal.includes('كود')) continue;

      let nameVal = cols[1] || '';
      let deptVal = cols[2] || '';

      // If there are only 2 columns, and the second column is a department name, it means Name is not written.
      if (cols.length === 2 && isDeptText(nameVal)) {
        deptVal = nameVal;
        nameVal = '';
      } else if (nameVal === deptVal || isDeptText(nameVal)) {
        if (!deptVal && nameVal) {
          deptVal = nameVal;
        }
        nameVal = '';
      }

      const matchedDept = departmentsList.find(
        d => d.en.toLowerCase() === deptVal.toLowerCase() || d.ar === deptVal
      ) || { en: deptVal || 'Operations', ar: deptVal || 'إدارة العمليات' };

      importedRecords.push({
        employee_code: codeVal,
        name: nameVal,
        name_ar: nameVal,
        department: matchedDept.en,
        department_ar: matchedDept.ar,
        job_title: 'Employee',
        job_title_ar: 'موظف',
        mobile: 'N/A',
        email: 'N/A',
        address: 'Egypt',
        address_ar: 'جمهورية مصر العربية'
      });
    }

    return importedRecords;
  };

  const handleCSVImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedEmployees.length === 0) {
      alert(isRtl ? "لم يتم العثور على بيانات صالحة للاستيراد. يرجى تزويدنا بكود واسم موظف." : "No valid data to import. Code and Name columns required.");
      return;
    }

    onImportEmployees(parsedEmployees);
    setShowImportModal(false);
    setCsvContentText('');
    setParsedEmployees([]);
  };

  const loadSampleCSVString = () => {
    const csvValue = `Code	Name	Department
1025	سعيد محمود	Information Technology
1001	أحمد محمد	Human Resources
1002	محمد علي	Operations
1003	محمود حسن	Engineering`;
    setCsvContentText(csvValue);
    setParsedEmployees(parseWorkforceData(csvValue));
  };

  const handleTextChangeAndParse = (text: string) => {
    setCsvContentText(text);
    setParsedEmployees(parseWorkforceData(text));
  };

  const handleFileUpload = (file: File) => {
    const isExcelOrCsv = file.name.endsWith('.xlsx') || 
                         file.name.endsWith('.xls') || 
                         file.name.endsWith('.csv') || 
                         file.name.endsWith('.tsv');

    const reader = new FileReader();
    if (isExcelOrCsv) {
      reader.onload = (e) => {
        try {
          const ab = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(ab, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          
          if (!rows || rows.length === 0) {
            alert(isRtl ? "شيت Excel فارغ أو غير صالح." : "The Excel sheet appears to be empty or invalid.");
            return;
          }

          let codeIdx = 0;
          let nameIdx = 1;
          let deptIdx = 2;

          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(5, rows.length); i++) {
            const row = rows[i];
            if (!row) continue;
            const isHeader = row.some(cell => {
              if (cell === null || cell === undefined) return false;
              const str = String(cell).toLowerCase().trim();
              return str.includes('code') || str.includes('كود') || str.includes('الرمز') ||
                     str.includes('name') || str.includes('الاسم') || str.includes('اسم');
            });
            
            if (isHeader) {
              headerRowIndex = i;
              row.forEach((cell, idx) => {
                if (cell === null || cell === undefined) return;
                const val = String(cell).toLowerCase().trim();
                if (val.includes('code') || val.includes('كود') || val.includes('الرمز')) {
                  codeIdx = idx;
                } else if (val.includes('name') || val.includes('الاسم') || val.includes('اسم') || val.includes('employee')) {
                  nameIdx = idx;
                } else if (val.includes('department') || val.includes('قسم') || val.includes('إدارة') || val.includes('القسم') || val.includes('الإدارة') || val.includes('dept')) {
                  deptIdx = idx;
                }
              });
              break;
            }
          }

          const importedRecords: Array<Omit<Employee, 'id'>> = [];
          const startDataRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

          const isDeptText = (text: string): boolean => {
            if (!text) return false;
            const t = text.toLowerCase();
            return t.includes('إدارة') || t.includes('ادارة') || t.includes('قسم') || t.includes('ورشة') || t.includes('ورشه') || t.includes('خدمة') || t.includes('الادارة') || t.includes('الإدارة') || t.includes('department') || t.includes('dept') || t.includes('العليا');
          };

          for (let i = startDataRow; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 1) continue;

            const codeValRaw = row[codeIdx] !== undefined ? row[codeIdx] : '';
            const nameValRaw = row[nameIdx] !== undefined ? row[nameIdx] : '';
            const deptValRaw = row[deptIdx] !== undefined ? row[deptIdx] : '';

            // Clean values
            const codeVal = String(codeValRaw).trim();
            let nameVal = String(nameValRaw).trim();
            let deptVal = String(deptValRaw).trim();

            if (!codeVal || codeVal.toLowerCase().includes('code') || codeVal.includes('كود')) continue;

            // Handle when name column contains department wording or matches department column, or is empty
            if (nameIdx === deptIdx && isDeptText(nameVal)) {
              deptVal = nameVal;
              nameVal = '';
            } else if (nameVal === deptVal || isDeptText(nameVal)) {
              if (!deptVal && nameVal) {
                deptVal = nameVal;
              }
              nameVal = '';
            }

            const matchedDept = departmentsList.find(
              d => d.en.toLowerCase() === deptVal.toLowerCase() || d.ar === deptVal
            ) || { en: deptVal || 'Operations', ar: deptVal || 'إدارة العمليات' };

            importedRecords.push({
              employee_code: codeVal,
              name: nameVal,
              name_ar: nameVal,
              department: matchedDept.en,
              department_ar: matchedDept.ar,
              job_title: 'Employee',
              job_title_ar: 'موظف',
              mobile: 'N/A',
              email: 'N/A',
              address: 'Egypt',
              address_ar: 'جمهورية مصر العربية'
            });
          }

          if (importedRecords.length > 0) {
            setParsedEmployees(importedRecords);
            // Prepare a sample text preview in the text box
            const previewLines = [
              "Code\tName\tDepartment",
              ...importedRecords.slice(0, 10).map(emp => `${emp.employee_code}\t${emp.name}\t${emp.department_ar || emp.department}`),
              ...(importedRecords.length > 10 ? ["..."] : [])
            ];
            setCsvContentText(previewLines.join('\n'));
          } else {
            alert(isRtl ? "لم يتم العثور على أسطر صالحة للاستيراد." : "No valid lines found to import. Check format layout.");
          }
        } catch (error) {
          console.error("Error reading with SheetJS xlsx:", error);
          alert(isRtl ? "حدث خطأ أثناء قراءة ملف Excel." : "Error parsing Excel or CSV file format.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setCsvContentText(text);
          setParsedEmployees(parseWorkforceData(text));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Excel Exports Helper of Master Database Tables using XLSX (SheetJS)
  const exportFileCollectionToExcel = (type: 'employees' | 'uniforms' | 'advances' | 'leaves' | 'medical') => {
    let rawData: any[] = [];
    let fileName = "";

    if (type === 'employees') {
      rawData = employees.map(e => ({
        [isRtl ? 'الكود' : 'Employee Code']: e.employee_code,
        [isRtl ? 'الاسم بالكامل' : 'Full Name']: e.name_ar || e.name,
        [isRtl ? 'الاسم بالإنجليزية' : 'English Name']: e.name,
        [isRtl ? 'القسم / الإدارة' : 'Department']: e.department_ar || e.department,
        [isRtl ? 'القسم بالإنجليزية' : 'English Department']: e.department,
        [isRtl ? 'المسمى الوظيفي' : 'Job Title']: e.job_title_ar || e.job_title,
        [isRtl ? 'الهاتف' : 'Mobile']: e.mobile || 'N/A',
        [isRtl ? 'البريد الإلكتروني' : 'Email']: e.email || 'N/A',
        [isRtl ? 'العنوان' : 'Address']: e.address_ar || e.address || ''
      }));
      fileName = isRtl ? "بيانات_الموظفين.xlsx" : "HR_Employees_Master_List.xlsx";
    } else if (type === 'uniforms') {
      const uniformSizes = requests.filter(r => r.request_type === 'uniform_size');
      rawData = uniformSizes.map(r => {
        const emp = employees.find(e => e.id === r.employee_id);
        return {
          [isRtl ? 'كود الموظف' : 'Employee Code']: emp?.employee_code || 'N/A',
          [isRtl ? 'اسم الموظف' : 'Employee Name']: emp?.name_ar || emp?.name || 'N/A',
          [isRtl ? 'مقاس البدلة' : 'Suit Size']: r.details.suit_size || 'N/A',
          [isRtl ? 'مقاس القميص' : 'Shirt Size']: r.details.shirt_size,
          [isRtl ? 'مقاس البنطلون' : 'Pants Size']: r.details.pants_size,
          [isRtl ? 'مقاس الحذاء' : 'Shoe Size']: r.details.shoe_size,
          [isRtl ? 'الطول (سم)' : 'Height (cm)']: r.details.height,
          [isRtl ? 'الوزن (كجم)' : 'Weight (kg)']: r.details.weight,
          [isRtl ? 'تاريخ التسجيل' : 'Register Date']: r.created_at
        };
      });
      fileName = "HR_Uniform_Inventory_Ledger.xlsx";
    } else if (type === 'advances') {
      const salaryAdvancesOrder = requests.filter(r => r.request_type === 'salary_advance');
      rawData = salaryAdvancesOrder.map(r => {
        const emp = employees.find(e => e.id === r.employee_id);
        return {
          [isRtl ? 'اسم الموظف' : 'Employee Name']: emp?.name_ar || emp?.name || 'N/A',
          [isRtl ? 'كود الموظف' : 'Employee Code']: emp?.employee_code || '',
          [isRtl ? 'المبلغ المطلوبة' : 'Amount ($)']: r.details.requested_amount,
          [isRtl ? 'السبب' : 'Reason']: r.details.reason,
          [isRtl ? 'الحالة' : 'Status']: r.status === 'pending' ? (isRtl ? 'قيد الانتظار' : 'Pending') : r.status === 'approved' ? (isRtl ? 'تمت الموافقة' : 'Approved') : (isRtl ? 'مرفوض' : 'Rejected'),
          [isRtl ? 'تاريخ تقديم الطلب' : 'Date Submitted']: r.created_at
        };
      });
      fileName = isRtl ? "سجل_سلف_الرواتب.xlsx" : "Salary_Advance_Requests_Ledger.xlsx";
    } else if (type === 'leaves') {
      const annualLeavesOrder = requests.filter(r => r.request_type === 'leave');
      rawData = annualLeavesOrder.map(r => {
        const emp = employees.find(e => e.id === r.employee_id);
        return {
          [isRtl ? 'اسم الموظف' : 'Employee Name']: emp?.name_ar || emp?.name || 'N/A',
          [isRtl ? 'كود الموظف' : 'Employee Code']: emp?.employee_code || '',
          [isRtl ? 'تاريخ البدء' : 'Start Date']: r.details.start_date,
          [isRtl ? 'تاريخ الانتهاء' : 'End Date']: r.details.end_date,
          [isRtl ? 'السبب' : 'Reason']: r.details.reason,
          [isRtl ? 'الحالة' : 'Status']: r.status === 'pending' ? (isRtl ? 'قيد الانتظار' : 'Pending') : r.status === 'approved' ? (isRtl ? 'تمت الموافقة' : 'Approved') : (isRtl ? 'مرفوض' : 'Rejected'),
          [isRtl ? 'تاريخ التقديم' : 'Date Submitted']: r.created_at
        };
      });
      fileName = "Annual_Leave_Ledger.xlsx";
    } else if (type === 'medical') {
      const medsRecords = requests.filter(r => r.request_type === 'prescription' || r.request_type === 'medical_report' || r.request_type === 'sick_leave');
      rawData = medsRecords.map(r => {
        const emp = employees.find(e => e.id === r.employee_id);
        const valProvider = r.details.clinic_name || r.details.medical_provider || 'General Rest';
        return {
          [isRtl ? 'اسم الموظف' : 'Employee Name']: emp?.name_ar || emp?.name || 'N/A',
          [isRtl ? 'كود الموظف' : 'Employee Code']: emp?.employee_code || '',
          [isRtl ? 'نوع المعاملة' : 'Form Type']: r.request_type,
          [isRtl ? 'المقدم الطبي' : 'Provider/Clinic']: valProvider,
          [isRtl ? 'ملاحظات' : 'Notes']: r.details.notes || '',
          [isRtl ? 'تاريخ التقديم' : 'Date Submitted']: r.created_at
        };
      });
      fileName = "Health_Registry_Ledger.xlsx";
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(rawData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, isRtl ? "البيانات" : "Data");
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Failed to export Excel:", err);
      alert(isRtl ? "حدث خطأ أثناء تصدير ملف Excel." : "Error exporting Excel sheet.");
    }
  };

  // Filtered employees listing
  const filteredEmployees = employees.filter(emp => {
    const term = searchQuery.toLowerCase();
    return (
      (emp.name || '').toLowerCase().includes(term) ||
      (emp.name_ar || '').toLowerCase().includes(term) ||
      (emp.employee_code || '').toLowerCase().includes(term) ||
      (emp.department || '').toLowerCase().includes(term) ||
      (emp.department_ar || '').toLowerCase().includes(term)
    );
  });

  // Filtered requests management list
  const filteredRequestsList = requests.filter(req => {
    const matchesType = requestFilterType === 'all' || req.request_type === requestFilterType;
    const matchesStatus = requestFilterStatus === 'all' || req.status === requestFilterStatus;
    return matchesType && matchesStatus;
  });

  // Medical Digital Files filter
  const medicalFilesList = requests.filter(r => 
    r.request_type === 'prescription' || 
    r.request_type === 'medical_report' || 
    r.request_type === 'sick_leave'
  ).filter(req => {
    const emp = employees.find(e => e.id === req.employee_id);
    const search = medicalSearchQuery.toLowerCase();
    if (!search) return true;
    return (
      (emp?.name || '').toLowerCase().includes(search) ||
      (emp?.employee_code || '').toLowerCase().includes(search) ||
      (req.details.clinic_name || req.details.medical_provider || '').toLowerCase().includes(search)
    );
  });

  // Uniform Size registries
  const uniformRegistriesList = requests.filter(r => r.request_type === 'uniform_size');

  const handleOpenActionModal = (req: RequestRecord) => {
    setShowRequestActionModal(req);
    setAdminActionNotes('');
  };

  const handleActionRequestChange = (status: 'approved' | 'rejected') => {
    if (!showRequestActionModal) return;
    onUpdateRequestStatus(showRequestActionModal.id, status, adminActionNotes);
    setShowRequestActionModal(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards Deck */}
      <h3 className={`text-md uppercase tracking-wider font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {t('chartsAnalytics')}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1 */}
        <div className={`p-4 rounded-xl border transition-colors shadow-sm ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xl font-black font-mono">{totalEmployees}</span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500"><Users className="w-4 h-4" /></span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider block mt-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('totalEmployees')}</span>
        </div>

        {/* Metric 2 */}
        <div className={`p-4 rounded-xl border transition-colors shadow-sm ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xl font-black font-mono">{totalRequestsCount}</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Layers className="w-4 h-4" /></span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider block mt-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('totalRequests')}</span>
        </div>

        {/* Metric 3 */}
        <div className={`p-4 rounded-xl border transition-colors shadow-sm ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xl font-black font-mono text-amber-500">{pendingRequests.length}</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><Clock className="w-4 h-4" /></span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider block mt-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('pendingRequests')}</span>
        </div>

        {/* Metric 4 */}
        <div className={`p-4 rounded-xl border transition-colors shadow-sm ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xl font-black font-mono text-emerald-500">{approvedRequests.length}</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><CheckCircle className="w-4 h-4" /></span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider block mt-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('approvedRequests')}</span>
        </div>

        {/* Metric 5 */}
        <div className={`p-4 rounded-xl border transition-colors shadow-sm ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xl font-black font-mono text-red-500">{rejectedRequests.length}</span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500"><AlertTriangle className="w-4 h-4" /></span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider block mt-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('rejectedRequests')}</span>
        </div>

        {/* Metric 7 */}
        <div className={`p-4 rounded-xl border transition-colors shadow-sm ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xl font-black font-mono">${salaryAdvanceRequests.reduce((acc, r) => acc + (r.details.requested_amount || 0), 0)}</span>
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500"><Layers className="w-4 h-4" /></span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider block mt-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('salaryAdvanceStats')}</span>
        </div>
      </div>

      {/* 2. Charts Visualization Panel */}
      <DashboardCharts employees={employees} requests={requests} isDarkMode={isDarkMode} />

      {/* 3. Navigation Controls */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto whitespace-nowrap scrollbar-thin">
        {[
          { id: 'requests', label: t('tabRequests'), unread: unreadHrNotifications.length },
          { id: 'employees', label: t('tabEmployees') },
          { id: 'logs', label: t('tabLogs') }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'requests') {
                onMarkNotificationsRead('hr');
              }
            }}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-red-600 text-red-600 dark:text-red-500'
                : 'border-transparent text-gray-500 hover:text-gray-850 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.unread && tab.unread > 0 ? (
              <span className="bg-red-600 text-white text-[10px] font-black font-mono w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                {tab.unread}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* 4. Active Tab Content Panel */}
      <div className={`p-6 rounded-xl border transition-colors shadow-sm ${
        isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'
      }`}>
        {activeTab === 'requests' && (
          // --- TAB: REQUESTS MANAGEMENT ---
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold">{t('tabRequests')}</h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'اعتماد أو رفض طلبات خدمات الموظفين ومراجعة التفاصيل' : 'Approve, decline, or process incoming workplace requests.'}
                </p>
              </div>

              {/* Advanced Request Filters */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={requestFilterType}
                  onChange={(e) => setRequestFilterType(e.target.value)}
                  className="bg-transparent border rounded-lg text-xs p-2 focus:ring-1 focus:ring-red-600 focus:outline-none dark:border-gray-800"
                >
                  <option value="all" className="dark:bg-gray-900">{t('filterAll')}</option>
                  <option value="salary_advance" className="dark:bg-gray-900">{t('salary_advance')}</option>
                  <option value="salary_certificate" className="dark:bg-gray-900">{t('salary_certificate')}</option>
                  <option value="uniform_size" className="dark:bg-gray-900">{t('uniform_size')}</option>
                </select>

                <select
                  value={requestFilterStatus}
                  onChange={(e) => setRequestFilterStatus(e.target.value)}
                  className="bg-transparent border rounded-lg text-xs p-2 focus:ring-1 focus:ring-red-600 focus:outline-none dark:border-gray-800"
                >
                  <option value="all" className="dark:bg-gray-900">{t('filterStatus')}</option>
                  <option value="pending" className="dark:bg-gray-900">{t('pending')}</option>
                  <option value="approved" className="dark:bg-gray-900">{t('approved')}</option>
                  <option value="rejected" className="dark:bg-gray-900">{t('rejected')}</option>
                </select>

                {/* Sub-Ledger Exports */}
                <button
                  onClick={() => exportFileCollectionToExcel('advances')}
                  className="p-2 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/80 border dark:border-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Advances CSV
                </button>

              </div>
            </div>

            {filteredRequestsList.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl dark:border-gray-800 text-gray-500 text-sm">
                <p>{t('noData')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b dark:border-gray-800 text-gray-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-semibold">{isRtl ? 'الموظف' : 'Employee'}</th>
                      <th className="py-3 px-4 font-semibold">{t('createdAt')}</th>
                      <th className="py-3 px-4 font-semibold">{isRtl ? 'نوع الطلب' : 'Request Type'}</th>
                      <th className="py-3 px-4 font-semibold">{isRtl ? 'تفاصيل الطلب' : 'Specs / Details'}</th>
                      <th className="py-3 px-4 font-semibold">{t('status')}</th>
                      <th className="py-3 px-4 font-semibold text-right">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                    {filteredRequestsList.map((req) => {
                      const emp = employees.find(e => e.id === req.employee_id);
                      return (
                        <tr key={req.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <p className="font-semibold">{isRtl ? emp?.name_ar : emp?.name}</p>
                              <span className="text-[10px] font-mono text-gray-500">{emp?.employee_code} • {isRtl ? emp?.department_ar : emp?.department}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-red-600 dark:text-red-500">
                            {t(req.request_type)}
                          </td>
                          <td className="py-3 px-4 max-w-md">
                            <div className="space-y-1">
                              {req.request_type === 'salary_advance' && (
                                <span>Advance: <strong className="text-red-500">${req.details.requested_amount}</strong> - {req.details.reason}</span>
                              )}
                              {req.request_type === 'leave' && (
                                <span>Annual Leave From: {req.details.start_date} To {req.details.end_date} - {req.details.reason}</span>
                              )}
                              {req.request_type === 'sick_leave' && (
                                <span>Sick Leave From: {req.details.start_date} To {req.details.end_date}</span>
                              )}
                              {req.request_type === 'uniform_size' && (
                                <span>Suit: {req.details.suit_size || 'N/A'}{req.details.shirt_size ? `, Shirt: ${req.details.shirt_size}, Pants: ${req.details.pants_size}, Shoe: ${req.details.shoe_size}` : ''} {(req.details.height || req.details.weight) ? `(H: ${req.details.height}cm / W: ${req.details.weight}kg)` : ''}</span>
                              )}
                              {req.request_type === 'personal_data_update' && (
                                <span className="block p-1 bg-red-500/5 border border-red-500/10 rounded">
                                  <strong>New Details Request:</strong> Mobile: {req.details.mobile}, Email: {req.details.email}, Address: {req.details.address}
                                </span>
                              )}
                              {req.request_type === 'suggestion' && (
                                <span>Category: <strong>{req.details.category}</strong> • Subject: <strong>{req.details.subject}</strong> - {req.details.details}</span>
                              )}
                              {req.request_type === 'prescription' && (
                                <span>Clinic: {req.details.clinic_name} ({req.details.visit_date})</span>
                              )}
                              {req.request_type === 'medical_report' && (
                                <span>Medical Provider: {req.details.medical_provider} (Recommended Leave: {req.details.recommended_rest_days} days)</span>
                              )}
                              {req.request_type === 'salary_certificate' && (
                                <span>Generate: {req.details.notes}</span>
                              )}
                              {req.attachmentName && (
                                <span className="block text-[10px] text-gray-500 font-mono mt-1">📎 Attachment: {req.attachmentName}</span>
                              )}
                            </div>
                            {req.admin_notes && (
                              <p className="mt-1 p-1 bg-neutral-100 dark:bg-zinc-800 text-[10px] rounded text-gray-500">
                                <strong>Notes:</strong> {req.admin_notes}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                                : req.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                            }`}>
                              {t(req.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {req.status === 'pending' ? (
                              <button
                                onClick={() => handleOpenActionModal(req)}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium p-1.5 px-3 rounded-lg text-[10px] transition"
                              >
                                {isRtl ? 'اتخاذ إجراء' : 'Review & Act'}
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-500 font-mono">Completed</span>
                            )}
                            {req.attachmentData && (
                              <button
                                onClick={() => setPreviewAttachment({ name: req.attachmentName || 'attachment', data: req.attachmentData! })}
                                className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-650 hover:underline text-[10.5px] transition ml-2 font-mono font-bold cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {isRtl ? 'عرض وتحميل' : 'View & Download'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'employees' && (
          // --- TAB: WORKFORCE EMPLOYEES DATABASE ---
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold">{t('tabEmployees')}</h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'إضافة أو تعديل الموظفين، استيراد وتصدير قاعدة البيانات' : 'Register new hires, modify profiles, import from spreadsheets, or pull backups.'}
                </p>
              </div>

              {/* Action Deck */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={handleOpenAddEmployee}
                  className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {t('addEmployeeBtn')}
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="p-2.5 bg-gray-950 dark:bg-black border border-red-600 hover:bg-neutral-900 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  {t('importExcel')}
                </button>
                <button
                  onClick={() => exportFileCollectionToExcel('employees')}
                  className="p-2.5 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/80 border dark:border-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  {t('exportExcel')}
                </button>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-transparent border rounded-lg text-sm p-2.5 pl-10 outline-none focus:border-red-600 dark:border-gray-800"
              />
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl dark:border-gray-800 text-gray-500 text-sm">
                <p>{t('noData')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto" dir="rtl">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b dark:border-gray-800 text-gray-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-bold text-right text-xs">الكود</th>
                      <th className="py-3 px-4 font-bold text-right text-xs">{isRtl ? 'الاسم' : 'Name'}</th>
                      <th className="py-3 px-4 font-bold text-right text-xs">{isRtl ? 'القسم' : 'Department'}</th>
                      <th className="py-3 px-4 font-bold text-left text-xs">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-red-600 dark:text-red-500 text-right text-sm">
                          {emp.employee_code}
                        </td>
                        <td className="py-3 px-4 text-right text-sm">
                          {(emp.name_ar || emp.name) ? (
                            <>
                              <p className="text-gray-950 dark:text-white font-black">{emp.name_ar || emp.name}</p>
                              {emp.name_ar && emp.name_ar !== emp.name && (
                                <span className="text-[10px] text-gray-500 font-normal block font-mono">{emp.name}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic block font-medium">الاسم مش مكتوب</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold">
                          <p className="text-gray-700 dark:text-gray-300">
                            {emp.department_ar || emp.department}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-left">
                          <div className="flex justify-start gap-1.5 flex-row-reverse">
                            <button
                              onClick={() => handleOpenEditEmployee(emp)}
                              className="p-1.5 px-2.5 border dark:border-gray-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-350 rounded-lg transition"
                              title={isRtl ? 'تعديل' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const displayName = emp.name_ar || emp.name || (isRtl ? `صاحب الكود ${emp.employee_code}` : `Code ${emp.employee_code}`);
                                if (confirm(isRtl ? `هل أنت متأكد من حذف الموظف ${displayName}؟` : `Are you sure you want to remove ${displayName}?`)) {
                                  onDeleteEmployee(emp.id);
                                }
                              }}
                              className="p-1.5 px-2.5 border dark:border-gray-800 hover:border-red-850 hover:bg-red-500/5 text-red-500 rounded-lg transition"
                              title={isRtl ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}



        {activeTab === 'logs' && (
          // --- TAB: AUDIT TRAILS ---
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-lg font-bold">{t('auditTrail')}</h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'عمليات رصد وتدقيق الأنشطة لجميع العمليات الإدارية على البوابة' : 'Secure platform activity tracking for accountability compliance.'}
                </p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-500 text-xs font-semibold p-1 px-3 border border-emerald-500/20 rounded-xl flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Audit Active
              </span>
            </div>

            <div className="divide-y divide-gray-150 dark:divide-gray-850 font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="py-3 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className={`inline-block px-1.5 py-0.5 text-[9px] rounded-sm font-bold ${
                      log.user_type === 'admin' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                    }`}>
                      {log.user_type.toUpperCase()}
                    </span>
                    <strong className="ml-1.5">{log.user_name}</strong>
                    <span className="text-neutral-500 dark:text-neutral-400 block sm:inline sm:ml-2">
                      → {isRtl ? log.action_ar : log.action}
                    </span>
                  </div>
                  <span className="text-gray-450 shrink-0 text-[10px]">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL: REQUEST ACTION PROCESSOR --- */}
      <AnimatePresence>
        {showRequestActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg p-6 rounded-xl border shadow-2xl relative ${
                isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <button 
                onClick={() => setShowRequestActionModal(null)}
                className="absolute top-4 right-4 text-gray-450 hover:text-red-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h4 className="text-md font-bold mb-2">Review Pending HR Service Order</h4>
              
              <div className="p-3.5 bg-neutral-100 dark:bg-zinc-850 rounded-lg text-xs space-y-2 mb-4 leading-relaxed">
                <p><strong>Employee:</strong> {employees.find(e => e.id === showRequestActionModal.employee_id)?.name_ar || employees.find(e => e.id === showRequestActionModal.employee_id)?.name}</p>
                <p><strong>Service Requested:</strong> <span className="font-semibold text-red-500">{t(showRequestActionModal.request_type)}</span></p>
                {showRequestActionModal.request_type === 'uniform_size' ? (
                  <p><strong>Uniform Details:</strong> Suit: {showRequestActionModal.details.suit_size || 'N/A'}{showRequestActionModal.details.shirt_size ? `, Shirt: ${showRequestActionModal.details.shirt_size}, Pants: ${showRequestActionModal.details.pants_size}, Shoe: ${showRequestActionModal.details.shoe_size}` : ''} {(showRequestActionModal.details.height || showRequestActionModal.details.weight) ? `(H: ${showRequestActionModal.details.height}cm, W: ${showRequestActionModal.details.weight}kg)` : ''}</p>
                ) : (
                  <>
                    <p><strong>Requested Amount:</strong> {showRequestActionModal.details.requested_amount ? `$${showRequestActionModal.details.requested_amount}` : 'N/A'}</p>
                    <p><strong>Content / Reason:</strong> {showRequestActionModal.details.reason || showRequestActionModal.details.details || 'General Statement provided'}</p>
                  </>
                )}
                {showRequestActionModal.details.start_date && (
                  <p><strong>Leave Window:</strong> {showRequestActionModal.details.start_date} to {showRequestActionModal.details.end_date}</p>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-xs font-semibold block">{t('adminNotes')}</label>
                <textarea
                  value={adminActionNotes}
                  onChange={(e) => setAdminActionNotes(e.target.value)}
                  placeholder="e.g., Request approved, budget successfully verified."
                  rows={2}
                  className="w-full bg-transparent border rounded-lg text-xs p-2 focus:ring-1 focus:outline-none dark:border-gray-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleActionRequestChange('rejected')}
                  className="px-4 py-2 hover:bg-red-500/15 text-red-500 border border-red-500/20 text-xs font-semibold rounded-lg transition"
                >
                  {t('rejectBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => handleActionRequestChange('approved')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition"
                >
                  {t('approveBtn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: ADD / EDIT EMPLOYEE --- */}
      <AnimatePresence>
        {showEmployeeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-xl border shadow-2xl relative ${
                isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-250 text-gray-900'
              }`}
            >
              <button 
                onClick={() => setShowEmployeeModal(false)}
                className="absolute top-4 left-4 text-gray-450 hover:text-red-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h4 className="text-lg font-black mb-4 text-right">
                {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h4>
              
              <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs text-right">
                
                <div className="space-y-1.5">
                  <label className="font-bold block text-gray-700 dark:text-stone-300">كود الموظف (Code) *</label>
                  <input
                    type="text"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    required
                    placeholder="مثال: 1001"
                    className="w-full bg-transparent border rounded-lg p-2.5 outline-none focus:border-red-650 dark:border-gray-800 font-mono text-left"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold block text-gray-700 dark:text-stone-300">الاسم الكامل (Name) *</label>
                  <input
                    type="text"
                    value={empName}
                    onChange={(e) => {
                      setEmpName(e.target.value);
                      if (!editingEmployee) setEmpNameAr(e.target.value);
                    }}
                    required
                    placeholder="أدخل الاسم الرباعي للموظف"
                    className="w-full bg-transparent border rounded-lg p-2.5 outline-none focus:border-red-650 dark:border-gray-800 text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold block text-gray-700 dark:text-stone-300">القسم (Department)</label>
                  <select
                    value={empDept}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmpDept(val);
                      setIsCustomDept(val === 'Custom / Other');
                      const matched = departmentsList.find(d => d.en === val);
                      if (matched) {
                        setEmpDeptAr(matched.ar);
                      }
                    }}
                    className="w-full bg-transparent border rounded-lg p-2.5 outline-none focus:border-red-650 dark:border-gray-800 dark:bg-gray-950 font-bold"
                  >
                    {departmentsList.map(d => (
                      <option key={d.en} value={d.en} className="dark:bg-gray-900">
                        {d.ar} ({d.en})
                      </option>
                    ))}
                  </select>
                </div>

                {isCustomDept && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-red-500/5 dark:bg-red-500/5 border border-red-500/10 rounded-lg">
                    <div className="space-y-1">
                      <label className="font-bold block text-gray-700 dark:text-stone-300">اسم القسم المخصص (عربي)</label>
                      <input
                        type="text"
                        value={customDeptAr}
                        onChange={(e) => setCustomDeptAr(e.target.value)}
                        required
                        placeholder="مثال: قسم الأمن"
                        className="w-full bg-transparent border rounded-lg p-2 outline-none focus:border-red-650 dark:border-gray-800 text-right font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold block text-gray-750 dark:text-stone-300">Dept Name (English)</label>
                      <input
                        type="text"
                        value={customDeptEn}
                        onChange={(e) => setCustomDeptEn(e.target.value)}
                        required
                        placeholder="e.g. Security Dept"
                        className="w-full bg-transparent border rounded-lg p-2 outline-none focus:border-red-650 dark:border-gray-800 text-left font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold block text-gray-700 dark:text-stone-300">الراتب الشهري الأساسي (Salary in EGP)</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(e.target.value)}
                    required
                    placeholder="مثال: 10000"
                    className="w-full bg-transparent border rounded-lg p-2.5 outline-none focus:border-red-650 dark:border-gray-800 font-mono text-left"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-dashed dark:border-gray-850">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeModal(false)}
                    className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded-lg transition border dark:border-gray-800 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-750 text-white rounded-lg font-bold shadow transition"
                  >
                    حفظ البيانات
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: IMPORT SPREADSHEET / CSV WORKFORCE --- */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-xl p-6 rounded-xl border shadow-2xl relative ${
                isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-250 text-gray-900'
              }`}
            >
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setCsvContentText('');
                  setParsedEmployees([]);
                }}
                className="absolute top-4 left-4 text-gray-450 hover:text-red-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h4 className="text-xl font-black text-right mb-1">استيراد الموظفين</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right mb-4">
                قم برفع ملف Excel/CSV المباشر أو انسخ الأعمدة والصفوف مباشرة من جدول البيانات الخاص بك.
              </p>

              {/* Required Format Legend */}
              <div className="mb-4 p-3 bg-neutral-105 dark:bg-zinc-850 rounded-lg text-xs leading-relaxed text-right border dark:border-zinc-800">
                <span className="font-bold text-red-650 dark:text-red-400 block mb-1">صيغة الملف المطلوبة:</span>
                <div className="grid grid-cols-3 gap-2 text-center font-bold bg-neutral-200 dark:bg-zinc-800 p-1.5 rounded mb-2 font-mono text-[10px]">
                  <div>الكود (Code)</div>
                  <div>الاسم (Name)</div>
                  <div>القسم (Department) <span className="text-[9px] text-gray-500 font-normal">(اختياري)</span></div>
                </div>
                <div className="text-[10px] text-gray-500 text-right">
                  يجب أن يحتوي الملف على عمود الكود وعمود الاسم كحد أدنى. (يمكنك محاكاة ذلك بالضغط على تفريغ ملف تجريبي بالأسفل).
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => csvFileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-red-500 bg-red-500/5' 
                    : isDarkMode 
                      ? 'border-gray-800 hover:border-red-650 bg-gray-950/40' 
                      : 'border-gray-250 hover:border-red-500 bg-neutral-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={csvFileRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden" 
                  accept=".xlsx,.xls,.csv,.tsv,.txt"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-red-500/10 text-red-650 dark:text-red-400 rounded-full">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">اسحب ملف Excel أو CSV هنا أو اضغط للاختيار</p>
                  <p className="text-[10px] text-gray-400">يدعم رفع صيغ Excel (.xlsx, .xls) أو ملفات النصية CSV المقسمة بالكامل</p>
                </div>
              </div>

              {/* Paste Text / Clipboard Backup Box */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={loadSampleCSVString}
                    className="text-red-600 dark:text-red-400 font-bold hover:underline"
                  >
                    💡 تعبئة ببيانات تجريبية (4 موظفين)
                  </button>
                  <span className="font-semibold text-gray-550">أو الصق محتوى الجدول هنا مباشرة:</span>
                </div>
                
                <textarea
                  value={csvContentText}
                  onChange={(e) => handleTextChangeAndParse(e.target.value)}
                  placeholder="1001	أحمد محمد	IT&#10;1002	محمد علي	HR"
                  rows={4}
                  className="w-full bg-transparent border rounded-lg p-2.5 focus:ring-1 focus:ring-red-600 outline-none dark:border-gray-800 font-mono text-xs text-right"
                />
              </div>

              {/* Parse feedback indicator */}
              {parsedEmployees.length > 0 && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-lg text-center font-bold text-xs flex items-center justify-center gap-2" dir="rtl">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>تم العثور على {parsedEmployees.length} موظف</span>
                </div>
              )}

              {/* Form Buttons */}
              <form onSubmit={handleCSVImportSubmit} className="mt-6 flex justify-end gap-3 border-t border-dashed dark:border-gray-850 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvContentText('');
                    setParsedEmployees([]);
                  }}
                  className="px-4 py-2 hover:bg-neutral-150 dark:hover:bg-neutral-800/80 rounded-lg transition border dark:border-gray-800 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={parsedEmployees.length === 0}
                  className={`px-6 py-2 rounded-lg font-bold shadow text-xs transition flex items-center gap-1.5 ${
                    parsedEmployees.length > 0
                      ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer hover:shadow-lg'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  ✅ استيراد الموظفين
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {previewAttachment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setPreviewAttachment(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border dark:border-zinc-805 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-right"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-950/40 border-b border-gray-150 dark:border-zinc-800 flex items-center justify-between">
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1 px-2.5 hover:bg-gray-150 dark:hover:bg-zinc-800 rounded-lg text-gray-550 hover:text-red-500 transition-all font-bold text-sm"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-gray-900 dark:text-white truncate max-w-[300px]">
                    {previewAttachment.name}
                  </span>
                  <span className="text-base text-red-500">📎</span>
                </div>
              </div>

              {/* Content / Preview */}
              <div className="p-6">
                {previewAttachment.data.startsWith('data:image/') ? (
                  <div className="flex justify-center max-h-[50vh] overflow-auto p-4 bg-gray-100 dark:bg-zinc-950/60 rounded-xl border dark:border-zinc-800/50">
                    <img
                      src={previewAttachment.data}
                      alt={previewAttachment.name}
                      className="max-w-full h-auto object-contain rounded-xl shadow-md border dark:border-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-gray-100 dark:bg-zinc-950/60 rounded-xl border dark:border-zinc-800/50 space-y-4">
                    <FileText className="w-16 h-16 text-red-500/80" />
                    <div className="text-center">
                      <p className="text-sm font-black text-gray-900 dark:text-white font-mono">{previewAttachment.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">مستند PDF أو ملف معتمد</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-950/40 border-t border-gray-150 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="px-4 py-2 hover:bg-gray-250 dark:hover:bg-zinc-855 text-gray-700 dark:text-zinc-300 rounded-lg transition text-xs font-bold"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => downloadAttachment(previewAttachment.data, previewAttachment.name)}
                  className="px-5 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg font-bold shadow text-xs transition flex items-center justify-center gap-1.5 hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الملف</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
