import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
    const [url, setUrl] = useState('');
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detailedError, setDetailedError] = useState('');
    const [showDetailedError, setShowDetailedError] = useState(false);

    useEffect(() => {
        fetchRepos();
    }, []);

    const fetchRepos = async () => {
        try {
            const { data, error } = await supabase
                .from('repos')
                .select('*')
                .order('createdat', { ascending: false });

            if (error) throw error;

            setRepos(data);
            setError('');
            setDetailedError('');
            setShowDetailedError(false);
        } catch (err) {
            setError('Failed to fetch repos');
            setDetailedError(err.message || 'No additional error details available');
        }
    };

    /**
     * Extracts repository information from a GitHub URL
     * @param {string} url - GitHub repository URL
     * @returns {Object} Repository information
     */
    const extractRepoInfo = (url) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname !== 'github.com') {
                throw new Error('Not a valid GitHub URL');
            }

            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            if (pathParts.length < 2) {
                throw new Error('Not a valid repository URL');
            }

            return {
                owner: pathParts[0],
                name: pathParts[1],
                fullName: `${pathParts[0]}/${pathParts[1]}`
            };
        } catch (err) {
            throw new Error('Invalid GitHub URL format');
        }
    };

    /**
     * Fetches repository data from GitHub API
     * @param {Object} repoInfo - Repository information
     * @returns {Promise<Object>} Repository data
     */
    const fetchGitHubRepoData = async (repoInfo) => {
        try {
            const response = await fetch(`https://api.github.com/repos/${repoInfo.fullName}`);
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            const data = await response.json();

            return {
                name: data.name,
                owner: data.owner.login,
                fullname: data.full_name,
                stars: data.stargazers_count,
                forks: data.forks_count,
                issues: data.open_issues_count,
                mainlanguage: data.language || 'Unknown',
                healthscore: Math.round((1 - (data.open_issues_count / (data.stargazers_count + 1))) * 100),
                activitylevel: data.pushed_at ? `${Math.round((Date.now() - new Date(data.pushed_at)) / (1000 * 60 * 60 * 24))} days` : 'Unknown',
                trendingfactor: Math.round((data.stargazers_count / (data.forks_count + 1)) * 10),
                createdat: new Date().toISOString(),
            };
        } catch (err) {
            throw new Error(`Failed to fetch repository data: ${err.message}`);
        }
    };

    /**
     * Handles form submission for adding a new GitHub repository.
     * Prevents default form submission, sets loading state, and attempts to add the repository via API.
     * Clears the URL input, refreshes the repository list, and manages error states.
     * 
     * @param {Event} e - The form submission event
     * @async
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setDetailedError('');
        setShowDetailedError(false);

        try {
            // Extract repo info from URL
            const repoInfo = extractRepoInfo(url);

            // Fetch repo data from GitHub API
            const repoData = await fetchGitHubRepoData(repoInfo);

            // Save to Supabase
            const { error } = await supabase
                .from('repos')
                .insert([repoData]);

            if (error) throw error;

            setUrl('');
            await fetchRepos();
        } catch (err) {
            setError('Failed to add repository');
            setDetailedError(err.message || 'No additional error details available');
        }
        setLoading(false);
    };

    /**
     * Toggles the visibility of the detailed error message
     */
    const toggleDetailedError = () => {
        setShowDetailedError(!showDetailedError);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-6xl mx-auto p-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">AnyCompany DevRepo Dashboard</h1>
                    <p className="text-gray-600">Track and analyze GitHub repository metrics</p>
                </div>

                <form onSubmit={handleSubmit} className="mb-12 max-w-2xl mx-auto">
                    <div className="flex gap-3 p-2 bg-white rounded-lg shadow-sm">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter GitHub repository URL (e.g., https://github.com/facebook/react)"
                            className="flex-1 px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add Repository'}
                        </button>
                    </div>
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
                            <div className="flex justify-between items-center">
                                <span>{error}</span>
                                {detailedError && (
                                    <button
                                        onClick={toggleDetailedError}
                                        className="text-sm underline focus:outline-none"
                                        type="button"
                                    >
                                        {showDetailedError ? 'Hide details' : 'See more'}
                                    </button>
                                )}
                            </div>
                            {showDetailedError && detailedError && (
                                <div className="mt-2 pt-2 border-t border-red-200 text-sm">
                                    <pre className="whitespace-pre-wrap">{detailedError}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </form>

                <div className="grid gap-6 md:grid-cols-2">
                    {repos.map((repo) => (
                        <div
                            key={repo.id}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800">{repo.name}</h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {repo.mainlanguage} • Added {new Date(repo.createdat).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Are you sure you want to delete this repository?')) {
                                                try {
                                                    const { error } = await supabase
                                                        .from('repos')
                                                        .delete()
                                                        .eq('id', repo.id);

                                                    if (error) throw error;

                                                    await fetchRepos();
                                                } catch (err) {
                                                    setError('Failed to delete repository');
                                                    setDetailedError(err.message || 'No additional error details available');
                                                }
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-500">⭐</span>
                                        <span className="font-medium">{repo.stars.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>🍴</span>
                                        <span className="font-medium">{repo.forks.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-orange-500">⚠️</span>
                                        <span className="font-medium">{repo.issues.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>💻</span>
                                        <span className="font-medium">{repo.mainlanguage}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                        <div className="text-sm text-blue-600 mb-1 font-medium">Health</div>
                                        <div className="text-2xl font-bold text-blue-700">
                                            {repo.healthscore}
                                            <span className="text-lg ml-1">
                                                {repo.healthscore > 80 ? '💪' : repo.healthscore > 50 ? '👍' : '🤔'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                        <div className="text-sm text-green-600 mb-1 font-medium">Activity</div>
                                        <div className="text-lg font-bold text-green-700">
                                            {repo.activitylevel.split(' ')[0]}
                                            <span className="text-lg ml-1">
                                                {repo.activitylevel.split(' ')[1]}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                                        <div className="text-sm text-purple-600 mb-1 font-medium">Trending</div>
                                        <div className="text-2xl font-bold text-purple-700">
                                            {repo.trendingfactor}
                                            <span className="text-lg ml-1">
                                                {repo.trendingfactor > 100 ? '🚀' : repo.trendingfactor > 50 ? '📈' : '📊'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {repos.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg">No repositories added yet</div>
                        <div className="text-gray-500 mt-2">Add a GitHub repository URL to get started</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
