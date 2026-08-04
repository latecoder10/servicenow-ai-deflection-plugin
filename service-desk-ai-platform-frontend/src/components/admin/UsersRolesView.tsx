import React from 'react';
import { SystemUser } from '../../types';
import { Users, Shield, Plus, CheckCircle2, UserCheck } from 'lucide-react';

interface UsersRolesViewProps {
  users: SystemUser[];
}

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({ users }) => {
  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Workspace Users & Role-Based Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage system administrators, knowledge managers, service desk leads, and AI platform permissions.
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{u.role}</td>
                <td className="py-3.5 px-4 text-slate-700">{u.department}</td>
                <td className="py-3.5 px-4">
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded border border-emerald-200 font-mono font-bold">
                    Active
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{u.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
