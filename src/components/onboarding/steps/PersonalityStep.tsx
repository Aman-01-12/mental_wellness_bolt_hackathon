import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Brain, ArrowRight } from 'lucide-react';

interface PersonalityStepProps {
  onNext: (data: any) => void;
  data: any;
}

interface FormData {
  personality_traits: string[];
  communication_style: string[];
  support_type: string[];
}

export function PersonalityStep({ onNext, data }: PersonalityStepProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      personality_traits: data.personality_traits || [],
      communication_style: data.communication_style || [],
      support_type: data.support_type || []
    }
  });

  const watchedTraits = watch('personality_traits') || [];
  const watchedCommunication = watch('communication_style') || [];
  const watchedSupport = watch('support_type') || [];

  const onSubmit = (formData: FormData) => {
    onNext(formData);
  };

  const handleTraitToggle = (trait: string) => {
    const currentTraits = watchedTraits;
    const newTraits = currentTraits.includes(trait)
      ? currentTraits.filter(t => t !== trait)
      : [...currentTraits, trait];
    setValue('personality_traits', newTraits);
  };

  const handleCommunicationToggle = (style: string) => {
    const currentStyles = watchedCommunication;
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    setValue('communication_style', newStyles);
  };

  const handleSupportToggle = (type: string) => {
    const currentTypes = watchedSupport;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    setValue('support_type', newTypes);
  };

  const personalityTraits = [
    'Introvert', 'Extrovert', 'Ambivert', 'Shy', 'Outgoing', 'Empathetic',
    'Analytical', 'Creative', 'Optimistic', 'Realistic', 'Adventurous', 'Cautious'
  ];

  const communicationStyles = [
    'Casual', 'Formal', 'Empathetic', 'Direct', 'Supportive', 'Humorous'
  ];

  const supportTypes = [
    'Good Listener', 'Advice Giver', 'Companion', 'Motivator', 'Problem Solver', 'Just Vibe'
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Personality</h2>
        <p className="text-gray-600">Help us understand how you connect with others</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Personality Traits (Select all that apply)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {personalityTraits.map((trait) => (
              <button
                key={trait}
                type="button"
                onClick={() => handleTraitToggle(trait)}
                className={`p-3 border rounded-xl text-center transition-all font-medium text-sm
                  ${watchedTraits.includes(trait)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-green-400'}
                `}
              >
                {trait}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Communication Style (Select all that apply)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {communicationStyles.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => handleCommunicationToggle(style)}
                className={`p-3 border rounded-xl text-center transition-all font-medium text-sm
                  ${watchedCommunication.includes(style)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-green-400'}
                `}
              >
                {style}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Support Type You Prefer to Give
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {supportTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSupportToggle(type)}
                className={`p-3 border rounded-xl text-center transition-all font-medium text-sm
                  ${watchedSupport.includes(type)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-green-400'}
                `}
              >
                {type}
              </button>
            ))}
          </div>
          {errors.support_type && (
            <p className="mt-1 text-sm text-error-500">{errors.support_type.message}</p>
          )}
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          type="submit"
          className="w-full bg-gradient-to-r from-secondary-500 to-primary-500 text-white py-4 px-6 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  );
}