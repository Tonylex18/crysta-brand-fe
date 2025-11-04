import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

type AuthModalProps = {
  onClose?: () => void;
};

export default function Auth({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { signIn, signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-[#00CFFF]">
            {mode === 'signin' ? 'Sign In to Crysta' : 'Create Your Crysta Account'}
          </h2>
          <p className="text-gray-600 mb-8">
            {mode === 'signin'
              ? 'Enter your credentials to access your account.'
              : 'Fill in your details to create a new account.'}
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setSubmitting(true);
              if (mode === 'signin') {
                await signIn(email, password);
                toast.success('Signed in successfully');
                navigate('/dashboard');
              } else {
                await signUp(name, email, password);
                toast.success('Account created successfully');
                sessionStorage.setItem('pendingEmail', email);
                navigate('/verify-email');
              }
              onClose?.();
            } catch (err: any) {
              const message = err?.response?.data?.message || 'Something went wrong';
              toast.error(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00CFFF]"
                placeholder="Jane Doe"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00CFFF]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00CFFF]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full px-6 py-3 text-white font-semibold rounded-lg transition-colors ${submitting ? 'bg-[#00CFFF]/70 cursor-not-allowed' : 'bg-[#00CFFF] hover:bg-[#00CFFF]/90'}`}
          >
            {submitting ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-sm text-gray-600 hover:text-[#00CFFF] transition-colors"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
