'use client';

import { useState } from 'react';

const Page = () => {
    const [originalFile, setOriginalFile] = useState(null);
    const [p7sFile, setP7sFile] = useState(null);
    const [verifyStatus, setVerifyStatus] = useState('');
    const [loadingVerify, setLoadingVerify] = useState(false);

    const handleOriginalFileChange = (e) => {
        setOriginalFile(e.target.files[0]);
    };
    const handleP7sFileChange = (e) => {
        setP7sFile(e.target.files[0]);
    };

    // --- Проверка подписи через прямой WebSocket к NCALayer ---
    const handleVerifySignature = async () => {
        setLoadingVerify(true);
        setVerifyStatus('');
        try {
            if (!originalFile || !p7sFile) {
                setVerifyStatus('Выберите оба файла!');
                setLoadingVerify(false);
                return;
            }
            // Читаем файлы как base64
            const fileToBase64 = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const [originalBase64, p7sBase64] = await Promise.all([
                fileToBase64(originalFile),
                fileToBase64(p7sFile)
            ]);

            // Открываем WebSocket к NCALayer
            const ws = new window.WebSocket('ws://127.0.0.1:13579/');
            const requestId = Date.now();

            ws.onopen = () => {
                ws.send(JSON.stringify({
                    module: "kz.gov.pki.knca.basics",
                    method: "verifyPkcs7",
                    args: {
                        data: originalBase64,
                        signature: p7sBase64,
                        encoding: "BASE64"
                    },
                    id: requestId
                }));
            };

            ws.onmessage = (event) => {
                const response = JSON.parse(event.data);
                if (response.id === requestId) {
                    if (response.result && response.result.valid) {
                        setVerifyStatus('✅ Подпись действительна');
                    } else {
                        setVerifyStatus('❌ Подпись недействительна или ошибка: ' + (response.error || ''));
                    }
                    setLoadingVerify(false);
                    ws.close();
                }
            };

            ws.onerror = (e) => {
                setVerifyStatus('Ошибка соединения с NCALayer: ' + (e.message || ''));
                setLoadingVerify(false);
                ws.close();
            };
        } catch (err) {
            setVerifyStatus('Ошибка проверки подписи: ' + (err.message || err));
            setLoadingVerify(false);
        }
    };

    return (
        <div className="container-xl">
            <div className="row bg-body-tertiary p-5 mx-2 rounded-5 mb-4">
                <div className="col-12 mx-auto text-center" style={{ maxWidth: "600px" }}>
                    <div className="mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-3" style={{ width: "80px", height: "80px" }}>
                            <i className="bi bi-shield-check" style={{ fontSize: "2.5rem" }}></i>
                        </div>
                        <h2 className="m-0 mb-2">Проверка подписи p7s</h2>
                        <p className="m-0 text-muted">
                            Проверьте действительность подписи для вашего файла и p7s-файла
                        </p>
                    </div>
                    <div className="d-flex flex-column align-items-center gap-3 mb-4">
                        <input
                            type="file"
                            onChange={handleOriginalFileChange}
                            className="form-control mb-2"
                            disabled={loadingVerify}
                            accept="application/pdf"
                        />
                        <input
                            type="file"
                            onChange={handleP7sFileChange}
                            className="form-control mb-2"
                            disabled={loadingVerify}
                            accept=".p7s"
                        />
                        <button
                            className="btn btn-success btn-lg rounded-4"
                            onClick={handleVerifySignature}
                            disabled={loadingVerify || !originalFile || !p7sFile}
                        >
                            {loadingVerify ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Проверка...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-shield-check me-3"></i>
                                    Проверить подпись
                                </>
                            )}
                        </button>
                        {verifyStatus && (
                            <span className={`badge py-2 px-3 rounded-4 text-wrap ${verifyStatus.startsWith('✅') ? 'bg-success' : verifyStatus.startsWith('❌') ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                {verifyStatus}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;
