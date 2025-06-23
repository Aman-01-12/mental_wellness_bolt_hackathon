import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Settings, ArrowRight } from 'lucide-react';

interface PreferencesStepProps {
  onNext: (data: any) => void;
  data: any;
}

interface FormData {
  mental_health_background: {
    has_experience: boolean;
    overcome_challenges: boolean;
    comfortable_sharing: boolean;
    professional_help: boolean;
  };
}

export function PreferencesStep({ onNext, data }: PreferencesStepProps) {
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      mental_health_background: data.mental_health_background || {
        has_experience: false,
        overcome_challenges: false,
        comfortable_sharing: false,
        professional_help: false,
      }
    }
  });

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
        <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Support Preferences</h2>
        <p className="text-gray-600">Help us understand your comfort level and experience</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-success-50 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Mental Health Experience</h3>
          <p className="text-sm text-gray-600 mb-4">
            This helps us better match you with compatible people. All information is kept private and anonymous.
          </p>
          
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                {...register('mental_health_background.has_experience')}
                type="checkbox"
                className="mt-1 w-4 h-4 text-success-600 border-gray-300 rounded focus:ring-success-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  I have experience with mental health challenges
                </span>
                <p className="text-xs text-gray-600">
                  You've personally dealt with anxiety, depression, stress, or other mental health issues
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                {...register('mental_health_background.overcome_challenges')}
                type="checkbox"
                className="mt-1 w-4 h-4 text-success-600 border-gray-300 rounded focus:ring-success-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  I've overcome significant mental health challenges
                </span>
                <p className="text-xs text-gray-600">
                  You've successfully worked through difficult periods and can share your experience
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                {...register('mental_health_background.comfortable_sharing')}
                type="checkbox"
                className="mt-1 w-4 h-4 text-success-600 border-gray-300 rounded focus:ring-success-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  I'm comfortable sharing my mental health journey
                </span>
                <p className="text-xs text-gray-600">
                  You're open to discussing your experiences to help others
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                {...register('mental_health_background.professional_help')}
                type="checkbox"
                className="mt-1 w-4 h-4 text-success-600 border-gray-300 rounded focus:ring-success-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  I've sought professional help (therapy, counseling, etc.)
                </span>
                <p className="text-xs text-gray-600">
                  You have experience with professional mental health services
                </p>
              </div>
            </label>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-warning-50 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Important Note</h3>
          <p className="text-sm text-gray-600">
            MindSpace provides peer support and is not a substitute for professional mental health care. 
            If you're experiencing a crisis, please contact emergency services or a mental health professional immediately.
          </p>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          type="submit"
          className="w-full bg-gradient-to-r from-success-500 to-primary-500 text-white py-4 px-6 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  );
}