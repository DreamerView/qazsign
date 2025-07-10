'use client';

import { useEffect, useState } from 'react';
import { NCALayerClient } from 'ncalayer-js-client';

const Page = () => {
    const [client, setClient] = useState(null);
    const [keys, setKeys] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const initClient = async () => {
            const nc = new NCALayerClient();
            try {
                await nc.connect(); // подключаемся к NCALayer
                setClient(nc);
            } catch (e) {
                setError('Не удалось подключиться к NCALayer. Убедитесь, что он запущен.');
            }
        };
        initClient();
    }, []);

    const handleGetKeys = async () => {
        if (!client) return;

        setLoading(true);
        setError('');
        
        try {
            const result = await client.getKeyInfo("PKCS12", "NONE");
            const keys = Array.isArray(result) ? result : [result];
            setKeys(keys.map((key, index) => ({ ...key, originalIndex: index })));
        } catch (e) {
            setError('Ошибка при получении ключей: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-xl">
            <div className="row bg-body-tertiary p-5 mx-2 rounded-5">
                <div className="col-12 mx-auto text-center" style={{ maxWidth: "600px" }}>
                    <div className="mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: "80px", height: "80px" }}>
                            <i className="bi bi-person" style={{ fontSize: "2.5rem" }}></i>
                        </div>
                        <h2 className="m-0 mb-2">Информация о ЭЦП</h2>
                        <p className="m-0 text-muted">
                            Получите подробную информацию о ваших сертификатах электронной цифровой подписи
                        </p>
                    </div>
                    
                    <div className="d-flex flex-column align-items-center gap-3">
                        <button
                            className="btn btn-primary btn-lg rounded-4"
                            onClick={handleGetKeys}
                            disabled={!client || loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Загрузка...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-shield-check me-2"></i>
                                    Получить информацию о сертификатах
                                </>
                            )}
                        </button>
                        
                        {error && (
                            <span className="badge bg-danger text-white py-2 px-3 rounded-4">
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
        </div>
    );
};

export default Page;
