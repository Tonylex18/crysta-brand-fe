import { useEffect, useState } from 'react';
import { verificationAPI } from '../lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Verifyemail = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingEmail');
    if (pending) {
      setEmail(pending);
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      toast.error('Email and OTP are required');
      return;
    }
    try {
      setSubmitting(true);
      await verificationAPI.verifyEmail(email, otp);
      toast.success('Email verified successfully');
      sessionStorage.removeItem('pendingEmail');
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Verification failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('No email found to resend OTP');
      return;
    }
    try {
      setResending(true);
      await verificationAPI.resendOtp(email);
      toast.success('A new OTP has been sent to your email');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Could not resend OTP';
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2 text-[#00CFFF]">Verify your email</h2>
          <p className="text-gray-600 mb-8">We sent a one-time code to {email || 'your email'}.</p>
        </div>

        <form className="space-y-4" onSubmit={handleVerify}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00CFFF] tracking-widest"
              placeholder="123456"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full px-6 py-3 text-white font-semibold rounded-lg transition-colors ${submitting ? 'bg-[#00CFFF]/70 cursor-not-allowed' : 'bg-[#00CFFF] hover:bg-[#00CFFF]/90'}`}
          >
            {submitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className={`text-sm ${resending ? 'text-gray-400' : 'text-gray-600 hover:text-[#00CFFF]'} transition-colors`}
          >
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Verifyemail;
