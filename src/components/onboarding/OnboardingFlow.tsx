import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PersonalityStep } from './steps/PersonalityStep';
import { LifestyleStep } from './steps/LifestyleStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { PrivacyStep } from './steps/PrivacyStep';

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
    if (stepData && typeof stepData === 'object' && !('window' in stepData) && !('nativeEvent' in stepData)) {
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
      await updateProfile({
        ...formData,
        onboarding_completed: true
      });
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
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors bg-transparent focus:outline-none"
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

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-6"
      >
        <Heart className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-gray-900 mb-4"
      >
        Welcome to MindSpace
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-gray-600 mb-8 max-w-md mx-auto"
      >
        We're here to support your mental wellbeing journey. Let's get you started with a quick setup.
      </motion.p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 px-6 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
      >
        <span>Let's Get Started</span>
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

function BasicInfoStep({ onNext, data }: { onNext: (data: any) => void; data: any }) {
  const [displayName, setDisplayName] = useState(data.display_name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ display_name: displayName });
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h2>
        <p className="text-gray-600">This helps us personalize your experience</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name (Optional)
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="How would you like to be called? (can be anonymous)"
          />
          <p className="mt-1 text-xs text-gray-500">
            This can be your real name, nickname, or any anonymous name you prefer
          </p>
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

function CompletionStep({ onComplete }: { onComplete: () => Promise<void> }) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-gray-900 mb-4"
      >
        You're All Set! 🎉
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-gray-600 mb-8 max-w-md mx-auto"
      >
        Welcome to MindSpace! You can now start connecting with our supportive community.
      </motion.p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={handleComplete}
        disabled={isCompleting}
        className="w-full bg-gradient-to-r from-success-500 to-primary-500 text-white py-4 px-6 rounded-2xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isCompleting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Enter MindSpace</span>
            <Heart className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </div>
  );
}