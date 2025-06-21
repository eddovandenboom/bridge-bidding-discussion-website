import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { boardAPI } from '../utils/api';

interface User {
  id: string;
  username: string;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  boardId: string;
  userId: string;
  user: User;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface CommentsProps {
  boardId: string;
  onClose?: () => void;
}

const Comments: React.FC<CommentsProps> = ({ boardId, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [boardId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getBoard(boardId);
      setComments(response.board.comments || []);
    } catch (err) {
      setError('Failed to load comments');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (content: string, parentId?: string) => {
    if (!isAuthenticated) {
      setError('You must be signed in to comment');
      return;
    }

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await boardAPI.addComment(boardId, content.trim(), parentId);
      
      // Refresh comments
      await fetchComments();
      
      // Clear form
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isReply = depth > 0;
    const maxDepth = 3;
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-4' : 'mb-6'}`}>
        <div className={`bg-white rounded-lg border ${isReply ? 'border-gray-200' : 'border-gray-300'} p-4`}>
          {/* Comment Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {comment.user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-medium text-gray-900">{comment.user.username}</span>
                {comment.user.role === 'ADMIN' && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Admin</span>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>
          
          {/* Comment Content */}
          <div className="text-gray-800 whitespace-pre-wrap mb-3">
            {comment.content}
          </div>
          
          {/* Comment Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && depth < maxDepth && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {replyingTo === comment.id ? 'Cancel' : 'Reply'}
              </button>
            )}
          </div>
          
          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.user.username}...`}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitComment(replyContent, comment.id)}
                  disabled={submitting || !replyContent.trim()}
                  className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          Discussion ({comments.length} {comments.length === 1 ? 'comment' : 'comments'})
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* New Comment Form */}
      {isAuthenticated ? (
        <div className="mb-8 bg-white rounded-lg border border-gray-300 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900">{user?.username}</span>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts about this bridge hand..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={() => submitComment(newComment)}
              disabled={submitting || !newComment.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-3">Sign in to join the discussion</p>
          <p className="text-sm text-gray-500">Share your analysis and learn from other bridge players</p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

export default Comments;