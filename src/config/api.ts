const VITE_API_URL = import.meta.env.VITE_API_URL;

export const AUTH_URL = `${VITE_API_URL}/auth`;

export const API_URL = `${VITE_API_URL}/api`;

console.log("API_URL from .env:", API_URL);
console.log("AUTH_URL from .env:", AUTH_URL);

export const API_ENDPOINTS = {
  auth: {
    login: `${AUTH_URL}/login`,
    signup: `${AUTH_URL}/register`,
    logout: `${AUTH_URL}/logout`,
    me: `${AUTH_URL}/me`,
  },

  dashboard: {
    stats: `/dashboard/stats`,
  },
  whatsapp: {
    connect: `/whatsapp/connect`,
    keepAlive: `/baileys/keep-alive`,
    devices: `/whatsapp/devices`,
    status: (deviceId: string) => `/whatsapp/status/${deviceId}`,
    send: `/whatsapp/send`,
    qr: (deviceId: string) => `/whatsapp/qr/${deviceId}`,
    deleteSession: (deviceId: string) => `/whatsapp/session/${deviceId}`,
    deleteAuth: (deviceId: string) => `/whatsapp/devices/${deviceId}/auth`,
  },
  campaigns: {
    list: `/campaigns`,
    withStats: `/campaigns/with-stats`,
    sends: (id: number) => `/campaigns/${id}/sends`,
    create: `/campaigns`,
    update: (id: number) => `/campaigns/${id}`,
    delete: (id: number) => `/campaigns/${id}`,
  },
  contacts: {
    list: `/contacts`,
    create: `/contacts`,
    update: (id: string) => `/contacts/${id}`,
    delete: (id: string) => `/contacts/${id}`,
  },
  chatbots: {
    create: `/chatbots`,
    list: `/chatbots`,
    toggle: (phoneNumber: string) => `/chatbots/${phoneNumber}/toggle`,
    remove: (phoneNumber: string) => `/chatbots/${phoneNumber}`,
  },
  mistral: {
    agents: `/mistral/agents`,
    createAgent: `/mistral/agents`,
    models: `/mistral/models`,
  },
  debug: {
    autoCleanup: `/debug/auto-cleanup`,
    caches: `/debug/caches`,
  },
  scheduledMessages: {
    process: `/processScheduledMessages`,
  },
  health: `/health`,
};
