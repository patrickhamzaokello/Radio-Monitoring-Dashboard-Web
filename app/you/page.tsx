// components/ArtistDashboard.tsx
'use client';
import React from 'react';
import { useArtistData } from '@/hooks/useArtistData';

const ArtistDashboard: React.FC = () => {
  const { data, loading, error } = useArtistData();

  if (loading) return <div className="p-4">Loading analytics...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-4">No data available</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Artist Analytics Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Artists" 
            value={data.metadata.total_artists} 
          />
          <StatCard 
            title="Avg Subscribers" 
            value={data.summary_stats.average_subscribers.toLocaleString()} 
          />
          <StatCard 
            title="Active Channels" 
            value={`${data.summary_stats.active_channels_count}/${data.metadata.total_artists}`} 
          />
          <StatCard 
            title="Growing Channels" 
            value={`${data.summary_stats.growing_channels_count}/${data.metadata.total_artists}`} 
          />
        </div>
      </div>

      {/* Artist Rankings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Artist Rankings</h2>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(data.metadata.analysis_timestamp).toLocaleString()}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artist</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Momentum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.artists.map((artist) => (
                <ArtistRow key={artist.channel_id} artist={artist} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const ArtistRow: React.FC<{ artist: any }> = ({ artist }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'rising': return 'bg-green-100 text-green-800';
      case 'stable': return 'bg-blue-100 text-blue-800';
      case 'declining': return 'bg-yellow-100 text-yellow-800';
      case 'dormant': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMomentumIcon = (score: number) => {
    if (score > 1) return '📈';
    if (score > 0) return '↗️';
    if (score < -1) return '📉';
    return '➡️';
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">#{artist.rank}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{artist.channel_name}</div>
          <div className="text-sm text-gray-500">{artist.video_count} videos</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{artist.subscribers.toLocaleString()}</div>
        <div className="text-sm text-gray-500">{artist.subscribers_per_year.toLocaleString()}/year</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{artist.recent_engagement_rate}%</div>
        <div className="text-sm text-gray-500">{artist.recent_avg_views.toLocaleString()} avg views</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="mr-1">{getMomentumIcon(artist.momentum_score)}</span>
          <span className="text-sm text-gray-900">{artist.momentum_score > 0 ? '+' : ''}{artist.momentum_score}%</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(artist.status)}`}>
          {artist.status}
        </span>
      </td>
    </tr>
  );
};

export default ArtistDashboard;