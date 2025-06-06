import { useState, useMemo,useEffect } from "react"
interface Artist {
    rank: number;
    channel_name: string;
    channel_id: string;
    subscribers: number;
    total_views: number;
    video_count: number;
    avg_views_per_video: number;
    recent_avg_views: number;
    recent_avg_likes: number;
    recent_engagement_rate: number;
    momentum_score: number;
    upload_frequency_per_month: number;
    latest_video_days_ago: number;
    popularity_score: number;
    subscribers_per_year: number;
    channel_age_years: number;
    description: string;
    status: 'hot' | 'rising' | 'stable' | 'declining' | 'dormant';
  }
  
  interface AnalyticsData {
    metadata: {
      total_artists: number;
      analysis_timestamp: string;
      data_source: string;
      script_version: string;
    };
    summary_stats: {
      average_subscribers: number;
      top_performer: { name: string; subscribers: number; };
      highest_engagement: { name: string; engagement_rate: number; };
      best_momentum: { name: string; momentum_score: number; };
      most_active: { name: string; upload_frequency: number; };
      active_channels_count: number;
      growing_channels_count: number;
    };
    artists: Artist[];
  }

  export const useArtistData = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await fetch('/data/artist_analytics.json');
          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }
          const jsonData: AnalyticsData = await response.json();
          setData(jsonData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, []);
  
    return { data, loading, error };
  };