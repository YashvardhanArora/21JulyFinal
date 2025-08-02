import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ComplaintComment } from "@shared/schema";

interface ComplaintCommentsProps {
  complaintId: number;
  complaintStatus: string;
  currentUserRole: 'admin' | 'customer';
  currentUserId: number;
}

export function ComplaintComments({ 
  complaintId, 
  complaintStatus, 
  currentUserRole, 
  currentUserId 
}: ComplaintCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<ComplaintComment[]>({
    queryKey: [`/api/complaints/${complaintId}/comments`],
    refetchInterval: 1000, // Refresh every 1 second for real-time chat
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { message: string; parentCommentId?: number }) => {
      return apiRequest(`/api/complaints/${complaintId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          message: data.message,
          userRole: currentUserRole,
          userId: currentUserId,
          parentCommentId: data.parentCommentId,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/complaints/${complaintId}/comments`] });
      setNewComment("");
      setReplyText("");
      setReplyingTo(null);
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate({ message: newComment });
  };

  const handleSubmitReply = (parentCommentId: number) => {
    if (!replyText.trim()) return;
    createCommentMutation.mutate({ 
      message: replyText, 
      parentCommentId 
    });
  };

  const canComment = currentUserRole === 'admin' || 
    (currentUserRole === 'customer' && complaintStatus !== 'closed');

  // Group comments by parent/child relationship
  const mainComments = comments.filter(c => !c.parentCommentId);
  const replies = comments.filter(c => c.parentCommentId);

  const getReepliesForComment = (commentId: number) => 
    replies.filter(r => r.parentCommentId === commentId);

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Chat Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {currentUserRole === 'admin' ? 'Respond to ASM' : 'Chat with Admin'}
            </span>
            <Badge variant="outline" className="text-xs">
              {comments.length} {comments.length === 1 ? 'message' : 'messages'}
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            Real-time updates
          </div>
        </div>

        {/* New Comment Form */}
        {canComment && (
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <Textarea
              placeholder={
                currentUserRole === 'admin' 
                  ? "Type your response to the ASM..."
                  : "Ask a question or provide updates about this complaint..."
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="bg-white"
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {currentUserRole === 'customer' && complaintStatus === 'closed' && (
                  <span className="text-amber-600 font-medium">
                    Cannot chat on closed complaints
                  </span>
                )}
              </div>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || createCommentMutation.isPending}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {createCommentMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {mainComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">
                {canComment 
                  ? "Be the first to add a comment" 
                  : "Comments will appear here when added"
                }
              </p>
            </div>
          ) : (
            mainComments.map((comment) => {
              const commentReplies = getReepliesForComment(comment.id);
              
              return (
                <div key={comment.id} className="space-y-3">
                  {/* Main Comment */}
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {comment.userRole === 'admin' ? (
                          <Shield className="w-4 h-4 text-blue-500" />
                        ) : (
                          <User className="w-4 h-4 text-green-500" />
                        )}
                        <Badge variant={comment.userRole === 'admin' ? 'default' : 'secondary'}>
                          {comment.userRole === 'admin' ? 'Admin' : 'ASM'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{comment.message}</p>
                    
                    {/* Reply Button */}
                    {canComment && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Reply
                        </Button>
                      </div>
                    )}

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyText.trim() || createCommentMutation.isPending}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Reply
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Replies */}
                  {commentReplies.length > 0 && (
                    <div className="ml-8 space-y-2">
                      {commentReplies.map((reply) => (
                        <div key={reply.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-2">
                            {reply.userRole === 'admin' ? (
                              <Shield className="w-3 h-3 text-blue-500" />
                            ) : (
                              <User className="w-3 h-3 text-green-500" />
                            )}
                            <Badge 
                              variant={reply.userRole === 'admin' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {reply.userRole === 'admin' ? 'Admin' : 'ASM'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {reply.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
    </div>
  );
}