import { API_ENDPOINTS } from "@/config/api";
import apiClient from "@/lib/api.client";
import React, { useEffect, useRef, useState } from "react";

interface OverviewChartProps {
  campaignId?: number | null;
  instanceName?: string;
}

const OverviewChart: React.FC<OverviewChartProps> = ({
  campaignId,
  instanceName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: "Mensagens Enviadas",
        data: [] as number[],
        color: "#FFD700",
      },
      {
        label: "Mensagens Entregues",
        data: [] as number[],
        color: "#FFE44D",
      },
    ],
  });
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.dashboard.stats, {
          params: { campaignId, instanceName },
        });
        if (response.data && response.data.chartData) {
          setChartData(response.data.chartData);
        } else {
          console.warn("Dados do gráfico não encontrados na resposta da API.");
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchChartData();
  }, [campaignId, instanceName]);
  useEffect(() => {
    if (!canvasRef.current || !chartData.labels.length) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const graphHeight = height - padding * 2;
    const xStep = (width - padding * 2) / (chartData.labels.length - 1 || 1);
    const maxValue = Math.max(10, ...chartData.datasets.flatMap((d) => d.data)); 

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    chartData.labels.forEach((label, i) => {
      ctx.fillText(label, padding + i * xStep, height - padding + 20);
    });

    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - i * (graphHeight / 5);
      const value = Math.round((maxValue / 5) * i);
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }

    chartData.datasets.forEach((dataset) => {
      ctx.beginPath();
      ctx.strokeStyle = dataset.color;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";

      dataset.data.forEach((value, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (value / maxValue) * graphHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });
  }, [chartData]);

  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-end">
      <canvas ref={canvasRef} className="w-full h-[360px]"></canvas>
      <div className="flex items-center justify-center mt-4 gap-4">
        {chartData.datasets.map((dataset) => (
          <span key={dataset.label} className="flex items-center">
            <span
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ background: dataset.color }}
            ></span>
            <span className="text-accent/80 text-sm font-medium">
              {dataset.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default OverviewChart;
