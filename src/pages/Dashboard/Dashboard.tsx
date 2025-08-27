import React, { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, MessageCircle, Users, Clock, RefreshCw, Loader2 } from "lucide-react";
import StatCard from "./components/StatCard";
import CampaignTable from "./components/CampaignTable";
import OverviewChart from "./components/OverviewChart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import apiClient from "@/lib/api.client";
import { API_ENDPOINTS } from "@/config/api";

type CampaignStatus = "Concluída" | "Agendada" | "Em Andamento" | "Rascunho";

interface DashboardStats {
  totalMessages: number;
  totalContacts: number;
  deliveryRate: number;
  avgResponseTime: number;
  messageChange: number;
  contactChange: number;
  deliveryChange: number;
  responseChange: number;
}

interface Campaign {
  id: number;
  name: string;
  status: CampaignStatus;
  messages: number;
  delivered: number;
  deliveryRate: number;
  date: string;
  nome_da_instancia?: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      if (!user) return;

      const response = await apiClient.get(API_ENDPOINTS.dashboard.stats, {
        params: { campaignId: selectedCampaign },
      });

      const { stats: apiStats, recentCampaigns: apiCampaigns } = response.data;

      const mappedStats = {
        ...apiStats,
        avgResponseTime: apiStats.avgSendInterval || 0,
      };

      setStats(mappedStats);
      setRecentCampaigns(apiCampaigns || []);

      if (!selectedCampaign) {
        setAllCampaigns(apiCampaigns || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Não foi possível carregar os dados do painel.");
    } finally {
      setLoading(false);
    }
  }, [user, selectedCampaign]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const campaignId = e.target.value ? Number(e.target.value) : null;
    setSelectedCampaign(campaignId);
  };

  const statCards = stats
    ? [
        {
          title: "Mensagens Enviadas",
          value: stats.totalMessages.toLocaleString(),
          change: `${stats.messageChange >= 0 ? "+" : ""}${stats.messageChange.toFixed(1)}%`,
          isIncrease: stats.messageChange >= 0,
          icon: <MessageCircle className="text-primary" size={20} />,
          iconBg: "bg-primary/10",
        },
        {
          title: "Contatos Totais",
          value: stats.totalContacts.toLocaleString(),
          change: `${stats.contactChange >= 0 ? "+" : ""}${stats.contactChange.toFixed(1)}%`,
          isIncrease: stats.contactChange >= 0,
          icon: <Users className="text-primary" size={20} />,
          iconBg: "bg-primary/10",
        },
        {
          title: "Taxa de Entrega",
          value: `${stats.deliveryRate.toFixed(1)}%`,
          change: `${stats.deliveryChange >= 0 ? "+" : ""}${stats.deliveryChange.toFixed(1)}%`,
          isIncrease: stats.deliveryChange >= 0,
          icon: <ArrowUpRight className="text-primary" size={20} />,
          iconBg: "bg-primary/10",
        },
        {
          title: "Intervalo Médio",
          value: `${stats.avgResponseTime.toFixed(1)} min`,
          change: `${stats.responseChange >= 0 ? "+" : ""}${stats.responseChange.toFixed(1)}%`,
          isIncrease: stats.responseChange < 0,
          icon: <Clock className="text-primary" size={20} />,
          iconBg: "bg-primary/10",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent">Painel de Controle</h1>
        <div className="flex items-center space-x-4">
          <select value={selectedCampaign || ""} onChange={handleCampaignChange} className="input w-full md:w-auto">
            <option value="">Todas as Campanhas</option>
            {allCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <button onClick={() => fetchDashboardData()} className="btn-secondary flex items-center space-x-2">
            <RefreshCw size={16} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold text-accent mb-6">Atividade de Mensagens</h2>
          <OverviewChart campaignId={selectedCampaign} />
        </div>
        <div className="card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-bold text-accent mb-6">Status das Campanhas</h2>
          <div className="space-y-5">
            {["Concluída", "Em Andamento", "Agendada", "Rascunho"].map((status) => {
              const count = recentCampaigns.filter((c) => c.status === status).length;
              const percentage = recentCampaigns.length > 0 ? (count / recentCampaigns.length) * 100 : 0;

              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1 text-text-secondary">
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div className="w-full bg-secondary-darker rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-accent mb-6">Campanhas Recentes</h2>
        <CampaignTable campaigns={recentCampaigns} />
      </div>
    </div>
  );
};

export default Dashboard;
