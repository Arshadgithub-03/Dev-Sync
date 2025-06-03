import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import UserAuth from '../auth/UserAuth'

// Main routing component for the app
const AppRoutes = () => {
    return (
        <div>
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/register' element={<Register />} />
                    {/* Protect the project route with authentication */}
                    <Route path='/project' element={<UserAuth><Project /></UserAuth>} />
                </Routes>
            </BrowserRouter>
        </div>
    )
}

export default AppRoutes