import { useState } from 'react';
import ProblemCard from '../components/ProblemCard';

const Top = ({ problems, filter, onUpvote, onDownvote, onReplySubmit, deviceId, onDelete, onDeleteReply, onSolve, onAskAI, onProblemSelect, selectedId }) => {
    // Pagination state
    const [displayCount, setDisplayCount] = useState(5);

    // Show all problems sorted by score descending
    const filteredProblems = problems
        .filter(p => filter === 'All' || p.category === filter)
        .sort((a, b) => b.score - a.score);

    // Slice for display
    const displayProblems = filteredProblems.slice(0, displayCount);
    const hasMore = displayCount < filteredProblems.length;

    return (
        <div className="top-page slide-down">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                {filter === 'All' ? 'Top Discussed Issues' : `Top ${filter} Issues`}
            </h2>

            <div className="problems-list">
                {displayProblems.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <p>No highly rated issues found in this category.</p>
                    </div>
                ) : (
                    <>
                        {displayProblems.map((p, index) => (
                            <ProblemCard
                                key={p.id}
                                problem={p}
                                isTop={true} // Add formatting to the top card list too
                                rank={index + 1}
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
                            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingBottom: '2rem' }}>
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

export default Top;
