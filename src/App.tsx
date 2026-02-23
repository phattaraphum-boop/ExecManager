import React, { useState, useEffect } from 'react';
import { Appointment, downloadICS } from '@/lib/utils';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Menu,
  LayoutDashboard,
  CalendarDays
} from 'lucide-react';
import { format, parseISO, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

// --- Components ---

const LoginScreen = ({ onLogin }: { onLogin: (role: 'secretary' | 'executive') => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '1234') {
      onLogin('secretary');
    } else if (username === 'exec' && password === '1234') {
      onLogin('executive');
    } else {
      setError('Invalid username or password (ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง)');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ExecManager Login</h1>
          <p className="text-gray-500">เข้าสู่ระบบจัดการนัดหมายผู้บริหาร</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username (ชื่อผู้ใช้)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="admin or exec"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (รหัสผ่าน)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="1234"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Sign In (เข้าสู่ระบบ)
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Demo Credentials:</p>
          <p>Secretary: admin / 1234</p>
          <p>Executive: exec / 1234</p>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Confirmed: 'bg-green-100 text-green-800 border-green-200',
    Cancelled: 'bg-red-100 text-red-800 border-red-200',
    Postponed: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const labels = {
    Pending: 'Pending (รอดำเนินการ)',
    Confirmed: 'Confirmed (ยืนยันแล้ว)',
    Cancelled: 'Cancelled (ยกเลิก)',
    Postponed: 'Postponed (เลื่อน)',
  };
  
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", styles[status as keyof typeof styles] || styles.Pending)}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

const AppointmentModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  role,
  onDelete
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: any) => void; 
  initialData?: Appointment | null;
  role: 'secretary' | 'executive';
  onDelete?: (id: number) => void;
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    title: '',
    location: '',
    attendees: '',
    description: '',
    status: 'Pending',
    secretary_note: '',
    executive_feedback: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure nulls are empty strings
        location: initialData.location || '',
        attendees: initialData.attendees || '',
        description: initialData.description || '',
        secretary_note: initialData.secretary_note || '',
        executive_feedback: initialData.executive_feedback || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Appointment (แก้ไขนัดหมาย)' : 'New Appointment (สร้างนัดหมายใหม่)'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title (หัวข้อนัดหมาย)</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Meeting with..."
                disabled={role === 'executive'}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date (วันที่)</label>
              <input
                required
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                // Executive can now edit date
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Time (เวลาเริ่ม)</label>
                <input
                  required
                  type="time"
                  value={formData.start_time}
                  onChange={e => setFormData({...formData, start_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  // Executive can now edit time
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Time (เวลาสิ้นสุด)</label>
                <input
                  required
                  type="time"
                  value={formData.end_time}
                  onChange={e => setFormData({...formData, end_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  // Executive can now edit time
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Location (สถานที่)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Conference Room A / Zoom Link"
                  disabled={role === 'executive'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Attendees (ผู้เข้าร่วม)</label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.attendees}
                  onChange={e => setFormData({...formData, attendees: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="John Doe, Jane Smith..."
                  disabled={role === 'executive'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status (สถานะ)</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="Pending">Pending (รอดำเนินการ)</option>
                <option value="Confirmed">Confirmed (ยืนยันแล้ว)</option>
                <option value="Postponed">Postponed (เลื่อน)</option>
                <option value="Cancelled">Cancelled (ยกเลิก)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description / Agenda (รายละเอียดวาระการประชุม)</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
              placeholder="Meeting agenda details..."
              disabled={role === 'executive'}
            />
          </div>

          {role === 'secretary' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Secretary Note (บันทึกส่วนตัวของเลขาฯ)</label>
              <textarea
                value={formData.secretary_note}
                onChange={e => setFormData({...formData, secretary_note: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none bg-yellow-50"
                placeholder="Internal notes..."
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Executive Feedback (ข้อเสนอแนะจากผู้บริหาร)</label>
            <textarea
              value={formData.executive_feedback}
              onChange={e => setFormData({...formData, executive_feedback: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none bg-blue-50"
              placeholder="Feedback or instructions from executive..."
              disabled={role === 'secretary'}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 w-full">
            {initialData && role === 'secretary' && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialData.id);
                  onClose();
                }}
                className="mr-auto px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
              >
                Delete (ลบ)
              </button>
            )}
            
            {initialData && (
              <>
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(formData.title)}&dates=${formData.date.replace(/-/g, '')}T${formData.start_time.replace(/:/g, '')}00/${formData.date.replace(/-/g, '')}T${formData.end_time.replace(/:/g, '')}00&details=${encodeURIComponent(formData.description)}&location=${encodeURIComponent(formData.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Google Cal
                </a>
                <button
                  type="button"
                  onClick={() => downloadICS({ ...formData, id: initialData.id, last_updated: '' } as Appointment)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Apple/Outlook
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel (ยกเลิก)
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Save (บันทึก)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<'dashboard' | 'calendar'>('dashboard');
  const [role, setRole] = useState<'secretary' | 'executive' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (role) {
      fetchAppointments();
    }
  }, [role]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setAppointments(data);
      } catch (e) {
        console.error('Failed to parse appointments JSON:', text.substring(0, 100));
        throw e;
      }
    } catch (error) {
      console.error('Failed to fetch appointments', error);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedAppointment) {
        await fetch(`/api/appointments/${selectedAppointment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      fetchAppointments();
      setIsModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Failed to save', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this appointment? (คุณแน่ใจหรือไม่ที่จะลบนัดหมายนี้?)')) return;
    try {
      await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      fetchAppointments();
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const openModal = (appointment?: Appointment) => {
    setSelectedAppointment(appointment || null);
    setIsModalOpen(true);
  };

  const handleLogin = (userRole: 'secretary' | 'executive') => {
    setRole(userRole);
  };

  const handleLogout = () => {
    setRole(null);
    setView('dashboard');
  };

  // Calendar Logic
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const dayAppointments = appointments.filter(apt => 
          isSameDay(parseISO(apt.date), cloneDay)
        );

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[100px] border border-gray-100 p-2 transition-colors hover:bg-gray-50 cursor-pointer relative",
              !isSameMonth(day, monthStart) ? "bg-gray-50/50 text-gray-400" : "bg-white",
              isSameDay(day, new Date()) ? "bg-indigo-50/30" : ""
            )}
            onClick={() => {
              // If clicking empty space, maybe create new?
              // For now, just focus day
            }}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={cn(
                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                isSameDay(day, new Date()) ? "bg-indigo-600 text-white" : "text-gray-700"
              )}>
                {formattedDate}
              </span>
              {role === 'secretary' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAppointment(null);
                    // Pre-fill date logic could go here
                    setIsModalOpen(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {dayAppointments.map(apt => (
                <div 
                  key={apt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(apt);
                  }}
                  className={cn(
                    "text-xs px-1.5 py-1 rounded border truncate cursor-pointer transition-all hover:shadow-sm",
                    apt.status === 'Confirmed' ? "bg-green-50 border-green-100 text-green-800" :
                    apt.status === 'Pending' ? "bg-yellow-50 border-yellow-100 text-yellow-800" :
                    apt.status === 'Cancelled' ? "bg-red-50 border-red-100 text-red-800 line-through opacity-60" :
                    "bg-gray-50 border-gray-100 text-gray-800"
                  )}
                >
                  {apt.start_time} {apt.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">{rows}</div>;
  };

  const renderDashboard = () => {
    const today = new Date();
    const todaysAppointments = appointments.filter(apt => isSameDay(parseISO(apt.date), today));
    const pendingAppointments = appointments.filter(apt => apt.status === 'Pending');
    
    return (
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Today's Schedule (วันนี้)</p>
                <h3 className="text-2xl font-bold text-gray-900">{todaysAppointments.length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending Approval (รอดำเนินการ)</p>
                <h3 className="text-2xl font-bold text-gray-900">{pendingAppointments.length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Confirmed (ยืนยันแล้ว)</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {appointments.filter(a => a.status === 'Confirmed').length}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Agenda */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Today's Agenda (วาระวันนี้)</h3>
            <span className="text-sm text-gray-500">{format(today, 'EEEE, MMMM do, yyyy')}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {todaysAppointments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No appointments scheduled for today. (ไม่มีนัดหมายวันนี้)</div>
            ) : (
              todaysAppointments.map(apt => (
                <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 group cursor-pointer" onClick={() => openModal(apt)}>
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-sm font-bold text-gray-900">{apt.start_time}</div>
                    <div className="text-xs text-gray-500">{apt.end_time}</div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{apt.title}</h4>
                      <StatusBadge status={apt.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {apt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {apt.location}
                        </span>
                      )}
                      {apt.attendees && (
                        <span className="flex items-center gap-1 truncate">
                          <Users className="w-3 h-3" /> {apt.attendees}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-indigo-600">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!role) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            ExecManager
          </h1>
          <p className="text-xs text-gray-500 mt-1">University Appointment System</p>
        </div>
        
        <nav className="p-4 space-y-1 flex-grow">
          <button
            onClick={() => setView('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
              view === 'dashboard' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard (แดชบอร์ด)
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
              view === 'calendar' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Calendar className="w-5 h-5" />
            Calendar (ปฏิทิน)
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {role === 'secretary' ? 'SEC' : 'EXEC'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {role === 'secretary' ? 'Secretary' : 'Executive'}
              </p>
              <p className="text-xs text-gray-500 truncate">Logged in</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            Sign Out (ออกจากระบบ)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {view === 'dashboard' ? 'Executive Dashboard (แดชบอร์ดผู้บริหาร)' : 'Calendar Overview (ภาพรวมปฏิทิน)'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, {role === 'secretary' ? 'Secretary Admin (เลขาฯ)' : 'Executive Director (ผู้บริหาร)'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {role === 'secretary' && (
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Appointment (สร้างนัดหมาย)
              </button>
            )}
          </div>
        </header>

        {view === 'calendar' && (
          <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900 w-48">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg text-gray-700">
                  Today
                </button>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'dashboard' ? renderDashboard() : renderCalendar()}
      </main>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={selectedAppointment}
        role={role}
        onDelete={handleDelete}
      />

      {/* System Info Modal */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => alert("System Architecture:\n\nThis is a custom Web Application built with React & Node.js, designed to replace the need for AppSheet.\n\nFeatures:\n- Role-based Access (Secretary vs Executive)\n- Calendar & Dashboard Views\n- SQLite Database (Robust & Fast)\n- Google Calendar Integration (via Link Generation)\n\nThis architecture offers better performance and customization than a spreadsheet-based app.")}
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all"
          title="System Info"
        >
          <div className="text-xs font-bold">INFO</div>
        </button>
      </div>
    </div>
  );
}
