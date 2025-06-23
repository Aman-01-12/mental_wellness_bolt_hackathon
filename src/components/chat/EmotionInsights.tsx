import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Heart, AlertTriangle, Lightbulb, Target, Zap } from 'lucide-react';
import { emotionService, type EmotionAnalysis } from '../../services/emotionService';

interface EmotionInsightsProps {
  emotionAnalysis: EmotionAnalysis;
}

export function EmotionInsights({ emotionAnalysis }: EmotionInsightsProps) {
  const { mental_health_indicators, all_emotions, primary_emotion, confidence, context_analysis } = emotionAnalysis;
  
  const recommendations = emotionService.getRecommendations(mental_health_indicators);

  const getIndicatorColor = (level: number) => {
    if (level < 0.3) return 'bg-green-500';
    if (level < 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIndicatorBgColor = (level: number) => {
    if (level < 0.3) return 'bg-green-50 border-green-200';
    if (level < 0.6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity < 0.4) return 'text-blue-600';
    if (intensity < 0.7) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-primary-500 rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Emotion Insights</h2>
          <p className="text-sm text-gray-500">AI-powered emotion analysis</p>
        </div>
      </div>

      {/* Primary Emotion */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Primary Emotion</span>
          <span className="text-xs text-gray-500">{Math.round(confidence * 100)}% confidence</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{emotionService.getEmotionEmoji(primary_emotion)}</span>
          <div className="flex-1">
            <div className="text-lg font-semibold text-gray-900 capitalize">{primary_emotion}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Context Analysis */}
      {context_analysis && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Context Analysis</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Emotional Tone</div>
              <div className="text-sm font-semibold text-gray-900 capitalize">{context_analysis.tone}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Intensity</div>
              <div className={`text-sm font-semibold ${getIntensityColor(context_analysis.intensity)}`}>
                {context_analysis.intensity < 0.4 ? 'Mild' : 
                 context_analysis.intensity < 0.7 ? 'Moderate' : 'High'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Complexity</div>
              <div className="text-sm font-semibold text-gray-900">
                {context_analysis.emotional_complexity < 1.5 ? 'Simple' :
                 context_analysis.emotional_complexity < 2.5 ? 'Moderate' : 'Complex'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Themes</div>
              <div className="text-sm font-semibold text-gray-900">
                {context_analysis.underlying_themes.length || 'None'}
              </div>
            </div>
          </div>
          
          {context_analysis.underlying_themes.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-2">Detected Themes:</div>
              <div className="flex flex-wrap gap-1">
                {context_analysis.underlying_themes.map((theme, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full capitalize"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Emotions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4" />
          <span>Detected Emotions</span>
        </h3>
        <div className="space-y-2">
          {all_emotions.slice(0, 4).map((emotion, index) => (
            <motion.div
              key={emotion.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm">{emotionService.getEmotionEmoji(emotion.label)}</span>
                <span className="text-sm text-gray-700 capitalize">{emotion.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-primary-400 to-secondary-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${emotion.score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">
                  {Math.round(emotion.score * 100)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mental Health Indicators */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <Heart className="w-4 h-4" />
          <span>Wellbeing Indicators</span>
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Anxiety Level', value: mental_health_indicators.anxiety_level, key: 'anxiety' },
            { label: 'Depression Level', value: mental_health_indicators.depression_level, key: 'depression' },
            { label: 'Stress Level', value: mental_health_indicators.stress_level, key: 'stress' },
            { label: 'Positive Sentiment', value: mental_health_indicators.positive_sentiment, key: 'positive' }
          ].map((indicator) => (
            <div key={indicator.key} className={`p-3 rounded-lg border ${getIndicatorBgColor(indicator.value)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{indicator.label}</span>
                <span className="text-xs text-gray-600">
                  {emotionService.getMentalHealthLevelDescription(indicator.value)}
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getIndicatorColor(indicator.value)}`}
                  style={{ width: `${indicator.value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Personalized Suggestions</span>
          </h3>
          <div className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-lg p-3 border border-accent-200"
              >
                <div className="flex items-start space-x-2">
                  <Zap className="w-3 h-3 text-accent-600 mt-1 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            This analysis uses advanced AI to understand emotional context and tone. 
            It's for informational purposes only and not a substitute for professional mental health assessment.
          </p>
        </div>
      </div>
    </motion.div>
  );
}