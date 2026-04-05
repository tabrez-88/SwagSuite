import { ExternalLink, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocialMediaTab } from "./hooks";
import type { SocialMediaTabProps } from "./types";

export default function SocialMediaTab({ company }: SocialMediaTabProps) {
  const { getSocialMediaIcon, getPlatformColor } = useSocialMediaTab();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Social Media Activity
          </CardTitle>
          {company.lastSocialMediaSync && (
            <p className="text-xs text-muted-foreground">
              Last synced: {new Date(company.lastSocialMediaSync).toLocaleString()}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {company.socialMediaPosts && company.socialMediaPosts.length > 0 ? (
          <div className="space-y-4">
            {company.socialMediaPosts.map((post: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`${getPlatformColor(post.platform)}`}>
                      {getSocialMediaIcon(post.platform)}
                    </div>
                    <span className="text-sm font-medium capitalize">{post.platform}</span>
                    {post.isExcitingNews && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Exciting News
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm">{post.content}</p>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-swag-orange hover:underline flex items-center gap-1"
                >
                  View original post <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No social media activity
            </h3>
            <p className="text-sm text-muted-foreground">
              No social media posts found for this company.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
