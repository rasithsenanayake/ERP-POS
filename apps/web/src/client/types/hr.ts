export type EmploymentType = 'full_time' | 'part_time' | 'contract';

export interface Employee {
  id: string;
  name: string;
  initials: string;
  title: string;
  department: 'Management' | 'Sales' | 'Warehouse' | 'Finance' | 'Support';
  branchId: string | null;
  type: EmploymentType;
  joinedAt: string;
  phone: string;
  /** Monthly basic salary, integer cents. */
  basicSalary: number;
  /** Monthly fixed allowances, integer cents. */
  allowances: number;
  leaveBalance: number;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'on_leave' | 'off';

export interface AttendanceRecord {
  employeeId: string;
  status: AttendanceStatus;
  clockIn: string | null;
  clockOut: string | null;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  kind: 'annual' | 'sick' | 'casual';
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
}