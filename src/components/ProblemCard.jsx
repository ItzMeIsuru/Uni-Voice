import { useState } from 'react';
import { ArrowUp, ArrowDown, MessageCircle, Clock, Send, Crown, Trash, CheckCircle, Flame, Sparkles } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const ReplyItem = ({ reply, allReplies, deviceId, onDeleteReply, onReplySubmit, problemId }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const children = allReplies.filter(r => r.parent_reply_id === reply.id);

    const handleReply = () => {
        if (replyText.trim()) {
            onReplySubmit(problemId, replyText, reply.id);
            setReplyText('');
            setIsReplying(false);
        }
    };

    return (
        <div className="reply-threaded">
            <div className="reply-item">
                <div className="reply-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="reply-author">Anonymous</span>
                    <span className="reply-time">{reply.timeAgo}</span>
                    <button
                        className="action-btn"
                        style={{ padding: '0 0.5rem', fontSize: '0.8rem', marginLeft: '0.5rem' }}
                        onClick={() => setIsReplying(!isReplying)}
                    >
                        Reply
                    </button>
                    {deviceId && reply.creator_id === deviceId && (
                        <button
                            className="action-btn"
                            style={{ color: 'var(--downvote-color)', padding: '0', marginLeft: 'auto' }}
                            onClick={() => setShowConfirm(true)}
                            title="Delete your reply"
                        >
                            <Trash size={14} />
                        </button>
                    )}
                </div>
                <p className="reply-text">{reply.text}</p>
                {isReplying && (
                    <div className="reply-input-wrapper" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleReply()}
                        />
                        <button className="send-reply-btn" onClick={handleReply} disabled={!replyText.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
            {children.length > 0 && (
                <div className="nested-replies" style={{ marginLeft: '1.5rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    {children.map(child => (
                        <ReplyItem
                            key={child.id}
                            reply={child}
                            allReplies={allReplies}
                            deviceId={deviceId}
                            onDeleteReply={onDeleteReply}
                            onReplySubmit={onReplySubmit}
                            problemId={problemId}
                        />
                    ))}
                </div>
            )}
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => {
                    onDeleteReply(problemId, reply.id);
                    setShowConfirm(false);
                }}
                message="Are you sure you want to delete this reply?"
            />
        </div>
    );
};

const ProblemCard = ({ problem, onUpvote, onDownvote, isTop, rank, onReplySubmit, deviceId, onDelete, onDeleteReply, onSolve, onAskAI, onProblemSelect, isSelected }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const handleReply = () => {
        if (replyText.trim()) {
            onReplySubmit(problem.id, replyText);
            setReplyText('');
        }
    };

    const topLevelReplies = (problem.replies || []).filter(r => !r.parent_reply_id);

    return (
        <div
            className={`problem-card ${isTop ? 'top-card' : ''} ${problem.solved ? 'is-solved' : ''} ${isSelected ? 'selected-card' : ''}`}
            onClick={() => onProblemSelect && onProblemSelect(problem.id)}
            style={{ cursor: onProblemSelect ? 'pointer' : 'default' }}
        >
            {isTop && (
                <div className={`top-badge ${rank === 1 ? 'top-1-badge' : ''}`}>
                    <div className="crown-container">
                        <Crown size={32} className="crown-icon" />
                        <span className="crown-number">{rank}</span>
                    </div>
                    <span>{rank === 1 ? 'HOTTEST ISSUE' : 'TOP ISSUE'}</span>
                    {rank === 1 && <Flame size={20} className="fire-icon" />}
                </div>
            )}
            <div className="problem-layout">
                <div className="vote-sidebar">
                    <button
                        className={`vote-btn upvote ${problem.userVote === 'up' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onUpvote(problem.id); }}
                        title="Upvote"
                    >
                        <ArrowUp size={24} />
                    </button>
                    <span className="vote-score" style={{
                        color: problem.score > 0 ? 'var(--upvote-color)' : problem.score < 0 ? 'var(--downvote-color)' : 'var(--text-muted)'
                    }}>
                        {problem.score}
                    </span>
                    <button
                        className={`vote-btn downvote ${problem.userVote === 'down' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onDownvote(problem.id); }}
                        title="Downvote"
                    >
                        <ArrowDown size={24} />
                    </button>
                </div>

                <div className="card-content">
                    <div className="card-header">
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span className="category-badge" data-category={problem.category}>
                                {problem.category}
                            </span>
                            {problem.solved && (
                                <span className="solved-badge">
                                    <CheckCircle size={14} style={{ marginRight: '4px' }} />
                                    Solved
                                </span>
                            )}
                            {deviceId && problem.creator_id === deviceId && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {onSolve && (
                                        <button
                                            className="action-btn"
                                            style={{ color: problem.solved ? 'var(--text-muted)' : 'var(--upvote-color)', padding: '0.2rem 0.5rem' }}
                                            onClick={(e) => { e.stopPropagation(); onSolve(problem.id); }}
                                            title={problem.solved ? "Unmark as Solved" : "Mark as Solved"}
                                        >
                                            <CheckCircle size={16} />
                                            <span>{problem.solved ? "Unsolve" : "Solve"}</span>
                                        </button>
                                    )}
                                    <button
                                        className="action-btn"
                                        style={{ color: 'var(--downvote-color)', padding: '0.2rem 0.5rem' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowConfirm(true);
                                        }}
                                        title="Delete your post"
                                    >
                                        <Trash size={16} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <span className="post-time">
                            <Clock size={14} style={{ marginRight: '4px' }} />
                            {problem.timeAgo}
                        </span>
                    </div>

                    <h3 className="problem-title">{problem.title}</h3>
                    <p className="problem-desc">{problem.description}</p>

                    <div className="card-footer">
                        <button className="action-btn reply-btn" onClick={(e) => { e.stopPropagation(); setShowReplies(!showReplies); }}>
                            <MessageCircle size={18} />
                            <span>{problem.replies?.length || 0} Replies</span>
                        </button>
                        {onAskAI && (
                            <button
                                className="action-btn ai-btn"
                                onClick={(e) => { e.stopPropagation(); onAskAI(problem); }}
                                style={{ color: 'var(--accent-color)' }}
                            >
                                <Sparkles size={18} />
                                <span>Ask AI</span>
                            </button>
                        )}
                    </div>

                    {showReplies && (
                        <div className="replies-section slide-down" onClick={(e) => e.stopPropagation()}>
                            <div className="replies-list">
                                {topLevelReplies.length > 0 ? (
                                    topLevelReplies.map(reply => (
                                        <ReplyItem
                                            key={reply.id}
                                            reply={reply}
                                            allReplies={problem.replies || []}
                                            deviceId={deviceId}
                                            onDeleteReply={onDeleteReply}
                                            onReplySubmit={onReplySubmit}
                                            problemId={problem.id}
                                        />
                                    ))
                                ) : (
                                    <p className="no-replies">No replies yet. Be the first!</p>
                                )}
                            </div>
                            <div className="reply-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Write an anonymous reply..."
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                                />
                                <button className="send-reply-btn" onClick={handleReply} disabled={!replyText.trim()}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => {
                    onDelete(problem.id);
                    setShowConfirm(false);
                }}
                message="Are you sure you want to delete this post?"
            />
        </div>
    );
};

export default ProblemCard;
