const environment = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE;
const productionUrl = import.meta.env.VITE_BACKEND_URL;

const API_BASE_URL =
  environment === "production" && productionUrl
    ? productionUrl
    : "http://localhost:5000";

export { API_BASE_URL };
