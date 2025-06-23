import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<SignUpFormData>();

  const password = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password);
    } catch (error: any) {
      setError('root', {
        message: error.message || 'Failed to create account'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            type="email"
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="Enter your email"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-error-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain uppercase, lowercase, and number'
              }
            })}
            type={showPassword ? 'text' : 'password'}
            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-error-500">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
            type={showConfirmPassword ? 'text' : 'password'}
            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-error-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex items-start space-x-3">
        <div className="relative">
          <input
            {...register('agreeToTerms', {
              required: 'You must agree to the terms and privacy policy'
            })}
            type="checkbox"
            className="sr-only"
            id="agreeToTerms"
          />
          <label
            htmlFor="agreeToTerms"
            className="flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded cursor-pointer hover:border-primary-400 transition-colors"
          >
            <Check className="w-3 h-3 text-primary-500 opacity-0 peer-checked:opacity-100 transition-opacity" />
          </label>
        </div>
        <label htmlFor="agreeToTerms" className="text-sm text-gray-600 cursor-pointer">
          I agree to the{' '}
          <a href="#" className="text-primary-500 hover:text-primary-600">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary-500 hover:text-primary-600">Privacy Policy</a>
        </label>
      </div>
      {errors.agreeToTerms && (
        <p className="text-sm text-error-500">{errors.agreeToTerms.message}</p>
      )}

      {errors.root && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
          <p className="text-sm text-error-600">{errors.root.message}</p>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <LoadingSpinner size="small" color="white" />
        ) : (
          'Create Account'
        )}
      </motion.button>
    </form>
  );
}