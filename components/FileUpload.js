"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { ProgressBar, Button, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../app/FileUpload.css'; // Assuming you have this file

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

function FileUpload() {
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // Function to determine progress bar color based on upload progress
    const getProgressBarColor = (progress) => {
        if (progress < 30) return 'danger'; // Red for 0% to 30%
        if (progress < 60) return 'warning'; // Yellow for 31% to 60%
        if (progress < 90) return 'info'; // Blue for 61% to 90%
        return 'success'; // Green for 91% to 100%
    };

    const uploadFile = async () => {
        if (!file) return;

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let uploadedChunks = 0;

        const uploadChunk = async (start, end) => {
            const chunk = file.slice(start, end);
            const formData = new FormData();
            formData.append('file', chunk);
            formData.append('start', start);
            formData.append('end', end);
            formData.append('totalChunks', totalChunks);

            try {
                await axios.post('https://file-upload-backend.netlify.app/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true,
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(prev => Math.max(prev, percentCompleted)); // Update progress
                    }
                });
                uploadedChunks += 1;
                setUploadProgress(Math.round((uploadedChunks / totalChunks) * 100));
            } catch (error) {
                console.error('Upload error:', error);
            }
        };

        const chunkPromises = [];
        for (let start = 0; start < file.size; start += CHUNK_SIZE) {
            const end = Math.min(start + CHUNK_SIZE, file.size);
            chunkPromises.push(uploadChunk(start, end));
        }

        setIsUploading(true);
        await Promise.all(chunkPromises);
        setIsUploading(false);
    };

    return (
        <Container>
            <Row className="justify-content-center mt-5">
                <Col xs={12} md={8} lg={6}>
                    <div className="text-center">
                        <div className="file-upload-container">
                            <h1>Upload Your Video</h1>
                            <input 
                                type="file" 
                                accept="video/*" 
                                onChange={handleFileChange} 
                                className="mb-3" 
                            />
                            <br />
                            <Button 
                                onClick={uploadFile} 
                                disabled={isUploading || !file}
                                variant="primary"
                                className="mb-3"
                            >
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </Button>
                            <br />
                            <ProgressBar 
                                now={uploadProgress} 
                                label={`${uploadProgress}%`} 
                                className="progress-bar" 
                                variant={getProgressBarColor(uploadProgress)} // Apply dynamic color
                            />
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default FileUpload;
