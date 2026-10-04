import type { AttendanceRecord, Employee, LeaveRequest } from '../types/hr';

export const employees: Employee[] = [
{ id: 'emp-nimali', name: 'Nimali Perera', initials: 'NP', title: 'Managing Director', department: 'Management', branchId: null, type: 'full_time', joinedAt: '2016-03-01', phone: '077 100 2201', basicSalary: 65000000, allowances: 10000000, leaveBalance: 14 },
{ id: 'emp-kasun', name: 'Kasun Jayawardena', initials: 'KJ', title: 'Branch Manager, Kandy', department: 'Management', branchId: 'br-kdy', type: 'full_time', joinedAt: '2019-07-15', phone: '077 220 4418', basicSalary: 28000000, allowances: 4000000, leaveBalance: 9 },
{ id: 'emp-tharushi', name: 'Tharushi Fernando', initials: 'TF', title: 'Sales Associate', department: 'Sales', branchId: 'br-col', type: 'full_time', joinedAt: '2023-02-01', phone: '077 305 1193', basicSalary: 9500000, allowances: 1500000, leaveBalance: 11 },
{ id: 'emp-ruwan', name: 'Ruwan Silva', initials: 'RS', title: 'Senior Sales Associate', department: 'Sales', branchId: 'br-col', type: 'full_time', joinedAt: '2020-11-09', phone: '077 412 7720', basicSalary: 13500000, allowances: 2000000, leaveBalance: 6 },
{ id: 'emp-dilshan', name: 'Dilshan Gunasekara', initials: 'DG', title: 'Sales Associate', department: 'Sales', branchId: 'br-kdy', type: 'full_time', joinedAt: '2024-01-08', phone: '071 556 0182', basicSalary: 9000000, allowances: 1500000, leaveBalance: 12 },
{ id: 'emp-sachini', name: 'Sachini Wickramasinghe', initials: 'SW', title: 'Store Lead, Galle', department: 'Sales', branchId: 'br-gal', type: 'full_time', joinedAt: '2021-05-17', phone: '077 661 3304', basicSalary: 16500000, allowances: 2500000, leaveBalance: 8 },
{ id: 'emp-ishara', name: 'Ishara Bandara', initials: 'IB', title: 'Warehouse Lead', department: 'Warehouse', branchId: null, type: 'full_time', joinedAt: '2018-09-03', phone: '077 780 9921', basicSalary: 14000000, allowances: 2000000, leaveBalance: 10 },
{ id: 'emp-amila', name: 'Amila Rathnayake', initials: 'AR', title: 'Storekeeper', department: 'Warehouse', branchId: null, type: 'full_time', joinedAt: '2022-04-11', phone: '076 219 5540', basicSalary: 8000000, allowances: 1000000, leaveBalance: 13 },
{ id: 'emp-chathuri', name: 'Chathuri Peiris', initials: 'CP', title: 'Accounts Executive', department: 'Finance', branchId: null, type: 'full_time', joinedAt: '2022-08-22', phone: '077 834 1127', basicSalary: 12000000, allowances: 1500000, leaveBalance: 7 },
{ id: 'emp-hasitha', name: 'Hasitha Gamage', initials: 'HG', title: 'Customer Care Agent', department: 'Support', branchId: 'br-col', type: 'part_time', joinedAt: '2025-06-02', phone: '071 993 2205', basicSalary: 5500000, allowances: 0, leaveBalance: 5 },
{ id: 'emp-minoli', name: 'Minoli Dias', initials: 'MD', title: 'Cashier', department: 'Sales', branchId: 'br-gal', type: 'contract', joinedAt: '2026-03-01', phone: '077 140 6638', basicSalary: 6500000, allowances: 500000, leaveBalance: 4 }];


export const attendanceToday: AttendanceRecord[] = [
{ employeeId: 'emp-nimali', status: 'present', clockIn: '08:52', clockOut: null },
{ employeeId: 'emp-kasun', status: 'present', clockIn: '08:41', clockOut: null },
{ employeeId: 'emp-tharushi', status: 'late', clockIn: '09:24', clockOut: null },
{ employeeId: 'emp-ruwan', status: 'present', clockIn: '08:55', clockOut: null },
{ employeeId: 'emp-dilshan', status: 'on_leave', clockIn: null, clockOut: null },
{ employeeId: 'emp-sachini', status: 'present', clockIn: '08:47', clockOut: null },
{ employeeId: 'emp-ishara', status: 'present', clockIn: '07:58', clockOut: null },
{ employeeId: 'emp-amila', status: 'absent', clockIn: null, clockOut: null },
{ employeeId: 'emp-chathuri', status: 'off', clockIn: null, clockOut: null },
{ employeeId: 'emp-hasitha', status: 'present', clockIn: '09:00', clockOut: null },
{ employeeId: 'emp-minoli', status: 'late', clockIn: '09:16', clockOut: null }];


export const leaveRequests: LeaveRequest[] = [
{ id: 'lv-1', employeeId: 'emp-ruwan', kind: 'annual', from: '2026-10-19', to: '2026-10-23', days: 5, reason: 'Family trip to Jaffna', status: 'pending' },
{ id: 'lv-2', employeeId: 'emp-sachini', kind: 'casual', from: '2026-10-09', to: '2026-10-09', days: 1, reason: 'Personal errand', status: 'pending' },
{ id: 'lv-3', employeeId: 'emp-amila', kind: 'sick', from: '2026-10-04', to: '2026-10-05', days: 2, reason: 'Fever — medical certificate to follow', status: 'pending' },
{ id: 'lv-4', employeeId: 'emp-dilshan', kind: 'annual', from: '2026-10-02', to: '2026-10-06', days: 3, reason: 'Wedding', status: 'approved' },
{ id: 'lv-5', employeeId: 'emp-tharushi', kind: 'casual', from: '2026-09-22', to: '2026-09-22', days: 1, reason: 'University exam', status: 'approved' }];