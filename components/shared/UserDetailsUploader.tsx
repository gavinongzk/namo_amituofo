'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react'; // Changed from Loader to Loader2 for consistency

const UserDetailsUploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<any[] | null>(null);

    // Simple feedback function to replace toast
    const showFeedback = (title: string, description: string, variant: 'default' | 'destructive' | 'warning' = 'default') => {
        console.log(`[${variant}] ${title}: ${description}`);
        setUploadStatus(`${title}: ${description}`);
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const selectedFile = event.target.files[0];
            // Basic client-side type check (server validates again)
            if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(selectedFile.type)) {
                // Replace toast with showFeedback
                showFeedback('Invalid File Type', 'Please select an Excel file (.xlsx or .xls).', 'destructive');
                setFile(null);
                event.target.value = ''; // Reset file input
            } else {
                setFile(selectedFile);
                setUploadStatus(null); // Clear previous status on new file selection
                setErrorDetails(null);
            }
        } else {
            setFile(null);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!file) {
            // Replace toast with showFeedback
            showFeedback('No File Selected', 'Please select an Excel file to upload.', 'warning');
            return;
        }

        setIsLoading(true);
        setUploadStatus('Uploading...');
        setErrorDetails(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload-user-details', {
                method: 'POST',
                body: formData,
                // No 'Content-Type' header needed, browser sets it correctly for FormData
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle specific error statuses (400 for validation, 401/403 for auth, 500 for server errors)
                let description = result.message || `Upload failed with status ${response.status}`;
                if (response.status === 400 && result.errors) {
                    // Validation errors from Zod
                    description = `${result.message}. See details below.`;
                    setErrorDetails(result.errors);
                } else if (response.status === 207 && result.operationErrors) {
                    // Partial success with database operation errors
                    description = `${result.message}. Some rows failed during database operation. See details below.`;
                    setErrorDetails(result.operationErrors);
                }
                setUploadStatus(`Error: ${description}`);
                // Replace toast with showFeedback
                showFeedback('Upload Failed', description, 'destructive');
            } else {
                // Success (200 OK or 207 Multi-Status with some failures handled above)
                setUploadStatus(result.message);
                // Replace toast with showFeedback
                showFeedback('Upload Successful', result.message);
                setFile(null); // Clear file input on success
                const fileInput = document.getElementById('userDetailsFile') as HTMLInputElement;
                if (fileInput) fileInput.value = ''; // Reset file input visually
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown network error occurred.';
            setUploadStatus(`Error: ${errorMessage}`);
            // Replace toast with showFeedback
            showFeedback('Upload Error', errorMessage, 'destructive');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg shadow-md space-y-4">
            <h3 className="text-lg font-semibold">Upload User Details (Excel)</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                    id="userDetailsFile"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
                {file && <p className="text-sm text-muted-foreground">Selected file: {file.name}</p>}
                <Button type="submit" disabled={!file || isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        'Upload File'
                    )}
                </Button>
            </form>
            {uploadStatus && (
                <div className={`mt-4 p-3 rounded ${uploadStatus.startsWith('Error:') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    <p className="font-medium">{uploadStatus}</p>
                </div>
            )}
            {errorDetails && errorDetails.length > 0 && (
                 <div className="mt-4 p-3 rounded bg-yellow-100 text-yellow-800 max-h-60 overflow-y-auto">
                    <h4 className="font-semibold mb-2">Error Details:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {errorDetails.map((err, index) => (
                            <li key={index}>
                                {err.row && `Row ${err.row}: `}{err.errors || err.error}
                                {err.rowData && ` (Phone: ${err.rowData.phoneNumber})`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UserDetailsUploader;