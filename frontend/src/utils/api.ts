import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: BACKEND_URL,
});

export interface DocumentStatus {
    id: string;
    filename: string;
    status: string;
    total_chunks: number;
    created_at: string;
}

export const getDocuments = async (userId: string): Promise<DocumentStatus[]> => {
    const response = await api.get('/documents', {
        headers: { 'X-User-ID': userId }
    });
    return response.data;
};

export const uploadDocument = async (file: File, userId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-User-ID': userId
        },
    });
    return response.data;
};

export const queryDocument = async (question: string, userId: string, topK: number = 5) => {
    const response = await api.post('/query', {
        question,
        top_k: topK,
    }, {
        headers: { 'X-User-ID': userId }
    });
    return response.data;
};

export const deleteDocument = async (id: string, userId: string) => {
    const response = await api.delete(`/documents/${id}`, {
        headers: { 'X-User-ID': userId }
    });
    return response.data;
};
