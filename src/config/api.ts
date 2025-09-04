export const API_URL = import.meta.env.VITE_API_URL;

console.log("API_URL from .env:", API_URL);

export const API_ENDPOINTS = {
  auth: {
    login: `/auth/login`,
    signup: `/auth/register`,
    logout: `/auth/logout`,
    me: `/auth/me`,
  },

  dashboard: {
    stats: `/api/dashboard/stats`,
  },
  whatsapp: {
    connect: `/api/whatsapp/connect`,
    keepAlive: `/api/baileys/keep-alive`,
    devices: `/api/whatsapp/devices`,
    status: (deviceId: string) => `/api/whatsapp/status/${deviceId}`,
    send: `/api/whatsapp/send`,
    qr: (deviceId: string) => `/api/whatsapp/qr/${deviceId}`,
    deleteSession: (deviceId: string) => `/api/whatsapp/session/${deviceId}`,
    deleteAuth: (deviceId: string) => `/api/whatsapp/devices/${deviceId}/auth`,
  },
  campaigns: {
    list: `/api/campaigns`,
    withStats: `/api/campaigns/with-stats`,
    sends: (id: number) => `/api/campaigns/${id}/sends`,
    create: `/api/campaigns`,
    update: (id: number) => `/api/campaigns/${id}`,
    delete: (id: number) => `/api/campaigns/${id}`,
    stop: (id: number) => `/api/campaigns/${id}/stop`,
  },
  contacts: {
    list: `/api/contacts`,
    create: `/api/contacts`,
    append: (id: string) => `/api/contacts/${id}/append`,
    update: (id: string) => `/api/contacts/${id}`,
    delete: (id: string) => `/api/contacts/${id}`,
    edit: (id: number) => `api/contacts/${id}`,
  },
  upload: {
    image: `/api/upload/image`,
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
