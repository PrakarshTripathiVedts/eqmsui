import axios from 'axios';
import config from "../environment/config";
import { authHeader } from './auth.header';
const API_URL = config.API_URL;


export const saveGatepass = async (data) => {
  try {
    
    const response = await axios.post(`${API_URL}api/gatepass`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeader()
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error saving Gatepass data:", error);
    throw error;
  }
}


export const UpdateGatepassData = async (id, Data) => {
  try {
    const response = await axios.put(`${API_URL}api/gatepass/${id}`, Data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating Gatepass:", error);
    throw error;
  }
}

export const getGatepassList = async () => {
  try {
    const response = await axios.get(`${API_URL}api/gatepass`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching gatepass List:", error);
    throw error;
  }
}

export const getGatepassById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/gatepass/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching gatepass Details id:", error);
    throw error;
  }
}


export const downloadGatepassFile = async (gatepassId) => {
  const response = await axios.get(`${API_URL}api/gatepass/${gatepassId}/attachment`, {
    headers: authHeader(),
    responseType: "blob",
  });
 
  const contentType   = response.headers["content-type"] ?? "application/octet-stream";
  const disposition   = response.headers["content-disposition"] ?? "";
  const filenameMatch = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)["']?/);
  const filename      = filenameMatch ? filenameMatch[1].trim() : "attachment";
 
  return { blob: response.data, filename, contentType };
};

export const getGatepassInHistory = async (id) => {
 try {
    const response = await axios.get(`${API_URL}api/gatepass/${id}/in-history`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching gatepass Details id:", error);
    throw error;
  }
}

export const submitGatepassInAction = async (id, data, file) => {
  try {
    const formData = new FormData();
  
  // Package DTO as a Blob with application/json type
  formData.append(
    "data",
    new Blob([JSON.stringify(data)], { type: "application/json" })
  );
  
  if (file) {
    formData.append("file", file);
  }
    const response = await axios.post(`${API_URL}api/gatepass/${id}/in-action`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeader()
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error saving Gatepass data:", error);
    throw error;
  }
}

export const updateGatepassInRemarks = async (id, Data) => {
  try {
    const response = await axios.put(`${API_URL}api/gatepass/gatepass-in/${id}`, Data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating gatepass In:", error);
    throw error;
  }
}

export const checkGatepassNoExists = async (gatepassNo) => {
  try {
    const response = await axios.get(`${API_URL}api/gatepass/exists?gatepassNo=${encodeURIComponent(gatepassNo)}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching gatepass Details id:", error);
    throw error;
  }
}

export const downloadGatepassInFile = async (gatepassId) => {
  const response = await axios.get(`${API_URL}api/gatepass/gatepass-in/${gatepassId}/attachment`, {
    headers: authHeader(),
    responseType: "blob",
  });
 
  const contentType   = response.headers["content-type"] ?? "application/octet-stream";
  const disposition   = response.headers["content-disposition"] ?? "";
  const filenameMatch = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)["']?/);
  const filename      = filenameMatch ? filenameMatch[1].trim() : "attachment";
 
  return { blob: response.data, filename, contentType };
};