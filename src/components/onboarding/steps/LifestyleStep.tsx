import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Coffee, ArrowRight } from 'lucide-react';

interface LifestyleStepProps {
  onNext: (data: any) => void;
  data: any;
}

interface FormData {
  work_status: string;
  work_style: string;
  food_habits: string;
  sleep_duration: number;
  relationship_status: string;
  availability: string;
}

export function LifestyleStep({ onNext, data }: LifestyleStepProps) {
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: data
  });

  const onSubmit = (formData: FormData) => {
    onNext(formData);
  };

  const workStatuses = [
    'Student', 'Working Professional', 'Freelancer', 'Unemployed', 'Retired', 'Other'
  ];

  const workStyles = [
    'Remote', 'Office', 'Hybrid', 'Not Applicable'
  ];

  const foodHabits = [
    'Vegetarian', 'Non-vegetarian', 'Vegan', 'Flexitarian', 'Other'
  ];

  const relationshipStatuses = [
    'Single', 'In a relationship', 'Married', 'It\'s complicated', 'Prefer not to say'
  ];

  const availabilityOptions = [
    'Always available', 'Working hours', 'Evenings', 'Weekends', 'Irregular'
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Coffee className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Lifestyle</h2>
        <p className="text-gray-600">Help us understand your daily routine and preferences</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Work/Study Status
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {workStatuses.map((status) => (
              <label key={status} className="cursor-pointer">
                <input
                  {...register('work_status')}
                  type="radio"
                  value={status}
                  className="sr-only peer"
                />
                <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
                  <span className="text-sm font-medium">{status}</span>
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Work Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {workStyles.map((style) => (
              <label key={style} className="cursor-pointer">
                <input
                  {...register('work_style')}
                  type="radio"
                  value={style}
                  className="sr-only peer"
                />
                <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
                  <span className="text-sm font-medium">{style}</span>
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Food Habits
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {foodHabits.map((habit) => (
              <label key={habit} className="cursor-pointer">
                <input
                  {...register('food_habits')}
                  type="radio"
                  value={habit}
                  className="sr-only peer"
                />
                <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
                  <span className="text-sm font-medium">{habit}</span>
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Average Sleep Duration (hours)
          </label>
          <input
            {...register('sleep_duration', { valueAsNumber: true })}
            type="range"
            min="4"
            max="12"
            step="1"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>4h</span>
            <span>6h</span>
            <span>8h</span>
            <span>10h</span>
            <span>12h</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Relationship Status
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relationshipStatuses.map((status) => (
              <label key={status} className="cursor-pointer">
                <input
                  {...register('relationship_status')}
                  type="radio"
                  value={status}
                  className="sr-only peer"
                />
                <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
                  <span className="text-sm font-medium">{status}</span>
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            When are you usually available to chat?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availabilityOptions.map((option) => (
              <label key={option} className="cursor-pointer">
                <input
                  {...register('availability')}
                  type="radio"
                  value={option}
                  className="sr-only peer"
                />
                <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
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
          transition={{ delay: 0.7 }}
          type="submit"
          className="w-full bg-gradient-to-r from-accent-500 to-primary-500 text-white py-4 px-6 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  );
}