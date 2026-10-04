import type { Employee } from '../types/hr';
import { percentOf } from './money';

/** Sri Lankan statutory rates in basis points. EPF/ETF are calculated on basic salary. */
export const EPF_EMPLOYEE_BPS = 800;
export const EPF_EMPLOYER_BPS = 1200;
export const ETF_EMPLOYER_BPS = 300;

export interface PayslipLine {
  employee: Employee;
  gross: number;
  epfEmployee: number;
  net: number;
  epfEmployer: number;
  etf: number;
}

export function payslip(employee: Employee): PayslipLine {
  const gross = employee.basicSalary + employee.allowances;
  const epfEmployee = percentOf(employee.basicSalary, EPF_EMPLOYEE_BPS);
  return {
    employee,
    gross,
    epfEmployee,
    net: gross - epfEmployee,
    epfEmployer: percentOf(employee.basicSalary, EPF_EMPLOYER_BPS),
    etf: percentOf(employee.basicSalary, ETF_EMPLOYER_BPS)
  };
}