import { API_BASE_URL } from "../config/api";

export const resolveProofUrl = (proofValue) => {
  if (!proofValue) return "";

  const proofString = String(proofValue);
  if (/^https?:\/\//i.test(proofString)) {
    return proofString;
  }

  return `${API_BASE_URL}/uploads/${proofString}`;
};