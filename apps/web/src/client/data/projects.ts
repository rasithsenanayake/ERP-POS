import type { Project, ProjectTask } from '../types/projects';

export const projects: Project[] = [
{ id: 'prj-bayview', name: 'Bayview office fit-out', client: 'Bayview Tech Solutions', ownerId: 'u-ruwan', status: 'active', dueDate: '2026-10-24', budgetHours: 60 },
{ id: 'prj-galle', name: 'Galle store refurbishment', client: 'Internal', ownerId: 'u-sachini', status: 'active', dueDate: '2026-11-14', budgetHours: 120 },
{ id: 'prj-hotel', name: 'Hill Country Hotels smart rooms', client: 'Hill Country Hotels', ownerId: 'u-kasun', status: 'on_hold', dueDate: '2026-12-05', budgetHours: 80 },
{ id: 'prj-web', name: 'serendib.lk checkout revamp', client: 'Internal', ownerId: 'u-nimali', status: 'active', dueDate: '2026-10-31', budgetHours: 40 },
{ id: 'prj-fort', name: 'Fort Bay CCTV install', client: 'Fort Bay Boutique Hotel', ownerId: 'u-sachini', status: 'done', dueDate: '2026-10-01', budgetHours: 16 }];


export const projectTasks: ProjectTask[] = [
{ id: 't-1', projectId: 'prj-bayview', title: 'Confirm laptop configuration with IT lead', assigneeId: 'u-ruwan', status: 'done', dueDate: '2026-09-30', loggedMinutes: 90 },
{ id: 't-2', projectId: 'prj-bayview', title: 'Image 40 ThinkPads with company build', assigneeId: 'u-ishara', status: 'doing', dueDate: '2026-10-14', loggedMinutes: 540 },
{ id: 't-3', projectId: 'prj-bayview', title: 'Deliver and set up docking stations', assigneeId: 'u-ruwan', status: 'todo', dueDate: '2026-10-20', loggedMinutes: 0 },
{ id: 't-4', projectId: 'prj-bayview', title: 'Staff handover session', assigneeId: 'u-tharushi', status: 'todo', dueDate: '2026-10-22', loggedMinutes: 0 },
{ id: 't-5', projectId: 'prj-galle', title: 'Finalise display wall layout', assigneeId: 'u-sachini', status: 'done', dueDate: '2026-09-25', loggedMinutes: 360 },
{ id: 't-6', projectId: 'prj-galle', title: 'Get quotes from three carpenters', assigneeId: 'u-sachini', status: 'doing', dueDate: '2026-10-08', loggedMinutes: 120 },
{ id: 't-7', projectId: 'prj-galle', title: 'Plan temporary stock move to Kelaniya', assigneeId: 'u-ishara', status: 'todo', dueDate: '2026-10-28', loggedMinutes: 0 },
{ id: 't-8', projectId: 'prj-hotel', title: 'Site survey of 120 rooms', assigneeId: 'u-kasun', status: 'done', dueDate: '2026-09-18', loggedMinutes: 480 },
{ id: 't-9', projectId: 'prj-hotel', title: 'Wait for client budget approval', assigneeId: 'u-kasun', status: 'doing', dueDate: '2026-10-30', loggedMinutes: 30 },
{ id: 't-10', projectId: 'prj-web', title: 'Add LankaQR payment option', assigneeId: 'u-nimali', status: 'doing', dueDate: '2026-10-10', loggedMinutes: 300 },
{ id: 't-11', projectId: 'prj-web', title: 'Delivery slot picker', assigneeId: 'u-nimali', status: 'todo', dueDate: '2026-10-20', loggedMinutes: 0 },
{ id: 't-12', projectId: 'prj-web', title: 'Abandoned-cart SMS reminder', assigneeId: 'u-tharushi', status: 'todo', dueDate: '2026-10-03', loggedMinutes: 0 },
{ id: 't-13', projectId: 'prj-fort', title: 'Install 6 Tapo cameras', assigneeId: 'u-sachini', status: 'done', dueDate: '2026-09-29', loggedMinutes: 600 },
{ id: 't-14', projectId: 'prj-fort', title: 'Train front desk on app', assigneeId: 'u-sachini', status: 'done', dueDate: '2026-10-01', loggedMinutes: 60 }];