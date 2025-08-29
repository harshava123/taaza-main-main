import React, { useState, useEffect, useRef } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch,
  MdPerson,
  MdPhone,
  MdAttachMoney,
  MdDateRange,
  MdHistory,
  MdMoreVert,
  MdVisibility,
  MdVisibilityOff
} from 'react-icons/md';
import { 
  getEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee,
  updateEmployeeSalary,
  updateEmployeeLeave,
  updateEmployeeAdvance
} from '../../services/firebaseService';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState('down');
  const menuRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    position: '',
    salary: '',
    joiningDate: '',
    status: 'active'
  });
  const [salaryData, setSalaryData] = useState({
    amount: '',
    month: '',
    year: '',
    notes: ''
  });
  const [leaveData, setLeaveData] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [advanceData, setAdvanceData] = useState({
    amount: '',
    reason: '',
    repaymentDate: ''
  });
  const menuButtonRefs = useRef({});
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [profileTab, setProfileTab] = useState('salary');
  // Add animation state
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle clicking outside menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
      } else {
        await addEmployee(formData);
      }
      await fetchEmployees();
      setShowAddModal(false);
      setEditingEmployee(null);
      setFormData({
        name: '',
        phone: '',
        position: '',
        salary: '',
        joiningDate: '',
        status: 'active'
      });
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    try {
      await updateEmployeeSalary(selectedEmployee.id, salaryData);
      await fetchEmployees();
      setShowSalaryModal(false);
      setSalaryData({ amount: '', month: '', year: '', notes: '' });
    } catch (error) {
      console.error('Error updating salary:', error);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const days = await updateEmployeeLeave(selectedEmployee.id, leaveData);
      await fetchEmployees();
      setShowLeaveModal(false);
      setLeaveData({ type: 'casual', startDate: '', endDate: '', reason: '' });
      alert(`Leave added for ${days} day${days > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error updating leave:', error);
    }
  };

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateEmployeeAdvance(selectedEmployee.id, advanceData);
      await fetchEmployees();
      setShowAdvanceModal(false);
      setAdvanceData({ amount: '', reason: '', repaymentDate: '' });
    } catch (error) {
      console.error('Error updating advance:', error);
    }
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(employeeId);
        await fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      phone: employee.phone || '',
      position: employee.position || '',
      salary: employee.salary || '',
      joiningDate: employee.joiningDate || '',
      status: employee.status || 'active'
    });
    setShowAddModal(true);
    setOpenMenuId(null);
  };

  const handleSalaryClick = (employee) => {
    setSelectedEmployee(employee);
    setShowSalaryModal(true);
    setOpenMenuId(null);
  };

  const handleLeaveClick = (employee) => {
    setSelectedEmployee(employee);
    setShowLeaveModal(true);
    setOpenMenuId(null);
  };

  const handleAdvanceClick = (employee) => {
    setSelectedEmployee(employee);
    setShowAdvanceModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteClick = (employeeId) => {
    handleDelete(employeeId);
    setOpenMenuId(null);
  };

  const handleMenuOpen = (employeeId) => {
    setOpenMenuId(employeeId);
    setTimeout(() => {
      const btn = menuButtonRefs.current[employeeId];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const menuHeight = 220; // Approximate height of menu
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < menuHeight) {
          setMenuDirection('up');
        } else {
          setMenuDirection('down');
        }
      }
    }, 0);
  };

  const handleViewProfile = (employee) => {
    setSelectedEmployee(employee);
    setShowProfileDrawer(true);
    setProfileTab('salary');
    setDrawerVisible(true);
    setOpenMenuId(null);
  };

  // Update drawer close logic to animate out
  const closeProfileDrawer = () => {
    setDrawerVisible(false);
    setTimeout(() => setShowProfileDrawer(false), 250);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phone?.includes(searchTerm) ||
    employee.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getLatestSalary = (employee) => {
    if (!employee.salaryHistory || employee.salaryHistory.length === 0) return employee.salary || 0;
    const latest = employee.salaryHistory[employee.salaryHistory.length - 1];
    return latest.amount || employee.salary || 0;
  };

  const getTotalAdvances = (employee) => {
    if (!employee.advanceHistory) return 0;
    return employee.advanceHistory.reduce((sum, advance) => sum + (Number(advance.amount) || 0), 0);
  };

  const getTotalLeaves = (employee) => {
    if (!employee.leaveHistory) return 0;
    return employee.leaveHistory.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-2">Manage your employees, salaries, and leave records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <MdAdd className="w-5 h-5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Employees ({filteredEmployees.length})</h3>
        </div>
        <div className="overflow-visible">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Advances</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leaves</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition overflow-visible cursor-pointer" onClick={() => handleViewProfile(employee)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <MdPerson className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MdPhone className="w-4 h-4 mr-1" />
                          {employee.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {employee.position}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const salary = getLatestSalary(employee);
                      const advances = getTotalAdvances(employee);
                      if (advances > 0) {
                        const toBePaid = Math.max(salary - advances, 0);
                        return (
                          <>
                            <div className="text-sm font-bold text-red-600">To Be Paid: ₹{toBePaid.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 line-through">₹{salary.toLocaleString()} Monthly</div>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <div className="text-sm text-gray-900">₹{salary.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Monthly</div>
                          </>
                        );
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">₹{getTotalAdvances(employee).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total Advances</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {
                        (employee.leaveHistory || []).reduce((sum, item) => sum + (item.days || 0), 0)
                      }
                    </div>
                    <div className="text-xs text-gray-500">Total Leave Days</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="relative flex justify-center items-center">
                      <button
                        ref={el => menuButtonRefs.current[employee.id] = el}
                        onClick={e => { e.stopPropagation(); handleMenuOpen(employee.id); }}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none p-2 rounded-full"
                        style={{ minWidth: 40, minHeight: 40 }}
                      >
                        <MdMoreVert className="w-5 h-5" />
                      </button>
                      {openMenuId === employee.id && (
                        <div
                          ref={menuRef}
                          onClick={e => e.stopPropagation()}
                          className={`absolute right-0 w-48 bg-white rounded-xl shadow-xl z-50 border border-gray-200 transition-all duration-200 ease-out
                            ${menuDirection === 'up' ? 'bottom-full mb-2 origin-bottom animate-fadeInUp' : 'mt-2 origin-top animate-fadeInDown'} max-h-60 overflow-y-auto`}
                          style={{ minWidth: '12rem' }}
                        >
                          {/* Arrow indicator */}
                          <div className={`absolute right-4 ${menuDirection === 'up' ? 'top-full' : 'bottom-full'}`}
                            style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                              borderTop: menuDirection === 'up' ? '8px solid #e5e7eb' : 'none',
                              borderBottom: menuDirection === 'down' ? '8px solid #e5e7eb' : 'none',
                            }}
                          />
                          <div className="py-1 divide-y divide-gray-100">
                            <button
                              onClick={() => handleSalaryClick(employee)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 focus:bg-blue-100 transition rounded-t-xl"
                            >
                              <MdAttachMoney className="w-4 h-4 mr-3 text-blue-600" />
                              Update Salary
                            </button>
                            <button
                              onClick={() => handleLeaveClick(employee)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 focus:bg-green-100 transition"
                            >
                              <MdDateRange className="w-4 h-4 mr-3 text-green-600" />
                              Add Leave
                            </button>
                            <button
                              onClick={() => handleAdvanceClick(employee)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 focus:bg-orange-100 transition"
                            >
                              <MdHistory className="w-4 h-4 mr-3 text-orange-600" />
                              Add Advance
                            </button>
                            <button
                              onClick={() => handleEdit(employee)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-100 transition"
                            >
                              <MdEdit className="w-4 h-4 mr-3 text-gray-600" />
                              Edit Employee
                            </button>
                            <button
                              onClick={() => handleDeleteClick(employee.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-100 transition rounded-b-xl"
                            >
                              <MdDelete className="w-4 h-4 mr-3" />
                              Delete Employee
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEmployee(null);
                    setFormData({
                      name: '',
                      phone: '',
                      position: '',
                      salary: '',
                      joiningDate: '',
                      status: 'active'
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Update Modal */}
      {showSalaryModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Salary - {selectedEmployee.name}</h2>
            <form onSubmit={handleSalarySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Salary (₹)</label>
                <input
                  type="number"
                  value={salaryData.amount}
                  onChange={(e) => setSalaryData({ ...salaryData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={salaryData.month}
                    onChange={(e) => setSalaryData({ ...salaryData, month: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Month</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = new Date(2024, i).toLocaleString('default', { month: 'long' });
                      return <option key={i + 1} value={i + 1}>{month}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={salaryData.year}
                    onChange={(e) => setSalaryData({ ...salaryData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={salaryData.notes}
                  onChange={(e) => setSalaryData({ ...salaryData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSalaryModal(false);
                    setSalaryData({ amount: '', month: '', year: '', notes: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Update Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Leave - {selectedEmployee.name}</h2>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={leaveData.type}
                  onChange={(e) => setLeaveData({ ...leaveData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="annual">Annual Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveData.startDate}
                    onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveData.endDate}
                    onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false);
                    setLeaveData({ type: 'casual', startDate: '', endDate: '', reason: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Add Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Modal */}
      {showAdvanceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Advance - {selectedEmployee.name}</h2>
            <form onSubmit={handleAdvanceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  value={advanceData.amount}
                  onChange={(e) => setAdvanceData({ ...advanceData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={advanceData.reason}
                  onChange={(e) => setAdvanceData({ ...advanceData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Date</label>
                <input
                  type="date"
                  value={advanceData.repaymentDate}
                  onChange={(e) => setAdvanceData({ ...advanceData, repaymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdvanceModal(false);
                    setAdvanceData({ amount: '', reason: '', repaymentDate: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
                >
                  Add Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileDrawer && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={closeProfileDrawer} />
          {/* Drawer with animation */}
          <div className={`relative ml-auto w-full max-w-md h-full shadow-2xl flex flex-col bg-white transition-transform duration-300 ease-in-out
            ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdPerson className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{selectedEmployee.name}</div>
                    <div className="text-sm text-gray-500 flex items-center"><MdPhone className="w-4 h-4 mr-1" />{selectedEmployee.phone}</div>
                    <div className="text-xs inline-flex px-2 py-1 rounded-full bg-blue-100 text-blue-800 mt-1">{selectedEmployee.position}</div>
                  </div>
                </div>
              </div>
              <button onClick={closeProfileDrawer} className="text-gray-400 hover:text-gray-700 absolute top-4 right-4"><span className="text-2xl">&times;</span></button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button onClick={() => setProfileTab('salary')} className={`flex-1 py-3 text-sm font-semibold ${profileTab === 'salary' ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>Salary History</button>
              <button onClick={() => setProfileTab('leave')} className={`flex-1 py-3 text-sm font-semibold ${profileTab === 'leave' ? 'border-b-2 border-green-600 text-green-700 bg-green-50' : 'text-gray-600 hover:bg-gray-50'}`}>Leave History</button>
              <button onClick={() => setProfileTab('advance')} className={`flex-1 py-3 text-sm font-semibold ${profileTab === 'advance' ? 'border-b-2 border-orange-600 text-orange-700 bg-orange-50' : 'text-gray-600 hover:bg-gray-50'}`}>Advance History</button>
            </div>
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {profileTab === 'salary' && (
                <div>
                  <h3 className="text-base font-bold mb-3 flex items-center gap-2"><MdAttachMoney className="text-blue-600" /> Salary History</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-2 text-left">Date</th>
                        <th className="py-2 px-2 text-left">Amount</th>
                        <th className="py-2 px-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedEmployee.salaryHistory || []).slice().reverse().map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 px-2">{item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                          <td className="py-2 px-2 text-blue-700 font-semibold">₹{item.amount}</td>
                          <td className="py-2 px-2">{item.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {profileTab === 'leave' && (
                <div>
                  <h3 className="text-base font-bold mb-3 flex items-center gap-2"><MdDateRange className="text-green-600" /> Leave History</h3>
                  {/* Total leave days */}
                  <div className="mb-2 text-sm text-green-700 font-semibold">
                    Total Leave Days: {
                      (selectedEmployee.leaveHistory || []).reduce((sum, item) => sum + (item.days || 0), 0)
                    }
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-2 text-left">Type</th>
                        <th className="py-2 px-2 text-left">From</th>
                        <th className="py-2 px-2 text-left">To</th>
                        <th className="py-2 px-2 text-left">Days</th>
                        <th className="py-2 px-2 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedEmployee.leaveHistory || []).slice().reverse().map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 px-2"><span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${item.type === 'sick' ? 'bg-red-100 text-red-700' : item.type === 'annual' ? 'bg-yellow-100 text-yellow-700' : item.type === 'casual' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{item.type}</span></td>
                          <td className="py-2 px-2">{item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                          <td className="py-2 px-2">{item.endDate ? new Date(item.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                          <td className="py-2 px-2 text-center">{item.days || '-'}</td>
                          <td className="py-2 px-2">{item.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {profileTab === 'advance' && (
                <div>
                  <h3 className="text-base font-bold mb-3 flex items-center gap-2"><MdHistory className="text-orange-600" /> Advance History</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-2 text-left">Date</th>
                        <th className="py-2 px-2 text-left">Amount</th>
                        <th className="py-2 px-2 text-left">Reason</th>
                        <th className="py-2 px-2 text-left">Repayment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedEmployee.advanceHistory || []).slice().reverse().map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 px-2">{item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                          <td className="py-2 px-2 text-orange-700 font-semibold">₹{item.amount}</td>
                          <td className="py-2 px-2">{item.reason || '-'}</td>
                          <td className="py-2 px-2">{item.repaymentDate ? new Date(item.repaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement; 