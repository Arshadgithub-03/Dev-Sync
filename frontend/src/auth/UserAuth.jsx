import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/UserProvider.jsx';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';

// Component to protect routes that require authentication
const UserAuth = ({ children }) => {
    // Access user context
    const { user, setUser } = useContext(UserContext);
    // State to show loading indicator
    const [loading, setLoading] = useState(true);
    // Navigation hook
    const navigate = useNavigate();

    useEffect(() => {
        // Get token and user from localStorage
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        // If no token or user, redirect to login
        if (!token || !storedUser) {
            setLoading(false);
            navigate('/login');
            return;
        }

        // If user is not set, validate token with backend
        if (!user) {
            axios.get('/users/me')
                .then((res) => {
                    setUser(res.data.user);
                })
                .catch((err) => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [user, setUser, navigate]);

    // Show loading indicator while validating
    if (loading) {
        return <div>Loading...</div>;
    }

    // Render children if authenticated
    return <>{children}</>;
};

export default UserAuth;