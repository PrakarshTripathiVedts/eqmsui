import axios from 'axios';
import config from "../environment/config";
import { authHeader } from './auth.header';

const API_URL = config.API_URL;

export const syncSSRItemsToLocal = async (divisionId) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/sync-ssr-items`, { params: { divisionId }, headers: { ...authHeader(), }, });
        return response;
    } catch (error) {
        console.error("Error syncing SSR items:", error);
        throw error;
    }
};

export const getLocalSSRItems = async (divisionId) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/local-ssr-items`, { params: { divisionId }, headers: { ...authHeader(), }, });
        return response.data;
    } catch (error) {
        console.error("Error fetching local SSR items:", error);
        throw error;
    }
};

export const getImportedSSRItemsByDivision = async (divisionId) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/imported-ssr-items`, { params: { divisionId }, headers: { ...authHeader(), }, });
        return response.data;
    } catch (error) {
        console.error("Error fetching imported SSR items:", error);
        throw error;
    }
};

export const importSSRItemToMain = async (payload) => {
    try {
        const response = await axios.post(`${API_URL}api/inventory/import-ssr-item`, payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...authHeader(),
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error Importing SSR Item:", error);
        throw error;
    }
};

export const deleteSSRItemfromSatge = async (ledgerPageCrvId) => {
    try {
        const response = await axios.delete(`${API_URL}api/inventory/delete-ssr-item`, {
            params: { ledgerPageCrvId },
            headers: { ...authHeader() }
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting SSR Item:", error);
        throw error;
    }
};

export const syncPwSSRItemsToLocal = async (divisionId, ledgerId) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/sync-pw-ssr-items`, { params: { divisionId, ledgerId }, headers: { ...authHeader(), }, });
        return response;
    } catch (error) {
        console.error("Error syncing project wise SSR items:", error);
        throw error;
    }
};

export const getLocalPwSSRItems = async (divisionId, ledgerId) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/local-pw-ssr-items`, { params: { divisionId, ledgerId }, headers: { ...authHeader(), }, });
        return response.data;
    } catch (error) {
        console.error("Error fetching local project wise SSR items:", error);
        throw error;
    }
};

export const importPwSSRItemToMain = async (payload) => {
    try {
        const response = await axios.post(`${API_URL}api/inventory/import-pw-ssr-item`, payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...authHeader(),
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error Importing Project Wise SSR Item:", error);
        throw error;
    }
};

export const getImportedPwSSRItemsByDivision = async (ledgerId, pageType) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/imported-pw-ssr-items`, { params: { ledgerId, pageType }, headers: { ...authHeader(), }, });
        return response.data;
    } catch (error) {
        console.error("Error fetching imported project wise SSR items:", error);
        throw error;
    }
};

export const getDivisionBasedLedger = async (divisionId) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/div-wise-ledger`, { params: { divisionId }, headers: { ...authHeader(), }, });
        return response.data;
    } catch (error) {
        console.error("Error fetching division-based ledger from SIS:", error);
        throw error;
    }
};

export const getImportedUniqueLedgers = async (divisionId) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/unique-ledgers`, { headers: { ...authHeader(), }, });
        return response.data;
    } catch (error) {
        console.error("Error fetching imported unique ledgers:", error);
        throw error;
    }
};

export const deletePwSSRItemfromSatge = async (ledgerPageCrvId) => {
    try {
        const response = await axios.delete(`${API_URL}api/inventory/delete-pw-ssr-item`, {
            params: { ledgerPageCrvId },
            headers: { ...authHeader() }
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting SSR Item:", error);
        throw error;
    }
};

export const addingToCondemantion = async (payload) => {
    try {
        const response = await axios.post(`${API_URL}api/inventory/add-condemnation`, payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...authHeader(),
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error in marking condemnation item:", error);
        throw error;
    }
};


export const getCondemnationList = async (divisionId) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/get-condemnations`, { params: { divisionId }, headers: { ...authHeader(), }, });
        return response.data;
    } catch (error) {
        console.error("Error fetching condemnation list:", error);
        throw error;
    }
};

export const getStockVerificationData = async (rateCosting, ledgerId) => {
    try {
        const response = await axios.get(`${API_URL}api/inventory/stock-data`, { params: { rateCosting, ledgerId }, headers: { ...authHeader(), }, });
        return response.data;
    } catch (error) {
        console.error("Error fetching stock verification data:", error);
        throw error;
    }
};