"use client";
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Video,
  Calendar,
  Activity,
  BarChart3,
  Filter,
  Search,
} from "lucide-react";
import { useArtistMultiAnalyticsData } from "@/hooks/useArtistMultiChannelData";
import MetricsExplanation from "@/components/MetricsExplanation";

const Dashboard = () => {
  const { statsdata, loading, error } = useArtistMultiAnalyticsData();
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("rank");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading artist analytics...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading data:</p>
          <p className="text-gray-600">{error || "Something went wrong"}</p>
        </div>
      </div>
    );
  }

  // Handle null or missing data
  if (!statsdata || !statsdata.artists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  // Now we can safely use the data
  const data = statsdata;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getStatusColor = (status: "hot" | "rising" | "stable" | "declining" | "dormant") => {
      const colors = {
        hot: "bg-gray-900 text-white",
        rising: "bg-gray-700 text-white",
        stable: "bg-gray-500 text-white",
        declining: "bg-gray-400 text-gray-900",
        dormant: "bg-gray-300 text-gray-900",
      };
      return colors[status];
  };

  const getStatusIcon = (status: string) => {
    if (status === "hot" || status === "rising")
      return <TrendingUp className="w-3 h-3" />;
    if (status === "declining") return <TrendingDown className="w-3 h-3" />;
    return <Activity className="w-3 h-3" />;
  };

  const filteredArtists = data.artists
    .filter(
      (artist) =>
        (filterStatus === "all" || artist.status === filterStatus) &&
        artist.artist_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "rank") return a.rank - b.rank;
      if (sortBy === "subscribers")
        return b.total_subscribers - a.total_subscribers;
      if (sortBy === "engagement")
        return b.recent_engagement_rate - a.recent_engagement_rate;
      if (sortBy === "momentum") return b.momentum_score - a.momentum_score;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900">
                Artist Analytics
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {data.metadata?.analysis_timestamp || "N/A"}
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{data.metadata?.total_artists || 0} Artists</span>
              <span>•</span>
              <span>{data.metadata?.total_channels || 0} Channels</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Top Performer</p>
                <p className="text-lg font-medium text-gray-900">
                  {data.artist_summary_stats?.top_performer?.name || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  {formatNumber(
                    data.artist_summary_stats?.top_performer?.total_subscribers || 0
                  )}{" "}
                  subscribers
                </p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Highest Engagement</p>
                <p className="text-lg font-medium text-gray-900">
                  {data.artist_summary_stats?.highest_engagement?.name || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  {data.artist_summary_stats?.highest_engagement?.engagement_rate || 0}
                  %
                </p>
              </div>
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Best Momentum</p>
                <p className="text-lg font-medium text-gray-900">
                  {data.artist_summary_stats?.best_momentum?.name || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  +{data.artist_summary_stats?.best_momentum?.momentum_score || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Artists</p>
                <p className="text-lg font-medium text-gray-900">
                  {data.artist_summary_stats?.active_artists_count || 0}
                </p>
                <p className="text-sm text-gray-600">
                  of {data.metadata?.total_artists || 0} total
                </p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <MetricsExplanation />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-gray-400"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 focus:outline-none focus:border-gray-400"
          >
            <option value="rank">Sort by Rank</option>
            <option value="subscribers">Sort by Subscribers</option>
            <option value="engagement">Sort by Engagement</option>
            <option value="momentum">Sort by Momentum</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 focus:outline-none focus:border-gray-400"
          >
            <option value="all">All Status</option>
            <option value="hot">Hot</option>
            <option value="rising">Rising</option>
            <option value="stable">Stable</option>
            <option value="declining">Declining</option>
            <option value="dormant">Dormant</option>
          </select>
        </div>

        {/* Artist List */}
        <div className="space-y-4">
          {filteredArtists.map((artist, index) => (
            <div
              key={artist.artist_name}
              className="bg-white border border-gray-200 p-6 cursor-pointer hover:border-gray-300 transition-colors"
              onClick={() =>
                setSelectedArtist(
                  selectedArtist === artist.artist_name
                    ? null
                    : artist.artist_name
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-light text-gray-400">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {artist.artist_name}
                      </h3>
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium ${getStatusColor(
                          artist.status
                        )}`}
                      >
                        {getStatusIcon(artist.status)}
                        <span>{artist.status.toUpperCase()}</span>
                      </span>
                      {artist.channel_count > 1 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700">
                          {artist.channel_count} channels
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatNumber(artist.total_subscribers)} subscribers •{" "}
                      {formatNumber(artist.total_views)} views
                       •{" "}Rank #{artist.rank}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-8 text-sm">
                  <div className="text-center">
                    <div className="text-gray-900 font-medium">
                      {artist.recent_engagement_rate}%
                    </div>
                    <div className="text-gray-500">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`font-medium ${
                        artist.momentum_score >= 0
                          ? "text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {artist.momentum_score >= 0 ? "+" : ""}
                      {artist.momentum_score}%
                    </div>
                    <div className="text-gray-500">Momentum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-900 font-medium">
                      {artist.latest_video_days_ago}d
                    </div>
                    <div className="text-gray-500">Last Upload</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-900 font-medium">
                      {artist.upload_frequency_per_month}
                    </div>
                    <div className="text-gray-500">Videos/Month</div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedArtist === artist.artist_name && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Performance Metrics
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Avg Views per Video
                          </span>
                          <span className="text-gray-900">
                            {formatNumber(artist.avg_views_per_video)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Recent Avg Views
                          </span>
                          <span className="text-gray-900">
                            {formatNumber(artist.recent_avg_views)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Videos</span>
                          <span className="text-gray-900">
                            {artist.total_videos}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Channel Age</span>
                          <span className="text-gray-900">
                            {artist.avg_channel_age_years} years
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Growth Rate</span>
                          <span className="text-gray-900">
                            {formatNumber(artist.subscribers_per_year)}/year
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Channel{artist.channel_count > 1 ? "s" : ""} (
                        {artist.channel_count})
                      </h4>
                      <div className="space-y-2">
                        {artist.channels?.map((channel) => (
                          <div
                            key={channel.id}
                            className="flex justify-between items-center p-3 bg-gray-50"
                          >
                            <span className="text-sm text-gray-900">
                              {channel.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatNumber(channel.subscribers)} subs
                            </span>
                          </div>
                        )) || <p className="text-sm text-gray-500">No channel data available</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredArtists.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No artists found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;