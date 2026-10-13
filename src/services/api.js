import axios from 'axios';

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV
        ? '/api'
        : 'https://federated-backend.onrender.com/api');

export const searchPatients = (hospitalId, q) =>
    axios.get(`${API_URL}/patients/search`, {
        params: { hospitalId, q },
    });

export const fetchPatientAnalysis = (medId) =>
    axios.get(`${API_URL}/reports/analysis/${medId}`);

export const addPatientAndPredict = (payload) =>
    axios.post(`${API_URL}/patients/add`, payload);

export const fetchFederatedDashboard = () =>
    axios.get(`${API_URL}/federated/dashboard`);

export const fetchHighRiskPatients = (hospitalId) =>
    axios.get(`${API_URL}/federated/high-risk`, {
        params: hospitalId ? { hospitalId } : {},
    });
