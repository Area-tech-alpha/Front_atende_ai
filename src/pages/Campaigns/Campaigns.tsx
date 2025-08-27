import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, ChevronDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CampaignCard from "./components/CampaignCard";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api.client";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "react-toastify";

type CampaignStatus = "Concluída" | "Em Andamento" | "Agendada" | "Rascunho" | "Não concluida" | "Concluída com erros";

export interface Campaign {
  id: number;
  name: string;
  description: string;
  status: CampaignStatus;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  errorCount: number;
  date: string;
  template: string;
  nome_da_instancia: string;
  texto: string;
  imagem: string | null;
  data_de_envio: string | null;
  contatos: number;
}

const Campaigns = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDeleteCampaign = (deletedCampaignId: number) => {
    setCampaigns((currentCampaigns) => currentCampaigns.filter((campaign) => campaign.id !== deletedCampaignId));
  };

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      if (!user) return;

      const response = await apiClient.get(API_ENDPOINTS.campaigns.withStats);

      setCampaigns(response.data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Falha ao carregar as campanhas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [fetchCampaigns, user]);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || campaign.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Campanhas
        </h1>
        <button
          onClick={() => navigate("/campaigns/new")}
          className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center">
          <Plus size={16} />
          <span>Nova Campanha</span>
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-accent/40" />
            </div>
            <input
              type="text"
              placeholder="Buscar campanhas..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex space-x-4">
            <div className="relative">
              <div className="flex items-center border-2 border-secondary-dark rounded-lg bg-secondary">
                <div className="px-3 py-2 flex items-center gap-2">
                  <Filter size={16} className="text-accent/40" />
                  <span className="text-sm text-accent">Status:</span>
                </div>
                <select
                  className="appearance-none bg-transparent pr-8 py-2 w-40 focus:outline-none text-sm text-accent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">Todos</option>
                  <option value="Rascunho">Rascunho</option>
                  <option value="Agendada">Agendada</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Falhou">Falhou</option>
                  <option value="Concluída com erros">Concluída com erros</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <ChevronDown size={16} className="text-accent/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign} // Passa o objeto inteiro, que já está no formato correto
              onDelete={handleDeleteCampaign}
            />
          ))
        ) : (
          <div className="col-span-full card py-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Search size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-display font-bold text-accent mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-accent/60 mb-6">Tente ajustar sua busca ou crie sua primeira campanha.</p>
            <button onClick={() => navigate("/campaigns/new")} className="btn-primary">
              Criar Nova Campanha
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;
