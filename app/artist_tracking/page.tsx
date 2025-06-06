"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Eye,
  Heart,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Download,
  BarChart3,
  Activity,
  Star,
  AlertTriangle,
  Moon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
} from "recharts";
import { useArtistData } from "@/hooks/useArtistData";

const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "hot":
      return <span className="text-red-500">🔥</span>;
    case "rising":
      return <Star className="w-4 h-4 text-yellow-500" />;
    case "watch":
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case "declining":
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    case "dormant":
      return <Moon className="w-4 h-4 text-gray-500" />;
    default:
      return null;
  }
};

const getMomentumIcon = (score: number) => {
  if (score > 1) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (score < 0.7) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-500" />;
};

const getEngagementColor = (rate: number) => {
  if (rate > 5) return "text-green-600 bg-green-50";
  if (rate > 2) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};


export default function YouTubeAnalyticsDashboard() {
    // 1. First, declare ALL hooks at the top
    const { data, loading, error } = useArtistData();
    const [searchTerm, setSearchTerm] = useState("");
    const [activityFilter, setActivityFilter] = useState("all");
    const [engagementFilter, setEngagementFilter] = useState("all");
    const [sortBy, setSortBy] = useState("popularity_score");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
    // 2. Then declare all useMemo/useCallback hooks
    const filteredAndSortedArtists = useMemo(() => {
      if (!data) return []; // Handle case where data isn't loaded yet
      
      return data.artists.filter((artist) => {
        const matchesSearch = artist.channel_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
  
        const matchesActivity =
          activityFilter === "all" ||
          (activityFilter === "active" && artist.latest_video_days_ago <= 7) ||
          (activityFilter === "recent" && artist.latest_video_days_ago <= 30) ||
          (activityFilter === "inactive" && artist.latest_video_days_ago > 30);
  
        const matchesEngagement =
          engagementFilter === "all" ||
          (engagementFilter === "high" && artist.recent_engagement_rate > 5) ||
          (engagementFilter === "medium" &&
            artist.recent_engagement_rate >= 2 &&
            artist.recent_engagement_rate <= 5) ||
          (engagementFilter === "low" && artist.recent_engagement_rate < 2);
  
        return matchesSearch && matchesActivity && matchesEngagement;
      }).sort((a, b) => {
        const aValue = a[sortBy as keyof typeof a] as number;
        const bValue = b[sortBy as keyof typeof b] as number;
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      });
    }, [data, searchTerm, activityFilter, engagementFilter, sortBy, sortOrder]);
  
    const overviewStats = useMemo(() => {
      if (!data) return {
        totalArtists: 0,
        mostPopular: { channel_name: "", popularity_score: 0 },
        highestEngagement: { channel_name: "", recent_engagement_rate: 0 },
        mostActive: { channel_name: "", upload_frequency_per_month: 0 }
      };
  
      const totalArtists = data.artists.length;
      const mostPopular = data.artists.reduce((prev, current) =>
        prev.popularity_score > current.popularity_score ? prev : current
      );
      const highestEngagement = data.artists.reduce((prev, current) =>
        prev.recent_engagement_rate > current.recent_engagement_rate
          ? prev
          : current
      );
      const mostActive = data.artists.reduce((prev, current) =>
        prev.upload_frequency_per_month > current.upload_frequency_per_month
          ? prev
          : current
      );
  
      return { totalArtists, mostPopular, highestEngagement, mostActive };
    }, [data]);
  
    const chartData = useMemo(() => {
      if (!data) return { subscriberData: [], engagementData: [] };
  
      const subscriberData = data.artists.map((artist) => ({
        name: artist.channel_name,
        subscribers: artist.subscribers,
        engagement: artist.recent_engagement_rate,
      }));
  
      const engagementData = data.artists.map((artist) => ({
        name: artist.channel_name,
        engagement: artist.recent_engagement_rate,
        subscribers: artist.subscribers,
        momentum: artist.momentum_score,
      }));
  
      return { subscriberData, engagementData };
    }, [data]);
  
    // 3. Only AFTER all hooks are declared, do conditional returns
    if (loading) return <div className="p-4">Loading analytics...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
    if (!data) return <div className="p-4">No data available</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              YouTube Artist Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Track performance metrics for top music artists
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Artists
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overviewStats.totalArtists}
              </div>
              <p className="text-xs text-muted-foreground">Tracked channels</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Most Popular
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overviewStats.mostPopular.channel_name}
              </div>
              <p className="text-xs text-muted-foreground">
                Score: {overviewStats.mostPopular.popularity_score}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Highest Engagement
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overviewStats.highestEngagement.channel_name}
              </div>
              <p className="text-xs text-muted-foreground">
                {overviewStats.highestEngagement.recent_engagement_rate}% rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Active</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overviewStats.mostActive.channel_name}
              </div>
              <p className="text-xs text-muted-foreground">
                {overviewStats.mostActive.upload_frequency_per_month}{" "}
                videos/month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search artists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Activity Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="active">Active (≤7 days)</SelectItem>
                  <SelectItem value="recent">Recent (≤30 days)</SelectItem>
                  <SelectItem value="inactive">
                    Inactive (more than 30 days)
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={engagementFilter}
                onValueChange={setEngagementFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Engagement Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Engagement</SelectItem>
                  <SelectItem value="high">High ({">"}5%)</SelectItem>
                  <SelectItem value="medium">Medium (2-5%)</SelectItem>
                  <SelectItem value="low">Low ({"<"}2%)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity_score">
                    Popularity Score
                  </SelectItem>
                  <SelectItem value="subscribers">Subscribers</SelectItem>
                  <SelectItem value="recent_engagement_rate">
                    Engagement Rate
                  </SelectItem>
                  <SelectItem value="momentum_score">Momentum</SelectItem>
                  <SelectItem value="latest_video_days_ago">
                    Recent Activity
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortOrder}
                onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="rankings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rankings">Artist Rankings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="rankings" className="space-y-4">
            {/* Artist Rankings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Artist Rankings</CardTitle>
                <CardDescription>
                  Showing {filteredAndSortedArtists.length} of{" "}
                  {data.artists.length} artists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Artist</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Subscribers</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead>Momentum</TableHead>
                        <TableHead>Last Video</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedArtists.map((artist) => (
                        <TableRow key={artist.channel_id}>
                          <TableCell>
                            <Badge variant="outline">#{artist.rank}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={`/placeholder.svg?height=40&width=40`}
                                />
                                <AvatarFallback>
                                  {artist.channel_name.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {artist.channel_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {artist.video_count} videos
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-bold">
                                {artist.popularity_score}
                              </div>
                              <Progress
                                value={artist.popularity_score}
                                className="w-16"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">
                                {formatNumber(artist.subscribers)}
                              </div>
                              {getMomentumIcon(artist.momentum_score)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getEngagementColor(
                                artist.recent_engagement_rate
                              )}
                            >
                              {artist.recent_engagement_rate}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMomentumIcon(artist.momentum_score)}
                              <span className="text-sm">
                                {artist.momentum_score.toFixed(1)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {artist.latest_video_days_ago}d ago
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(artist.status)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* Individual Artist Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedArtists.slice(0, 6).map((artist) => (
                <Card key={artist.channel_id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={`/placeholder.svg?height=48&width=48`}
                          />
                          <AvatarFallback>
                            {artist.channel_name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {artist.channel_name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{artist.rank}</Badge>
                            {getStatusIcon(artist.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {artist.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">
                          {formatNumber(artist.subscribers)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Subscribers
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">
                          {formatNumber(artist.total_views)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Total Views
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-green-600">
                          {artist.recent_engagement_rate}%
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          Engagement
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">
                          {formatNumber(artist.recent_avg_views)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          Avg Views
                        </div>
                      </div>
                    </div>

                    {/* Performance Indicators */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Popularity Score
                        </span>
                        <span className="text-sm font-medium">
                          {artist.popularity_score}/100
                        </span>
                      </div>
                      <Progress
                        value={artist.popularity_score}
                        className="h-2"
                      />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Upload Frequency
                        </span>
                        <span>{artist.upload_frequency_per_month}/month</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Last Video
                        </span>
                        <span>{artist.latest_video_days_ago} days ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            {/* Charts and Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscriber Distribution</CardTitle>
                  <CardDescription>
                    Subscriber count comparison across artists
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.subscriberData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`${value}`, "Subscribers"]}
                      />
                      <Bar dataKey="subscribers" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement vs Subscribers</CardTitle>
                  <CardDescription>
                    Relationship between audience size and engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={chartData.engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subscribers" name="Subscribers" />
                      <YAxis dataKey="engagement" name="Engagement %" />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value}`,
                          name === "subscribers"
                            ? "Subscribers"
                            : "Engagement Rate",
                        ]}
                      />
                      <Scatter dataKey="engagement" fill="#10b981" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Momentum Trends</CardTitle>
                <CardDescription>
                  Artist momentum scores indicating growth trajectory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.artists}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="channel_name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Momentum Score"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="momentum_score"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}