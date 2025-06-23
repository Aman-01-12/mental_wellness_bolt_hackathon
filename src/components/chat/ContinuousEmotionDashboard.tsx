import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, TrendingUp, AlertTriangle, Clock, Target, Zap, 
  BarChart3, Activity, Shield, Heart, ChevronDown, ChevronUp,
  Download, RotateCcw, Eye
} from 'lucide-react';
import { type ComprehensiveEmotionalAssessment } from '../../services/continuousEmotionService';

interface ContinuousEmotionDashboardProps {
  assessment: ComprehensiveEmotionalAssessment;
  onExportData: () => any;
  onResetAnalysis: () => void;
}

export function ContinuousEmotionDashboard({ 
  assessment, 
  onExportData, 
  onResetAnalysis 
}: ContinuousEmotionDashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['realtime']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'volatile': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  const handleExport = () => {
    const data = onExportData();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emotional-analysis-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-primary-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Continuous Emotion Analysis</h2>
              <p className="text-purple-100">AI-powered psychological monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              title="Export Data"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onResetAnalysis}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              title="Reset Analysis"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Real-time State */}
        <div>
          <button
            onClick={() => toggleSection('realtime')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl hover:from-primary-100 hover:to-secondary-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Real-time Emotional State</h3>
            </div>
            {expandedSections.has('realtime') ? 
              <ChevronUp className="w-5 h-5 text-gray-500" /> : 
              <ChevronDown className="w-5 h-5 text-gray-500" />
            }
          </button>

          <AnimatePresence>
            {expandedSections.has('realtime') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 grid grid-cols-2 gap-4"
              >
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Primary Emotion</div>
                  <div className="text-xl font-bold text-gray-900 capitalize">
                    {assessment.realTimeState.primaryEmotion}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                      style={{ width: `${assessment.realTimeState.confidence * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(assessment.realTimeState.confidence * 100)}% confidence
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Emotional Intensity</div>
                  <div className="text-xl font-bold text-gray-900">
                    {assessment.realTimeState.intensity < 0.4 ? 'Mild' :
                     assessment.realTimeState.intensity < 0.7 ? 'Moderate' : 'High'}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full"
                      style={{ width: `${assessment.realTimeState.intensity * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Emotional Stability</div>
                  <div className="text-xl font-bold text-gray-900">
                    {assessment.realTimeState.stability < 0.4 ? 'Unstable' :
                     assessment.realTimeState.stability < 0.7 ? 'Moderate' : 'Stable'}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-red-400 to-green-500 h-2 rounded-full"
                      style={{ width: `${assessment.realTimeState.stability * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Overall Status</div>
                  <div className={`text-xl font-bold ${
                    assessment.realTimeState.intensity > 0.7 ? 'text-red-600' :
                    assessment.realTimeState.intensity > 0.4 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {assessment.realTimeState.intensity > 0.7 ? 'Needs Attention' :
                     assessment.realTimeState.intensity > 0.4 ? 'Monitoring' : 'Stable'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contextual Factors */}
        <div>
          <button
            onClick={() => toggleSection('context')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-secondary-50 to-accent-50 rounded-xl hover:from-secondary-100 hover:to-accent-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-secondary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Contextual Analysis</h3>
            </div>
            {expandedSections.has('context') ? 
              <ChevronUp className="w-5 h-5 text-gray-500" /> : 
              <ChevronDown className="w-5 h-5 text-gray-500" />
            }
          </button>

          <AnimatePresence>
            {expandedSections.has('context') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Conversation Flow</div>
                    <div className="text-sm text-gray-900 capitalize">
                      {assessment.contextualFactors.conversationFlow}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Response Patterns</div>
                    <div className="text-sm text-gray-900 capitalize">
                      {assessment.contextualFactors.responsePatterns}
                    </div>
                  </div>
                </div>

                {assessment.contextualFactors.languageShifts.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Language Shifts Detected</div>
                    <div className="flex flex-wrap gap-1">
                      {assessment.contextualFactors.languageShifts.map((shift, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {shift}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.contextualFactors.culturalIndicators.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Cultural Indicators</div>
                    <div className="flex flex-wrap gap-1">
                      {assessment.contextualFactors.culturalIndicators.map((indicator, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trend Analysis */}
        <div>
          <button
            onClick={() => toggleSection('trends')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-accent-50 to-success-50 rounded-xl hover:from-accent-100 hover:to-success-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-accent-600" />
              <h3 className="text-lg font-semibold text-gray-900">Emotional Trends</h3>
            </div>
            {expandedSections.has('trends') ? 
              <ChevronUp className="w-5 h-5 text-gray-500" /> : 
              <ChevronDown className="w-5 h-5 text-gray-500" />
            }
          </button>

          <AnimatePresence>
            {expandedSections.has('trends') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Trend Direction</div>
                    <div className={`text-lg font-bold ${getTrendColor(assessment.trendAnalysis.trend)}`}>
                      {assessment.trendAnalysis.trend.charAt(0).toUpperCase() + assessment.trendAnalysis.trend.slice(1)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${
                          assessment.trendAnalysis.trend === 'improving' ? 'bg-green-500' :
                          assessment.trendAnalysis.trend === 'declining' ? 'bg-red-500' :
                          assessment.trendAnalysis.trend === 'volatile' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${assessment.trendAnalysis.trendStrength * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Trend Strength</div>
                    <div className="text-lg font-bold text-gray-900">
                      {assessment.trendAnalysis.trendStrength < 0.3 ? 'Weak' :
                       assessment.trendAnalysis.trendStrength < 0.7 ? 'Moderate' : 'Strong'}
                    </div>
                  </div>
                </div>

                {assessment.trendAnalysis.keyChanges.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">Key Changes Detected</div>
                    <div className="space-y-2">
                      {assessment.trendAnalysis.keyChanges.slice(0, 3).map((change, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm text-gray-900">{change.change}</div>
                            <div className="text-xs text-gray-500">
                              {change.timestamp.toLocaleTimeString()} - Significance: {Math.round(change.significance * 100)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.trendAnalysis.patterns.timeBasedPatterns.length > 0 && (
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Time-based Patterns</div>
                    <div className="space-y-1">
                      {assessment.trendAnalysis.patterns.timeBasedPatterns.map((pattern, index) => (
                        <div key={index} className="text-sm text-gray-700">• {pattern}</div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Risk Assessment */}
        <div>
          <button
            onClick={() => toggleSection('risk')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-error-50 to-warning-50 rounded-xl hover:from-error-100 hover:to-warning-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-error-600" />
              <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(assessment.riskAssessment.level)}`}>
                {assessment.riskAssessment.level.toUpperCase()}
              </span>
            </div>
            {expandedSections.has('risk') ? 
              <ChevronUp className="w-5 h-5 text-gray-500" /> : 
              <ChevronDown className="w-5 h-5 text-gray-500" />
            }
          </button>

          <AnimatePresence>
            {expandedSections.has('risk') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {assessment.riskAssessment.factors.length > 0 && (
                  <div className={`rounded-lg p-4 border ${getRiskColor(assessment.riskAssessment.level)}`}>
                    <div className="text-sm font-medium text-gray-700 mb-3">Risk Factors</div>
                    <div className="space-y-2">
                      {assessment.riskAssessment.factors.map((factor, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-gray-700">{factor}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.riskAssessment.recommendations.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">Professional Recommendations</div>
                    <div className="space-y-2">
                      {assessment.riskAssessment.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Heart className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-gray-700">{rec}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Support Actions */}
        <div>
          <button
            onClick={() => toggleSection('support')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-success-50 to-primary-50 rounded-xl hover:from-success-100 hover:to-primary-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-success-600" />
              <h3 className="text-lg font-semibold text-gray-900">Support Actions</h3>
            </div>
            {expandedSections.has('support') ? 
              <ChevronUp className="w-5 h-5 text-gray-500" /> : 
              <ChevronDown className="w-5 h-5 text-gray-500" />
            }
          </button>

          <AnimatePresence>
            {expandedSections.has('support') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-700 mb-3">Immediate Actions</div>
                  <div className="space-y-2">
                    {assessment.supportActions.immediate.map((action, index) => (
                      <div key={index} className="text-sm text-red-600">• {action}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-700 mb-3">Short-term Actions</div>
                  <div className="space-y-2">
                    {assessment.supportActions.shortTerm.map((action, index) => (
                      <div key={index} className="text-sm text-yellow-600">• {action}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-700 mb-3">Long-term Actions</div>
                  <div className="space-y-2">
                    {assessment.supportActions.longTerm.map((action, index) => (
                      <div key={index} className="text-sm text-green-600">• {action}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}