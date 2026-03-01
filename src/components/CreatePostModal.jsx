import { useState } from 'react';
import { X, Send } from 'lucide-react';

const CreatePostModal = ({ isOpen, onClose, onSubmit, categories }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(categories[0]);
    const [customCategory, setCustomCategory] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        const selectedCat = category === 'Custom' && customCategory.trim() !== ''
            ? customCategory.trim()
            : category;

        onSubmit({
            title,
            description,
            category: selectedCat
        });

        // Reset
        setTitle('');
        setDescription('');
        setCategory(categories[0]);
        setCustomCategory('');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Report an Issue Anonymously</h2>
                    <button className="icon-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="post-form">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            placeholder="Briefly describe the issue..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {category === 'Custom' && (
                        <div className="form-group slide-down">
                            <label>Custom Category Name</label>
                            <input
                                type="text"
                                placeholder="E.g., Library, Sports Center..."
                                value={customCategory}
                                onChange={e => setCustomCategory(e.target.value)}
                                required
                                maxLength={30}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Details</label>
                        <textarea
                            placeholder="Provide more details about what's going on..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            rows={4}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-btn">
                            <Send size={18} />
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
