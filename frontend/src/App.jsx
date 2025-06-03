import React from 'react'
import AppRoutes from './routes/AppRoutes'
import UserProvider from './context/UserProvider'

// Main App component that wraps routes with user provider
const App = () => {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  )
}

export default App