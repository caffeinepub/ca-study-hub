import { useCallback, useEffect, useState } from "react";
import { containsBannedContent } from "../data/bannedWords";
import type { Quote } from "../data/quotes";

export type PostType = "text" | "quote";
export type SortMode = "newest" | "popular";

export interface CommunityComment {
  id: string;
  authorName: string;
  authorInitials: string;
  text: string;
  timestamp: number;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorInitials: string;
  type: PostType;
  text: string;
  quote?: {
    text: string;
    author: string;
    source?: string;
  };
  timestamp: number;
  likes: number;
  likedBy: string[]; // principal strings
  comments: CommunityComment[];
}

const STORAGE_KEY = "ca_community_posts";

function loadPosts(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPosts();
    return JSON.parse(raw) as CommunityPost[];
  } catch {
    return getDefaultPosts();
  }
}

function savePosts(posts: CommunityPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function getDefaultPosts(): CommunityPost[] {
  return [
    {
      id: "default-1",
      authorName: "Priya Sharma",
      authorInitials: "PS",
      type: "text",
      text: "Just cleared CA Inter Group 1! Study smart, not just hard. Focus on ICAI study material first, then practice MCQs from RTP. You've got this!",
      timestamp: Date.now() - 1000 * 60 * 60 * 3,
      likes: 24,
      likedBy: [],
      comments: [
        {
          id: "c1",
          authorName: "Rahul Mehta",
          authorInitials: "RM",
          text: "Congratulations! Which subjects did you find hardest?",
          timestamp: Date.now() - 1000 * 60 * 60 * 2,
        },
      ],
    },
    {
      id: "default-2",
      authorName: "Arjun Nair",
      authorInitials: "AN",
      type: "quote",
      text: "",
      quote: {
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
      },
      timestamp: Date.now() - 1000 * 60 * 60 * 8,
      likes: 18,
      likedBy: [],
      comments: [],
    },
    {
      id: "default-3",
      authorName: "Sneha Patel",
      authorInitials: "SP",
      type: "text",
      text: "Reminder: ICAI has released the updated Study Material for CA Final Nov 2025. Make sure to download it from the ICAI website. The SFM chapter revisions are significant!",
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
      likes: 41,
      likedBy: [],
      comments: [
        {
          id: "c2",
          authorName: "Vikram Singh",
          authorInitials: "VS",
          text: "Thanks for the heads up! Any specific chapters that changed?",
          timestamp: Date.now() - 1000 * 60 * 60 * 20,
        },
        {
          id: "c3",
          authorName: "Meera Krishnan",
          authorInitials: "MK",
          text: "The derivatives section was completely rewritten. Very helpful changes.",
          timestamp: Date.now() - 1000 * 60 * 60 * 18,
        },
      ],
    },
  ];
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function useCommunity(principalStr?: string) {
  const [posts, setPosts] = useState<CommunityPost[]>(loadPosts);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortMode === "newest") return b.timestamp - a.timestamp;
    return b.likes - a.likes;
  });

  const addPost = useCallback(
    (
      params: {
        type: PostType;
        text: string;
        quote?: Quote;
      },
      authorName: string,
    ): { success: boolean; warning?: string } => {
      const contentToCheck =
        params.type === "text"
          ? params.text
          : `${params.quote?.text ?? ""} ${params.quote?.author ?? ""}`;
      if (
        containsBannedContent(contentToCheck) ||
        containsBannedContent(params.text)
      ) {
        return {
          success: false,
          warning:
            "Your post contains content that violates our community guidelines (sexual, abusive, political, or religious content). The post has been blocked.",
        };
      }

      if (params.type === "text" && params.text.trim().length < 5) {
        return { success: false, warning: "Post is too short." };
      }

      const initials = authorName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const newPost: CommunityPost = {
        id: `post-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        authorName,
        authorInitials: initials,
        type: params.type,
        text: params.type === "text" ? params.text.trim() : "",
        quote: params.quote
          ? {
              text: params.quote.text,
              author: params.quote.author,
              source: params.quote.source,
            }
          : undefined,
        timestamp: Date.now(),
        likes: 0,
        likedBy: [],
        comments: [],
      };

      setPosts((prev) => [newPost, ...prev]);
      return { success: true };
    },
    [],
  );

  const toggleLike = useCallback(
    (postId: string) => {
      if (!principalStr) return;
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const alreadyLiked = p.likedBy.includes(principalStr);
          return {
            ...p,
            likes: alreadyLiked ? p.likes - 1 : p.likes + 1,
            likedBy: alreadyLiked
              ? p.likedBy.filter((id) => id !== principalStr)
              : [...p.likedBy, principalStr],
          };
        }),
      );
    },
    [principalStr],
  );

  const addComment = useCallback(
    (
      postId: string,
      text: string,
      authorName: string,
    ): { success: boolean; warning?: string } => {
      if (containsBannedContent(text)) {
        return {
          success: false,
          warning:
            "Your comment contains content that violates community guidelines and has been blocked.",
        };
      }
      if (text.trim().length < 2) {
        return { success: false, warning: "Comment is too short." };
      }

      const initials = authorName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const newComment: CommunityComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        authorName,
        authorInitials: initials,
        text: text.trim(),
        timestamp: Date.now(),
      };

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p,
        ),
      );
      return { success: true };
    },
    [],
  );

  const isLiked = useCallback(
    (postId: string) => {
      if (!principalStr) return false;
      const post = posts.find((p) => p.id === postId);
      return post?.likedBy.includes(principalStr) ?? false;
    },
    [posts, principalStr],
  );

  return {
    posts: sortedPosts,
    sortMode,
    setSortMode,
    addPost,
    toggleLike,
    addComment,
    isLiked,
    formatTimeAgo,
    totalPosts: posts.length,
  };
}
