import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-content slide-down">
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="confirm-btn yes-btn" onClick={onConfirm}>
                        Yes
                    </button>
                    <button className="confirm-btn no-btn" onClick={onClose}>
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
