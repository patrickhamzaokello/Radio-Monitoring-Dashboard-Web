import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Activity, 
  Calendar,
  BarChart3,
  Target,
  Clock,
  Video
} from 'lucide-react';

const MetricsExplanation = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const metrics = [
    {
      name: "Popularity Score",
      icon: <Target className="w-4 h-4" />,
      description: "Composite ranking based on subscriber count, view performance, engagement, and momentum",
      calculation: "Weighted formula: Subscribers (25%) + Avg Views/Video (20%) + Recent Avg Views (25%) + Engagement Rate (15%) + Momentum (10%) + Upload Frequency (5%)",
      interpretation: "Higher scores indicate better overall performance across all metrics"
    },
    {
      name: "Momentum Score",
      icon: <TrendingUp className="w-4 h-4" />,
      description: "Growth trend based on recent video performance vs. historical average",
      calculation: "Compares average views of 3 most recent videos against older videos as percentage change",
      interpretation: "Positive = growing, negative = declining. Values above +5% indicate strong momentum"
    },
    {
      name: "Engagement Rate",
      icon: <Activity className="w-4 h-4" />,
      description: "Audience interaction relative to view count",
      calculation: "((Likes + Comments) / Views) × 100 for recent videos",
      interpretation: "Industry average is 1-3%. Higher rates indicate stronger audience connection"
    },
    {
      name: "Upload Frequency",
      icon: <Calendar className="w-4 h-4" />,
      description: "Content creation consistency",
      calculation: "Number of videos uploaded per month based on recent activity",
      interpretation: "Higher frequency can boost algorithm performance but quality matters more"
    },
    {
      name: "Recent Avg Views",
      icon: <Eye className="w-4 h-4" />,
      description: "Current performance indicator",
      calculation: "Average view count across the 20 most recent videos",
      interpretation: "Shows current audience reach and content performance"
    },
    {
      name: "Growth Rate",
      icon: <BarChart3 className="w-4 h-4" />,
      description: "Long-term channel development",
      calculation: "Total subscribers divided by channel age in years",
      interpretation: "Indicates sustainable growth pace. Newer channels may show higher rates"
    }
  ];

  const statusLevels = [
    {
      status: "Hot",
      color: "bg-gray-900 text-white",
      criteria: "Momentum > 5% AND Engagement > 3%",
      meaning: "Rapidly growing with high audience engagement"
    },
    {
      status: "Rising",
      color: "bg-gray-700 text-white",
      criteria: "Positive momentum AND recent activity (≤30 days)",
      meaning: "Growing steadily with consistent content"
    },
    {
      status: "Stable",
      color: "bg-gray-500 text-white",
      criteria: "Consistent performance, regular uploads",
      meaning: "Maintaining steady audience and activity"
    },
    {
      status: "Declining",
      color: "bg-gray-400 text-gray-900",
      criteria: "Momentum < -10% OR inactive > 60 days",
      meaning: "Decreasing performance or reduced activity"
    },
    {
      status: "Dormant",
      color: "bg-gray-300 text-gray-900",
      criteria: "No uploads for > 90 days",
      meaning: "Channel appears inactive"
    }
  ];

  return (
    <div className="bg-white border border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Understanding the Metrics</h3>
          <p className="text-sm text-gray-500 mt-1">
            Learn how each metric is calculated and what it means for artist performance
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            
            {/* Performance Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Performance Metrics
              </h4>
              <div className="space-y-4">
                {metrics.map((metric, index) => (
                  <div key={index} className="border-l-2 border-gray-100 pl-4">
                    <div className="flex items-center space-x-2 mb-1">
                      {metric.icon}
                      <h5 className="text-sm font-medium text-gray-900">{metric.name}</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{metric.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><span className="font-medium">How it's calculated:</span> {metric.calculation}</p>
                      <p><span className="font-medium">What it means:</span> {metric.interpretation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Levels */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Artist Status Levels
              </h4>
              <div className="space-y-3">
                {statusLevels.map((level, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${level.color} flex-shrink-0`}>
                      {level.status.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 font-medium">{level.meaning}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Criteria:</span> {level.criteria}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Freshness */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Data Freshness
                </h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• All metrics are calculated using live YouTube API data</p>
                  <p>• Recent performance based on last 20 videos</p>
                  <p>• Momentum compares latest 3 videos vs. historical average</p>
                  <p>• Multi-channel artists show aggregated metrics</p>
                </div>
              </div>

              {/* Reading Tips */}
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Reading Tips</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Focus on momentum and engagement for growth potential</p>
                  <p>• High subscriber count doesn't always mean current success</p>
                  <p>• Consistency in uploads often correlates with stability</p>
                  <p>• Compare artists within similar genres for best insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsExplanation;