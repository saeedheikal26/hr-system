import React, { useState, useRef } from 'react';
import { useLanguage } from './LanguageContext';
import { Employee, RequestRecord, RequestType, Notification } from '../types';
import { 
  DollarSign, FileText, Calendar, HeartPulse, ShieldAlert,
  Shirt, History, Check, Eye, Trash, Upload, Download, Award, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeePortalProps {
  employee: Employee;
  requests: RequestRecord[];
  notifications: Notification[];
  onSubmitRequest: (requestType: RequestType, details: any, attachment?: { name: string; data: string }) => void;
  onMarkNotificationsRead: (userId: string) => void;
  isDarkMode: boolean;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  employee,
  requests,
  notifications,
  onSubmitRequest,
  onMarkNotificationsRead,
  isDarkMode
}) => {
  const { isRtl } = useLanguage();
  const [activeForm, setActiveForm] = useState<RequestType | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
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

  // Form input states
  const [advanceValue, setAdvanceValue] = useState('');
  const [advanceNotes, setAdvanceNotes] = useState('');

  React.useEffect(() => {
    if (activeForm === 'salary_advance') {
      const baseSalary = employee.salary || 10000;
      setAdvanceValue(String(baseSalary / 2));
      setAdvanceNotes('سلفة نصف الراتب - صرف السلفة يوم 15 من الشهر');
    }
  }, [activeForm, employee.salary]);

  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const [medicalNotes, setMedicalNotes] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  const [payslipNotes, setPayslipNotes] = useState('');

  // Suit / Uniform sizes
  const [suitShirtSize, setSuitShirtSize] = useState('L');
  const [suitPantsSize, setSuitPantsSize] = useState('34');
  const [suitShoeSize, setSuitShoeSize] = useState('42');
  const [suitSuitSize, setSuitSuitSize] = useState('50');

  // Attachment states
  const [attachment, setAttachment] = useState<{ name: string; data: string } | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myRequests = requests.filter(r => r.employee_id === employee.id);

  // File processors
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("الحد الأقصى للملف 10 ميجابايت");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        data: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setAdvanceValue('');
    setAdvanceNotes('');
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReason('');
    setMedicalNotes('');
    setPrescriptionNotes('');
    setPayslipNotes('');
    setAttachment(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;

    let details: any = {};
    if (activeForm === 'salary_advance') {
      if (!advanceValue) {
        alert("يرجى إدخال قيمة السلفة");
        return;
      }
      details = { requested_amount: parseFloat(advanceValue), reason: advanceNotes };
    } else if (activeForm === 'leave') {
      if (!leaveFrom || !leaveTo || !leaveReason) {
        alert("يرجى ملء جميع الحقول المطلوبة للإجازة");
        return;
      }
      details = { start_date: leaveFrom, end_date: leaveTo, reason: leaveReason };
    } else if (activeForm === 'medical_report') {
      details = { notes: medicalNotes, medical_provider: 'Cairo Medical City', report_date: new Date().toISOString().split('T')[0], recommended_rest_days: 3 };
    } else if (activeForm === 'prescription') {
      details = { notes: prescriptionNotes, clinic_name: 'Cairo Clinic', visit_date: new Date().toISOString().split('T')[0] };
    } else if (activeForm === 'salary_certificate') {
      details = { notes: payslipNotes || 'طلب مفردات مرتب معتمد للموظف' };
    } else if (activeForm === 'uniform_size') {
      details = { suit_size: suitSuitSize };
    }

    onSubmitRequest(activeForm, details, attachment || undefined);
    resetForm();
    setActiveForm(null);
  };

  const getFormTitle = (type: RequestType) => {
    switch (type) {
      case 'salary_advance': return '💰 نموذج طلب سلفة';
      case 'salary_certificate': return '📄 نموذج طلب مفردات مرتب';
      case 'leave': return '📝 نموذج طلب إجازة';
      case 'medical_report': return '🏥 نموذج رفع تقرير طبي';
      case 'prescription': return '💊 نموذج رفع روشتة طبية';
      case 'uniform_size': return '👔 نموذج تسجيل مقاس البدل';
      default: return 'تقديم طلب خدمات الموظفين';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      {/* Profile Header */}
      <div className={`p-6 rounded-2xl border transition-colors shadow-lg ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-150'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white leading-tight">
              مرحبًا {employee.name_ar || employee.name}
            </h2>
            {employee.department && (
              <p className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <span>🏢</span>
                <span>{employee.department_ar || employee.department}</span>
              </p>
            )}
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              كود الموظف: <span className="font-mono font-bold text-red-600 dark:text-red-400">{employee.employee_code}</span>
            </p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-md border border-neutral-800"
          >
            <History className="w-4 h-4 ml-1" />
            <span>طلب سابق ({myRequests.length})</span>
          </button>
        </div>
      </div>

      {/* Services Grid (6 Big and Clear Cards) */}
      {!activeForm && !showHistory && (
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-widest font-black text-gray-500 dark:text-gray-400 mr-1">
            الخدمات الإلكترونية الذاتية
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { key: 'salary_advance', label: '💰 طلب سلفة', desc: 'تقديم طلب سلفة مالية عاجلة ومرنة من راتبك الشهرى' },
              { key: 'salary_certificate', label: '📄 طلب مفردات مرتب', desc: 'استخراج شهادة معتمدة بمفردات المرتب باللغتين العربية والإنجليزية' },
              { key: 'prescription', label: '💊 رفع روشتة طبية', desc: 'إرسال الروشتات العلاجية ومستندات الأدوية من أجل اعتماد الصرف المالي' }
            ].map((serv) => (
              <button
                key={serv.key}
                onClick={() => {
                  setActiveForm(serv.key as RequestType);
                  resetForm();
                }}
                className={`flex flex-col text-right p-6 rounded-2xl border transition-all duration-200 cursor-pointer shadow hover:shadow-md hover:-translate-y-1 ${
                  isDarkMode 
                    ? 'bg-zinc-900 border-zinc-800 hover:border-red-600/50 hover:bg-zinc-900/80 shadow-black/20' 
                    : 'bg-white border-zinc-150 hover:border-red-500/40 hover:bg-zinc-50 shadow-gray-200/50'
                }`}
              >
                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                  {serv.label}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                  {serv.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Form View */}
      {activeForm && (
        <div className={`p-6 rounded-2xl border transition-colors shadow-lg ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-150'
        }`}>
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-dashed dark:border-zinc-800 border-zinc-150">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              {getFormTitle(activeForm)}
            </h3>
            <button
              onClick={() => {
                setActiveForm(null);
                resetForm();
              }}
              className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
            >
              إغلاق النموذج ✕
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {activeForm === 'salary_advance' && (
              <div className="space-y-5">
                <div className="p-4 bg-red-500/5 text-red-600 border border-red-500/10 rounded-xl text-sm font-semibold flex items-start gap-2.5">
                  <span className="text-base">📅</span>
                  <div>
                    <span className="block font-black text-gray-900 dark:text-white mb-0.5">موعد صرف السلفة</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-bold">
                      سيتم مراجعة الطلب وصرف السلفة حصراً يوم <span className="text-red-600 dark:text-red-400 font-mono text-sm font-black">15</span> من الشهر الجاري تلقائياً ومزامنتها بنظام الأجور والرواتب بمجرد اعتمادها.
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">
                      قيمة السلفة المطلوبة
                    </label>
                    <select
                      className="w-full bg-transparent border rounded-xl text-sm p-3 outline-none focus:border-red-600 dark:border-zinc-800 font-bold dark:bg-zinc-900 text-gray-900 dark:text-white"
                      value={advanceValue}
                      onChange={(e) => setAdvanceValue(e.target.value)}
                    >
                      <option value={String((employee.salary || 10000) / 2)} className="dark:bg-zinc-900 text-gray-900 dark:text-white">
                        قيمة السلفة (نصف الراتب)  
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeForm === 'leave' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">
                      من تاريخ
                    </label>
                    <input
                      type="date"
                      value={leaveFrom}
                      onChange={(e) => setLeaveFrom(e.target.value)}
                      required
                      className="w-full bg-transparent border rounded-xl text-sm p-3 outline-none focus:border-red-600 dark:border-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">
                      إلى تاريخ
                    </label>
                    <input
                      type="date"
                      value={leaveTo}
                      onChange={(e) => setLeaveTo(e.target.value)}
                      required
                      className="w-full bg-transparent border rounded-xl text-sm p-3 outline-none focus:border-red-600 dark:border-zinc-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">
                    السبب
                  </label>
                  <input
                    type="text"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="سبب تقديم طلب الإجازة"
                    required
                    className="w-full bg-transparent border rounded-xl text-sm p-3 outline-none focus:border-red-600 dark:border-zinc-800"
                  />
                </div>
              </div>
            )}

            {activeForm === 'salary_certificate' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-550/5 text-red-600 border border-red-500/10 rounded-xl text-xs font-medium">
                  ملاحظة: طلب شهادة مفردات مرتب سيقيد فوراً لمراجعة الموارد البشرية لطباعتها وتوقيعها رقمیًا.
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">
                    ملاحظات للـ HR (اختياري)
                  </label>
                  <input
                    type="text"
                    value={payslipNotes}
                    onChange={(e) => setPayslipNotes(e.target.value)}
                    placeholder="مثال: يرجى توجيه الخطاب لبنك مصر"
                    className="w-full bg-transparent border rounded-xl text-sm p-3 outline-none focus:border-red-600 dark:border-zinc-800"
                  />
                </div>
              </div>
            )}

            {activeForm === 'medical_report' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">
                    ملاحظات التقرير الطبي
                  </label>
                  <input
                    type="text"
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="مثال: مرض مرئ فحص بكتيرى مبرمج"
                    className="w-full bg-transparent border rounded-xl text-sm p-3 outline-none focus:border-red-600 dark:border-zinc-800"
                  />
                </div>

                {/* File Upload Box */}
                <div className="space-y-2">
                  <label className="text-xs font-bold block text-gray-500 dark:text-gray-400">رفع الملف</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
                      dragActive 
                        ? 'border-red-600 bg-red-600/5' 
                        : isDarkMode 
                          ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/20' 
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {attachment ? (
                      <div className="flex items-center justify-between p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg max-w-md mx-auto">
                        <span className="text-xs font-mono font-bold truncate max-w-[200px]">{attachment.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachment(null);
                          }}
                          className="text-red-500 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                        >
                          حذف الملف ✕
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs font-black">اسحب وأفلت الملف الطبي هنا، أو اضغط للتصفح</p>
                        <p className="text-[10px] text-gray-400">يدعم PDF أو الصور (JPG, PNG) بحد أقصى 10 ميجا</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeForm === 'prescription' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">
                    ملاحظات أو تفاصيل الادوية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    placeholder="مثال: روشتة علاج عظام"
                    className="w-full bg-transparent border rounded-xl text-sm p-3 outline-none focus:border-red-600 dark:border-zinc-800"
                  />
                </div>

                {/* File Upload Box */}
                <div className="space-y-2">
                  <label className="text-xs font-bold block text-gray-500 dark:text-gray-400">رفع صورة أو PDF</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
                      dragActive 
                        ? 'border-red-600 bg-red-600/5' 
                        : isDarkMode 
                          ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/20' 
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {attachment ? (
                      <div className="flex items-center justify-between p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg max-w-md mx-auto">
                        <span className="text-xs font-mono font-bold truncate max-w-[200px]">{attachment.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachment(null);
                          }}
                          className="text-red-500 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                        >
                          حذف الملف ✕
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs font-black">اسحب وأفلت الروشتة هنا، أو اضغط للتصفح</p>
                        <p className="text-[10px] text-gray-405">يتلقى النظام الصور والوثائق كمرجع صيدلاني مباشر</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeForm === 'uniform_size' && (
              <div className="space-y-4">
                <div id="uniform-sizes-container flex flex-col" className="max-w-xs">
                  <div>
                    <label id="lbl-suit-size" className="text-xs font-bold block mb-1.5 text-gray-500">مقاس البدلة</label>
                    <select
                      id="sel-suit-size"
                      value={suitSuitSize}
                      onChange={(e) => setSuitSuitSize(e.target.value)}
                      className="w-full bg-transparent border rounded-xl text-sm p-3 outline-none dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      {['46', '48', '50', '52', '54', '56', '58', '60'].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action Block */}
            <div className="flex justify-end gap-3 pt-4 border-t border-dashed dark:border-zinc-800 border-zinc-150">
              <button
                type="button"
                onClick={() => {
                  setActiveForm(null);
                  resetForm();
                }}
                className="px-5 py-2.5 text-xs font-bold border dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs bg-red-650 hover:bg-red-700 text-white rounded-xl font-bold shadow-md transition duration-155 flex items-center justify-center gap-1 bg-red-600"
              >
                <span>🔴 إرسال الطلب</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests History Screen */}
      {showHistory && (
        <div className={`p-6 rounded-2xl border transition-colors shadow-lg ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-150'
        }`}>
          <div className="flex justify-between items-center pb-4 mb-4 border-b dark:border-zinc-800 border-zinc-150">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              سجل الطلبات والخدمات السابقة
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs font-bold text-gray-500 hover:text-red-500"
            >
              الرجوع للخدمات ✕
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm font-semibold">
              لا توجد طلبات سابقة مسجلة.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b dark:border-zinc-800 border-zinc-200 text-gray-450 font-bold">
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">نوع الطلب</th>
                    <th className="py-3 px-4">التفاصيل والبيانات المدخلة</th>
                    <th className="py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                  {myRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        {new Date(req.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {req.request_type === 'salary_advance' && '💰 طلب سلفة'}
                        {req.request_type === 'salary_certificate' && '📄 طلب مفردات مرتب'}
                        {req.request_type === 'leave' && '📝 طلب إجازة'}
                        {req.request_type === 'medical_report' && '🏥 تقرير طبي'}
                        {req.request_type === 'prescription' && '💊 روشتة طبية'}
                        {req.request_type === 'uniform_size' && '👔 مقاسات الزي'}
                      </td>
                      <td className="py-3 px-4 max-w-sm leading-relaxed font-semibold">
                        {req.request_type === 'salary_advance' && (
                          <span>قيمة السلفة المطلوب: <span className="text-red-600 font-bold">{req.details.requested_amount} ج.م</span> {req.details.reason ? ` - ${req.details.reason}` : ''}</span>
                        )}
                        {req.request_type === 'leave' && (
                          <span>إجازة من {req.details.start_date} إلى {req.details.end_date} ({req.details.reason})</span>
                        )}
                        {req.request_type === 'uniform_size' && (
                          <span>بدلة: {req.details.suit_size || 'N/A'}{req.details.shirt_size ? ` / قميص: ${req.details.shirt_size} / بنطال: ${req.details.pants_size} / حذاء: ${req.details.shoe_size}` : ''}</span>
                        )}
                        {req.request_type === 'salary_certificate' && (
                          <span>{req.details.notes}</span>
                        )}
                        {req.request_type === 'medical_report' && (
                          <span>تقرير طبي: {req.details.notes || 'تم رفع التقرير لجهة العمل'}</span>
                        )}
                        {req.request_type === 'prescription' && (
                          <span>روشتة: {req.details.notes || 'تم تقديم الروشتة للمراجعة'}</span>
                        )}
                        {req.attachmentName && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-zinc-500 font-mono">📎 {req.attachmentName}</span>
                            {req.attachmentData && (
                              <button
                                onClick={() => setPreviewAttachment({ name: req.attachmentName, data: req.attachmentData! })}
                                className="inline-flex items-center gap-1 text-red-500 hover:text-red-650 hover:underline text-[9.5px] transition font-mono font-bold cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                {isRtl ? 'عرض وتحميل' : 'View & Download'}
                              </button>
                            )}
                          </div>
                        )}
                        {req.admin_notes && (
                          <div className="mt-1 p-2 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-650 border-r-2 border-red-500 font-medium">
                            رد الموارد البشرية: {req.admin_notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                        }`}>
                          {req.status === 'pending' && 'قيد الانتظار'}
                          {req.status === 'approved' && 'تمت الموافقة'}
                          {req.status === 'rejected' && 'تم الرفض'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Attachment Preview Modal */}
      <AnimatePresence>
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
                  className="p-1 px-2.5 hover:bg-gray-150 dark:hover:bg-zinc-800 rounded-lg text-gray-500 hover:text-red-500 transition-all font-bold text-sm"
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
