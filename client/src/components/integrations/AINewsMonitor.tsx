import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Eye, 
  Search,
  ExternalLink,
  Bell,
  BellOff
} from "lucide-react";

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  sourceUrl: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  entityType: 'company' | 'supplier' | 'industry';
  entityId?: string;
  entityName?: string;
  publishedAt: string;
  alertsSent: boolean;
}

interface NewsMonitorSettings {
  enableCustomerNews: boolean;
  enableVendorNews: boolean;
  enableIndustryNews: boolean;
  minimumRelevanceScore: number;
  alertThreshold: number;
  autoNotifyReps: boolean;
}

export function AINewsMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");

  const { data: newsItems } = useQuery<NewsItem[]>({
    queryKey: ['/api/integrations/news/items', { search: searchQuery, sentiment: selectedSentiment }],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: settings } = useQuery<NewsMonitorSettings>({
    queryKey: ['/api/integrations/news/settings'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NewsMonitorSettings>) => {
      await apiRequest('/api/integrations/news/settings', {
        method: 'POST',
        body: newSettings
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "News monitoring settings saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/news/settings'] });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async (newsId: string) => {
      await apiRequest(`/api/integrations/news/${newsId}/toggle-alert`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/news/items'] });
    },
  });

  const sendManualAlertMutation = useMutation({
    mutationFn: async (newsId: string) => {
      await apiRequest(`/api/integrations/news/${newsId}/send-alert`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Alert Sent",
        description: "News alert has been sent to relevant team members.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/news/items'] });
    },
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'company': return 'bg-blue-100 text-blue-800';
      case 'supplier': return 'bg-purple-100 text-purple-800';
      case 'industry': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNews = newsItems?.filter(item => {
    if (selectedSentiment !== 'all' && item.sentiment !== selectedSentiment) return false;
    if (searchQuery && !item.headline.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.entityName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* News Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                AI News Monitor
              </CardTitle>
              <CardDescription>
                AI-powered news tracking for customers, vendors, and industry updates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48"
                />
              </div>
              <div className="flex gap-1">
                {['all', 'positive', 'negative', 'neutral'].map((sentiment) => (
                  <Button
                    key={sentiment}
                    variant={selectedSentiment === sentiment ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSentiment(sentiment)}
                    className="capitalize"
                  >
                    {sentiment}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full">
            <div className="space-y-4">
              {filteredNews?.map((news) => (
                <div key={news.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSentimentIcon(news.sentiment)}
                        <Badge className={getSentimentColor(news.sentiment)}>
                          {news.sentiment}
                        </Badge>
                        <Badge className={getEntityTypeColor(news.entityType)}>
                          {news.entityType}
                        </Badge>
                        {news.entityName && (
                          <Badge variant="outline">{news.entityName}</Badge>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-xs text-muted-foreground">
                            Relevance: {news.relevanceScore}/10
                          </span>
                        </div>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">{news.headline}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{news.summary}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Published: {new Date(news.publishedAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(news.sourceUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Read More
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAlertMutation.mutate(news.id)}
                          >
                            {news.alertsSent ? (
                              <BellOff className="h-3 w-3 mr-1" />
                            ) : (
                              <Bell className="h-3 w-3 mr-1" />
                            )}
                            {news.alertsSent ? 'Mute' : 'Alert'}
                          </Button>
                          {!news.alertsSent && news.relevanceScore >= (settings?.alertThreshold || 7) && (
                            <Button
                              size="sm"
                              onClick={() => sendManualAlertMutation.mutate(news.id)}
                              disabled={sendManualAlertMutation.isPending}
                            >
                              Send Alert
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No news items found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>News Monitoring Settings</CardTitle>
          <CardDescription>
            Configure AI-powered news tracking and alert preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium">Customer News</Label>
                <p className="text-sm text-muted-foreground">Track customer company news</p>
              </div>
              <Switch
                checked={settings?.enableCustomerNews || false}
                onCheckedChange={(checked) => 
                  updateSettingsMutation.mutate({ enableCustomerNews: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium">Vendor News</Label>
                <p className="text-sm text-muted-foreground">Track supplier updates</p>
              </div>
              <Switch
                checked={settings?.enableVendorNews || false}
                onCheckedChange={(checked) => 
                  updateSettingsMutation.mutate({ enableVendorNews: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium">Industry News</Label>
                <p className="text-sm text-muted-foreground">Track industry trends</p>
              </div>
              <Switch
                checked={settings?.enableIndustryNews || false}
                onCheckedChange={(checked) => 
                  updateSettingsMutation.mutate({ enableIndustryNews: checked })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Relevance Score</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={settings?.minimumRelevanceScore || 5}
                onChange={(e) => 
                  updateSettingsMutation.mutate({ 
                    minimumRelevanceScore: parseInt(e.target.value) 
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Only show news with relevance score above this threshold
              </p>
            </div>

            <div className="space-y-2">
              <Label>Auto-Alert Threshold</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={settings?.alertThreshold || 7}
                onChange={(e) => 
                  updateSettingsMutation.mutate({ 
                    alertThreshold: parseInt(e.target.value) 
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Automatically send alerts for news above this score
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="font-medium">Auto-notify Sales Reps</Label>
              <p className="text-sm text-muted-foreground">
                Automatically notify assigned sales reps about customer news
              </p>
            </div>
            <Switch
              checked={settings?.autoNotifyReps || false}
              onCheckedChange={(checked) => 
                updateSettingsMutation.mutate({ autoNotifyReps: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}