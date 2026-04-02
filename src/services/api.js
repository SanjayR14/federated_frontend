import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const searchPatients = (hospitalId, q) =>
    axios.get(`${API_URL}/patients/search`, {
        params: { hospitalId, q },
    });

export const fetchPatientAnalysis = (medId) =>
    axios.get(`${API_URL}/reports/analysis/${medId}`);

export const addPatientAndPredict = (payload) =>
    axios.post(`${API_URL}/patients/add`, payload);
