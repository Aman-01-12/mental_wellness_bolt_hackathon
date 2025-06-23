import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { PersonalityStep } from './steps/PersonalityStep';
import { LifestyleStep } from './steps/LifestyleStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { PrivacyStep } from './steps/PrivacyStep';
import { CompletionStep } from './steps/CompletionStep';

const steps = [
  'welcome',
  'basic-info',
  'personality',
  'lifestyle',
  'preferences',
  'privacy',
  'completion'
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const { updateProfile } = useAuthStore();

  const handleNext = (stepData?: any) => {
    if (stepData) {
      setFormData(prev => ({ ...prev, ...stepData }));
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Explicitly construct user data object to avoid circular references
      const userData = {
        display_name: formData.display_name,
        age_range: formData.age_range,
        gender: formData.gender,
        personality_traits: formData.personality_traits,
        work_status: formData.work_status,
        work_style: formData.work_style,
        food_habits: formData.food_habits,
        sleep_duration: formData.sleep_duration,
        relationship_status: formData.relationship_status,
        communication_style: formData.communication_style,
        support_type: formData.support_type,
        availability: formData.availability,
        mental_health_background: formData.mental_health_background,
        privacy_settings: formData.privacy_settings,
        onboarding_completed: true
      };

      await updateProfile(userData);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const renderStep = () => {
    switch (steps[currentStep]) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} />;
      case 'basic-info':
        return <BasicInfoStep onNext={handleNext} data={formData} />;
      case 'personality':
        return <PersonalityStep onNext={handleNext} data={formData} />;
      case 'lifestyle':
        return <LifestyleStep onNext={handleNext} data={formData} />;
      case 'preferences':
        return <PreferencesStep onNext={handleNext} data={formData} />;
      case 'privacy':
        return <PrivacyStep onNext={handleNext} data={formData} />;
      case 'completion':
        return <CompletionStep onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 min-h-[600px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <div className="text-sm text-gray-400">
                Use the form above to continue
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}