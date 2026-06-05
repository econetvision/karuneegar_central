import { useState } from 'react';
import { Users, Lock, CheckCircle2 } from 'lucide-react';
import api from '../api/client';

interface Props {
  onDecision: (isPublic: boolean) => void;
}

export default function VisibilityPrompt({ onDecision }: Props) {
  const [saving, setSaving] = useState(false);

  const decide = async (isPublic: boolean) => {
    setSaving(true);
    try {
      await api.put('/profile', { is_public: isPublic });
      onDecision(isPublic);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-saffron-500 to-orange-600 px-6 py-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-2xl mb-2">Share Your Profile?</h2>
          <p className="text-white/85 text-sm leading-relaxed">
            Help your community connect with you by making your profile visible in the member directory.
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          <button
            onClick={() => decide(true)}
            disabled={saving}
            className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-saffron-200 hover:border-saffron-500 hover:bg-saffron-50 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-saffron-100 group-hover:bg-saffron-200 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
              <CheckCircle2 size={20} className="text-saffron-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Yes, share my profile</p>
              <p className="text-sm text-gray-500 mt-0.5">
                My name, occupation, location, and gothram will be visible to community members.
              </p>
            </div>
          </button>

          <button
            onClick={() => decide(false)}
            disabled={saving}
            className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
              <Lock size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Keep it private</p>
              <p className="text-sm text-gray-400 mt-0.5">
                Only you can see your profile. You can change this anytime in Edit Profile.
              </p>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-5 px-6">
          You can always change your preference later in <span className="font-medium">Edit Profile → Privacy</span>.
        </p>
      </div>
    </div>
  );
}
