import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowLeft, CheckCircle, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';
import { useAuthStore } from '../../store/authStore';
import { useForm } from 'react-hook-form';

const AGE_RANGES = [
  '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
];
const GENDER_OPTIONS = [
  'Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'
];
const PERSONALITY_TRAITS = [
  'Introvert', 'Extrovert', 'Ambivert', 'Shy', 'Outgoing', 'Empathetic',
  'Analytical', 'Creative', 'Optimistic', 'Realistic', 'Adventurous', 'Cautious'
];
const COMMUNICATION_STYLES = [
  'Casual', 'Formal', 'Empathetic', 'Direct', 'Supportive', 'Humorous'
];
const SUPPORT_TYPES = [
  'Good Listener', 'Advice Giver', 'Companion', 'Motivator', 'Problem Solver', 'Just Vibe'
];
const WORK_STATUSES = [
  'Student', 'Working Professional', 'Freelancer', 'Unemployed', 'Retired', 'Other'
];
const WORK_STYLES = [
  'Remote', 'Office', 'Hybrid', 'Not Applicable'
];
const FOOD_HABITS = [
  'Vegetarian', 'Non-vegetarian', 'Vegan', 'Flexitarian', 'Other'
];
const RELATIONSHIP_STATUSES = [
  'Single', 'In a relationship', 'Married', "It's complicated", 'Prefer not to say'
];
const AVAILABILITY_OPTIONS = [
  'Always available', 'Working hours', 'Evenings', 'Weekends', 'Irregular'
];

function formatTraits(traits: string[] | null) {
  if (!traits || traits.length === 0) return '—';
  return traits.join(', ');
}

function formatCheckboxObj(obj: any, labels: Record<string, string>) {
  if (!obj) return '—';
  return Object.entries(labels)
    .filter(([key]) => obj[key])
    .map(([_, label]) => label)
    .join(', ') || '—';
}

function safeFormatTraits(val: any) {
  if (Array.isArray(val)) return formatTraits(val);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return formatTraits(parsed);
    } catch {}
    // fallback: treat as single value
    return formatTraits([val]);
  }
  return formatTraits(null);
}

export function ProfilePage() {
  const { profile, updateProfile } = useAuthStore();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      display_name: profile?.display_name || '',
      ai_companion_name: profile?.ai_companion_name || '',
      age_range: profile?.age_range || '',
      gender: profile?.gender || '',
      personality_traits: profile?.personality_traits || [],
      communication_style: profile?.communication_style || '',
      support_type: profile?.support_type || '',
      work_status: profile?.work_status || '',
      work_style: profile?.work_style || '',
      food_habits: profile?.food_habits || '',
      sleep_duration: profile?.sleep_duration || 8,
      relationship_status: profile?.relationship_status || '',
      availability: profile?.availability || '',
      mental_health_background: profile?.mental_health_background || {
        has_experience: false,
        overcome_challenges: false,
        comfortable_sharing: false,
        professional_help: false,
      },
      privacy_settings: profile?.privacy_settings || {
        share_age_range: true,
        share_gender: false,
        share_personality_traits: true,
        share_work_status: false,
        share_relationship_status: false,
        share_mental_health_background: false,
        allow_matching: true,
        anonymous_mode: true,
      },
    }
  });

  const watchedTraits = watch('personality_traits') || [];
  const watchedMentalHealth = watch('mental_health_background') || {};
  const watchedPrivacy = watch('privacy_settings') || {};

  const handleTraitToggle = (trait: string) => {
    const currentTraits = watchedTraits;
    const newTraits = currentTraits.includes(trait)
      ? currentTraits.filter((t: string) => t !== trait)
      : [...currentTraits, trait];
    setValue('personality_traits', newTraits);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      await updateProfile(data);
      setSuccess(true);
      setEditMode(false);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Reset form to profile values on cancel
  const handleCancel = () => {
    reset({
      display_name: profile?.display_name || '',
      ai_companion_name: profile?.ai_companion_name || '',
      age_range: profile?.age_range || '',
      gender: profile?.gender || '',
      personality_traits: profile?.personality_traits || [],
      communication_style: profile?.communication_style || '',
      support_type: profile?.support_type || '',
      work_status: profile?.work_status || '',
      work_style: profile?.work_style || '',
      food_habits: profile?.food_habits || '',
      sleep_duration: profile?.sleep_duration || 8,
      relationship_status: profile?.relationship_status || '',
      availability: profile?.availability || '',
      mental_health_background: profile?.mental_health_background || {
        has_experience: false,
        overcome_challenges: false,
        comfortable_sharing: false,
        professional_help: false,
      },
      privacy_settings: profile?.privacy_settings || {
        share_age_range: true,
        share_gender: false,
        share_personality_traits: true,
        share_work_status: false,
        share_relationship_status: false,
        share_mental_health_background: false,
        allow_matching: true,
        anonymous_mode: true,
      },
    });
    setEditMode(false);
  };

  // Labels for checkboxes
  const mentalHealthLabels = {
    has_experience: 'Has experience with mental health challenges',
    overcome_challenges: 'Overcame significant challenges',
    comfortable_sharing: 'Comfortable sharing journey',
    professional_help: 'Sought professional help',
  };
  const privacyLabels = {
    share_age_range: 'Share Age Range',
    share_gender: 'Share Gender',
    share_personality_traits: 'Share Personality Traits',
    share_work_status: 'Share Work/Study Status',
    share_relationship_status: 'Share Relationship Status',
    share_mental_health_background: 'Share Mental Health Experience',
    allow_matching: 'Allow Peer Matching',
    anonymous_mode: 'Anonymous Mode',
  };

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-primary-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">My Profile</h1>
                <p className="text-sm text-gray-500 dark:text-gray-300">Manage your preferences and privacy settings</p>
              </div>
            </div>
            {!editMode && (
              <button
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-sm"
                onClick={() => setEditMode(true)}
              >
                <Pencil className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </div>

          {!editMode ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <span className="block text-xs text-gray-500 mb-1">Display Name</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.display_name || '—'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">AI Companion Name</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.ai_companion_name || 'Alex'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Age Range</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.age_range || '—'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Gender</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.gender || '—'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Personality Traits</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{formatTraits(profile?.personality_traits ?? null)}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Communication Style</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{safeFormatTraits(profile?.communication_style)}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Support Type</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{safeFormatTraits(profile?.support_type)}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Work/Study Status</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.work_status || '—'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Work Style</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.work_style || '—'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Food Habits</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.food_habits || '—'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Sleep Duration</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.sleep_duration ? `${profile.sleep_duration} hours` : '—'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Relationship Status</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.relationship_status || '—'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Availability</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{profile?.availability || '—'}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Mental Health Background</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{formatCheckboxObj(profile?.mental_health_background, mentalHealthLabels)}</div>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Privacy Settings</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{formatCheckboxObj(profile?.privacy_settings, privacyLabels)}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Edit Profile</h2>
                <p className="text-gray-600 dark:text-gray-300">Update your information and preferences below</p>
              </div>
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name (Optional)</label>
                <input {...register('display_name')} type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" placeholder="How would you like to be called? (can be anonymous)" autoComplete="off" />
              </div>
              {/* AI Companion Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Companion Name (Optional)</label>
                <input {...register('ai_companion_name')} type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" placeholder="What would you like to call your AI companion? (default: Alex)" autoComplete="off" />
              </div>
              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AGE_RANGES.map((range) => (
                    <label key={range} className="cursor-pointer">
                      <input {...register('age_range')} type="radio" value={range} className="sr-only peer" />
                      <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                        <span className="text-sm font-medium">{range}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GENDER_OPTIONS.map((option) => (
                    <label key={option} className="cursor-pointer">
                      <input {...register('gender')} type="radio" value={option} className="sr-only peer" />
                      <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                        <span className="text-sm font-medium">{option}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Personality Traits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personality Traits</label>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_TRAITS.map((trait) => (
                    <button
                      type="button"
                      key={trait}
                      onClick={() => handleTraitToggle(trait)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${watchedTraits.includes(trait) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-primary-50'}`}
                      aria-pressed={watchedTraits.includes(trait)}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>
              {/* Communication Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Communication Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COMMUNICATION_STYLES.map((style) => (
                    <label key={style} className="cursor-pointer">
                      <input {...register('communication_style')} type="radio" value={style} className="sr-only peer" />
                      <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                        <span className="text-sm font-medium">{style}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Support Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Support Type You Prefer to Give</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SUPPORT_TYPES.map((type) => (
                    <label key={type} className="cursor-pointer">
                      <input {...register('support_type')} type="radio" value={type} className="sr-only peer" />
                      <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                        <span className="text-sm font-medium">{type}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Work/Study Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work/Study Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {WORK_STATUSES.map((status) => (
                    <label key={status} className="cursor-pointer">
                      <input {...register('work_status')} type="radio" value={status} className="sr-only peer" />
                      <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
                        <span className="text-sm font-medium">{status}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Work Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WORK_STYLES.map((style) => (
                    <label key={style} className="cursor-pointer">
                      <input {...register('work_style')} type="radio" value={style} className="sr-only peer" />
                      <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
                        <span className="text-sm font-medium">{style}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Food Habits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Food Habits</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FOOD_HABITS.map((habit) => (
                    <label key={habit} className="cursor-pointer">
                      <input {...register('food_habits')} type="radio" value={habit} className="sr-only peer" />
                      <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
                        <span className="text-sm font-medium">{habit}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Sleep Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Average Sleep Duration (hours)</label>
                <input {...register('sleep_duration', { valueAsNumber: true })} type="range" min="4" max="12" step="0.5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-500" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>4h</span>
                  <span>6h</span>
                  <span>8h</span>
                  <span>10h</span>
                  <span>12h</span>
                </div>
              </div>
              {/* Relationship Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Status</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RELATIONSHIP_STATUSES.map((status) => (
                    <label key={status} className="cursor-pointer">
                      <input {...register('relationship_status')} type="radio" value={status} className="sr-only peer" />
                      <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
                        <span className="text-sm font-medium">{status}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When are you usually available to chat?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <label key={option} className="cursor-pointer">
                      <input {...register('availability')} type="radio" value={option} className="sr-only peer" />
                      <div className="p-3 border border-gray-200 rounded-xl text-center hover:border-accent-300 peer-checked:border-accent-500 peer-checked:bg-accent-50 transition-all">
                        <span className="text-sm font-medium">{option}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Mental Health Background */}
              <div className="bg-success-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Mental Health Experience</h3>
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input {...register('mental_health_background.has_experience')} type="checkbox" className="mt-1 w-4 h-4 text-success-600 border-gray-300 rounded focus:ring-success-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">I have experience with mental health challenges</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">You've personally dealt with anxiety, depression, stress, or other mental health issues</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input {...register('mental_health_background.overcome_challenges')} type="checkbox" className="mt-1 w-4 h-4 text-success-600 border-gray-300 rounded focus:ring-success-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">I've overcome significant mental health challenges</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">You've successfully worked through difficult periods and can share your experience</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input {...register('mental_health_background.comfortable_sharing')} type="checkbox" className="mt-1 w-4 h-4 text-success-600 border-gray-300 rounded focus:ring-success-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">I'm comfortable sharing my mental health journey</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">You're open to discussing your experiences to help others</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input {...register('mental_health_background.professional_help')} type="checkbox" className="mt-1 w-4 h-4 text-success-600 border-gray-300 rounded focus:ring-success-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">I've sought professional help (therapy, counseling, etc.)</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">You have experience with professional mental health services</p>
                    </div>
                  </label>
                </div>
              </div>
              {/* Privacy Settings */}
              <div className="bg-primary-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Privacy & Sharing</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Anonymous Mode</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Use only display name, hide all other identifying info</p>
                    </div>
                    <input {...register('privacy_settings.anonymous_mode')} type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Allow Peer Matching</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Let others find and connect with you for support</p>
                    </div>
                    <input {...register('privacy_settings.allow_matching')} type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                  </label>
                </div>
              </div>
              {/* Error Message */}
              {error && <div className="bg-red-100 text-red-700 rounded-xl p-2 text-sm">{error}</div>}
              {/* Success Message */}
              {success && (
                <div className="flex items-center justify-center gap-2 text-success-700 bg-success-50 rounded-xl p-3 text-sm">
                  <CheckCircle className="w-5 h-5" /> Profile updated successfully!
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handleCancel} className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-60" disabled={isSubmitting || loading}>{isSubmitting || loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}