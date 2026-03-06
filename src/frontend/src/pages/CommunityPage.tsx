import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Heart,
  LogIn,
  MessageCircle,
  Quote,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { QUOTES } from "../data/quotes";
import { type PostType, useCommunity } from "../hooks/useCommunity";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";

function PostAvatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{
        background: "oklch(var(--primary) / 0.15)",
        color: "oklch(var(--primary))",
        border: "1px solid oklch(var(--primary) / 0.25)",
      }}
    >
      {initials}
    </div>
  );
}

export function CommunityPage() {
  const { identity, login } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const principalStr = identity?.getPrincipal().toText();
  const authorName = profile?.name || (identity ? "CA Student" : "Guest");

  const {
    posts,
    sortMode,
    setSortMode,
    addPost,
    toggleLike,
    addComment,
    isLiked,
    formatTimeAgo,
  } = useCommunity(principalStr);

  // Compose state
  const [postType, setPostType] = useState<PostType>("text");
  const [textContent, setTextContent] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [composeWarning, setComposeWarning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expanded comments
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [commentWarnings, setCommentWarnings] = useState<
    Record<string, string>
  >({});

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSubmitPost = () => {
    setComposeWarning("");
    setIsSubmitting(true);

    const selectedQuote = QUOTES.find((q) => q.id === selectedQuoteId);
    const result = addPost(
      {
        type: postType,
        text: textContent,
        quote: postType === "quote" ? selectedQuote : undefined,
      },
      authorName,
    );

    setIsSubmitting(false);

    if (!result.success) {
      setComposeWarning(result.warning ?? "Could not submit post.");
      return;
    }

    setTextContent("");
    setSelectedQuoteId("");
    setComposeWarning("");
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId] ?? "";
    const result = addComment(postId, text, authorName);
    if (!result.success) {
      setCommentWarnings((prev) => ({
        ...prev,
        [postId]: result.warning ?? "Could not post comment.",
      }));
      return;
    }
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    setCommentWarnings((prev) => ({ ...prev, [postId]: "" }));
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const canSubmit =
    postType === "text" ? textContent.trim().length >= 5 : !!selectedQuoteId;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(var(--primary) / 0.12)",
              border: "1px solid oklch(var(--primary) / 0.25)",
            }}
          >
            <Users
              className="w-5 h-5"
              style={{ color: "oklch(var(--primary))" }}
            />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Community
            </h2>
            <p className="text-sm text-muted-foreground font-heading">
              Share thoughts, updates, and inspiration with fellow CA students
            </p>
          </div>
        </div>
      </motion.div>

      {/* Compose Box */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          {!identity ? (
            /* Guest prompt */
            <div
              className="flex flex-col items-center gap-3 py-4 text-center rounded-xl"
              style={{ background: "oklch(var(--muted) / 0.5)" }}
              data-ocid="community.guest_prompt.card"
            >
              <LogIn
                className="w-8 h-8"
                style={{ color: "oklch(var(--primary))" }}
              />
              <div>
                <p className="font-heading font-semibold text-foreground text-sm">
                  Sign in to post
                </p>
                <p className="text-xs text-muted-foreground font-heading mt-0.5">
                  Guests can read posts -- sign in to share and interact.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => void login()}
                className="font-heading gap-2"
                style={{
                  background: "oklch(var(--primary))",
                  color: "oklch(var(--primary-foreground))",
                }}
                data-ocid="community.signin.button"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Button>
            </div>
          ) : (
            /* Compose form */
            <div className="space-y-3" data-ocid="community.compose.panel">
              <div className="flex items-center gap-3">
                <PostAvatar
                  initials={(
                    authorName[0] + (authorName.split(" ")[1]?.[0] ?? "")
                  ).toUpperCase()}
                />
                <p className="text-sm font-heading font-semibold text-foreground">
                  {authorName}
                </p>
              </div>

              {/* Post type tabs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid="community.post_type.text.tab"
                  onClick={() => {
                    setPostType("text");
                    setComposeWarning("");
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold transition-all"
                  style={{
                    background:
                      postType === "text"
                        ? "oklch(var(--primary) / 0.12)"
                        : "oklch(var(--muted))",
                    color:
                      postType === "text"
                        ? "oklch(var(--primary))"
                        : "oklch(var(--muted-foreground))",
                    border:
                      postType === "text"
                        ? "1.5px solid oklch(var(--primary) / 0.35)"
                        : "1.5px solid oklch(var(--border))",
                  }}
                >
                  Text Post
                </button>
                <button
                  type="button"
                  data-ocid="community.post_type.quote.tab"
                  onClick={() => {
                    setPostType("quote");
                    setComposeWarning("");
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold transition-all"
                  style={{
                    background:
                      postType === "quote"
                        ? "oklch(var(--primary) / 0.12)"
                        : "oklch(var(--muted))",
                    color:
                      postType === "quote"
                        ? "oklch(var(--primary))"
                        : "oklch(var(--muted-foreground))",
                    border:
                      postType === "quote"
                        ? "1.5px solid oklch(var(--primary) / 0.35)"
                        : "1.5px solid oklch(var(--border))",
                  }}
                >
                  Share a Quote
                </button>
              </div>

              {postType === "text" ? (
                <Textarea
                  placeholder="Share an educational thought, study tip, or ICAI update..."
                  value={textContent}
                  onChange={(e) => {
                    setTextContent(e.target.value);
                    setComposeWarning("");
                  }}
                  className="font-heading text-sm resize-none min-h-[90px]"
                  data-ocid="community.post_text.textarea"
                />
              ) : (
                <Select
                  value={selectedQuoteId}
                  onValueChange={(v) => {
                    setSelectedQuoteId(v);
                    setComposeWarning("");
                  }}
                >
                  <SelectTrigger
                    className="h-10 font-heading text-sm"
                    data-ocid="community.quote_picker.select"
                  >
                    <SelectValue placeholder="Pick a quote to share..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {QUOTES.map((q) => (
                      <SelectItem
                        key={q.id}
                        value={q.id}
                        className="font-heading text-sm"
                      >
                        &ldquo;{q.text.slice(0, 55)}
                        {q.text.length > 55 ? "…" : ""}&rdquo; — {q.author}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Warning */}
              <AnimatePresence>
                {composeWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    data-ocid="community.compose.error_state"
                    className="flex items-start gap-2 rounded-lg p-3 text-xs font-heading"
                    style={{
                      background: "oklch(var(--destructive) / 0.1)",
                      border: "1px solid oklch(var(--destructive) / 0.3)",
                      color: "oklch(var(--destructive))",
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {composeWarning}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={!canSubmit || isSubmitting}
                  onClick={handleSubmitPost}
                  className="font-heading gap-2 h-9"
                  style={{
                    background: "oklch(var(--primary))",
                    color: "oklch(var(--primary-foreground))",
                  }}
                  data-ocid="community.post.submit_button"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Sort Toggle */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <p className="text-sm font-heading text-muted-foreground">
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </p>
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ border: "1px solid oklch(var(--border))" }}
        >
          <button
            type="button"
            data-ocid="community.sort.newest.tab"
            onClick={() => setSortMode("newest")}
            className="px-3 py-1.5 text-xs font-heading font-semibold transition-all"
            style={{
              background:
                sortMode === "newest"
                  ? "oklch(var(--primary))"
                  : "oklch(var(--card))",
              color:
                sortMode === "newest"
                  ? "oklch(var(--primary-foreground))"
                  : "oklch(var(--muted-foreground))",
            }}
          >
            Newest
          </button>
          <button
            type="button"
            data-ocid="community.sort.popular.tab"
            onClick={() => setSortMode("popular")}
            className="px-3 py-1.5 text-xs font-heading font-semibold transition-all flex items-center gap-1"
            style={{
              background:
                sortMode === "popular"
                  ? "oklch(var(--primary))"
                  : "oklch(var(--card))",
              color:
                sortMode === "popular"
                  ? "oklch(var(--primary-foreground))"
                  : "oklch(var(--muted-foreground))",
            }}
          >
            <TrendingUp className="w-3 h-3" />
            Popular
          </button>
        </div>
      </motion.div>

      {/* Feed */}
      {posts.length === 0 ? (
        <motion.div
          variants={itemVariants}
          data-ocid="community.feed.empty_state"
          className="flex flex-col items-center gap-3 py-16 rounded-2xl text-center"
          style={{
            background: "oklch(var(--card))",
            border: "1px dashed oklch(var(--border))",
          }}
        >
          <Users
            className="w-12 h-12"
            style={{ color: "oklch(var(--muted-foreground))" }}
          />
          <h3 className="font-heading font-semibold text-foreground">
            No posts yet
          </h3>
          <p className="text-sm text-muted-foreground font-heading max-w-xs">
            Be the first to share a thought or quote with the community!
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
          data-ocid="community.feed.list"
        >
          {posts.map((post, i) => {
            const liked = isLiked(post.id);
            const commentsExpanded = expandedComments.has(post.id);
            const commentText = commentInputs[post.id] ?? "";
            const commentWarning = commentWarnings[post.id] ?? "";
            const catColor =
              post.type === "quote" && post.quote
                ? "var(--chart-1)"
                : "var(--primary)";

            return (
              <motion.div
                key={post.id}
                variants={itemVariants}
                data-ocid={`community.post.item.${i + 1}`}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "oklch(var(--card))",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                {/* Post header */}
                <div className="flex items-start gap-3 p-5 pb-3">
                  <PostAvatar initials={post.authorInitials} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-semibold text-sm text-foreground">
                        {post.authorName}
                      </span>
                      <Badge
                        className="text-[10px] font-heading px-2 py-0.5 h-auto"
                        style={{
                          background:
                            post.type === "quote"
                              ? `oklch(${catColor} / 0.12)`
                              : "oklch(var(--muted))",
                          color:
                            post.type === "quote"
                              ? `oklch(${catColor})`
                              : "oklch(var(--muted-foreground))",
                          border:
                            post.type === "quote"
                              ? `1px solid oklch(${catColor} / 0.25)`
                              : "1px solid oklch(var(--border))",
                        }}
                      >
                        {post.type === "quote" ? "Quote" : "Post"}
                      </Badge>
                    </div>
                    <p className="text-xs font-heading text-muted-foreground mt-0.5">
                      {formatTimeAgo(post.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Post body */}
                <div className="px-5 pb-4">
                  {post.type === "text" ? (
                    <p className="text-sm font-heading text-foreground leading-relaxed">
                      {post.text}
                    </p>
                  ) : post.quote ? (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: `oklch(${catColor} / 0.06)`,
                        border: `1px solid oklch(${catColor} / 0.18)`,
                      }}
                    >
                      <Quote
                        className="w-4 h-4 mb-2 opacity-50"
                        style={{ color: `oklch(${catColor})` }}
                      />
                      <blockquote className="font-display text-sm italic leading-relaxed text-foreground mb-2">
                        &ldquo;{post.quote.text}&rdquo;
                      </blockquote>
                      <cite
                        className="not-italic text-xs font-heading font-semibold"
                        style={{ color: `oklch(${catColor})` }}
                      >
                        — {post.quote.author}
                        {post.quote.source && (
                          <span className="font-normal text-muted-foreground ml-1">
                            · {post.quote.source}
                          </span>
                        )}
                      </cite>
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-1 px-5 pb-4 pt-1"
                  style={{ borderTop: "1px solid oklch(var(--border))" }}
                >
                  {/* Like */}
                  <button
                    type="button"
                    data-ocid={`community.post.like.${i + 1}`}
                    onClick={() => identity && toggleLike(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all hover:scale-105 active:scale-95 mt-3"
                    style={{
                      background: liked
                        ? "oklch(var(--destructive) / 0.1)"
                        : "transparent",
                      color: liked
                        ? "oklch(var(--destructive))"
                        : "oklch(var(--muted-foreground))",
                      cursor: identity ? "pointer" : "default",
                    }}
                    title={!identity ? "Sign in to like" : undefined}
                  >
                    <Heart
                      className="w-4 h-4"
                      style={{
                        fill: liked ? "oklch(var(--destructive))" : "none",
                      }}
                    />
                    {post.likes > 0 && <span>{post.likes}</span>}
                    {post.likes === 0 && <span>Like</span>}
                  </button>

                  {/* Comments toggle */}
                  <button
                    type="button"
                    data-ocid={`community.post.comments_toggle.${i + 1}`}
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all mt-3"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {post.comments.length > 0 ? (
                      <span>
                        {post.comments.length} comment
                        {post.comments.length !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span>Comment</span>
                    )}
                    {commentsExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Comments section */}
                <AnimatePresence>
                  {commentsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 pb-5 space-y-3"
                        style={{
                          borderTop: "1px solid oklch(var(--border))",
                        }}
                      >
                        {/* Existing comments */}
                        {post.comments.length > 0 && (
                          <div className="space-y-3 pt-4">
                            {post.comments.map((comment, ci) => (
                              <div
                                key={comment.id}
                                className="flex items-start gap-2"
                                data-ocid={`community.comment.item.${ci + 1}`}
                              >
                                <PostAvatar
                                  initials={comment.authorInitials}
                                  size="sm"
                                />
                                <div
                                  className="flex-1 rounded-xl px-3 py-2"
                                  style={{
                                    background: "oklch(var(--muted) / 0.5)",
                                    border:
                                      "1px solid oklch(var(--border) / 0.5)",
                                  }}
                                >
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-heading font-semibold text-foreground">
                                      {comment.authorName}
                                    </span>
                                    <span className="text-[10px] font-heading text-muted-foreground">
                                      {formatTimeAgo(comment.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-heading text-foreground mt-0.5 leading-relaxed">
                                    {comment.text}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add comment */}
                        {identity ? (
                          <div className="space-y-2 pt-2">
                            <div className="flex items-start gap-2">
                              <PostAvatar
                                initials={(
                                  authorName[0] +
                                  (authorName.split(" ")[1]?.[0] ?? "")
                                ).toUpperCase()}
                                size="sm"
                              />
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  value={commentText}
                                  onChange={(e) => {
                                    setCommentInputs((prev) => ({
                                      ...prev,
                                      [post.id]: e.target.value,
                                    }));
                                    setCommentWarnings((prev) => ({
                                      ...prev,
                                      [post.id]: "",
                                    }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      if (commentText.trim().length >= 2) {
                                        handleAddComment(post.id);
                                      }
                                    }
                                  }}
                                  className="flex-1 rounded-lg px-3 py-2 text-xs font-heading outline-none"
                                  style={{
                                    background: "oklch(var(--muted) / 0.6)",
                                    border: "1px solid oklch(var(--border))",
                                    color: "oklch(var(--foreground))",
                                  }}
                                  data-ocid={`community.comment.input.${i + 1}`}
                                />
                                <button
                                  type="button"
                                  data-ocid={`community.comment.submit_button.${i + 1}`}
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={commentText.trim().length < 2}
                                  className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-40"
                                  style={{
                                    background: "oklch(var(--primary))",
                                    color: "oklch(var(--primary-foreground))",
                                  }}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <AnimatePresence>
                              {commentWarning && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  data-ocid={`community.comment.error_state.${i + 1}`}
                                  className="flex items-start gap-2 rounded-lg p-2.5 text-xs font-heading"
                                  style={{
                                    background:
                                      "oklch(var(--destructive) / 0.1)",
                                    border:
                                      "1px solid oklch(var(--destructive) / 0.3)",
                                    color: "oklch(var(--destructive))",
                                  }}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                  {commentWarning}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={() => void login()}
                              className="text-xs font-heading underline-offset-2 hover:underline"
                              style={{ color: "oklch(var(--primary))" }}
                              data-ocid="community.comment.signin.button"
                            >
                              Sign in to comment
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
