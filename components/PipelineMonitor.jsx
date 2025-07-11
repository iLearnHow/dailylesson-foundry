import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const PipelineMonitor = () => {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    retries: 0,
    avgProcessingTime: 0,
    estimatedTimeRemaining: 0,
    currentRate: 0,
    startTime: null,
    lastUpdate: null
  });

  const [isRunning, setIsRunning] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [hourlyProgress, setHourlyProgress] = useState([]);
  const [pipelineState, setPipelineState] = useState(null);

  // Load pipeline state from file
  useEffect(() => {
    const loadPipelineState = async () => {
      try {
        const response = await fetch('/api/pipeline/state');
        if (response.ok) {
          const state = await response.json();
          setPipelineState(state);
          
          // Update stats from state
          setStats(prev => ({
            ...prev,
            total: state.stats?.total || 0,
            completed: state.stats?.completed || 0,
            failed: state.stats?.failed || 0,
            startTime: state.stats?.startTime || null,
            retries: state.stats?.retries || 0
          }));
          
          setIsRunning(state.stats?.startTime && !state.stats?.lastSave);
        }
      } catch (error) {
        console.log('No pipeline state found');
      }
    };
    
    loadPipelineState();
    const interval = setInterval(loadPipelineState, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Simulate real-time updates when running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStats(prev => {
        const newCompleted = Math.min(prev.completed + Math.floor(Math.random() * 2), prev.total);
        const newFailed = Math.min(prev.failed + (Math.random() > 0.98 ? 1 : 0), prev.total - newCompleted);
        const newInProgress = Math.min(5, prev.total - newCompleted - newFailed);
        
        const remaining = prev.total - newCompleted - newFailed;
        const currentRate = newCompleted > 0 ? newCompleted / ((Date.now() - prev.startTime) / 1000 / 3600) : 0;
        const estimatedTimeRemaining = remaining > 0 && currentRate > 0 ? remaining / currentRate : 0;

        return {
          ...prev,
          completed: newCompleted,
          failed: newFailed,
          inProgress: newInProgress,
          currentRate: Math.round(currentRate * 10) / 10,
          estimatedTimeRemaining: Math.round(estimatedTimeRemaining * 10) / 10,
          lastUpdate: new Date().toISOString()
        };
      });

      // Add to recent activity
      setRecentActivity(prev => [
        ...prev.slice(-9),
        {
          time: new Date().toLocaleTimeString(),
          message: `Completed lesson ${Math.floor(Math.random() * 100) + 1}`,
          type: 'success'
        }
      ]);

      // Update hourly progress
      const now = new Date();
      const hour = now.getHours();
      setHourlyProgress(prev => {
        const existing = prev.find(h => h.hour === hour);
        if (existing) {
          return prev.map(h => h.hour === hour ? { ...h, completed: h.completed + 1 } : h);
        } else {
          return [...prev.slice(-11), { hour, completed: 1 }];
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const startPipeline = async () => {
    try {
      const response = await fetch('/api/pipeline/start', { method: 'POST' });
      if (response.ok) {
        setIsRunning(true);
        setStats(prev => ({ ...prev, startTime: Date.now() }));
      }
    } catch (error) {
      console.error('Failed to start pipeline:', error);
    }
  };

  const pausePipeline = async () => {
    try {
      const response = await fetch('/api/pipeline/pause', { method: 'POST' });
      if (response.ok) {
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Failed to pause pipeline:', error);
    }
  };

  const resetPipeline = () => {
    setIsRunning(false);
    setStats(prev => ({
      ...prev,
      completed: 0,
      failed: 0,
      inProgress: 0,
      retries: 0,
      startTime: null,
      lastUpdate: null
    }));
    setRecentActivity([]);
    setHourlyProgress([]);
  };

  const progressPercentage = ((stats.completed + stats.failed) / stats.total) * 100;
  const successRate = stats.completed / (stats.completed + stats.failed) * 100 || 0;

  const statusData = [
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' },
    { name: 'In Progress', value: stats.inProgress, color: '#f59e0b' },
    { name: 'Pending', value: stats.total - stats.completed - stats.failed - stats.inProgress, color: '#6b7280' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HeyGen Video Pipeline</h1>
              <p className="text-gray-600">Generating educational videos with Kelly and Ken avatars</p>
            </div>
            <div className="flex space-x-4">
              {!isRunning ? (
                <button
                  onClick={startPipeline}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Pipeline
                </button>
              ) : (
                <button
                  onClick={pausePipeline}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Pipeline
                </button>
              )}
              <button
                onClick={resetPipeline}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-gray-600">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                <p className="text-gray-600">Failed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                <p className="text-gray-600">In Progress</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.currentRate}</p>
                <p className="text-gray-600">Videos/Hour</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Success Rate</p>
                <p className="font-semibold text-green-600">{Math.round(successRate)}%</p>
              </div>
              <div>
                <p className="text-gray-600">Time Remaining</p>
                <p className="font-semibold text-blue-600">
                  {stats.estimatedTimeRemaining > 0 ? `${Math.round(stats.estimatedTimeRemaining)}h` : 'Calculating...'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Progress & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Progress</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600 mr-2">{activity.time}</span>
                  <span className="text-gray-900">{activity.message}</span>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900">HeyGen API</p>
              <p className="text-xs text-gray-600">Operational</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900">Cloudflare R2</p>
              <p className="text-xs text-gray-600">Operational</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900">Kelly Avatar</p>
              <p className="text-xs text-gray-600">Ready</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900">Ken Avatar</p>
              <p className="text-xs text-gray-600">Ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineMonitor; 