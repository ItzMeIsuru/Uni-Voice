import ProblemCard from '../components/ProblemCard';

const Home = ({ problems, filter, onUpvote, onDownvote, onReplySubmit, deviceId, onDelete, onDeleteReply, onSolve, onAskAI, onProblemSelect, selectedId }) => {
    // Top 5 highest rated problems
    const topProblems = [...problems].sort((a, b) => b.score - a.score).slice(0, 5);

    // Apply filtering logic
    const displayProblems = filter === 'All'
        ? topProblems
        : topProblems.filter(p => p.category === filter);

    return (
        <div className="home-page slide-down">
            <div className="hero-section">
                <h2>Top 5 Uni Voices</h2>
                <p>The most pressing issues highlighted by the community right now.</p>
            </div>

            <div className="problems-list mt-4">
                {displayProblems.length > 0 ? (
                    displayProblems.map((problem, index) => (
                        <ProblemCard
                            key={problem.id}
                            problem={problem}
                            onUpvote={onUpvote}
                            onDownvote={onDownvote}
                            onReplySubmit={onReplySubmit}
                            isTop={true} // Add badge formatting
                            rank={index + 1}
                            deviceId={deviceId}
                            onDelete={onDelete}
                            onDeleteReply={onDeleteReply}
                            onSolve={onSolve}
                            onAskAI={onAskAI}
                            onProblemSelect={onProblemSelect}
                            isSelected={selectedId === problem.id}
                        />
                    ))
                ) : (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <p>No issues reported in this category. Be the first to start a conversation!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
