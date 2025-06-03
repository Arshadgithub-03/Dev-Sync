// Project.jsx - Main collaborative project screen

// Imports
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { markdown } from "@codemirror/lang-markdown";
import { material } from "@uiw/codemirror-theme-material";
import { githubDark } from "@uiw/codemirror-theme-github";
import { createTheme } from "@uiw/codemirror-themes";
import { draculaInit } from "@uiw/codemirror-theme-dracula";
import { debounce, throttle } from "lodash";
import { EditorView, WidgetType, Decoration } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { autocompletion } from "@codemirror/autocomplete";
import { linter } from "@codemirror/lint";

import React, { useState, useEffect, useContext, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from '../config/axios.js'
import { initializeSocket, sendMessage, receiveMessage } from '../config/socket.js'
import { UserContext } from '../context/UserProvider.jsx'
import Markdown from 'markdown-to-jsx'
import { getWebContainer } from "../config/webContainer.js";
import { pythonIcon, cppIcon, javaIcon, goIcon, swiftIcon, kotlinIcon } from '../components/LanguageIcons.jsx';
import { Icon } from '@iconify/react';

const dracula = draculaInit();

const CURSOR_TIMEOUT = 2000;
const ONLINE_TIMEOUT = 60 * 1000; // 60 seconds

const languageExtensions = {
  js: javascript(),
  jsx: javascript({ jsx: true }),
  ts: javascript({ typescript: true }),
  py: python(),
  java: java(),
  cpp: cpp(),
  html: html(),
  css: css(),
  md: markdown(),
};

const detectLanguage = (filename) => {
  const extension = (filename || 'index.js').split('.').pop().toLowerCase();
  return languageExtensions[extension] || javascript();
};

const THEMES = {
  dracula,
  material,
  githubDark
};

const fileIcons = {
  // Programming Languages
  js: <Icon icon="devicon:javascript" width="1em" height="1em" color="#f7e018" />,
  jsx: <Icon icon="devicon:react" width="1em" height="1em" color="#61dafb" />,
  ts: <Icon icon="devicon:typescript" width="1em" height="1em" color="#3178c6" />,
  tsx: <Icon icon="devicon:typescript" width="1em" height="1em" color="#3178c6" />,
  html: <Icon icon="devicon:html5" width="1em" height="1em" color="#e34c26" />,
  css: <Icon icon="devicon:css3" width="1em" height="1em" color="#264de4" />,
  scss: <Icon icon="devicon:sass" width="1em" height="1em" />,
  less: <Icon icon="vscode-icons:file-type-less" width="1em" height="1em" />,
  json: <Icon icon="vscode-icons:file-type-json" width="1em" height="1em" />,

  // Configuration Files
  env: <Icon icon="vscode-icons:file-type-env" width="1em" height="1em" />,
  lock: <Icon icon="vscode-icons:file-type-lock" width="1em" height="1em" />,
  yml: <Icon icon="vscode-icons:file-type-yaml" width="1em" height="1em" />,
  yaml: <Icon icon="vscode-icons:file-type-yaml" width="1em" height="1em" />,
  toml: <Icon icon="vscode-icons:file-type-toml" width="1em" height="1em" />,

  // Documents
  md: <Icon icon="devicon:markdown" width="1em" height="1em" />,
  txt: <Icon icon="vscode-icons:file-type-text" width="1em" height="1em" />,

  // Assets
  png: <Icon icon="vscode-icons:file-type-png" width="1em" height="1em" />,
  jpg: <Icon icon="vscode-icons:file-type-jpg" width="1em" height="1em" />,
  jpeg: <Icon icon="vscode-icons:file-type-jpg" width="1em" height="1em" />,
  gif: <Icon icon="vscode-icons:file-type-gif" width="1em" height="1em" />,
  svg: <Icon icon="devicon:svg" width="1em" height="1em" />,
  webp: <Icon icon="vscode-icons:file-type-webp" width="1em" height="1em" />,
  ico: <Icon icon="vscode-icons:file-type-image" width="1em" height="1em" />,

  // Media Files
  mp3: <Icon icon="vscode-icons:file-type-audio" width="1em" height="1em" />,
  wav: <Icon icon="vscode-icons:file-type-audio" width="1em" height="1em" />,
  mp4: <Icon icon="vscode-icons:file-type-video" width="1em" height="1em" />,
  webm: <Icon icon="vscode-icons:file-type-video" width="1em" height="1em" />,

  // Fonts
  woff: <Icon icon="vscode-icons:file-type-font" width="1em" height="1em" />,
  woff2: <Icon icon="vscode-icons:file-type-font" width="1em" height="1em" />,
  ttf: <Icon icon="vscode-icons:file-type-font" width="1em" height="1em" />,

  // System Files
  dockerfile: <Icon icon="devicon:docker" width="1em" height="1em" />,
  sh: <Icon icon="devicon:bash" width="1em" height="1em" />,
  default: <Icon icon="vscode-icons:file-type-generic" width="1em" height="1em" />
};

const allowedExtensions = [
  // Code Files
  'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'less', 'json',

  // Configuration
  'env', 'lock', 'yml', 'yaml', 'toml',

  // Documents
  'md', 'txt',

  // Assets
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico',

  // Media
  'mp3', 'wav', 'mp4', 'webm',

  // Fonts
  'woff', 'woff2', 'ttf',

  // System
  'dockerfile', 'sh'
];

// Component to render AI messages with special formatting
const WriteAiMessage = React.memo(({ message }) => {
  const formattedContent = (() => {
    try {
      const parsed = typeof message === 'string' ? JSON.parse(message) : message;
      // If parsed is an object, try to extract a string property
      if (typeof parsed === 'object' && parsed !== null) {
        // Prefer 'text', then 'joke', then first string property
        if (typeof parsed.text === 'string') return parsed.text;
        if (typeof parsed.joke === 'string') return parsed.joke;
        // Fallback: find first string property
        const firstStringProp = Object.values(parsed).find(v => typeof v === 'string');
        if (firstStringProp) return firstStringProp;
        // If no string property, stringify the object
        return JSON.stringify(parsed, null, 2);
      }
      return parsed;
    } catch {
      return typeof message === 'string' ? message : String(message);
    }
  })();

  return (
    <div className="ai-reply bg-gray-800 rounded-lg p-4 text-sm leading-relaxed text-gray-300 shadow-md border border-gray-700">
      <Markdown
        options={{
          overrides: {
            // Custom components for special blocks
            think: {
              component: ({ children }) => (
                <div className="bg-gray-700/50 p-3 rounded-lg my-3 border-l-4 border-blue-500">
                  <div className="text-blue-400 text-xs font-mono mb-2">THINKING PROCESS:</div>
                  <div className="text-gray-300 text-sm space-y-2">{children}</div>
                </div>
              )

              // component: () => null
            },
            // Headings hierarchy
            h1: { component: ({ children }) => <h1 className="text-xl font-bold text-gray-100 mb-3 mt-2">{children}</h1> },
            h2: { component: ({ children }) => <h2 className="text-lg font-semibold text-gray-100 mb-2 mt-4">{children}</h2> },
            h3: { component: ({ children }) => <h3 className="text-md font-medium text-gray-200 mb-2 mt-3">{children}</h3> },
            h4: { component: ({ children }) => <h4 className="text-sm font-medium text-gray-300 mb-1 mt-2">{children}</h4> },
            // Paragraphs with proper spacing
            p: { component: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p> },
            // Code blocks with proper language detection
            code: {
              component: ({ children, className }) => {
                const language = className?.replace('language-', '') || 'plaintext';
                return (
                  <div className="bg-gray-900 rounded-md overflow-hidden mb-4 mt-2 shadow-lg">
                    <div className="flex justify-between items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
                      <span>{language}</span>
                    </div>
                    <pre className="p-4 overflow-auto">
                      <code className={`language-${language} text-sm`}>{children}</code>
                    </pre>
                  </div>
                );
              }
            },
            // Inline code snippets
            inlineCode: { component: ({ children }) => <code className="bg-gray-700 px-1 py-0.5 rounded text-red-300 text-sm">{children}</code> },
            // Lists with improved spacing
            ul: { component: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4 pl-4">{children}</ul> },
            ol: { component: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4 pl-4">{children}</ol> },
            li: { component: ({ children }) => <li className="text-gray-300 pl-2">{children}</li> },
            // Blockquotes with updated styling
            blockquote: {
              component: ({ children }) => (
                <blockquote className="border-l-4 border-green-500 pl-4 text-gray-400 italic my-4 bg-gray-700/20 py-2 rounded-r">
                  {children}
                </blockquote>
              )
            },
            // Tables support
            table: { component: ({ children }) => <table className="w-full my-4 bg-gray-700/20 rounded-lg overflow-hidden">{children}</table> },
            th: { component: ({ children }) => <th className="px-4 py-2 bg-gray-800 text-left text-gray-300 border-b border-gray-600">{children}</th> },
            td: { component: ({ children }) => <td className="px-4 py-2 border-b border-gray-700/50 text-gray-400">{children}</td> }
          }
        }}
      >
        {formattedContent}
      </Markdown>
    </div>
  );
});

// Main Project component
const Project = () => {
  // ====== Context and Navigation ======
  const location = useLocation(); // Get current route location (for project data)
  const { user } = useContext(UserContext); // Get current user from context
  const navigate = useNavigate(); // For navigation (e.g., go to home)

  // ====== State Management ======
  // UI state
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false); // Collaborators panel
  const [isModalOpen, setIsModalOpen] = useState(false); // Add collaborators modal
  const [selectedUserIds, setSelectedUserIds] = useState([]); // Selected users for adding

  // Project and chat state
  const [project, setProject] = useState(location.state.project); // Current project
  const [message, setMessage] = useState(''); // Current chat message
  const [users, setUsers] = useState([]); // All users (for adding collaborators)
  const [messages, setMessages] = useState([]); // Project chat messages

  // File system state
  const [fileTree, setFileTree] = useState({}); // Project file structure
  const [currentFile, setCurrentFile] = useState(null); // Currently open file
  const [openFiles, setOpenFiles] = useState([]); // Tabs of open files
  const [openFolders, setOpenFolders] = useState([]); // Expanded folders in explorer

  // WebContainer and preview state
  const [webContainer, setWebContainer] = useState(null); // WebContainer instance
  const [reloadKey, setReloadKey] = useState(0); // For preview reload
  const [isInstalling, setIsInstalling] = useState(false); // NPM install status
  const [isInstalled, setIsInstalled] = useState(false); // NPM install done
  const [iframeUrl, setIframeUrl] = useState(null); // Preview iframe URL
  const [runProcess, setRunProcess] = useState(null); // Running process in container
  const [selectedTheme, setSelectedTheme] = useState('dracula'); // Code editor theme

  // File/folder creation state
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Collaboration state
  const [collaborators, setCollaborators] = useState({}); // Online/typing status
  const [localCursor, setLocalCursor] = useState(null); // Local user cursor
  const [remoteCursors, setRemoteCursors] = useState([]); // Other users' cursors
  const typingTimeoutRef = useRef(null); // For typing status debounce

  // Preview panel state
  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(false);

  // Misc refs and state
  const messageBoxRef = React.useRef(null); // For auto-scroll in chat
  const [searchQuery, setSearchQuery] = useState(""); // User search in modal
  const [contextMenu, setContextMenu] = useState(null); // Right-click context menu
  const [isRenaming, setIsRenaming] = useState(false); // <-- Move isRenaming to parent
  const [renameInput, setRenameInput] = useState(""); // <-- Move renameInput to parent
  const [creationType, setCreationType] = useState(null); // 'file' or 'folder' (explorer)
  const [creationPath, setCreationPath] = useState(''); // Path for new file/folder
  const [creationContext, setCreationContext] = useState({
    type: null, // 'file' or 'folder'
    parentPath: null,
    name: ''
  });
  const creationInputRef = useRef(null);

  // ====== User and Collaborator Handlers ======
  // Toggle user selection for adding as collaborator
  const handleUserClick = (id) => {
    // Update selected user IDs for collaborator modal
    setSelectedUserIds(prevSelectedUserIds => {
      const newSelectedUserIds = new Set(prevSelectedUserIds);
      if (newSelectedUserIds.has(id)) {
        newSelectedUserIds.delete(id);
      } else {
        newSelectedUserIds.add(id);
      }
      return newSelectedUserIds;
    });
  };

  // Add selected users as collaborators (admin only)
  function addCollaborators() {
    // Only allow admin to add collaborators
    if (!user || user._id !== location.state.project.admin?._id) {
      alert("Only the admin can add collaborators.");
      return;
    }
    // Require at least one user selected
    if (selectedUserIds.size === 0) {
      alert("Select users");
      return;
    }
    // Send request to backend to add users
    axios.put("/projects/add-user", {
      projectId: location.state.project._id,
      users: Array.from(selectedUserIds)
    })
      .then(res => {
        setIsModalOpen(false);
      })
      .catch(err => {
        console.log(err);
      });
  }

  // Remove collaborator (admin only)
  function removeCollaborator(userId) {
    if (!user || user._id !== project.admin?._id) {
      alert("Only the admin can remove collaborators.");
      return;
    }
    if (userId === project.admin?._id) {
      alert("Cannot remove the admin from the project.");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this collaborator?")) return;
    axios.put("/projects/remove-user", {
      projectId: project._id,
      userId
    })
      .then(res => {
        setProject(res.data.project);
      })
      .catch(err => {
        alert(err.response?.data?.error || err.message);
      });
  }

  // Generate a unique color for each sender (for chat/cursors)
  function getColorForSender(sender) {
    // Hash sender string to generate a color hue
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 100%, 80%)`;
  }

  // ====== Chat Handlers ======
  // Send a chat message (and update collaborators' status)
  const send = (message) => {
    // Mark self as active
    setCollaborators(prev => ({
      ...prev,
      [user._id]: { ...prev[user._id], lastActive: Date.now() }
    }));
    // Trim and validate message
    const trimmedMessage = message.trim();
    if (trimmedMessage === "") return;
    // Build outgoing message object
    const outgoingMessage = {
      sender: { _id: user._id, name: user.name },
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
    };
    // Send message to collaborators and save to DB
    sendMessage("project-message", outgoingMessage);
    setMessages((prevMessages) => [...prevMessages, outgoingMessage]);
    saveMessageToDB(outgoingMessage);
  };

  // Save a chat message to the backend
  const saveMessageToDB = async (messageData) => {
    // POST message to backend for persistence
    try {
      await axios.post('/projects/save-message', {
        projectId: project._id,
        sender: messageData.sender,
        message: messageData.message
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  // Context Menu Component
  // Context Menu Component for file/folder actions (rename/delete)
  const ContextMenu = ({ position, targetPath, isFolder }) => {
    const inputRef = useRef(null);
    const menuRef = useRef(null);

    // Hide menu if click outside (including rename input)
    useEffect(() => {
      if (!position) return;
      function handleClickOutside(event) {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target)
        ) {
          setIsRenaming(false);
          setContextMenu(null);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [position]);

    // Handle menu actions: rename or delete
    const handleAction = (action) => {
      switch (action) {
        case 'rename':
          setRenameInput(targetPath.split('/')?.pop());
          setIsRenaming(true);
          setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
          }, 0);
          break;
        case 'delete':
          deleteFileOrFolder(targetPath);
          setContextMenu(null);
          break;
        default:
          break;
      }
    };

    // Handle rename form submit
    const handleRenameSubmit = (e) => {
      e.preventDefault();
      if (renameInput.trim() && targetPath) {
        // Build new path for renamed item
        const parts = targetPath.split('/');
        parts.pop();
        const newPath = parts.length ? parts.join('/') + '/' + renameInput.trim() : renameInput.trim();
        handleRename(targetPath, newPath);
        setIsRenaming(false);
        setContextMenu(null);
      }
    };

    if (!position) return null;

    return (
      <div
        ref={menuRef}
        className="fixed bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-2 z-[9999]"
        style={{ left: position.x, top: position.y, minWidth: 160 }}
      >
        <div className="text-white min-w-[160px]">
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="px-4 py-2">
              <input
                ref={inputRef}
                autoFocus
                id="rename-input"
                name="rename"
                type="text"
                value={renameInput}
                onChange={e => setRenameInput(e.target.value)}
                className="bg-gray-800 text-white px-2 py-1 rounded text-sm w-32 z-[10000] relative"
                style={{ position: 'relative', zIndex: 10000, minWidth: 120 }}
                aria-label="Rename file or folder"
              />
              <button type="submit" className="hidden">Rename</button>
            </form>
          ) : (
            <>
              <button
                onClick={() => handleAction('rename')}
                className="w-full px-4 py-2 text-left hover:bg-gray-700"
                title="Rename"
              >
                Rename
              </button>
              <button
                onClick={() => handleAction('delete')}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 text-red-400"
                title="Delete"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Create a new file or folder in the file tree
  const handleCreate = () => {
    // Destructure creation context
    const { type, parentPath, name } = creationContext;

    // If no name is entered, reset creation state
    if (!name.trim()) {
      setCreationContext({ type: null, parentPath: null, name: '' });
      return;
    }

    // Only allow valid file extensions for files
    if (type === 'file') {
      const ext = name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        alert(`Allowed extensions: ${allowedExtensions.join(', ')}`);
        return;
      }
    }

    setFileTree(prev => {
      // Clone file tree to avoid mutation
      const newTree = structuredClone(prev);
      let current = newTree;
      const pathParts = parentPath ? parentPath.split('/') : [];

      // Traverse to the parent directory
      for (const part of pathParts) {
        if (!current[part]) current[part] = {};
        current = current[part];
      }

      // Add the new file or folder if it doesn't exist
      if (!current[name]) {
        current[name] = type === 'file' ? { file: { contents: '' } } : {};
        // Save the updated file tree
        autoSave(newTree);
      }

      return newTree;
    });

    // If a file was created, open it in the editor
    if (type === 'file') {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      setCurrentFile(fullPath);
      setOpenFiles(prev => [...new Set([...prev, fullPath])]);
    }

    // Expand parent folders if needed
    if (parentPath) {
      setOpenFolders(prev => {
        const paths = parentPath.split('/');
        const newFolders = [];
        let currentPath = '';

        for (const path of paths) {
          currentPath = currentPath ? `${currentPath}/${path}` : path;
          if (!prev.includes(currentPath)) {
            newFolders.push(currentPath);
          }
        }

        return [...prev, ...newFolders];
      });
    }

    // Reset creation state
    setCreationContext({ type: null, parentPath: null, name: '' });
  };

  // Create a new file or folder with validation and auto-open logic
  const handleCreateItem = (parentPath, name, type) => {
    // Build full path for new item
    const fullPath = parentPath ? `${parentPath}/${name}` : name;

    // Check for duplicate item
    if (existsInFileTree(fullPath, fileTree)) {
      alert('Item already exists!');
      return;
    }

    // Validate name (no empty or slashes)
    if (!name || name.includes('/')) {
      alert('Invalid name');
      return;
    }

    // Validate file extension for files
    if (type === 'file') {
      const extension = name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        alert(`Invalid extension. Allowed: ${allowedExtensions.join(', ')}`);
        return;
      }
    }

    setFileTree(prev => {
      // Clone file tree
      const newTree = structuredClone(prev);
      let current = newTree;
      const parts = parentPath ? parentPath.split('/') : [];

      // Validate path (cannot create inside a file)
      for (const part of parts) {
        if (current[part]?.file) {
          alert('Invalid path - cannot create in file');
          return prev;
        }
        current[part] = current[part] || {};
        current = current[part];
      }
      // Add new item if it doesn't exist
      if (!current[name]) {
        current[name] = type === 'file'
          ? { file: { contents: '' } }
          : {};

        // Expand parent folders automatically
        const newOpenFolders = [...openFolders];
        let currentPath = '';
        for (const part of parts) {
          currentPath += (currentPath ? '/' : '') + part;
          if (!newOpenFolders.includes(currentPath)) {
            newOpenFolders.push(currentPath);
          }
        }
        setOpenFolders(newOpenFolders);
        // Save updated tree
        autoSave(newTree);
      }

      return newTree;
    });

    // Auto-open new file in editor
    if (type === 'file') {
      setCurrentFile(fullPath);
      setOpenFiles(prev => [...new Set([...prev, fullPath])]);
    }
  };

  // Check if a path exists in the file tree
  const existsInFileTree = (path, tree) => {
    // Split path and traverse tree
    const parts = path.split('/');
    let current = tree;
    for (const part of parts) {
      if (!current[part]) return false;
      current = current[part];
    }
    return true;
  };

  // Rename a file or folder in the file tree
  const handleRename = (oldPath, newPath) => {
    // Validate new path
    if (!newPath || newPath.includes('/../') || newPath.endsWith('/')) {
      alert('Invalid name');
      return;
    }
    setFileTree(prev => {
      // Clone tree and split paths
      const newTree = structuredClone(prev);
      const oldParts = oldPath.split('/');
      const newParts = newPath.split('/');
      const oldName = oldParts.pop();
      const newName = newParts.pop();
      let currentOld = newTree;
      let currentNew = newTree;
      // Traverse to old and new parent directories
      for (const part of oldParts) {
        if (!currentOld[part]) return prev;
        currentOld = currentOld[part];
      }
      for (const part of newParts) {
        if (!currentNew[part]) currentNew[part] = {};
        currentNew = currentNew[part];
      }
      // Move item to new path
      if (currentOld[oldName]) {
        currentNew[newName] = currentOld[oldName];
        delete currentOld[oldName];
      }
      // Save updated tree after rename
      autoSave(newTree);
      return newTree;
    });

    // Always treat as folder if any open file/folder path starts with oldPath + '/'
    setOpenFiles(prev => prev.map(file =>
      file === oldPath ? newPath : file.startsWith(oldPath + '/') ? file.replace(oldPath + '/', newPath + '/') : file
    ));
    setOpenFolders(prev => prev.map(folder =>
      folder === oldPath ? newPath : folder.startsWith(oldPath + '/') ? folder.replace(oldPath + '/', newPath + '/') : folder
    ));
    setCurrentFile(prev => {
      if (!prev) return prev;
      if (prev === oldPath) return newPath;
      if (prev.startsWith(oldPath + '/')) return prev.replace(oldPath + '/', newPath + '/');
      return prev;
    });
  };

  // Delete a file or folder from the file tree
  const deleteFileOrFolder = (path) => {
    // Confirm deletion with user
    if (window.confirm(`Are you sure you want to delete "${path}"?`)) {
      setFileTree(prev => {
        // Clone tree and traverse to parent
        const newTree = structuredClone(prev);
        const parts = path.split('/');
        let current = newTree;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) return prev; // Invalid path
          current = current[parts[i]];
        }
        // Delete the file/folder
        delete current[parts[parts.length - 1]];
        // Save updated tree
        autoSave(newTree);
        return newTree;
      });
      // Remove from open files/folders and reset current file if needed
      setOpenFiles(prev => prev.filter(file => file !== path));
      setOpenFolders(prev => prev.filter(folder => folder !== path));
      if (currentFile === path) setCurrentFile(null);
    }
  };

  // Get the contents of a file from the file tree
  const getFileContent = (path, tree) => {
    // Return empty string if no path or tree
    if (!tree || !path) return "";
    const parts = path.split("/");
    let current = tree;

    // Traverse to file node
    for (let i = 0; i < parts.length; i++) {
      if (!current[parts[i]]) return "";
      current = current[parts[i]];
    }

    const fileData = current?.file;
    // Handle image files (old/new format)
    if (fileData?.isImage) {
      // Debug: log the contents type and value (detailed)
      console.log('[DEBUG] Image fileData:', fileData);
      if (fileData.contents === undefined) {
        console.warn('[DEBUG] fileData.contents is undefined for', path);
        return '';
      }
      // If already base64 string
      if (typeof fileData.contents === 'string') {
        return fileData.contents.startsWith('data:image')
          ? fileData.contents.split(',')[1]
          : fileData.contents;
      }
      // If contents is Uint8Array or ArrayBuffer, convert to base64
      if (fileData.contents && typeof fileData.contents === 'object') {
        let bytes;
        if (fileData.contents instanceof Uint8Array) {
          bytes = fileData.contents;
        } else if (fileData.contents.buffer) {
          bytes = new Uint8Array(fileData.contents.buffer);
        } else {
          // Handle plain object (from JSON) with numeric keys (ensure correct order)
          const keys = Object.keys(fileData.contents).sort((a, b) => Number(a) - Number(b));
          const values = keys.map(k => fileData.contents[k]);
          if (values.every(v => typeof v === 'number')) {
            bytes = new Uint8Array(values);
          } else {
            console.warn('Image fileData.contents is not a valid byte array:', fileData.contents);
            return '';
          }
        }
        if (!bytes || !bytes.byteLength) {
          console.warn('Image bytes is empty or invalid:', bytes);
          return '';
        }
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        try {
          return btoa(binary);
        } catch (e) {
          console.error('btoa failed for image binary:', e);
          return '';
        }
      }
    }
    // Fallback: if contents is an object, return empty string to avoid [object Object]
    if (current?.file?.contents && typeof current.file.contents === 'object') {
      return '';
    }
    return current?.file?.contents || "";
  };

  // Render the file/folder tree recursively
  const renderFileTree = (tree = {}, currentPath = "") => {
    return (
      <div className="file-tree">
        {creationContext.type && creationContext.parentPath === currentPath && (
          <div className="creation-input pl-4 py-1" ref={creationInputRef}>
            <input
              autoFocus
              type="text"
              value={creationContext.name}
              onChange={(e) => setCreationContext(prev => ({
                ...prev,
                name: e.target.value
              }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setCreationContext({ type: null, parentPath: null, name: '' });
              }}
              className="bg-gray-800 text-white px-2 py-1 rounded text-sm w-36"
              placeholder={`New ${creationContext.type} name...`}
            />
          </div>
        )}

        {Object.entries(tree).map(([name, item]) => {
          const fullPath = currentPath ? `${currentPath}/${name}` : name;
          const isFolder = typeof item === 'object' && item !== null && !item.file;

          return (
            <div key={fullPath} className="tree-item">
              <div
                className="group flex items-center gap-2 hover:bg-gray-700 p-1 rounded relative"
                onContextMenu={e => {
                  e.preventDefault();
                  setContextMenu({ position: { x: e.clientX, y: e.clientY }, targetPath: fullPath, isFolder });
                  setIsRenaming(false);
                  setRenameInput("");
                }}
              >
                <button
                  className="flex items-center gap-2 flex-1"
                  onClick={() => {
                    if (isFolder) {
                      setOpenFolders(prev =>
                        prev.includes(fullPath)
                          ? prev.filter(p => p !== fullPath)
                          : [...prev, fullPath]
                      );
                    } else {
                      setCurrentFile(fullPath);
                      setOpenFiles(prev => prev.includes(fullPath) ? prev : [...prev, fullPath]);
                    }
                  }}
                >
                  {isFolder ? (
                    <i
                      className={`ri-folder-${openFolders.includes(fullPath) ? 'open' : 'close'
                        }-fill text-yellow-500`}
                    />
                  ) : (
                    getFileIcon(name)
                  )}
                  <span className="truncate pb-0.5">{name}</span>
                </button>

                {isFolder && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setCreationContext({
                          type: 'file',
                          parentPath: fullPath,
                          name: ''
                        });
                      }}
                      className="text-gray-400 hover:text-blue-400"
                      title="Create New File"
                    >
                      <i className="ri-file-add-line text-sm"></i>
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setCreationContext({
                          type: 'folder',
                          parentPath: fullPath,
                          name: ''
                        });
                      }}
                      className="text-gray-400 hover:text-yellow-500"
                      title="Create New Folder"
                    >
                      <i className="ri-folder-add-line text-sm"></i>
                    </button>
                  </div>
                )}
              </div>

              {isFolder && openFolders.includes(fullPath) && (
                <div className="ml-4">
                  {renderFileTree(item, fullPath)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Get the icon for a file based on its extension or type
  const getFileIcon = (fileName) => {
    if (isImageFile(fileName)) {
      return <Icon icon="vscode-icons:file-type-image" width="1em" height="1em" />;
    }
    if (!fileName) return fileIcons.default;
    let ext = fileName.split('.').pop().toLowerCase();
    // Special cases for files like Dockerfile, Makefile, etc.
    if (fileName.toLowerCase() === 'dockerfile') ext = 'dockerfile';
    if (fileName.toLowerCase() === 'makefile') ext = 'makefile';
    if (fileName.endsWith('.lock')) ext = 'lock';
    return fileIcons[ext] || fileIcons.default;
  };

  // Debounced auto-save of file tree to backend
  const autoSave = debounce((updatedFileTree) => {
    // Save file tree to backend
    axios.put("/projects/update-file-tree", {
      projectId: location.state.project._id,
      fileTree: updatedFileTree,
    }).then(res => {
      console.log("Auto-saved:", res.data);
    }).catch(err => {
      console.log("Error in auto-save:", err);
    });
  }, 3000);

  // Handle file upload (single or multiple files)
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    await processFileUpload(files);
    e.target.value = ''; // Reset input
  };

  // Handle folder upload (entire folder structure)
  const handleFolderUpload = async (e) => {
    const files = e.target.files;
    await processFileUpload(files, true);
    e.target.value = ''; // Reset input
  };

  // Check if a file is an image based on extension
  const isImageFile = (fileName) => {
    return /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName);
  };

  // Get MIME type for a file based on extension
  const getMimeType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp'
    }[ext] || 'application/octet-stream';
  };

  // Process uploaded files and add them to the file tree
  const processFileUpload = async (files, isFolderUpload = false) => {

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const newTree = structuredClone(fileTree);

    for (const file of files) {

      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} exceeds 5MB limit`);
        continue;
      }

      const webkitPath = file.webkitRelativePath || '';
      const pathParts = isFolderUpload
        ? webkitPath.split('/')
        : [file.name];

      let current = newTree;

      // Handle folder structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      const fileName = pathParts[pathParts.length - 1];
      const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName);
      const extension = fileName.split('.').pop().toLowerCase();

      // Validate file extension
      if (!allowedExtensions.includes(extension) && !isFolderUpload) {
        alert(`Invalid file type: ${extension}`);
        continue;
      }

      // Read file content
      const contents = await readFileContent(file, isImage);

      // Add to file tree
      current[fileName] = {
        file: {
          contents,
          encoding: isImage ? 'binary' : 'utf8',
          ...(isImage ? { isImage: true } : {})
        }
      };
    }

    setFileTree(newTree);
    autoSave(newTree);
  };

  // Read file content as text or binary (for images)
  const readFileContent = (file, isImage) => {
    return new Promise((resolve) => {
      if (!isImage) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const buffer = new Uint8Array(e.target.result);
          resolve(buffer);
        };
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Throttled function to update local cursor and broadcast to collaborators
  const throttledCursorUpdate = throttle((cursorPos) => {
    setLocalCursor(cursorPos);
    sendMessage("CURSOR_UPDATE", {
      userId: user._id,
      cursorPos,
      filePath: currentFile,
      name: user.name,
    });
  }, 100);

  // Generate collaborative cursor decorations for CodeMirror
  const collaborativeDecorations = (cursors) => {
    return EditorView.decorations.of(state => {
      const decorations = [];
      Object.entries(cursors).forEach(([userId, { pos, color, name }]) => {
        decorations.push(
          Decoration.widget({
            widget: new CursorWidget(userId, color, name),
            side: 1
          }).range(pos)
        );
      });
      return Decoration.set(decorations, true);
    });
  };

  // Widget class for rendering collaborator cursors in CodeMirror
  class CursorWidget extends WidgetType {
    constructor(userId, color, name) {
      super();
      this.userId = userId;
      this.color = color;
      this.name = name;
    }

    eq(other) {
      return this.userId === other.userId && this.color === other.color && this.name === other.name;
    }

    toDOM() {
      const span = document.createElement("span");
      span.className = "collaborator-cursor";
      span.style.borderLeft = `2px solid ${this.color}`;
      span.setAttribute("data-user", this.name || this.userId);
      // span.appendChild(tooltip); // Removed JS tooltip, only CSS tooltip remains
      return span;
    }

    ignoreEvent() {
      return true;
    }
  }

  // Install project dependencies in the WebContainer
  const handleInstall = async () => {
    if (isInstalling || !webContainer) return;
    setIsInstalling(true);

    try {
      const sanitized = sanitizeFileTree(fileTree);
      console.log('[DEBUG] Sanitized file tree for WebContainer:', sanitized);
      await webContainer.mount(sanitized); // Use sanitized file tree here
      const installProcess = await webContainer.spawn("npm", ["install"]);

      installProcess.output.pipeTo(new WritableStream({
        write(chunk) {
          console.log(chunk);
        }
      }));

      await installProcess.exit;
      setIsInstalled(true);
    } catch (error) {
      console.error("Installation error:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Run the project in the WebContainer and show preview
  const handleRun = async () => {
    if (runProcess) {
      await runProcess.kill();
    }

    try {
      const sanitizedTree = sanitizeFileTree(fileTree);
      await webContainer.mount(sanitizedTree);
      const newProcess = await webContainer.spawn("npm", ["start"]);
      setRunProcess(newProcess);

      newProcess.output.pipeTo(new WritableStream({
        write(chunk) {
          console.log(chunk);
        }
      }));

      webContainer.on("server-ready", (port, url) => {
        setIframeUrl(url);
        autoSave(fileTree);
        setIsPreviewPanelOpen(true);
      });
    } catch (error) {
      console.error("Run error:", error);
    }
  };

  // Close a file tab and update open files/current file
  const handleCloseTab = (file) => {
    setOpenFiles(prev => {
      const idx = prev.indexOf(file);
      const newOpenFiles = prev.filter(f => f !== file);
      // If the closed tab was active, select the next tab (right), or previous (left), or null
      if (currentFile === file) {
        if (newOpenFiles.length === 0) {
          setCurrentFile(null);
        } else if (idx < newOpenFiles.length) {
          setCurrentFile(newOpenFiles[idx]); // select the next tab
        } else {
          setCurrentFile(newOpenFiles[newOpenFiles.length - 1]); // select the last tab
        }
      }
      return newOpenFiles;
    });
  };

  // Add this derived state for filtered users
  const filteredUsers = users.filter(user =>
    !project.users.some(projectUser => projectUser._id === user._id) &&
    (user.name.toLowerCase().includes(searchQuery) ||
      user.email.toLowerCase().includes(searchQuery))
  );

  // Add these inside the Project component
  const handleCodeChange = (value, viewUpdate) => {
    // Mark self as active
    setCollaborators(prev => ({
      ...prev,
      [user._id]: { ...prev[user._id], lastActive: Date.now() }
    }));

    if (!currentFile || !viewUpdate || isImageFile(currentFile)) return;

    const newContent = value;
    const cursorPos = viewUpdate.state.selection.ranges[0].from;

    // Update local file tree
    setFileTree(prev => {
      const newTree = structuredClone(prev);
      const parts = currentFile.split('/');
      let current = newTree;

      // Modified path traversal logic
      for (let i = 0; i < parts.length - 1; i++) { // Stop before last part
        if (!current[parts[i]] || current[parts[i]].file) {
          current[parts[i]] = current[parts[i]] || {};
        }
        current = current[parts[i]];
      }

      // Directly update file contents
      const fileName = parts[parts.length - 1];
      if (!current[fileName]) {
        current[fileName] = { file: { contents: newContent } };
      } else {
        current[fileName].file.contents = newContent;
      }

      // Debounced auto-save
      autoSave(newTree);
      return newTree;
    });

    // Broadcast changes to collaborators
    sendMessage('CODE_CHANGE', {
      content: newContent,
      filePath: currentFile,
      cursorPos,
      userId: user._id
    });

    // Only for editor: broadcast typing status
    sendMessage('TYPING_STATUS', {
      userId: user._id,
      isTyping: true,
      fileName: currentFile,
      projectId: project._id
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendMessage('TYPING_STATUS', {
        userId: user._id,
        isTyping: false,
        fileName: currentFile,
        projectId: project._id
      });
    }, 1500);
  };

  // Enhanced CodeMirror extensions configuration
  const codeMirrorExtensions = (filePath) => [
    EditorState.allowMultipleSelections.of(true),
    detectLanguage(filePath),
    // EditorView.lineWrapping,
    EditorView.updateListener.of(update => {
      if (update.docChanged || update.selectionSet) {
        const cursorPos = update.state.selection.main.head;
        throttledCursorUpdate(cursorPos);
      }
    }),
    collaborativeDecorations(remoteCursors),
    EditorView.theme({
      "&": {
        fontSize: "14px",
        height: "100%",
        backgroundColor: "transparent",
      },
      ".cm-content": {
        fontFamily: "Fira Code, Menlo, Monaco, Consolas, Courier New, monospace",
        padding: "1rem 0",
      },
      ".cm-gutters": {
        backgroundColor: "#1a1a1a",
        borderRight: "1px solid #333",
        color: "#666",
      },
      ".cm-activeLine": {
        backgroundColor: "#ffffff08",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "#ffffff05",
      },
      ".collaborator-cursor": {
        position: "relative",
        "&::after": {
          content: "attr(data-user)",
          position: "absolute",
          top: "-1.25rem",
          left: "-2px",
          fontSize: "0.75rem",
          background: "var(--cursor-color)",
          color: "white",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          whiteSpace: "nowrap",
        }
      }
    }),
    linter(),
    autocompletion(),
    EditorView.contentAttributes.of({ "data-enable-grammarly": "false" }),
  ];

  // Utility: Sanitize file tree for WebContainer (with deep debug logging)
  function sanitizeFileTree(tree, path = '') {
    if (!tree || typeof tree !== 'object' || Array.isArray(tree)) {
      return {};
    }
    const result = {};
    // Allowed file extensions for code and config
    const allowedExtensions = [
      'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'md', 'txt', 'cjs', 'mjs', 'yml', 'yaml', 'lock', 'env', 'gitignore', 'dockerfile', 'sh', 'bat', 'conf', 'config', 'eslintrc', 'babelrc', 'prettierrc', 'editorconfig', 'npmrc', 'rc', 'svg'
    ];
    // Always include these filenames
    const alwaysInclude = ['package.json', 'package-lock.json', 'yarn.lock', 'vite.config.js', 'vite.config.ts', 'webpack.config.js', 'webpack.config.ts', 'tsconfig.json', 'jsconfig.json', 'README.md'];
    // Max image size (in bytes) to include (e.g., 200KB)
    const MAX_IMAGE_SIZE = 200 * 1024;

    for (const [key, value] of Object.entries(tree)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        result[key] = {};
        continue;
      }
      if (value.file) {
        let contents = value.file.contents;
        const ext = key.split('.').pop().toLowerCase();
        const isImage = value.file.isImage || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(key);
        // Only include allowed code/config files, alwaysInclude, or small images
        if (
          alwaysInclude.includes(key) ||
          allowedExtensions.includes(ext) ||
          (isImage && contents && ((typeof contents === 'string' && contents.length < MAX_IMAGE_SIZE * 1.37) || (contents.byteLength && contents.byteLength < MAX_IMAGE_SIZE)))
        ) {
          if (isImage) {
            if (typeof contents === 'string') {
              // Already base64 or string
            } else if (contents instanceof Uint8Array) {
              contents = btoa(String.fromCharCode(...contents));
            } else if (contents && contents.buffer) {
              contents = btoa(String.fromCharCode(...new Uint8Array(contents.buffer)));
            } else {
              contents = '';
            }
          }
          result[key] = {
            file: {
              contents: typeof contents === 'string' ? contents : '',
              encoding: value.file.encoding || 'utf8',
              ...(isImage ? { isImage: true } : {})
            }
          };
        }
        // else: skip this file
      } else {
        // Recursively sanitize subfolders
        const sanitized = sanitizeFileTree(value, key);
        // Only include folder if it has any files/subfolders after sanitization
        if (sanitized && typeof sanitized === 'object' && Object.keys(sanitized).length > 0) {
          result[key] = sanitized;
        }
      }
    }
    return result;
  }

  // --- React useEffect: Initialize sockets, WebContainer, and message listeners on mount ---
  useEffect(() => {
    // Initialize socket connection for this project
    initializeSocket(project._id)

    // Start WebContainer if not already started
    if (!webContainer) {
      getWebContainer().then(container => {
        setWebContainer(container);
        console.log("Container Started");
      })
    }

    // Listen for incoming chat messages
    receiveMessage('project-message', data => {
      console.log("Received Data:", data);
      try {
        // Save all messages, process AI messages separately
        if (data.sender._id === 'ai') {
          saveMessageToDB(data);
          setMessages(prev => [...prev, data]);
        } else {
          // Handle normal user messages
          setMessages(prev => [...prev, data]);
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    // Fetch latest project data and messages from backend
    axios.get(`/projects/get-project/${location.state.project._id}`)
      .then(res => {
        const projectData = res.data.project;
        setProject(projectData);
        setFileTree(projectData.fileTree || {});

        // Remove duplicate messages (by sender, message, and timestamp)
        const messages = projectData.messages || [];
        const uniqueMessages = messages.reduce((acc, current) => {
          const exists = acc.some(item =>
            item.message === current.message &&
            item.sender._id === current.sender._id &&
            item.createdAt === current.createdAt
          );
          return exists ? acc : [...acc, current];
        }, []);

        setMessages(uniqueMessages);
      })

    // Fetch all users for collaborator modal
    axios.get('/users/all')
      .then(res => {
        setUsers(res.data.users)
      })
      .catch(err => {
        console.log(err);
      })

    // Listen for remote code changes from collaborators
    receiveMessage('CODE_CHANGE', ({ content, filePath, cursorPos, userId }) => {
      if (userId !== user._id) {
        setFileTree(prev => {
          const newTree = structuredClone(prev);
          const parts = filePath.split('/');
          let current = newTree;

          // Traverse to file node and update contents
          for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]] = current[parts[i]] || {};
          }

          const fileName = parts[parts.length - 1];
          current[fileName] = { file: { contents: content } };
          return newTree;
        });
      }
    });

    // Listen for remote cursor updates
    receiveMessage('CURSOR_UPDATE', ({ userId, cursorPos, filePath, name }) => {
      if (userId !== user._id && filePath === currentFile) {
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: {
            pos: cursorPos,
            color: getColorForSender(userId),
            name: name,
            lastActive: Date.now(),
          },
        }));
      }
    });

    // Listen for typing status updates from collaborators
    receiveMessage('TYPING_STATUS', ({ userId, isTyping }) => {
      setCollaborators(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isTyping, lastActive: Date.now() }
      }));
    });

    // --- Optional: Clean up WebContainer on unmount ---
    // return () => {
    //   if (webContainer) {
    //     webContainer.teardown();
    //     setWebContainer(null);
    //   }
    // };
  }, [])

  // --- ONLINE STATUS BROADCAST/RECEIVE LOGIC ---
  useEffect(() => {
    // Broadcast self as online every 30 seconds
    function markSelfOnline() {
      setCollaborators(prev => ({
        ...prev,
        [user._id]: {
          ...(prev[user._id] || {}),
          lastActive: Date.now(),
        },
      }));
      sendMessage('USER_ONLINE', {
        userId: user._id,
        lastActive: Date.now(),
      });
      console.log('USER_ONLINE sent', user._id);
    }
    markSelfOnline(); // On mount
    const interval = setInterval(markSelfOnline, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [user._id]);

  useEffect(() => {
    // Listen for USER_ONLINE events from other users
    const handler = ({ userId, lastActive }) => {
      console.log('USER_ONLINE received', userId, lastActive, 'self:', user._id);
      if (userId !== user._id) {
        setCollaborators(prev => ({
          ...prev,
          [userId]: {
            ...(prev[userId] || {}),
            lastActive,
          },
        }));
      }
    };
    receiveMessage('USER_ONLINE', handler);
    return () => {
      // Add socket.off cleanup if needed
    };
  }, [user._id]);

  // --- Auto-scroll chat to bottom when messages update ---
  useEffect(() => {
    if (messageBoxRef.current) {
      setTimeout(() => {
        messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
      }, 0);
    }
  }, [messages]);

  // --- Reset selected users when collaborator modal closes ---
  useEffect(() => {
    if (!isModalOpen) {
      setSelectedUserIds(new Set()); // Clear selection when modal closes
    }
  }, [isModalOpen]);

  // --- Update files in WebContainer after install ---
  useEffect(() => {
    if (!webContainer || !isInstalled) return;
    async function updateFiles() {
      try {
        // Mount updated file tree to WebContainer
        await webContainer.mount(fileTree);
      } catch (error) {
        console.error("Error updating files in WebContainer:", error);
      }
    }
    updateFiles();
  }, [fileTree]); // Only update files, not restart server

  // --- Clean up inactive remote cursors every second ---
  useEffect(() => {
    const interval = setInterval(() => {
      setRemoteCursors((prev) => {
        // Remove cursors that haven't updated in 10 seconds
        const now = Date.now();
        const filtered = {};
        Object.entries(prev).forEach(([userId, cursor]) => {
          if (now - (cursor.lastActive || 0) < CURSOR_TIMEOUT) {
            filtered[userId] = cursor;
          }
        });
        return filtered;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Close creation input if user clicks outside ---
  useEffect(() => {
    if (!creationContext.type) return;
    function handleClickOutside(event) {
      if (
        creationInputRef.current &&
        !creationInputRef.current.contains(event.target)
      ) {
        setCreationContext({ type: null, parentPath: null, name: '' });
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [creationContext.type]);

  // --- Clean up image data in file tree on mount (if needed) ---
  useEffect(() => {
    const cleanImageData = (tree) => {
      Object.entries(tree).forEach(([key, value]) => {
        if (value?.file?.isImage) {
          if (value.file.contents.startsWith('data:image')) {
            value.file.contents = value.file.contents.split(',')[1];
          }
        }
        if (typeof value === 'object') cleanImageData(value);
      });
    };
    cleanImageData(fileTree);
  }, []);

  // --- Periodically update current user's online status in collaborators ---
  useEffect(() => {
    function markSelfOnline() {
      setCollaborators(prev => ({
        ...prev,
        [user._id]: {
          ...(prev[user._id] || {}),
          lastActive: Date.now(),
        },
      }));
    }
    markSelfOnline(); // On mount
    const interval = setInterval(markSelfOnline, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [user._id]);

  // === File/Folder Open and Download Handlers ===
  const fileInputRef = useRef();
  const folderInputRef = useRef();

  const onOpenClick = () => {
    // Show file/folder picker (files and folders)
    if (fileInputRef.current && folderInputRef.current) {
      // Prefer folder picker if supported
      folderInputRef.current.click();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onDownloadClick = () => {
    // Download the current file tree as a zip file
    import('jszip').then(JSZip => {
      const zip = new JSZip.default();
      // Recursively add files to zip
      function addFilesToZip(tree, path = '') {
        Object.entries(tree).forEach(([name, item]) => {
          const fullPath = path ? `${path}/${name}` : name;
          if (item.file && typeof item.file.contents === 'string') {
            // Add file
            zip.file(fullPath, item.file.contents, { binary: item.file.encoding === 'binary' });
          } else if (typeof item === 'object') {
            addFilesToZip(item, fullPath);
          }
        });
      }
      addFilesToZip(fileTree);
      zip.generateAsync({ type: 'blob' }).then(content => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name || 'project'}.zip`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      });
    });
  };

  // Add hidden file/folder inputs to the component.
  return (
    // Main layout: two sections (chat/collaborators and editor/coding)
    <main className="h-screen w-screen flex bg-gradient-to-br from-gray-900 to-blue-900/20 text-white overflow-hidden">
      {/* ===== Left Chat Section ===== */}
      <section className="left relative h-full flex flex-col w-[350px] bg-gray-800/80 shadow-2xl backdrop-blur-sm">
        <div className="chats h-full flex flex-col">
          {/* --- Chat Header: Project name, home button, collaborators toggle --- */}
          <header className="flex items-center justify-between w-full bg-gray-900/90 p-4 h-16 border-b border-gray-700 backdrop-blur-sm">
            {/* Home button */}
            <button
              onClick={() => navigate('/')}
              className="text-blue-400 hover:text-blue-300 text-2xl p-2 rounded-lg transition-all"
              title="Go to Home"
            >
              <i className="ri-home-4-line"></i>
            </button>
            {/* Project name and collaborators count */}
            <div className="flex-1 px-4">
              <h2 className="text-white text-lg font-semibold truncate" title={project.name}>
                {project.name}
              </h2>
              <p className="text-xs text-gray-400">{project.users.length} collaborators</p>
            </div>
            {/* Collaborators side panel toggle */}
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="text-blue-400 hover:text-blue-300 text-2xl p-2 rounded-lg transition-all"
              title="Show/Hide Collaborators"
            >
              <i className="ri-group-fill"></i>
            </button>
          </header>

          {/* --- Chat Messages List --- */}
          <div ref={messageBoxRef} className="conversation-area flex flex-grow flex-col p-4 overflow-y-auto space-y-4">
            <div className="message-box flex-grow flex flex-col gap-4">
              {/* Render each chat message */}
              {messages.map((msg, index) => {
                const isOutgoing = msg.sender._id === user._id;
                const isAI = msg.sender._id === "ai";
                // Robust UTC time parsing
                let timestamp = '--:--';
                if (msg.createdAt) {
                  const date = new Date(msg.createdAt);
                  if (!isNaN(date.getTime())) {
                    // Always display in user's local time, but parse as UTC
                    timestamp = date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  }
                }

                return (
                  <div
                    key={msg._id || index}
                    className={`message flex flex-col rounded-xl p-3 shadow-lg ${isAI ? "w-full bg-gray-700" :
                      isOutgoing
                        ? "ml-auto bg-blue-600/90 text-white"
                        : "self-start bg-gray-700/50 text-gray-200"
                      }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      {!isOutgoing && !isAI && (
                        <span
                          className="text-xs font-medium"
                          style={{ color: getColorForSender(msg.sender.name) }}
                        >
                          {msg.sender.name}
                        </span>
                      )}
                      {isAI && (
                        <div className="flex items-center gap-2 text-blue-400">
                          {/* <i className="ri-ai-generate"></i> */}
                          <span className="text-sm font-semibold">AI Assistant</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm mb-1">
                      {isAI ? (
                        <WriteAiMessage message={msg.message} />
                      ) : (
                        <div className="break-words">{msg.message}</div>
                      )}
                    </div>
                    <div className={`text-xs ${isOutgoing ? 'text-blue-200' : 'text-gray-400'}`}>
                      {timestamp}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- Message Input Area --- */}
          <div className="inputField w-full flex items-center bg-gray-900/80 p-3 gap-2 border-t border-gray-700 backdrop-blur-sm">
            <div className="flex-grow">
              {/* Textarea for typing chat messages */}
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) {
                      send(message.trim());
                      setMessage('');
                      e.target.style.height = 'auto'; // Reset height after sending
                    }
                  }
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Type a message..."
                rows={1}
                className={`
                    w-full
                    bg-gray-800
                    text-white
                    placeholder-gray-500
                    rounded
                    outline-none
                    resize-none
                    p-2
                    min-h-[40px]
                    max-h-40
                    overflow-y-auto
                    [&::-webkit-scrollbar]:[width:2.5px]
                  [&::-webkit-scrollbar-thumb]:bg-blue-200
                  [&::-webkit-scrollbar-track]:bg-blue-800
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    transition-all
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                `}
              />
            </div>

            {/* Send button */}
            <button
              onClick={() => {
                if (message.trim()) {
                  send(message.trim());
                  setMessage('');
                  const textarea = document.querySelector('textarea'); // Select the textarea
                  if (textarea) textarea.style.height = 'auto'; // Reset height after sending
                }
              }}
              className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Send Message"
              aria-label="Send Message"
            >
              <i className="ri-send-plane-fill text-2xl"></i>
            </button>
          </div>
        </div>

        {/* --- Collaborators Side Panel (slide-in) --- */}
        <div className={`sidePanel absolute inset-0 bg-gray-800/95 backdrop-blur-xl transition-transform 
                    ${isSidePanelOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <header className="flex justify-between items-center p-4 bg-gray-900 h-16 border-b border-gray-700">
            {/* Collaborators panel header */}
            <div className="flex items-center gap-3">
              <i className="ri-team-line text-2xl text-blue-400"></i>
              <h2 className="text-white text-lg font-semibold">
                Collaborators ({project.users.length})
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 text-xl p-2 rounded-lg transition-all"
                title="Add Collaborator"
              >
                <i className="ri-user-add-line"></i>
              </button>
              <button
                onClick={() => setIsSidePanelOpen(false)}
                className="text-gray-400 hover:text-gray-300 text-2xl p-2 rounded-lg transition-all"
                title="Close Collaborators Panel"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </header>
          <div className="users-list p-4 space-y-3 overflow-y-auto">
            {/* List of project collaborators with online status */}
            {project.users?.map((user) => {
              const collaborator = collaborators[user._id];
              const isOnline = collaborator && collaborator.lastActive && (Date.now() - collaborator.lastActive < ONLINE_TIMEOUT);
              return (
                <div key={user._id} className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center relative">
                      <i className="ri-user-3-line text-blue-400"></i>
                      {isOnline && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full z-50"></span>
                      )}
                    </div>
                    {user._id === project.admin?._id && (
                      <div className="absolute -bottom-0.5 -right-0 ">
                        <i className="ri-shield-star-line text-yellow-500"></i>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {user.name}
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </div>
                  {/* Remove button for non-admins, visible only to admin */}
                  {user._id !== project.admin?._id && (
                    <button
                      onClick={() => removeCollaborator(user._id)}
                      className="absolute right-7 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-all"
                      title="Remove Collaborator"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Right Editor Section ===== */}
      <section className="right flex flex-1 h-full bg-gray-900/80 backdrop-blur-sm min-w-0">
        {/* --- File Explorer Sidebar --- */}
        <div className="explorer h-full w-52 flex flex-col border-r border-gray-700">
          <div className="flex items-center justify-between p-4 h-16 border-b border-gray-700">
            <h3 className="text-white font-semibold">EXPLORER</h3>
            <div className="flex items-center">
              {/* Keep only create new file/folder buttons */}
              <button
                onClick={() => setCreationContext({ type: 'file', parentPath: '', name: '' })}
                className="text-blue-400 hover:text-blue-300 p-0.5 rounded-lg transition-all"
                title="Create New File"
              >
                <i className="ri-file-add-line text-lg"></i>
              </button>
              <button
                onClick={() => setCreationContext({ type: 'folder', parentPath: '', name: '' })}
                className="text-blue-400 hover:text-blue-300 p-0.5 rounded-lg transition-all ml-2"
                title="Create New Folder"
              >
                <i className="ri-folder-add-line text-lg"></i>
              </button>
            </div>
          </div>

          <div className="file-tree flex-1 p-4 space-y-2 overflow-y-auto">
            {/* Render file/folder creation input if needed */}
            {isCreatingFolder && (
              <div className="ml-4">
                {/* नई फ़ाइल/फोल्डर इनपुट */}
                {(creationPath === currentPath && creationType) && (
                  <div className="flex items-center gap-2 ml-6 p-1">
                    <i className={`ri-${creationType === 'file' ? 'file-add' : 'folder-add'}-line ${creationType === 'file' ? 'text-blue-400' : 'text-yellow-500'}`}></i>
                    <input
                      autoFocus
                      type="text"
                      className="bg-gray-800 text-white px-2 py-1 rounded flex-1 text-sm"
                      placeholder={`नया ${creationType === 'file' ? 'फ़ाइल' : 'फोल्डर'} नाम...`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          handleCreateItem(currentPath, e.target.value.trim(), creationType);
                          setCreationType(null);
                          setCreationPath('');
                        }
                        if (e.key === 'Escape') {
                          setCreationType(null);
                          setCreationPath('');
                        }
                      }}
                      onBlur={(e) => {
                        setCreationType(null);
                        setCreationPath('');
                      }}
                    />
                  </div>
                )}
                {/* Only render children if tree[name] exists */}
                {tree && tree[name] && renderFileTree(tree[name], currentPath)}
              </div>
            )}
            {/* File tree rendering code */}
            {renderFileTree(fileTree)}
          </div>
          {/* Moved Action Panel to bottom of explorer */}
          <div className="action-panel p-4 border-t border-gray-700 space-y-3 bg-gray-900">
            <button
              onClick={onOpenClick}
              className="w-full flex items-center justify-start text-gray-200 hover:text-white text-sm font-medium p-2 rounded-md transition-colors hover:bg-gray-800"
              title="Open File or Folder"
            >
              <i className="ri-folder-open-line text-lg mr-2"></i>
              Open File/Folder
            </button>
            <button
              onClick={onDownloadClick}
              className="w-full flex items-center justify-start text-gray-200 hover:text-white text-sm font-medium p-2 rounded-md transition-colors hover:bg-gray-800"
              title="Download Project as Zip"
            >
              <i className="ri-download-line text-lg mr-2"></i>
              Download Code
            </button>
          </div>
        </div>
        {/* --- Main Code Editor Area --- */}
        <div className="editor flex flex-col flex-1 w-[calc(100%-13rem)] min-w-0">
          {/* Tabs bar for open files and control buttons */}
          <div className="tabs-bar flex items-center h-16 w-full px-4 bg-gray-900 border-b border-gray-700">
            {/* Open file tabs (scrollable) */}
            <div className="tab flex-1 overflow-x-auto whitespace-nowrap min-w-0">
                           <div className="opened-files flex items-center gap-1 p-1 w-max">
                {openFiles.map((file) => {
                  const extension = file.split('.').pop().toLowerCase();
                  const icon = fileIcons[extension] || fileIcons.default;

                  return (
                    <div
                      key={file}
                      className={`tab-item flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer transition-all ${currentFile === file ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/60'}`}
                      onClick={() => setCurrentFile(file)}
                    >
                      {getFileIcon(file)}
                      <span className="truncate max-w-[120px] pb-0.5">{file.split('/').pop()}</span>
                      <button

                        onClick={e => { e.stopPropagation(); handleCloseTab(file); }}
                       
                        className="ml-1 text-gray-500 hover:text-red-400"
                        title="Close Tab"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Control Buttons Group */}
            <div className="control-buttons flex items-center gap-3 bg-gray-900 ml-4 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="p-2 hover:bg-gray-700 rounded-lg transition-all"
                disabled={isInstalling}
                title="Install Dependencies"
              >
                {isInstalling ? (
                  <svg className="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  <i className="ri-download-line text-blue-400"></i>
                )}
              </button>
              <button
                onClick={handleRun}
                className="p-2 hover:bg-gray-700 rounded-lg transition-all"
                title="Run Project"
              >
                <i className="ri-play-line text-green-400"></i>
              </button>

              {/* <div className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded-lg">
                <i className="ri-brush-line text-blue-400 text-sm"></i>
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="bg-transparent text-blue-400 text-sm cursor-pointer"
                >
                  {Object.keys(THEMES).map theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div> */}
            </div>
          </div>

          {/* --- Code Editor or Image Preview --- */}
          <div className="editor-content relative overflow-y-auto h-[calc(100%-4rem)]">
            {/* Show code editor if a file is open, or welcome message otherwise */}
            {currentFile ? (
              isImageFile(currentFile) ? (
                <img
                  src={`data:${getMimeType(currentFile)};base64,${getFileContent(currentFile, fileTree)}`}
                  alt={currentFile.split('/').pop()}
                  className="max-h-full max-w-full object-contain"
                  style={{ background: '#222', borderRadius: 8, padding: 8, minHeight: 100, minWidth: 100 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <CodeMirror
                  key={currentFile + selectedTheme} // Force remount on theme/file change
                  value={getFileContent(currentFile, fileTree)}
                  theme={THEMES[selectedTheme]}
                  extensions={codeMirrorExtensions(currentFile)}
                  className="h-full"
                  // height="100%"
                  onChange={handleCodeChange}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    foldGutter: true,
                    syntaxHighlighting: true,
                    searchKeymap: true,
                    lintKeymap: true,
                  }}
                />
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-950/50 text-center p-8">
                <i className="ri-code-s-slash-line text-6xl text-blue-400 mb-4"></i>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to {project.name}</h3>
                <p className="text-gray-400 mb-6">Select a file or create a new one to start coding</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setCreationContext({ type: 'file', parentPath: '', name: '' })}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all"
                  >
                    Create New File
                  </button>
                  <button
                    onClick={() => setCreationContext({ type: 'folder', parentPath: '', name: '' })}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-all"
                  >
                    Create New Folder
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --- Preview Panel (shows running app/website) --- */}
          {iframeUrl && (
            <div className="relative">
              {/* Toggle preview panel button */}
              <button
                onClick={() => setIsPreviewPanelOpen(!isPreviewPanelOpen)}
                className='cursor-pointer text-blue-500 text-xl bg-gray-950 rounded-lg hover:bg-gray-700 transition-all duration-200 fixed bottom-4 right-4 z-50'
                title="preview"
              >
                <i className={`ri-arrow-${isPreviewPanelOpen ? 'down' : 'up'}-s-line p-2`}></i>
              </button>
              {/* Preview panel with iframe */}
              <div
                className={`preview-panel fixed bottom-0 left-0 right-0 h-full bg-gray-900 border-gray-700 transition-transform duration-300 ease-in-out ${isPreviewPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ zIndex: 40 }}
              >
                <div className="flex items-center justify-between p-3 border-b border-gray-700">
                  {/* <input
                    type="text"
                    value={iframeUrl}
                    onChange={(e) => setIframeUrl(e.target.value)}
                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg mr-4 focus:ring-2 focus:ring-blue-500 outline-none"
                  /> */}
                  <h3 className="font-semibold text-white rounded-lg px-4 py-2 mr-4">Preview</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setReloadKey(prev => prev + 1)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Reload Preview"
                    >
                      <i className="ri-refresh-line text-xl"></i>
                    </button>
                    <button
                      onClick={() => setIsPreviewPanelOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <i className="ri-close-line text-xl"></i>
                    </button>
                  </div>
                </div>
                <iframe
                  key={reloadKey}
                  src={iframeUrl}
                  className="w-full h-[calc(100%-4rem)] bg-white"
                  title="Preview"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== Add Collaborators Modal ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md p-6">
            {/* Modal header and search input */}
            <h3 className="text-xl font-bold text-white mb-4">Add Collaborators</h3>

            <input
              type="text"
              placeholder="Search users..."
              className="w-full p-3 mb-4 bg-gray-700 rounded-lg text-white placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            />

            <div className="users-list max-h-[50vh] overflow-y-auto space-y-3">
              {/* List of users to add as collaborators */}
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <div
                    key={user._id}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${selectedUserIds.has(user._id)
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-gray-700/30 hover:bg-gray-700/50'
                      }`}
                    onClick={() => handleUserClick(user._id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <i className="ri-user-line text-blue-400"></i>
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 p-4">
                  No matching users found
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-6">
              {/* Cancel and Add Selected buttons */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={addCollaborators}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                disabled={selectedUserIds.size === 0}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Context Menu for file/folder actions ===== */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          targetPath={contextMenu.targetPath}
          isFolder={contextMenu.isFolder}
        />
      )}

      {/* Hidden file/folder inputs for open functionality */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        onChange={handleFileUpload}
      />
      <input
        type="file"
        ref={folderInputRef}
        style={{ display: 'none' }}
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFolderUpload}
      />
    </main>
  );
};

export default Project;