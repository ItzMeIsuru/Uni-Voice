import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <h1 className="loading-logo">
                    Uni<span>Voice</span>
                </h1>
                <div className="loading-bar-track">
                    <div className="loading-bar-fill"></div>
                </div>
                <p className="loading-subtext">CAMPUS ISSUE PLATFORM</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
