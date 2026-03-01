import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Plus, MapPin, Sun, Moon, Sunset, ChevronDown, ChevronRight } from 'lucide-react';
import CreatePostModal from './components/CreatePostModal';
import RightSidebar from './components/RightSidebar';
import LoadingScreen from './components/LoadingScreen';

import Home from './pages/Home';
import Top from './pages/Top';
import Recent from './pages/Recent';

const categories = ['Canteen/Food', 'Hostel', 'Academic', 'Non-academic', 'Toilets', 'Transport', 'Security', 'Custom'];
const standardCategories = categories.filter(c => c !== 'Custom');

const calculateTimeAgo = (dateInput) => {
  if (!dateInput) return 'Just now';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInDays < 30) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

function App() {
  const [theme, setTheme] = useState('light');
  const [userLocation, setUserLocation] = useState(null);
  const [isAutoTheme, setIsAutoTheme] = useState(true);

  // Live Database State
  const [problems, setProblems] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [totalVisitors, setTotalVisitors] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCustomFilterOpen, setIsCustomFilterOpen] = useState(false);

  // Interaction State
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);

  const selectedProblem = problems.find(p => p.id === selectedProblemId) || null;

  const location = useLocation();

  // --- 1. Anonymous Device Tracking ---
  useEffect(() => {
    let storedId = localStorage.getItem('univoice_device_id');
    if (!storedId) {
      // Generate a random 16 character string if they've never visited before
      storedId = 'user_' + Math.random().toString(36).substring(2, 18);
      localStorage.setItem('univoice_device_id', storedId);
    }
    setDeviceId(storedId);
  }, []);

  // --- 2. Fetch Live Database ---
  const fetchProblems = async () => {
    const startTime = Date.now();
    try {
      const res = await fetch('/.netlify/functions/api');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      // Re-sync user's previous votes to show up/down highlights correctly
      if (deviceId) {
        const [voteRes, pollVoteRes, visitsRes] = await Promise.all([
          fetch('/.netlify/functions/api/sync_votes', {
            method: 'POST',
            body: JSON.stringify({ device_id: deviceId })
          }),
          fetch('/.netlify/functions/api/sync_poll_votes', {
            method: 'POST',
            body: JSON.stringify({ device_id: deviceId })
          }),
          fetch('/.netlify/functions/api/visitors', {
            method: 'POST',
            body: JSON.stringify({ device_id: deviceId })
          })
        ]);

        const myVotes = await voteRes.json();
        const myPollVotes = await pollVoteRes.json();

        try {
          const visitorData = await visitsRes.json();
          if (visitorData && visitorData.total_visitors) {
            setTotalVisitors(visitorData.total_visitors);
          }
        } catch (e) {
          console.error("Failed to parse visitor data", e);
        }

        // Map DB problem rows into the frontend state format
        const enrichedData = data.map(p => {
          const myVote = myVotes.find(v => v.problem_id === p.id);
          const myPollVote = myPollVotes.find(v => v.problem_id === p.id);
          return {
            ...p,
            timeAgo: p.created_at ? calculateTimeAgo(p.created_at) : p.time_ago,
            replies: (p.replies || []).map(r => ({ ...r, timeAgo: r.created_at ? calculateTimeAgo(r.created_at) : r.time_ago })),
            userVote: myVote ? myVote.vote_type : null,
            user_poll_vote: myPollVote ? myPollVote.vote_option : null
          };
        });
        setProblems(enrichedData);
      } else {
        setProblems(data.map(p => ({
          ...p,
          timeAgo: p.created_at ? calculateTimeAgo(p.created_at) : p.time_ago,
          replies: (p.replies || []).map(r => ({ ...r, timeAgo: r.created_at ? calculateTimeAgo(r.created_at) : r.time_ago }))
        })));
      }
    } catch (error) {
      console.error("Failed to load problems from db:", error);
    } finally {
      const elapsed = Date.now() - startTime;
      const minDelay = 1500;
      if (elapsed < minDelay) {
        setTimeout(() => setIsLoading(false), minDelay - elapsed);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (deviceId) fetchProblems();
  }, [deviceId]);

  // Extract dynamically created custom categories from posts
  const customCategories = useMemo(() => {
    const postCategories = problems.map(p => p.category);
    const uniqueCustomCats = new Set(postCategories.filter(c => !standardCategories.includes(c)));
    return Array.from(uniqueCustomCats);
  }, [problems]);

  const handleThemeClick = (clickedTheme) => {
    if (!isAutoTheme && theme === clickedTheme) {
      setIsAutoTheme(true);
      // Instant visual feedback before IP fetch completes
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 17) setTheme('light');
      else if (hour >= 17 && hour < 20) setTheme('afternoon');
      else setTheme('dark');
    } else {
      setIsAutoTheme(false);
      setTheme(clickedTheme);
    }
  };

  // Auto Theming
  useEffect(() => {
    if (!isAutoTheme) return;

    const fetchThemeByLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data && data.timezone) {
          setUserLocation(`${data.city}, ${data.country_name}`);

          const date = new Date();
          const localTimeStr = date.toLocaleString('en-US', { timeZone: data.timezone, hour: 'numeric', hour12: false });
          const hour = parseInt(localTimeStr, 10);

          if (hour >= 6 && hour < 17) setTheme('light');
          else if (hour >= 17 && hour < 20) setTheme('afternoon');
          else setTheme('dark');
        }
      } catch (error) {
        console.error("Error fetching IP location:", error);
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 17) setTheme('light');
        else if (hour >= 17 && hour < 20) setTheme('afternoon');
        else setTheme('dark');
      }
    };

    fetchThemeByLocation();
  }, [isAutoTheme]);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  // Ambient Mouse Glow Tracker
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Live Timer for Time Ago Strings
  useEffect(() => {
    const interval = setInterval(() => {
      setProblems(currentProblems => currentProblems.map(p => ({
        ...p,
        timeAgo: p.created_at ? calculateTimeAgo(p.created_at) : p.timeAgo,
        replies: (p.replies || []).map(r => ({ ...r, timeAgo: r.created_at ? calculateTimeAgo(r.created_at) : r.timeAgo }))
      })));
    }, 60000); // Recalculate every minute
    return () => clearInterval(interval);
  }, []);

  // --- Database Mutators (Votes/Posts/Replies) ---
  const handleVote = async (problemId, type) => {
    // Optimistically update UI first for instant feedback feeling
    setProblems(probs => probs.map(p => {
      if (p.id === problemId) {
        let newScore = p.score;
        let newUserVote = null;

        if (p.userVote === type) {
          // Canceling vote
          newScore = type === 'up' ? newScore - 1 : newScore + 1;
        } else if (p.userVote) {
          // Switching vote direction
          newScore = type === 'up' ? newScore + 2 : newScore - 2;
          newUserVote = type;
        } else {
          // Fresh vote
          newScore = type === 'up' ? newScore + 1 : newScore - 1;
          newUserVote = type;
        }
        return { ...p, score: newScore, userVote: newUserVote };
      }
      return p;
    }));

    // Fire to database quietly into the background
    await fetch('/.netlify/functions/api/vote', {
      method: 'POST',
      body: JSON.stringify({ problem_id: problemId, device_id: deviceId, vote_type: type })
    });
  };

  const handleUpvote = (id) => handleVote(id, 'up');
  const handleDownvote = (id) => handleVote(id, 'down');

  const handleReplySubmit = async (problemId, replyText, parentReplyId = null) => {
    // Optimistic UI update
    setProblems(probs => probs.map(p => {
      if (p.id === problemId) {
        return {
          ...p,
          replies: [...(p.replies || []), { id: Date.now(), text: replyText, timeAgo: 'Just now', creator_id: deviceId, parent_reply_id: parentReplyId }]
        };
      }
      return p;
    }));

    // Persist to Neon DB
    await fetch('/.netlify/functions/api/replies', {
      method: 'POST',
      body: JSON.stringify({ problem_id: problemId, text: replyText, device_id: deviceId, parent_reply_id: parentReplyId })
    });
  };

  const handleDeleteReply = async (problemId, replyId) => {
    // Optimistic UI deletion
    setProblems(probs => probs.map(p => {
      if (p.id === problemId) {
        return { ...p, replies: p.replies.filter(r => r.id !== replyId) };
      }
      return p;
    }));

    // Delete securely from the database
    await fetch('/.netlify/functions/api/replies', {
      method: 'DELETE',
      body: JSON.stringify({ reply_id: replyId, device_id: deviceId })
    });
  };

  const handleCreatePost = async (postData) => {
    try {
      // Persist new post to Neon DB
      const res = await fetch('/.netlify/functions/api/problems', {
        method: 'POST',
        body: JSON.stringify({
          title: postData.title,
          description: postData.description,
          category: postData.category,
          device_id: deviceId // Also automatically registers their first 'upvote' for their own post
        })
      });

      if (!res.ok) {
        let errorMsg = "Failed to post issue. Please check the backend connection.";
        try {
          const errData = await res.json();
          if (errData.error === "Profanity is not allowed." || res.status === 400) {
            errorMsg = "Don't use offensive language";
          } else if (errData.error) {
            errorMsg = errData.error;
          }
        } catch (e) {
          // Fall back to default message if JSON parsing fails
        }
        throw new Error(errorMsg);
      }

      const newPost = await res.json();

      // Update local state with the newly minted DB record
      setProblems([{ ...newPost, timeAgo: newPost.created_at ? calculateTimeAgo(newPost.created_at) : 'Just now', userVote: 'up', replies: [] }, ...problems]);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePost = async (problemId) => {
    // Optimistic UI deletion
    setProblems(probs => probs.filter(p => p.id !== problemId));

    // Delete securely from the database (backend guarantees ownership via deviceId)
    await fetch('/.netlify/functions/api/problems', {
      method: 'DELETE',
      body: JSON.stringify({ problem_id: problemId, device_id: deviceId })
    });
  };

  const handleSolvePost = async (problemId) => {
    const problemToUpdate = problems.find(p => p.id === problemId);
    if (!problemToUpdate) return;

    const newSolvedState = !problemToUpdate.solved;

    // Optimistic UI update
    setProblems(probs => probs.map(p => {
      if (p.id === problemId) {
        return { ...p, solved: newSolvedState };
      }
      return p;
    }));

    // Persist to database
    await fetch('/.netlify/functions/api/problems', {
      method: 'PATCH',
      body: JSON.stringify({ problem_id: problemId, device_id: deviceId, solved: newSolvedState })
    });
  };

  const handleAskAI = async (problem) => {
    setSelectedProblemId(problem.id);
    setAiSuggestion('');
    setIsAILoading(true);

    // Smooth scroll to the AI panel on mobile devices
    setTimeout(() => {
      if (window.innerWidth <= 768) {
        const aiSidebar = document.querySelector('.ai-sidebar');
        if (aiSidebar) {
          aiSidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);

    try {
      const res = await fetch('/.netlify/functions/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: problem.title,
          description: problem.description,
          category: problem.category
        })
      });

      if (!res.ok) {
        let errorMsg = "Failed to get AI suggestion";
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch (e) { }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setAiSuggestion(data.suggestion);
    } catch (err) {
      console.error(err);
      if (err.message.includes("Gemini API Key")) {
        setAiSuggestion("💡 **Missing API Key**\n\nThe Gemini API Key is not configured.\n\nPlease add `GEMINI_API_KEY = your_key_here` to the `.env` file in the root folder, and then restart the development server.");
      } else {
        setAiSuggestion(`Sorry, I couldn't generate a suggestion right now. (${err.message})`);
      }
    } finally {
      setIsAILoading(false);
    }
  };

  const handlePollVote = async (problemId, voteOption) => {
    if (!deviceId) return;
    try {
      const res = await fetch('/.netlify/functions/api/poll_vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_id: problemId, device_id: deviceId, vote_option: voteOption })
      });
      if (!res.ok) throw new Error("Failed to vote on poll");

      setProblems(prev => prev.map(p => {
        if (p.id === problemId) {
          const prevVote = p.user_poll_vote;
          let newYes = parseInt(p.poll_yes || 0);
          let newNo = parseInt(p.poll_no || 0);

          if (prevVote === voteOption) {
            if (voteOption === 'yes') newYes--;
            if (voteOption === 'no') newNo--;
            return { ...p, user_poll_vote: null, poll_yes: newYes, poll_no: newNo };
          } else {
            if (prevVote === 'yes') newYes--;
            if (prevVote === 'no') newNo--;
            if (voteOption === 'yes') newYes++;
            if (voteOption === 'no') newNo++;
            return { ...p, user_poll_vote: voteOption, poll_yes: newYes, poll_no: newNo };
          }
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app-container">
      <header className="app-header glass-effect">
        <div className="logo-container">
          <h1>Uni<span>Voice</span></h1>
        </div>

        <nav className="main-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/top" className={`nav-link ${location.pathname === '/top' ? 'active' : ''}`}>Top Discussed</Link>
          <Link to="/recent" className={`nav-link ${location.pathname === '/recent' ? 'active' : ''}`}>Recent Activity</Link>
        </nav>

        <div className="header-controls">
          {userLocation && (
            <div className="location-badge">
              <MapPin size={16} />
              <span>{userLocation}</span>
            </div>
          )}

          <div className="theme-switcher">
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeClick('light')}
              title="Light Mode"
            >
              <Sun size={20} />
            </button>
            <button
              className={`theme-btn ${theme === 'afternoon' ? 'active' : ''}`}
              onClick={() => handleThemeClick('afternoon')}
              title="Afternoon Mode"
            >
              <Sunset size={20} />
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeClick('dark')}
              title="Dark Mode"
            >
              <Moon size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="compose-btn-wrapper">
            <button className="primary-btn pulse-button" style={{ width: '100%' }} onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={20} />
              Report Issue
            </button>
          </div>

          <h2>Filters</h2>
          <div className="filter-list">
            <label className="filter-item">
              <input
                type="radio" name="category" value="All"
                checked={filter === 'All'}
                onChange={() => setFilter('All')}
              />
              <span>All Problems</span>
            </label>
            {standardCategories.map(cat => (
              <label key={cat} className="filter-item">
                <input
                  type="radio" name="category" value={cat}
                  checked={filter === cat}
                  onChange={() => setFilter(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}

            {customCategories.length > 0 && (
              <div className="custom-filter-group">
                <div
                  className="filter-item custom-filter-toggle"
                  onClick={() => setIsCustomFilterOpen(!isCustomFilterOpen)}
                >
                  <span style={{ flex: 1, fontWeight: '600' }}>Custom</span>
                  {isCustomFilterOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>

                {isCustomFilterOpen && (
                  <div className="custom-categories-list slide-down">
                    {customCategories.map(cat => (
                      <label key={cat} className="filter-item sub-filter-item">
                        <input
                          type="radio" name="category" value={cat}
                          checked={filter === cat}
                          onChange={() => setFilter(cat)}
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        <main className="content-area">
          <Routes>
            <Route path="/" element={<Home problems={problems} filter={filter} onUpvote={handleUpvote} onDownvote={handleDownvote} onReplySubmit={handleReplySubmit} deviceId={deviceId} onDelete={handleDeletePost} onDeleteReply={handleDeleteReply} onSolve={handleSolvePost} onAskAI={handleAskAI} onProblemSelect={setSelectedProblemId} selectedId={selectedProblemId} />} />
            <Route path="/top" element={<Top problems={problems} filter={filter} onUpvote={handleUpvote} onDownvote={handleDownvote} onReplySubmit={handleReplySubmit} deviceId={deviceId} onDelete={handleDeletePost} onDeleteReply={handleDeleteReply} onSolve={handleSolvePost} onAskAI={handleAskAI} onProblemSelect={setSelectedProblemId} selectedId={selectedProblemId} />} />
            <Route path="/recent" element={<Recent problems={problems} filter={filter} onUpvote={handleUpvote} onDownvote={handleDownvote} onReplySubmit={handleReplySubmit} deviceId={deviceId} onDelete={handleDeletePost} onDeleteReply={handleDeleteReply} onSolve={handleSolvePost} onAskAI={handleAskAI} onProblemSelect={setSelectedProblemId} selectedId={selectedProblemId} />} />
          </Routes>
        </main>

        <RightSidebar
          problems={problems}
          selectedProblem={selectedProblem}
          aiSuggestion={aiSuggestion}
          isAILoading={isAILoading}
          onCloseAI={() => {
            setSelectedProblemId(null);
            setAiSuggestion('');
          }}
          onPollVote={handlePollVote}
          deviceId={deviceId}
          totalVisitors={totalVisitors}
        />
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        categories={categories}
      />
    </div>
  );
}

export default App;
