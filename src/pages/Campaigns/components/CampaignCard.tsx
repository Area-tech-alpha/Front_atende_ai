import React from "react";
import { Calendar, ArrowUpRight, Edit, Trash2, PauseCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CampaignDetailsModal from "./CampaignDetailsModal";
import { API_ENDPOINTS } from "@/config/api";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api.client";
import { AxiosError } from "axios";
import { Campaign } from "../Campaigns";
import ConfirmToast from "@/components/ui/ConfirmToast";
import { toast } from "react-toastify";

interface CampaignCardProps {
  campaign: Campaign;
  onDelete: (id: number) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onDelete }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = React.useState(false);
  const { user } = useAuth();
  const getStatusStyle = (status: Campaign["status"]) => {
    switch (status) {
      case "Concluída":
        return "bg-green-100 text-green-700";
      case "Concluída com erros":
        return "bg-orange-100 text-orange-700";
      case "Não concluida":
        return "bg-red-100 text-red-700";
      case "Cancelada":
        return "bg-gray-100 text-gray-700";
      case "Em Andamento":
      case "Imediata":
        return "bg-yellow-100 text-yellow-700";
      case "Agendada":
        return "bg-blue-100 text-blue-700";
      case "Rascunho":
        return "bg-zinc-200 text-zinc-600";
      default:
        return "bg-zinc-200 text-zinc-600";
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleDelete = async () => {
    toast.warn(
      ({ closeToast }) => (
        <ConfirmToast
          message={`Tem certeza que deseja excluir a campanha "${campaign.name}"?`}
          onConfirm={async () => {
            if (!user?.id) {
              toast.error("Erro: Usuário não autenticado. Por favor, faça login novamente.");
              return;
            }
            try {
              await apiClient.delete(API_ENDPOINTS.campaigns.delete(campaign.id));
              toast.success("Campanha excluída com sucesso!");
              onDelete(campaign.id);
            } catch (error) {
              console.error("Falha ao excluir campanha:", error);
              let errorMessage = "Ocorreu um erro na comunicação com o servidor.";
              if (error instanceof AxiosError) {
                errorMessage = error.response?.data?.message || "Erro retornado pelo servidor.";
              }
              toast.error(`Erro ao excluir campanha: ${errorMessage}`);
            }
          }}
          onCancel={() => {
            console.log("Exclusão da campanha cancelada.");
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
  const onStatusChange = (campaignId: number, newStatus: Campaign["status"]) => {
    if (campaign.id === campaignId) {
      campaign.status = newStatus;
    }
  };

  const handleStopCampaign = async (campaignId: number) => {
    if (window.confirm("Tem certeza que deseja parar esta campanha? Os envios restantes serão cancelados.")) {
      try {
        await apiClient.put(API_ENDPOINTS.campaigns.stop(campaignId));
        toast.success("Sinal de parada enviado para a campanha.");
        onStatusChange(campaignId, "Cancelada");
      } catch (error) {
        toast.error("Não foi possível parar a campanha.");
      }
    }
  };

  return (
    <div className="card group hover:shadow-glow transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-display font-bold text-accent truncate">{campaign.name}</h3>
        <span
          className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-lg ${getStatusStyle(
            campaign.status
          )}`}>
          {(() => {
            switch (campaign.status) {
              case "Concluída":
                return "Concluída";
              case "Em Andamento":
                return "Em Andamento";
              case "Agendada":
                return "Agendada";
              case "Cancelada":
                return "Cancelada";
              case "Imediata":
                return "Imediata";
              case "Concluída com erros":
                return "Concluída c/ erros";
              case "Não concluida":
                return "Não concluída";
              default:
                return "Rascunho";
            }
          })()}
        </span>
      </div>
      <p className="text-sm text-accent/60 mb-4 line-clamp-2">{campaign.description}</p>

      <div className="flex items-center text-sm text-accent/60 mb-4">
        <Calendar size={16} className="mr-1" />
        <span>{formatDate(campaign.date)}</span>
        <span className="mx-2">•</span>
        <span>Template: {campaign.template}</span>
        {campaign.nome_da_instancia && <span className="mx-2">•</span>}
        {campaign.nome_da_instancia && (
          <span>
            Instância: <span className="text-primary">{campaign.nome_da_instancia}</span>
          </span>
        )}
      </div>

      {campaign.status === "Concluída" ||
      campaign.status === "Em Andamento" ||
      campaign.status === "Concluída com erros" ? (
        <div className="space-y-3 mb-4">
          <div className="flex flex-wrap gap-4 text-xs text-accent/60">
            <span>
              <b>Total:</b> {campaign.sentCount ?? 0}
            </span>
            <span>
              <b>Enviados:</b> {campaign.deliveredCount ?? 0}
            </span>
            <span>
              <b>Lidos:</b> {campaign.readCount ?? 0}
            </span>
            <span>
              <b>Erros:</b> {campaign.errorCount ?? 0}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-secondary-dark">
        <button
          className="text-accent/60 text-sm font-medium hover:text-primary transition-colors duration-200 flex items-center"
          onClick={() => setShowDetails(true)}>
          <ArrowUpRight size={16} className="mr-1" />
          Ver Detalhes
        </button>

        <div className="flex items-center space-x-2">
          {(campaign.status === "Concluída" ||
            campaign.status === "Concluída com erros" ||
            campaign.status === "Rascunho" ||
            campaign.status === "Agendada" ||
            campaign.status === "Em Andamento") && (
            <button
              className="text-accent/60 text-sm font-medium hover:text-primary transition-colors duration-200 ml-2"
              onClick={() =>
                navigate("/campaigns/new", {
                  state: {
                    reuseCampaign: {
                      ...campaign,
                      status: "Rascunho",
                    },
                  },
                })
              }>
              Reutilizar
            </button>
          )}

          {campaign.status === "Em Andamento" && (
            <button
              onClick={() => handleStopCampaign(campaign.id)}
              className="text-orange-500 text-sm font-medium hover:text-orange-700 transition-colors duration-200 flex items-center"
              title="Parar Campanha">
              <PauseCircle size={16} className="mr-1" />
              Parar
            </button>
          )}

          <div className="flex items-center border-l border-secondary-dark pl-2 space-x-1">
            {(campaign.status === "Rascunho" || campaign.status === "Agendada") && (
              <button
                className="p-2 rounded-md hover:bg-secondary-dark/50 text-accent/60 hover:text-primary transition-colors"
                title="Editar"
                onClick={() =>
                  navigate("/campaigns/new", {
                    state: {
                      reuseCampaign: {
                        ...campaign,
                        status: "Rascunho",
                      },
                    },
                  })
                }>
                <Edit size={16} />
              </button>
            )}

            <button
              className="p-2 rounded-md hover:bg-secondary-dark/50 text-red-500/80 hover:text-red-500 transition-colors"
              title="Excluir"
              onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <CampaignDetailsModal campaignId={campaign.id} open={showDetails} onClose={() => setShowDetails(false)} />
    </div>
  );
};

export default CampaignCard;
