/**
 * API Client for Food Recognition & Nutrition Tracker.
 */
import axios from 'axios';

const API_BASE = ''; // Proxied through Vite to http://127.0.0.1:8000

export const api = {
  // Health & Readiness
  getHealth: async () => {
    const res = await axios.get(`${API_BASE}/api/health`);
    return res.data;
  },

  // Food Catalog
  getAllFoods: async () => {
    const res = await axios.get(`${API_BASE}/api/foods`);
    return res.data;
  },

  getFoodById: async (id) => {
    const res = await axios.get(`${API_BASE}/api/food/${id}`);
    return res.data;
  },

  // Core End-to-End Analysis
  analyzeFood: async (imageFile, foodName) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (foodName && foodName.trim()) {
      formData.append('food_name', foodName.trim());
    }
    const res = await axios.post(`${API_BASE}/api/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Recalculate Nutrition
  recalculateNutrition: async (foodKey, servingWeightG) => {
    const res = await axios.post(`${API_BASE}/api/nutrition`, {
      food_key: foodKey,
      serving_weight_g: Number(servingWeightG),
    });
    return res.data;
  },

  // Match Food
  matchFood: async (userFoodName, predictedFoodKey, topKPredictions) => {
    const res = await axios.post(`${API_BASE}/api/match-food`, {
      user_food_name: userFoodName,
      predicted_food_key: predictedFoodKey,
      top_k_predictions: topKPredictions,
    });
    return res.data;
  },

  // History Operations
  getHistory: async (limit = 50, offset = 0) => {
    const res = await axios.get(`${API_BASE}/api/history`, {
      params: { limit, offset },
    });
    return res.data;
  },

  deleteHistoryItem: async (id) => {
    const res = await axios.delete(`${API_BASE}/api/history/${id}`);
    return res.data;
  },

  clearHistory: async () => {
    const res = await axios.delete(`${API_BASE}/api/history`);
    return res.data;
  },

  // COA Memory Hierarchy Telemetry
  getCoaStats: async () => {
    const res = await axios.get(`${API_BASE}/api/coa-stats`);
    return res.data;
  },

  clearLruCache: async () => {
    const res = await axios.post(`${API_BASE}/api/coa/clear-cache`);
    return res.data;
  },

  // -----------------------------------------------------------------------
  // Autonomous Agents Hub API
  // -----------------------------------------------------------------------
  getAgentsOverview: async () => {
    const res = await axios.get(`${API_BASE}/api/agents`);
    return res.data;
  },

  getLiveMetrics: async () => {
    const res = await axios.get(`${API_BASE}/api/agents/metrics`);
    return res.data;
  },

  getAgentTasks: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/api/agents/tasks`, { params });
    return res.data;
  },

  createAgentTask: async (taskData) => {
    const res = await axios.post(`${API_BASE}/api/agents/tasks`, taskData);
    return res.data;
  },

  getAgentTaskDetails: async (taskId) => {
    const res = await axios.get(`${API_BASE}/api/agents/tasks/${taskId}`);
    return res.data;
  },

  startAgentTask: async (taskId) => {
    const res = await axios.post(`${API_BASE}/api/agents/tasks/${taskId}/start`);
    return res.data;
  },

  cancelAgentTask: async (taskId) => {
    const res = await axios.post(`${API_BASE}/api/agents/tasks/${taskId}/cancel`);
    return res.data;
  },

  retryAgentTask: async (taskId) => {
    const res = await axios.post(`${API_BASE}/api/agents/tasks/${taskId}/retry`);
    return res.data;
  },

  getAgentTaskLogs: async (taskId) => {
    const res = await axios.get(`${API_BASE}/api/agents/tasks/${taskId}/logs`);
    return res.data;
  },

  getAgentMessages: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/api/agents/messages`, { params });
    return res.data;
  },

  sendAgentMessage: async (messageData) => {
    const res = await axios.post(`${API_BASE}/api/agents/messages`, messageData);
    return res.data;
  },

  getAgentReports: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/api/agents/reports`, { params });
    return res.data;
  },

  getAgentReportContent: async (reportId) => {
    const res = await axios.get(`${API_BASE}/api/agents/reports/${reportId}/content`);
    return res.data;
  },
};
