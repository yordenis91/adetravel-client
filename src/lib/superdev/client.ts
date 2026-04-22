import { createSuperdevClient } from "@superdevhq/client";

const superdevEnabled = import.meta.env.VITE_SUPERDEV_ENABLED === "true";

const disabledSuperdevClient = {
  auth: {
    logout: () => {
      console.warn("Superdev auth.logout() called while Superdev is disabled.");
    },
  },
  options: {
    showBranding: false,
    affiliateId: "",
  },
  integrations: {
    core: {
      uploadFile: async () => {
        throw new Error("Superdev is disabled locally.");
      },
      invokeLLM: async () => {
        throw new Error("Superdev is disabled locally.");
      },
      generateImage: async () => {
        throw new Error("Superdev is disabled locally.");
      },
      getUploadedFile: async () => {
        throw new Error("Superdev is disabled locally.");
      },
      sendEmail: async () => {
        throw new Error("Superdev is disabled locally.");
      },
      extractDataFromUploadedFile: async () => {
        throw new Error("Superdev is disabled locally.");
      },
    },
  },
  entity: () => ({
    list: async () => [],
    create: async () => {
      throw new Error("Superdev is disabled locally.");
    },
    update: async () => {
      throw new Error("Superdev is disabled locally.");
    },
    delete: async () => {
      throw new Error("Superdev is disabled locally.");
    },
  }),
} as any;

export const superdevClient = superdevEnabled
  ? createSuperdevClient({
      appId: import.meta.env.VITE_APP_ID,
      requiresAuth: false,
      showBranding: true,
      affiliateId: '',
      baseUrl: import.meta.env.VITE_SUPERDEV_BASE_URL,
      loginUrl: `${import.meta.env.VITE_SUPERDEV_BASE_URL}/auth/app-login?app_id=${
        import.meta.env.VITE_APP_ID
      }`,
    })
  : disabledSuperdevClient;
