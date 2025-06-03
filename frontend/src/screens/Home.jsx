import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/UserProvider.jsx';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  // Show 'Guest' if no user is logged in
  const displayName = user?.name ? user.name : 'Guest';

  function createProject(e) {
    e.preventDefault();
    if (!user || !user._id) {
      alert('Please login or register to create a project.');
      return;
    }
    if (!projectName.trim()) return;

    axios.post('/projects/create', {
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      name: projectName.trim(),
    }).then((res) => {
      setIsModalOpen(false);
      setProjectName("");
      setProjects([...projects, res.data]);
    }).catch(console.error);
  }

  function handleLogout() {
    if (!window.confirm('Are you sure you want to logout?')) return;
    axios.get('/users/logout')
      .then(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/'); // Go to home page after logout
        window.location.reload(); // Reload the page after logout
      }).catch(console.error);
  }

  // Delete handler
 const deleteProject = (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?`)) return;
    axios
      .delete(`/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      .then(() => {
        // remove from state
        setProjects(projects.filter(p => p._id !== projectId));
        alert(`Project "${projectName}" has been deleted.`);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to delete project: " + err.response?.data?.error || err.message);
      });
  };

  useEffect(() => {
    axios.get('/projects/all')
      .then((res) => setProjects(res.data.projects))
      .catch(console.error);
  }, []);

  return (
    <main className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800'>
      {/* Navigation Bar */}
      <nav className='p-6 bg-gray-800 shadow-xl'>
        <div className='flex justify-between items-center max-w-7xl mx-auto'>
          <h1 className='text-2xl font-bold text-blue-400'>AI-Enhanced Collaboration Platform for Developers</h1>
          <div className='flex gap-4'>
            {user ? (
              <>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2'
                >
                  <i className="ri-add-line"></i> New Project
                </button>
                <button
                  onClick={handleLogout}
                  className='bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all'
                >
                  Logout
                </button>
              </>
            ) : (
              <div className='flex gap-4'>
                <button
                  onClick={() => navigate('/login')}
                  className='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all'
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className='bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all'
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='text-center py-20 px-4'>
        <h1 className='text-5xl font-bold text-white mb-6'>
          Welcome <span className='text-blue-400'>{displayName}</span>
        </h1>
        <p className='text-gray-300 text-xl mb-8'>
          Collaborate, Manage, and Run Projects Efficiently
        </p>
      </section>

      {/* Projects Grid */}
      <div className='max-w-7xl mx-auto px-4 pb-20'>
        <h2 className='text-3xl font-bold text-white mb-8'>Your Projects</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() => navigate(`/project`, { state: { project } })}
              className={`p-6 rounded-xl bg-gray-800 hover:bg-gray-700 cursor-pointer transition-all border-2 relative ${user && project.admin?._id === user._id
                ? 'border-blue-500'
                : 'border-gray-600'
                }`}
            >
              {/* Delete button */}
              {project.admin?._id === user?._id && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    deleteProject(project._id, project.name);
                  }}
                  className='absolute top-2 right-2 text-red-400 hover:text-red-600'
                  title="Delete Project"
                >
                  <i className="ri-delete-bin-5-line"></i>
                </button>
              )}
              <h3 className='text-xl font-semibold text-white mb-2'>{project.name}</h3>
              <div className='flex items-center gap-2 text-gray-400'>
                <i className="ri-user-line"></i>
                <span>{project.admin?.name}</span>
                {user && project.admin?._id === user._id && (
                  <span className='ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full'>
                    Admin
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className='text-center py-12'>
            <p className='text-gray-400 text-lg mb-4'>
              No projects found. Create your first project to get started!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className='bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg'
            >
              Create New Project
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4'>
          <div className='bg-gray-800 rounded-xl p-6 w-full max-w-md'>
            <h3 className='text-2xl font-bold text-white mb-6'>Create New Project</h3>
            <form onSubmit={createProject}>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project Name"
                className='w-full px-4 py-3 bg-gray-700 rounded-lg text-white mb-6 focus:ring-2 focus:ring-blue-500'
                required
              />
              <div className='flex justify-end gap-4'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-6 py-2 text-gray-300 hover:text-white transition-all'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-all'
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;