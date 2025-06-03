// socket.js - Socket.io client for real-time collaboration
import socket from 'socket.io-client'


let socketInstance = null 


// Initialize socket connection for a specific project
export const initializeSocket = (projectId) => {

    socketInstance = socket(import.meta.env.VITE_API_URL, {
        auth: {
            token: localStorage.getItem('token')
        },
        query: {
            projectId
        }
    })
    return socketInstance
}


// Listen for a specific event from the server
export const receiveMessage = (eventName, cb) => {
    socketInstance.on(eventName, cb)
}


// Emit an event with data to the server
export const sendMessage = (eventName, data) => {
    socketInstance.emit(eventName, data)
}