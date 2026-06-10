export interface Employee {
  id: string;
  employee_code: string;
  name: string;
  name_ar?: string;
  department?: string;
  department_ar?: string;
  job_title?: string;
  job_title_ar?: string;
  mobile?: string;
  email?: string;
  address?: string;
  address_ar?: string;
  salary?: number;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'hr';
}

export type RequestType =
  | 'salary_advance'
  | 'salary_certificate'
  | 'uniform_size'
  | 'leave'
  | 'sick_leave'
  | 'prescription'
  | 'medical_report'
  | 'suggestion'
  | 'personal_data_update';

export interface RequestDetails {
  // Salary Advance
  requested_amount?: number;
  reason?: string;
  
  // Uniform Sizes
  shirt_size?: string;
  pants_size?: string;
  shoe_size?: string;
  suit_size?: string;
  height?: number;
  weight?: number;
  
  // Leaves
  start_date?: string;
  end_date?: string;
  
  // Medical common
  clinic_name?: string;
  visit_date?: string;
  medical_provider?: string;
  report_date?: string;
  recommended_rest_days?: number;
  
  // Complaints / Suggestions
  category?: string;
  subject?: string;
  details?: string;
  
  // Personal Data Update
  mobile?: string;
  address?: string;
  email?: string;
  notes?: string;
}

export interface RequestRecord {
  id: string;
  employee_id: string;
  request_type: RequestType;
  details: RequestDetails;
  attachmentName?: string;
  attachmentData?: string; // base64 string
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  employee_id: string;
  type: 'prescription' | 'report' | 'sick_leave';
  file_url?: string;
  file_data?: string; // base64 representation
  file_name?: string;
  provider_or_clinic: string;
  date: string;
  rest_days?: number;
  notes: string;
  created_at: string;
}

export interface UniformSize {
  id: string;
  employee_id: string;
  shirt_size?: string;
  pants_size?: string;
  shoe_size?: string;
  suit_size?: string;
  height?: number;
  weight?: number;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string; // 'hr' or employee_id
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_name: string;
  user_type: 'employee' | 'admin';
  action: string;
  action_ar: string;
  created_at: string;
}
