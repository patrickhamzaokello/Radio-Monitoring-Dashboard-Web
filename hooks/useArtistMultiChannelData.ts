import { useState, useEffect } from "react";

interface Channel {
  channel_name: string;
  channel_id: string;
  data_fetched_at: string;
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
  channel_age_years: number;
  popularity_score: number;
  subscribers_per_year: number;
  description: string;
  status: 'hot' | 'rising' | 'stable' | 'declining' | 'dormant';
  artist_name: string;
}

interface Artist {
  artist_name: string;
  channel_count: number;
  primary_channel_name: string;
  primary_channel_id: string;
  channels: {
    name: string;
    id: string;
    subscribers: number;
  }[];
  data_fetched_at: string;
  total_subscribers: number;
  total_views: number;
  total_videos: number;
  avg_views_per_video: number;
  recent_avg_views: number;
  recent_engagement_rate: number;
  momentum_score: number;
  upload_frequency_per_month: number;
  latest_video_days_ago: number;
  avg_channel_age_years: number;
  popularity_score: number;
  subscribers_per_year: number;
  status: 'hot' | 'rising' | 'stable' | 'declining' | 'dormant';
  individual_channels: Channel[];
  rank: number;
}

interface ArtistSummaryStats {
  average_total_subscribers: number;
  top_performer: {
    name: string;
    total_subscribers: number;
    channel_count: number;
  };
  highest_engagement: {
    name: string;
    engagement_rate: number;
  };
  best_momentum: {
    name: string;
    momentum_score: number;
  };
  most_active: {
    name: string;
    upload_frequency: number;
  };
  active_artists_count: number;
  growing_artists_count: number;
  multi_channel_artists: number;
}

interface ArtistAnalyticsData {
  metadata: {
    total_artists: number;
    total_channels: number;
    analysis_timestamp: string;
    data_source: string;
    script_version: string;
  };
  artist_summary_stats: ArtistSummaryStats;
  artists: Artist[];
  individual_channels: Channel[];
}

export const useArtistMultiAnalyticsData = () => {
  const [statsdata, setData] = useState<ArtistAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/artist_analytics_multi_channel.json');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const jsonData: ArtistAnalyticsData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { statsdata, loading, error };
};