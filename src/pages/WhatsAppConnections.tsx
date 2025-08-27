import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MoreVertical, Wifi, WifiOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/config/api";
import apiClient from "@/lib/api.client";
import ConfirmToast from "@/components/ui/ConfirmToast"; 

interface WhatsAppConnection {
  deviceId: string;
  connection_name: string;
  status: "connected" | "connecting" | "disconnected" | "pending";
}

const WhatsAppConnections: React.FC = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiClient.get(API_ENDPOINTS.whatsapp.devices);
      setConnections(response.data.devices || []);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Falha ao buscar conexões.";
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnections();
    const interval = setInterval(fetchConnections, 30000);
    return () => clearInterval(interval);
  }, [fetchConnections]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "connected":
        return {
          color: "text-green-500",
          text: "Conectado",
          icon: <Wifi size={16} />,
        };
      case "connecting":
      case "pending":
        return {
          color: "text-yellow-500",
          text: "Conectando...",
          icon: <Loader2 size={16} className="animate-spin" />,
        };
      default:
        return {
          color: "text-red-500",
          text: "Desconectado",
          icon: <WifiOff size={16} />,
        };
    }
  };

  const handleDeleteConnection = async (deviceId: string) => {
    toast.warn(
      ({ closeToast }) => (
        <ConfirmToast
          message="Tem certeza? Isso removerá os dados de autenticação e desconectará o aparelho."
          onConfirm={async () => {
            try {
              await apiClient.delete(
                API_ENDPOINTS.whatsapp.deleteAuth(deviceId)
              );
              toast.success("Conexão excluída com sucesso!");
              fetchConnections();
            } catch (err) {
              toast.error("Não foi possível excluir a conexão.");
            } finally {
              setOpenMenuId(null);
            }
          }}
          onCancel={() => {
            setOpenMenuId(null);
            closeToast();
          }}
          closeToast={closeToast} 
        />
      ),
      {
        autoClose: false,
        closeOnClick: false,
      }
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-accent">Conexões WhatsApp</h1>

      <div className="bg-secondary rounded-xl p-6 shadow-soft border border-secondary-dark">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : connections.length === 0 ? (
          <div className="text-accent/80 text-center py-4">
            Nenhuma conexão encontrada. Adicione uma na tela "Conectar
            WhatsApp".
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => {
              const statusInfo = getStatusInfo(connection.status);
              return (
                <div
                  key={connection.deviceId}
                  className="bg-secondary-dark rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-medium text-accent text-lg">
                      {connection.connection_name || "Conexão Sem Nome"}
                    </h3>
                    <p className="text-accent/60 text-sm">
                      {connection.deviceId}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 relative">
                    <span
                      className={`flex items-center gap-2 text-sm font-medium ${statusInfo.color}`}
                    >
                      {statusInfo.icon}
                      {statusInfo.text}
                    </span>
                    <button
                      className="p-1 rounded-full text-accent/70 hover:bg-secondary-darker"
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === connection.deviceId
                            ? null
                            : connection.deviceId
                        )
                      }
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openMenuId === connection.deviceId && (
                      <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-40">
                        <button
                          className="flex items-center gap-3 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                          onClick={() =>
                            handleDeleteConnection(connection.deviceId)
                          }
                        >
                          <Trash2 size={16} />
                          <span>Excluir</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppConnections;
