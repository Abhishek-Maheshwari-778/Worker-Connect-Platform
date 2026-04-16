import { useAuth } from '@/context/AuthContext';
import { ShieldOff, Mail, LogOut, AlertTriangle } from 'lucide-react';

const SuspendedPage = ({ reason }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-red-100">
          {/* Red header */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 px-8 py-10 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <ShieldOff className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display font-black text-2xl text-white">Account Suspended</h1>
            <p className="text-red-100 text-sm mt-2">Your access has been temporarily restricted</p>
          </div>

          {/* Body */}
          <div className="p-8 space-y-5">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800 mb-1">Reason for suspension</p>
                <p className="text-sm text-red-700 leading-relaxed">
                  {reason || user?.suspendReason || 'Violation of platform terms and conditions.'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <p>If you believe this suspension is a mistake or would like to appeal, please contact our support team.</p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Mail className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <a href="mailto:support@labourconnect.in"
                  className="text-orange-600 font-semibold hover:underline">
                  support@labourconnect.in
                </a>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Labour Connect · Account ID: {user?._id?.slice(-8).toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default SuspendedPage;