# AI-Integrated Project Collaboration Chat App  

This repository contains the source code for an **AI-powered project collaboration chat application**. The app allows users to create projects, invite collaborators, and communicate in private chat rooms. Additionally, users can interact with an AI assistant for code generation and request AI-powered server code execution directly in the browser.  

---

## Description  

The AI-Integrated Project Collaboration Chat App is a **real-time** platform designed for teams to work together seamlessly. Users can:  
✅ **Register and log in** securely.  
✅ **Create projects** and invite collaborators.  
✅ **Communicate privately** in project-specific chat rooms.  
✅ **Interact with AI** using `@ai` commands for assistance.  
✅ **Request AI-generated server code** and run it within the browser.  

This application enhances teamwork and efficiency by integrating **AI-powered assistance** into collaborative software development.  

---

## Features  

### 🏠 Authentication  
- Users can **register** and **log in** securely.  
- 2FA (Two-Factor Authentication) for enhanced security.  
 

### 📂 Project Management  
- Create new projects and provide a project name.  
- Invite **collaborators** to join the project.  
 

### 💬 Real-Time Chat & AI Interaction  
- Private chat rooms for project members.  
- Interact with AI using `@ai` for:  
  - **General queries**  
  - **Code assistance**  
  - **Debugging suggestions**  
  - **Code review**  
 
 
### 🖥 AI-Powered Server Code Execution  
- Users can request AI-generated **server code**.  
- The application provides an **embedded code editor** to modify code.  
- Run the **generated server code directly in the browser**.  
 

---

## Technologies Used  

| Technology    | Purpose |
|--------------|---------|
| **React.js** | Frontend UI & chat interface |
| **Node.js (Express)** | Backend API |
| **MongoDB** | Database for user/projects |
| **Socket.io** | Real-time chat functionality |
| **Redis** | Efficient session & message handling |
| **Gemini AI** | AI for code generation and queries |
| **Web Container** | Running AI-powered server containers |

---

## Getting Started  

### 🔹 Setup Locally  

1️⃣ **Clone the repository**  
```sh
git clone [repository URL]
cd project-name
```
2️⃣ **Install backend dependencies** 
```sh
cd server
npm install
```
3️⃣ Install frontend dependencies
```sh
cd ../client
npm install
```
🔹 Run the Project

4️⃣ Start the backend server
```sh
cd ../server
npm start
```
5️⃣ Start the frontend application
```sh
cd ../client
npm start
