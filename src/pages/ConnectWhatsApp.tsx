import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import apiClient from '@/lib/api.client';


const ConnectWhatsApp: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'Desconectado' | 'Conectando...' | 'Aguardando QR' | 'Conectado'>('Desconectado');
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionName, setConnectionName] = useState('');

  const pollQrCode = async (deviceId: string) => {
    let attempts = 0;
    while (attempts < 15) {
      try {
        const res = await apiClient.get(API_ENDPOINTS.whatsapp.qr(deviceId));
        if (res.data && res.data.qr) {
          setQrCode(res.data.qr);
          setOpenQRDialog(true);
          setConnectionStatus('Aguardando QR');
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('Falha ao buscar QR code, tentando novamente...', e);
      }
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    }
    setError('Não foi possível obter o QR Code do servidor.');
    setConnectionStatus('Desconectado');
    setIsLoading(false);
  };

  const handleConnect = async () => {
    if (!phoneNumber) {
      toast.error('Por favor, insira um número de telefone no formato 55619...');
      return;
    }
    setIsLoading(true);
    setQrCode(null);
    setError(null);
    setConnectionStatus('Conectando...');
    try {
      const payload = {
        deviceId: phoneNumber,
        connectionName: connectionName || `Conexão de ${phoneNumber}`
      };
      await apiClient.post(API_ENDPOINTS.whatsapp.connect, payload);
      await pollQrCode(phoneNumber);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Falha ao conectar. Verifique o console.';
      setError(errorMessage);
      toast.error(errorMessage);
      setConnectionStatus('Desconectado');
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = useCallback(async () => {
    if (!phoneNumber) return;
    try {
      const response = await apiClient.get(API_ENDPOINTS.whatsapp.status(phoneNumber));
      if (response.data.status === 'connected') {
        setConnectionStatus('Conectado');
        setOpenQRDialog(false);
        toast.success('WhatsApp conectado com sucesso!');
      }
    } catch (err) {
      console.log('Verificação de status falhou, tentando novamente...');
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (connectionStatus === 'Aguardando QR') {
      const interval = setInterval(checkConnectionStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus, checkConnectionStatus]);

  return (
    <>
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-secondary p-8 rounded-2xl border border-secondary-dark shadow-soft flex flex-col items-center">
          <QrCode className="w-12 h-12 text-primary mb-2" />
          <h1 className="text-2xl font-bold text-accent mb-2 text-center">Conectar WhatsApp</h1>
          <p className="text-accent/60 mb-6 text-center text-sm">Crie uma nova conexão para disparar suas campanhas.</p>

          <div className="w-full space-y-4 mb-6">
            <div>
              <label htmlFor="connectionName" className="block text-sm font-medium text-accent mb-1">
                Nome da Conexão
              </label>
              <input
                id="connectionName"
                type="text"
                value={connectionName}
                onChange={e => setConnectionName(e.target.value)}
                placeholder="Ex: WhatsApp Comercial"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-accentmb-1">
                Número do WhatsApp (com DDI e DDD)
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Ex: 5561999999999"
                className="input"
              />
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={isLoading || connectionStatus === 'Conectado'}
            className="btn btn-primary w-full flex items-center justify-center">
            {isLoading ? <Loader2 className="animate-spin" /> : 'Gerar QR Code'}
          </button>

          <div className="mt-4 w-full text-center h-10">
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-400 bg-red-400/10 p-2 rounded-lg text-sm">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}
            {connectionStatus === 'Conectado' && (
              <div className="flex items-center justify-center gap-2 text-green-400 bg-green-400/10 p-2 rounded-lg text-sm">
                <CheckCircle size={18} />
                <span>Conectado com sucesso!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {openQRDialog && (
        <div className="fixed inset-0 bg-accent/75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="card p-8 relative">
            <button
              onClick={() => setOpenQRDialog(false)}
              className="absolute top-4 right-4 text-accent/60  hover:text-text-primary transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-2">Escaneie para Conectar</h2>
            <p className="text-accent/60 mb-6 text-center text-sm">
              Abra o WhatsApp no seu celular e conecte um novo aparelho.
            </p>

            <div className="bg-white p-4 rounded-lg border-2 border-primary">
              {qrCode ? (
                <QRCodeSVG value={qrCode} size={256} level="H" />
              ) : (
                <div className="w-[256px] h-[256px] flex items-center justify-center">
                  <Loader2 className="animate-spin w-16 h-16 text-primary" />
                </div>
              )}
            </div>
            <p className="mt-4 text-text-secondary text-sm">
              {connectionStatus === 'Aguardando QR' ? 'Aguardando leitura do QR Code...' : connectionStatus}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectWhatsApp;
