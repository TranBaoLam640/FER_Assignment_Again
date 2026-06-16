import React, { useState, useRef } from 'react';

export default function CreateSetOcr() {
    const [progress, setProgress] = useState('');
    const [results, setResults] = useState([]);
    const [showSaveButton, setShowSaveButton] = useState(false);
    const fileInputRef = useRef(null);

    // Chuyển đổi File sang dạng data URL (Base64)
    const fileToDataURL = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result); 
            reader.readAsDataURL(file);
        });
    };

    // Xử lý OCR hàng loạt ảnh
    const processBatch = async () => {
        const files = fileInputRef.current?.files;
        if (!files || files.length === 0) {
            alert('Please select some images first');
            return;
        }

        // Đảm bảo thư viện Puter đã được nạp từ thẻ script trong index.html
        if (!window.puter) {
            alert('Puter.js library is not loaded yet');
            return;
        }

        setProgress('');
        setResults([]);
        setShowSaveButton(false);

        const tempResults = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setProgress(`Processing image ${i + 1} of ${files.length}...`);

            try {
                // Chuyển sang data URL trước
                const dataUrl = await fileToDataURL(file);
                // Gọi API của Puter qua biến toàn cục window
                const text = await window.puter.ai.img2txt(dataUrl);

                const successResult = {
                    filename: file.name,
                    text: text || 'No text found',
                    timestamp: new Date().toISOString(),
                    isError: false
                };

                tempResults.push(successResult);
                // Cập nhật giao diện theo thời gian thực (real-time) cho từng ảnh
                setResults((prev) => [...prev, successResult]);

            } catch (error) {
                const errorResult = {
                    filename: file.name,
                    text: `Error - ${error.message}`,
                    isError: true
                };
                
                tempResults.push(errorResult);
                setResults((prev) => [...prev, errorResult]);
            }
        }

        setProgress('All images processed!');
        // Chỉ hiện nút lưu nếu có ít nhất một ảnh xử lý thành công (không lỗi)
        const hasSuccess = tempResults.some(r => !r.isError);
        if (hasSuccess) {
            setShowSaveButton(true);
        }
    };

    // Lưu kết quả vào đám mây của Puter
    const saveResults = async () => {
        try {
            // Lọc bỏ các kết quả bị lỗi trước khi lưu
            const validResults = results.filter(r => !r.isError);

            const resultsText = validResults.map(result =>
                `File: ${result.filename}\nTimestamp: ${result.timestamp}\n\n${result.text}\n\n---\n\n`
            ).join('');

            await window.puter.fs.write('ocr-results.txt', resultsText);
            alert('Results saved to ocr-results.txt');
        } catch (error) {
            alert('Error saving results: ' + error.message);
        }
    };

    return (
        <div>
            <h3>Batch OCR Processing</h3>
            <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                multiple 
            />
            <button onClick={processBatch}>Process All Images</button>

            <div>{progress}</div>

            <div style={{ marginTop: '20px' }}>
                <h4>Results:</h4>
                <div>
                        {results.map((result, index) => (
                            <div key={index} style={{ marginBottom: '20px', color: result.isError ? 'red' : 'inherit' }}>
                                <strong>{result.filename}</strong>
                                <pre style={{ whiteSpace: 'pre-wrap' }}>{result.text}</pre>
                        </div>
                    ))}
                -</div>
            </div>

            {showSaveButton && (
                <button onClick={saveResults} style={{ marginTop: '10px' }}>
                    Save Results
                </button>
            )}

            <div></div>
        </div>
    );
}