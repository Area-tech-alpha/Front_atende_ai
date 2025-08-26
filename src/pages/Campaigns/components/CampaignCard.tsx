import React from "react";
import { Calendar, ArrowUpRight, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CampaignDetailsModal from "./CampaignDetailsModal";
import { API_ENDPOINTS } from "@/config/api";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api.client";
import { AxiosError } from "axios";

interface Campaign {
  id: number;
  name: string;
  description: string;
  status: "Completed" | "In Progress" | "Scheduled" | "Draft";
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  date: string;
  template: string;
  errorCount?: number;
  nome_da_instancia?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  reuseCampaign?: any;
  onDelete: (id: number) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  reuseCampaign,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = React.useState(false);

  const getStatusStyle = (status: Campaign["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "In Progress":
        return "bg-yellow-100 text-yellow-700";
      case "Scheduled":
        return "bg-blue-100 text-blue-700";
      case "Draft":
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
  const { user } = useAuth();
  const handleDelete = async () => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a campanha "${campaign.name}"?`
      )
    ) {
      if (!user?.id) {
        alert(
          "Erro: Usuário não autenticado. Por favor, faça login novamente."
        );
        return;
      }

      try {
        await apiClient.delete(
          API_ENDPOINTS.campaigns.delete(campaign.id,)
        );

        alert("Campanha excluída com sucesso!");
        onDelete(campaign.id);
      } catch (error) {
        console.error("Falha ao excluir campanha:", error);
        let errorMessage = "Ocorreu um erro na comunicação com o servidor.";

        if (error instanceof AxiosError) {
          errorMessage =
            error.response?.data?.message || "Erro retornado pelo servidor.";
        }

        alert(`Erro ao excluir campanha: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="card group hover:shadow-glow transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-display font-bold text-accent truncate">
          {campaign.name}
        </h3>
        <span
          className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-lg ${getStatusStyle(
            campaign.status
          )}`}
        >
          {campaign.status === "Completed"
            ? "Concluída"
            : campaign.status === "In Progress"
            ? "Em Andamento"
            : campaign.status === "Scheduled"
            ? "Agendada"
            : "Rascunho"}
        </span>
      </div>
      <p className="text-sm text-accent/60 mb-4 line-clamp-2">
        {campaign.description}
      </p>

      <div className="flex items-center text-sm text-accent/60 mb-4">
        <Calendar size={16} className="mr-1" />
        <span>{formatDate(campaign.date)}</span>
        <span className="mx-2">•</span>
        <span>Template: {campaign.template}</span>
        {campaign.nome_da_instancia && <span className="mx-2">•</span>}
        {campaign.nome_da_instancia && (
          <span>
            Instância:{" "}
            <span className="text-primary">{campaign.nome_da_instancia}</span>
          </span>
        )}
      </div>

      {campaign.status === "Completed" || campaign.status === "In Progress" ? (
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
        {/* Botão Ver Detalhes */}
        <button
          className="text-accent/60 text-sm font-medium hover:text-primary transition-colors duration-200 flex items-center"
          onClick={() => setShowDetails(true)}
        >
          <ArrowUpRight size={16} className="mr-1" />
          Ver Detalhes
        </button>

        <div className="flex items-center space-x-2">
          {/* Bloco revertido para a lógica original */}
          {(campaign.status === "Completed" || campaign.status === "Draft") && (
            <button
              className="text-accent/60 text-sm font-medium hover:text-primary transition-colors duration-200 ml-2"
              onClick={() =>
                navigate("/campaigns/new", {
                  state: { reuseCampaign: reuseCampaign || campaign },
                })
              }
            >
              Reutilizar
            </button>
          )}

          <div className="flex items-center border-l border-secondary-dark pl-2 space-x-1">
            {(campaign.status === "Draft" ||
              campaign.status === "Scheduled") && (
              <button
                className="p-2 rounded-md hover:bg-secondary-dark/50 text-accent/60 hover:text-primary transition-colors"
                title="Editar"
                onClick={() =>
                  navigate("/campaigns/new", {
                    state: { reuseCampaign: reuseCampaign || campaign },
                  })
                }
              >
                <Edit size={16} />
              </button>
            )}

            <button
              className="p-2 rounded-md hover:bg-secondary-dark/50 text-red-500/80 hover:text-red-500 transition-colors"
              title="Excluir"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <CampaignDetailsModal
        campaignId={campaign.id}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </div>
  );
};

export default CampaignCard;
