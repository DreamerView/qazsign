'use client';

import { useEffect, useState } from 'react';
import { NCALayerClient } from 'ncalayer-js-client';

const Page = () => {
    const [client, setClient] = useState(null);
    const [keys, setKeys] = useState([])
    // --- Добавлено для подписания PDF ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [signStatus, setSignStatus] = useState('');
    const [signedData, setSignedData] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // --- конец добавленного ---

    // --- Функции для подписания PDF ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
    };

    const toBase64 = async (file) => {
        const buffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        let binary = "";
        for (let byte of uint8) {
            binary += String.fromCharCode(byte);
        }
        return btoa(binary);
    };

    const handleSignPdf = async () => {
        if (!selectedFile) {
            setError('Выберите PDF-файл');
            return;
        }
        setError(null);
        setSignStatus('📄 Чтение PDF-файла...');
        setLoading(true);
        setSignedData('');
        let client = null;
        try {
            const base64 = await toBase64(selectedFile);
            client = new NCALayerClient();
            setSignStatus('🔐 Подключение к NCALayer...');
            await client.connect();
            setSignStatus('📂 Подписание...');
            const result = await client.basicsSignCMS(
                NCALayerClient.basicsStoragesAll,
                base64,
                NCALayerClient.basicsCMSParamsDetached,
                NCALayerClient.basicsSignerSignAny,
            );
            // --- Проверка результата ---
            if (typeof result !== 'string') {
                setError('Ошибка: Некорректный ответ от NCALayer');
                setSignStatus('❌ Ошибка при подписании');
                return;
            }
            // Если это JSON с ошибкой
            try {
                const parsed = JSON.parse(result);
                if (parsed && (parsed.message || parsed.code)) {
                    setError('Ошибка от NCALayer: ' + (parsed.message || JSON.stringify(parsed)));
                    setSignStatus('❌ Ошибка при подписании');
                    return;
                }
            } catch (e) { /* не JSON, всё ок */ }
            setSignedData(result);
            setSignStatus('✅ PDF подписан успешно');
        } catch (err) {
            setError('Ошибка: ' + (err.message || err));
            setSignStatus('❌ Ошибка при подписании');
        } finally {
            setLoading(false);
            if (client && client.socket?.readyState === WebSocket.OPEN) {
                client.socket.close();
            }
        }
    };

    // --- Проверка base64 ---
    function isBase64(str) {
        if (!str || typeof str !== 'string') return false;
        // base64 обычно кратна 4, содержит только A-Za-z0-9+/ и может заканчиваться =
        return /^[A-Za-z0-9+/]+={0,2}$/.test(str) && str.length % 4 === 0;
    }
    // --- Проверка PEM CMS ---
    function isPemCms(str) {
        if (!str || typeof str !== 'string') return false;
        return str.includes('-----BEGIN CMS-----') && str.includes('-----END CMS-----');
    }

    const downloadP7s = (data) => {
        let base64 = data;
        if (isPemCms(data)) {
            // Извлечь base64 между PEM заголовками
            const match = data.match(/-----BEGIN CMS-----([\s\S]*?)-----END CMS-----/);
            if (match && match[1]) {
                base64 = match[1].replace(/\s+/g, '');
            } else {
                setError('Ошибка: Не удалось извлечь base64 из PEM CMS');
                return;
            }
        }
        if (!isBase64(base64)) {
            setError('Ошибка: Подпись не является корректной base64-строкой!');
            return;
        }
        try {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "application/pkcs7-signature" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = selectedFile?.name.replace(/\.pdf$/i, "") + ".p7s";
            link.click();
        } catch (e) {
            setError('Ошибка при декодировании base64: ' + (e.message || e));
        }
    };
    // --- конец функций для подписания PDF ---

    return (
        <div className="container-xl">
            <div className="row bg-body-tertiary p-5 mx-2 rounded-5">
                <div className="col-12 mx-auto text-center" style={{ maxWidth: "600px" }}>
                    <div className="mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: "80px", height: "80px" }}>
                            <i className="bi bi-pen" style={{ fontSize: "2.5rem" }}></i>
                        </div>
                        <h2 className="m-0 mb-2">Подпись документов</h2>
                        <p className="m-0 text-muted">
                            Подпишите документы с помощью сертификата электронной цифровой подписи
                        </p>
                    </div>
                    
                    <div className="d-flex flex-column align-items-center gap-3 mb-4">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="form-control mb-2"
                            disabled={loading}
                        />
                        <button
                            className="btn btn-success btn-lg rounded-4"
                            onClick={handleSignPdf}
                            disabled={loading || !selectedFile}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Подписание...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-shield-check me-3"></i>
                                    Подписать PDF
                                </>
                            )}
                        </button>
                        {signStatus && (
                            <span className="badge bg-info text-dark py-2 px-3 rounded-4 text-wrap">
                                {signStatus}
                            </span>
                        )}
                        {error && (
                            <span className="badge bg-danger text-white py-2 px-3 rounded-4 text-wrap">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                {error}
                            </span>
                        )}
                    </div>
                    
                </div>
            </div>



            {keys.length > 0 && (
                <div className="row bg-body-tertiary p-5 rounded-5 mx-2 mt-5">
                    <div className="col-12">

                        
                                                <div className="row">
                                    {keys.map((key, i) => (
                                        <div key={i} className="col-12 mb-4">
                                            <div className="card border-0 shadow-sm">
                                                <div className="card-body p-4">
                                                    <div className="d-flex">
                                                        {/* Аватар слева */}
                                                        <div className="flex-shrink-0 me-4">
                                                            <div className="d-inline-flex align-items-center justify-content-center bg-gradient text-white rounded-circle" style={{ 
                                                                width: "80px", 
                                                                height: "80px",
                                                                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                                                            }}>
                                                                <i className="bi bi-person-vcard" style={{ fontSize: "2rem" }}></i>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Информация справа */}
                                                        <div className="flex-grow-1">
                                                            <div className="mb-3">
                                                                <h5 className="mb-1">Сертификат #{i + 1}</h5>
                                                                <p className="text-muted mb-0">{key.subjectCn || 'Неизвестный владелец'}</p>
                                                            </div>
                                                            
                                                            <div className="row">
                                                                <div className="col-md-6">
                                                                    <h6 className="text-primary mb-3">
                                                                        <i className="bi bi-person me-2"></i>
                                                                        Основная информация
                                                                    </h6>
                                                                    <ul className="list-unstyled">
                                                                        <li className="mb-2">
                                                                            <strong>Владелец:</strong><br/>
                                                                            <span className="text-muted">{key.subjectCn || 'Не указан'}</span>
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <strong>Удостоверяющий центр:</strong><br/>
                                                                            <span className="text-muted">{key.issuerCn || 'Не указан'}</span>
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <strong>Серийный номер:</strong><br/>
                                                                            <span className="text-muted">{key.serialNumber || 'Не указан'}</span>
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <strong>Алиас:</strong><br/>
                                                                            <span className="text-muted">{key.alias || 'Не указан'}</span>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <h6 className="text-primary mb-3">
                                                                        <i className="bi bi-calendar-check me-2"></i>
                                                                        Срок действия
                                                                    </h6>
                                                                    <ul className="list-unstyled">
                                                                        <li className="mb-2">
                                                                            <strong>Выпущен:</strong><br/>
                                                                            <span className="text-muted">
                                                                                {key.certNotBefore ? new Date(Number(key.certNotBefore)).toLocaleDateString('ru-RU') : 'Не указан'}
                                                                            </span>
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <strong>Действителен до:</strong><br/>
                                                                            <span className="text-muted">
                                                                                {key.certNotAfter ? new Date(Number(key.certNotAfter)).toLocaleDateString('ru-RU') : 'Не указан'}
                                                                            </span>
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <strong>Текущий статус:</strong><br/>
                                                                            <div className="mt-2">
                                                                                {key.certNotAfter ? 
                                                                                    (new Date(Number(key.certNotAfter)) > new Date() ? 
                                                                                        <span className="badge bg-primary fs-6">Действителен</span> : 
                                                                                        <span className="badge bg-danger fs-6">Истёк</span>
                                                                                    ) : 
                                                                                    <span className="badge bg-secondary fs-6">Неизвестен</span>
                                                                                }
                                                                            </div>
                                                                        </li>
                                                                    </ul>
                                                                    
                                                                    {key.keyUsage && (
                                                                        <div className="mt-4">
                                                                            <h6 className="text-primary mb-2">
                                                                                <i className="bi bi-gear me-2"></i>
                                                                                Назначение ключа
                                                                            </h6>
                                                                            <p className="text-muted mb-0">{key.keyUsage}</p>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {key.extendedKeyUsage && (
                                                                        <div className="mt-3">
                                                                            <h6 className="text-primary mb-2">
                                                                                <i className="bi bi-gear-wide-connected me-2"></i>
                                                                                Расширенное назначение
                                                                            </h6>
                                                                            <p className="text-muted mb-0">{key.extendedKeyUsage}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Отладочная информация для разработчиков */}
                                <details className="mt-2">
                                    <summary className="text-muted">
                                        <i className="bi bi-code-slash me-2"></i>
                                        Отладочная информация (JSON) - для разработчиков
                                    </summary>
                                    <pre className="bg-body p-3 rounded mt-2" style={{fontSize: '12px', maxHeight: '200px', overflow: 'auto'}}>
                                        {JSON.stringify(keys, null, 2)}
                                    </pre>
                                </details>
                    </div>
                </div>
            )}
            {/* --- Вывод результата подписи и кнопки скачивания --- */}
            {signedData && (
                <div className="row bg-body-tertiary p-4 rounded-5 mx-2 mt-4">
                    <div className="col-12">
                        <h5 className="mb-3">📎 Результат NCALayer:</h5>
                        <textarea
                            value={signedData}
                            readOnly
                            className="form-control mb-3"
                            style={{ fontFamily: 'monospace', height: '200px', fontSize: '13px' }}
                        />
                        {(isBase64(signedData) || isPemCms(signedData)) ? (
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => downloadP7s(signedData)}
                            >
                                ⬇️ Скачать .p7s файл
                            </button>
                        ) : (
                            <div className="text-danger mt-2">Результат не является корректной base64-строкой или PEM CMS. Это может быть текст ошибки или пустой ответ.</div>
                        )}
                    </div>
                </div>
            )}
            {/* --- Конец вывода подписи --- */}
        </div>
    );
};

export default Page;
