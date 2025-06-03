import { createContext, useEffect, useState } from "react";

// Create a context for user authentication
export const UserContext = createContext();

// Provider component to wrap the app and provide user state
const UserProvider = ({ children }) => {
    // State to hold the current user
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Load user from localStorage if available
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            setUser(null); // Start as guest if no user in localStorage
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;