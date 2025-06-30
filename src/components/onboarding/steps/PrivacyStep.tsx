import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Eye, EyeOff, Users, Lock } from 'lucide-react';

interface PrivacyStepProps {
  onNext: (data: any) => void;
  data: any;
}

interface FormData {
  privacy_settings: {
    share_age_range: boolean;
    share_gender: boolean;
    share_personality_traits: boolean;
    share_work_status: boolean;
    share_relationship_status: boolean;
    share_mental_health_background: boolean;
    allow_matching: boolean;
    anonymous_mode: boolean;
  };
}

export function PrivacyStep({ onNext, data }: PrivacyStepProps) {
  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      privacy_settings: data.privacy_settings || {
        share_age_range: true,
        share_gender: false,
        share_personality_traits: true,
        share_work_status: false,
        share_relationship_status: false,
        share_mental_health_background: false,
        allow_matching: true,
        anonymous_mode: true,
      }
    }
  });

  const watchedSettings = watch('privacy_settings');

  const onSubmit = (formData: FormData) => {
    onNext(formData);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy & Sharing</h2>
        <p className="text-gray-600">Control what information you share during peer matching</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary-50 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Lock className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Core Privacy Settings</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium text-gray-900">Anonymous Mode</span>
                <p className="text-xs text-gray-600">Use only display name, hide all other identifying info</p>
              </div>
              <input
                {...register('privacy_settings.anonymous_mode')}
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium text-gray-900">Allow Peer Matching</span>
                <p className="text-xs text-gray-600">Let others find and connect with you for support</p>
              </div>
              <input
                {...register('privacy_settings.allow_matching')}
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </label>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-secondary-50 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Your Privacy is Protected</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• You can change these settings anytime in your profile</li>
            <li>• No real names or contact info are ever shared</li>
            <li>• All conversations are private and encrypted</li>
            <li>• You can block or report any user</li>
            <li>• You control when and how you engage</li>
          </ul>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          type="submit"
          className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 px-6 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  );
}