import { useState } from 'react';
import ProblemCard from '../components/ProblemCard';

const Recent = ({ problems, filter, onUpvote, onDownvote, onReplySubmit, deviceId, onDelete, onDeleteReply, onSolve, onAskAI, onProblemSelect, selectedId }) => {
    const [displayCount, setDisplayCount] = useState(5);

    const filteredProblems = problems
        .filter(p => filter === 'All' || p.category === filter)
        .sort((a, b) => b.id - a.id);

    const displayProblems = filteredProblems.slice(0, displayCount);
    const hasMore = displayCount < filteredProblems.length;

    return (
        <div className="recent-page slide-down">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                {filter === 'All' ? 'Recent Activity' : `${filter} Recent Activity`}
            </h2>

            <div className="problems-list">
                {displayProblems.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <p>No recent issues in this category.</p>
                    </div>
                ) : (
                    <>
                        {displayProblems.map(p => (
                            <ProblemCard
                                key={p.id}
                                problem={p}
                                onUpvote={onUpvote}
                                onDownvote={onDownvote}
                                onReplySubmit={onReplySubmit}
                                deviceId={deviceId}
                                onDelete={onDelete}
                                onDeleteReply={onDeleteReply}
                                onSolve={onSolve}
                                onAskAI={onAskAI}
                                onProblemSelect={onProblemSelect}
                                isSelected={selectedId === p.id}
                            />
                        ))}
                        {hasMore && (
                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <button
                                    className="secondary-btn"
                                    onClick={() => setDisplayCount(prev => prev + 5)}
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Recent;
