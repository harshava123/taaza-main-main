import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAdmin();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(form.email, form.password);
      if (result.success) {
        navigate('/admin', { replace: true });
      } else {
        setError(result.error || 'Login failed.');
      }
    } catch {
      setError('Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
          <span className="text-4xl mb-2">🥩</span>
          <h1 className="text-2xl font-extrabold text-red-700 tracking-tight mb-1">Taaza Meat </h1>
          <p className="text-gray-500 text-sm">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-2 border border-red-100 text-center animate-fade-in">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition placeholder-gray-400 text-sm"
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition placeholder-gray-400 text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
      <footer className="mt-8 text-xs text-gray-400 text-center">
        &copy; {new Date().getFullYear()} Taaza Meat. All rights reserved.
      </footer>
    </div>
  );
};

export default Login; 