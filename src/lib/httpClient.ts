import axios, { AxiosHeaders, AxiosRequestConfig } from 'axios';

type SetupOptions = {
  getToken: () => string | null;
  onUnauthorized?: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const isBrowser = typeof window !== 'undefined';
const RELATIVE_API_PREFIXES = [
  '/api',
  '/auth',
  '/campaigns',
  '/contacts',
  '/whatsapp',
  '/chatbots',
  '/debug',
  '/mistral',
  '/processScheduledMessages',
  '/health'
];

let tokenGetter: () => string | null = () => null;
let unauthorizedHandler: () => void = () => {};
let fetchConfigured = false;
let axiosConfigured = false;

const matchesRelativeApiPath = (pathname: string) =>
  RELATIVE_API_PREFIXES.some(prefix => pathname.startsWith(prefix));

const shouldAttachAuth = (url: string): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url, isBrowser ? window.location.origin : 'http://localhost');

    if (API_BASE_URL) {
      const base = new URL(API_BASE_URL);
      if (parsedUrl.origin === base.origin && parsedUrl.href.startsWith(base.href)) {
        return true;
      }
    }

    if (isBrowser && parsedUrl.origin === window.location.origin) {
      return matchesRelativeApiPath(parsedUrl.pathname);
    }

    return false;
  } catch {
    return matchesRelativeApiPath(url);
  }
};

const configureFetch = () => {
  if (fetchConfigured || !isBrowser || typeof window.fetch !== 'function') {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let request: Request;
    if (input instanceof Request) {
      request = init ? new Request(input, init) : input;
    } else {
      request = new Request(input, init);
    }

    let finalRequest = request;
    const token = tokenGetter();

    if (token && shouldAttachAuth(request.url)) {
      const headers = new Headers(request.headers);
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
        finalRequest = new Request(request, { headers });
      }
    }

    const response = await originalFetch(finalRequest);
    if ((response.status === 401 || response.status === 403) && shouldAttachAuth(request.url)) {
      unauthorizedHandler();
    }

    return response;
  };

  fetchConfigured = true;
};

const buildFullUrl = (config: AxiosRequestConfig): string => {
  const url = config.url || '';

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (config.baseURL) {
    try {
      return new URL(url, config.baseURL).href;
    } catch {
      return `${config.baseURL}${url}`;
    }
  }

  if (isBrowser && url.startsWith('/')) {
    return new URL(url, window.location.origin).href;
  }

  return url;
};

const configureAxios = () => {
  if (axiosConfigured) {
    return;
  }

  axios.interceptors.request.use(config => {
    const token = tokenGetter();
    const fullUrl = buildFullUrl(config);

    if (token && shouldAttachAuth(fullUrl)) {
      const headers =
        config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers ?? {});

      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      config.headers = headers;
    }

    return config;
  });

  axios.interceptors.response.use(
    response => response,
    error => {
      const status = error?.response?.status;
      const requestConfig = error?.response?.config as AxiosRequestConfig | undefined;

      if (status && requestConfig) {
        const fullUrl = buildFullUrl(requestConfig);
        if ((status === 401 || status === 403) && shouldAttachAuth(fullUrl)) {
          unauthorizedHandler();
        }
      }

      return Promise.reject(error);
    }
  );

  axiosConfigured = true;
};

export const setupHttpClients = (options: SetupOptions) => {
  tokenGetter = options.getToken;
  unauthorizedHandler = options.onUnauthorized ?? (() => {});

  configureFetch();
  configureAxios();
};
