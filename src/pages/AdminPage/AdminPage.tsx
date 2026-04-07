import { useState, useEffect } from 'react';
import './AdminPage.css';
import type { Reservation } from '../../shared/types';
import { formatCents, getRate } from '../../shared/pricing';

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      localStorage.setItem('admin_token', data.token);
      onLogin(data.token);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <form className="admin-login" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        {error && <p className="admin-error">{error}</p>}
        <label>
          Username
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>
    </div>
  );
}

function AddReservationModal({ token, onClose, onAdded }: { token: string; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    event_date: '',
    payment_type: 'check' as 'deposit' | 'full' | 'check',
    notes: '',
    paid_in_full: false,
    amount_total: '',
    amount_paid: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/add-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          paid_in_full: form.paid_in_full ? 1 : 0,
          amount_total: Math.round((parseFloat(form.amount_total) || 0) * 100),
          amount_paid: Math.round((parseFloat(form.amount_paid) || 0) * 100),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add reservation');
        return;
      }
      onAdded();
      onClose();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string | boolean | number) => {
    setForm(f => {
      const updated = { ...f, [key]: value };
      if (key === 'event_date' && typeof value === 'string' && value) {
        updated.amount_total = String(getRate(value) / 100);
      }
      return updated;
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Add Reservation</h3>
        {error && <p className="admin-error">{error}</p>}
        <form onSubmit={handleSubmit} className="add-reservation-form">
          <label>First name <input value={form.first_name} onChange={e => set('first_name', e.target.value)} /></label>
          <label>Last name <input value={form.last_name} onChange={e => set('last_name', e.target.value)} /></label>
          <label>E-mail <input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></label>
          <label>Phone <input value={form.phone} onChange={e => set('phone', e.target.value)} /></label>
          <label>Event date <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} /></label>
          <label>Payment type
            <select value={form.payment_type} onChange={e => set('payment_type', e.target.value)}>
              <option value="deposit">Deposit</option>
              <option value="full">Full</option>
              <option value="check">Check</option>
            </select>
          </label>
          <label>Notes <textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></label>
          <label>Total amount ($) <input type="text" inputMode="decimal" value={form.amount_total} onChange={e => set('amount_total', e.target.value)} /></label>
          <label>Amount paid ($) <input type="text" inputMode="decimal" value={form.amount_paid} onChange={e => set('amount_paid', e.target.value)} /></label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.paid_in_full} onChange={e => set('paid_in_full', e.target.checked)} />
            Paid in full
          </label>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReservationRow({ r, token, onRefresh }: { r: Reservation; token: string; onRefresh: () => void }) {
  const [loading, setLoading] = useState('');

  const action = async (endpoint: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setLoading(endpoint);
    try {
      const res = await fetch(`/api/reservations/${r.id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || `Failed to ${endpoint}`);
      } else {
        onRefresh();
      }
    } catch {
      alert('Network error');
    } finally {
      setLoading('');
    }
  };

  const daysUntil = Math.ceil((new Date(r.event_date + 'T12:00:00').getTime() - Date.now()) / 86400000);
  const urgent = daysUntil <= 7 && !r.paid_in_full;

  return (
    <tr className={urgent ? 'row-urgent' : ''}>
      <td>{r.event_date}</td>
      <td>{r.first_name} {r.last_name}</td>
      <td>{r.email}</td>
      <td>{r.phone}</td>
      <td>{r.payment_type}</td>
      <td>{r.paid_in_full ? 'Yes' : 'No'}</td>
      <td>{formatCents(r.amount_paid)} / {formatCents(r.amount_total)}</td>
      <td>{r.status}</td>
      <td className="actions-cell">
        {r.status === 'active' && (
          <>
            <button
              className="btn-sm"
              disabled={!!loading}
              onClick={() => action('cancel', `Cancel reservation for ${r.first_name} ${r.last_name}?`)}
            >
              {loading === 'cancel' ? '…' : 'Cancel'}
            </button>
            {r.paid_in_full ? (
              <button
                className="btn-sm"
                disabled={!!loading}
                onClick={() => action('refund', `Refund ${formatCents(r.amount_total - 50000)} to ${r.first_name}?`)}
              >
                {loading === 'refund' ? '…' : 'Refund'}
              </button>
            ) : null}
            {!r.paid_in_full && (
              <>
                <button
                  className="btn-sm"
                  disabled={!!loading}
                  onClick={() => action('invoice', `Send invoice to ${r.email}?`)}
                >
                  {loading === 'invoice' ? '…' : 'Request Payment'}
                </button>
                <button
                  className="btn-sm"
                  disabled={!!loading}
                  onClick={() => action('mark-paid', `Mark ${r.first_name} ${r.last_name} as paid in full?`)}
                >
                  {loading === 'mark-paid' ? '…' : 'Mark Paid'}
                </button>
              </>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming');
  const [showAdd, setShowAdd] = useState(false);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch {
      // network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, [filter]);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Reservations</h2>
        <div className="admin-header-actions">
          <button className="btn btn-green" onClick={() => setShowAdd(true)}>Add Reservation</button>
          <button className="btn btn-outline" onClick={onLogout}>Log Out</button>
        </div>
      </div>

      <div className="admin-filters">
        {(['upcoming', 'all', 'past'] as const).map(f => (
          <button
            key={f}
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="admin-loading">Loading…</p>
      ) : reservations.length === 0 ? (
        <p className="admin-empty">No reservations found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Payment</th>
                <th>Paid</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <ReservationRow key={r.id} r={r} token={token} onRefresh={fetchReservations} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddReservationModal
          token={token}
          onClose={() => setShowAdd(false)}
          onAdded={fetchReservations}
        />
      )}

      <UserManagement token={token} onLogout={onLogout} />
    </div>
  );
}

function UserManagement({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setAddError(data.error || 'Failed to add user');
        return;
      }
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch {
      setAddError('Network error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      } else {
        fetchUsers();
      }
    } catch {
      alert('Network error');
    }
  };

  const handleEditPassword = async (id: number) => {
    if (!editPassword.trim()) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: editPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update password');
      } else {
        setEditingId(null);
        setEditPassword('');
      }
    } catch {
      alert('Network error');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="user-management">
      <h2>Users</h2>

      {loading ? (
        <p className="admin-loading">Loading…</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td className="actions-cell">
                    {editingId === u.id ? (
                      <>
                        <input
                          type="password"
                          placeholder="New password"
                          value={editPassword}
                          onChange={e => setEditPassword(e.target.value)}
                          className="inline-input"
                        />
                        <button className="btn-sm" disabled={editLoading} onClick={() => handleEditPassword(u.id)}>
                          {editLoading ? '…' : 'Save'}
                        </button>
                        <button className="btn-sm" onClick={() => { setEditingId(null); setEditPassword(''); }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-sm" onClick={() => setEditingId(u.id)}>Change Password</button>
                        <button className="btn-sm btn-sm-danger" onClick={() => handleDelete(u.id, u.username)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="add-user-form" onSubmit={handleAdd}>
        {addError && <p className="admin-error">{addError}</p>}
        <input type="text" placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <button type="submit" className="btn btn-green" disabled={adding}>
          {adding ? 'Adding…' : 'Add User'}
        </button>
      </form>
    </div>
  );
}

export function AdminPage() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  if (!token) {
    return <AdminLogin onLogin={setToken} />;
  }

  return <Dashboard token={token} onLogout={handleLogout} />;
}
