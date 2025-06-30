import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';

interface BasicInfoStepProps {
  onNext: (data: any) => void;
  data: any;
}

interface FormData {
  display_name: string;
  age_range: string;
  gender: string;
}

export function BasicInfoStep({ onNext, data }: BasicInfoStepProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: data
  });

  const onSubmit = (formData: FormData) => {
    onNext(formData);
  };

  const ageRanges = [
    '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
  ];

  const genderOptions = [
    'Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h2>
        <p className="text-gray-600">Help us personalize your experience (all fields optional)</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name <span className="text-error-500">*</span>
          </label>
          <input
            {...register('display_name', { required: 'Display name is required' })}
            type="text"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="How would you like to be called? (can be anonymous)"
          />
          {errors.display_name && (
            <p className="mt-1 text-sm text-error-500">{errors.display_name.message}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Range <span className="text-error-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ageRanges.map((range) => (
              <label key={range} className="cursor-pointer">
                <input
                  {...register('age_range', { required: 'Please select your age range' })}
                  type="radio"
                  value={range}
                  className="sr-only peer"
                />
                <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                  <span className="text-sm font-medium">{range}</span>
                </div>
              </label>
            ))}
          </div>
          {errors.age_range && (
            <p className="mt-1 text-sm text-error-500">{errors.age_range.message}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {genderOptions.map((option) => (
              <label key={option} className="cursor-pointer">
                <input
                  {...register('gender')}
                  type="radio"
                  value={option}
                  className="sr-only peer"
                />
                <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                  <span className="text-sm font-medium">{option}</span>
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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