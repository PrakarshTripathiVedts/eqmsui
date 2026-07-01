
import axios from 'axios';
import config from "../environment/config";
import { authHeader } from './auth.header';
const API_URL = config.API_URL;

export const saveComponentData = async (data) => {
  try {
    
    const response = await axios.post(`${API_URL}api/component`, data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader()
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error saving calibration data:", error);
    throw error;
  }
}


export const UpdateComponentData = async (id, Data) => {
  try {
    const response = await axios.put(`${API_URL}api/component/${id}`, Data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating calibration:", error);
    throw error;
  }
}

export const getComponentList = async () => {
  try {
    const response = await axios.get(`${API_URL}api/component`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching calibration by ID:", error);
    throw error;
  }
}


export const getComponentId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/component/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching component id:", error);
    throw error;
  }
}


export const getComponentMasterListById = async (componentid) => {
  try {
    const response = await axios.get(`${API_URL}api/componentdetails/list/${componentid}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching calibration by ID:", error);
    throw error;
  }
}


export const saveComponentDetailsData = async (data) => {

  console.log("data************",data);
  try {
    
    const response = await axios.post(`${API_URL}api/componentdetails`, data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader()
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error saving component details data:", error);
    throw error;
  }
}


export const getComponentDetailsId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/componentdetails/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching component details id:", error);
    throw error;
  }
}


export const UpdateComponentDetailsData = async (id, Data) => {
  try {
    const response = await axios.put(`${API_URL}api/componentdetails/${id}`, Data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating component details:", error);
    throw error;
  }
}


export const saveComponentIssuedData = async (data) => {
  try {
    
    const response = await axios.post(`${API_URL}api/component/component-issued`, data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader()
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error saving Component Issued:", error);
    throw error;
  }
}

export const getComponentIssuedListByComponent = async (componentId) => {
  try {
    const response = await axios.get(`${API_URL}api/component/component-issued-component-id/${componentId}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching component Issued Date by Component ID:", error);
    throw error;
  }
}

export const saveComponentReturnedData = async (data) => {
  try {
    
    const response = await axios.post(`${API_URL}api/component/component-returned`, data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader()
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error saving Component Returned:", error);
    throw error;
  }
}