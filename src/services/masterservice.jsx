import axios from 'axios';
import config from "../environment/config";
import { authHeader } from './auth.header';

const API_URL = config.API_URL;

export const getEquipmentListService = async () => {
  try {
    const response = await axios.get(`${API_URL}api/equipment`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching equipment list:", error);
    throw error;
  }
}

export const saveEquipmentData = async (data) => {
  try {
    
    const response = await axios.post(`${API_URL}api/equipment`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeader()
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error saving equipment data:", error);
    throw error;
  }
}



export const UpdateEquipment = async (id,values) => {
  try {
    const response = await axios.put(`${API_URL}api/equipment/${id}`, values, {
      headers: {
         'Content-Type': 'multipart/form-data',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating equipment partially:", error);
    throw error;
  }
}

export const getEquipmentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/equipment/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching equipment by ID:", error);
    throw error;
  }
}

export const getEquipmentLogListService = async () => {
  try {
    const response = await axios.get(`${API_URL}api/equipment-usage-logs`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching equipment log list:", error);
    throw error;
  }
}

export const saveEquipmentLogData = async (data) => {
  try {
    const response = await axios.post(`${API_URL}api/equipment-usage-logs`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error saving equipment log data:", error);
    throw error;
  }
}

export const getEquipmentLogById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/equipment-usage-logs/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching equipment log by ID:", error);
    throw error;
  }
}



export const UpdateEquipmentLog = async (id, Data) => {
  try {
    const response = await axios.put(`${API_URL}api/equipment-usage-logs/${id}`, Data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating equipment log:", error);
    throw error;
  }
}


export const getModelListService = async () => {
  try {
    const response = await axios.get(`${API_URL}api/models`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching model list:", error);
    throw error;
  }
}

export const getModelById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/models/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching model by ID:", error);
    throw error;
  }
}

export const saveModelData = async (data) => {
  try {
    const response = await axios.post(`${API_URL}api/models`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error saving model data:", error);
    throw error;
  }
}

export const partialUpdateModel = async (id, partialData) => {
  try {
    const response = await axios.patch(`${API_URL}api/models/${id}`, partialData, {
      headers: {
        "Content-Type": "application/merge-patch+json",
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating model partially:", error);
    throw error;
  }
}

export const getMakeListService = async () => {
  try {
    const response = await axios.get(`${API_URL}api/makes`,
      {
        headers: authHeader(),
      });
    return response.data;
  } catch (error) {
    console.error("Error fetching make list:", error);
    throw error;
  }
}


export const getEmployeeListService = async () => {
  try {
    const response = await axios.get(`${API_URL}api/master/employee`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching model by ID:", error);
    throw error;
  }
}


export const getProjectListService = async () => {
  try {
    const response = await axios.get(`${API_URL}api/master/project`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching model by ID:", error);
    throw error;
  }
}

export const getMakeById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/makes/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching make by ID:", error);
    throw error;
  }
}

export const saveMakeData = async (data) => {
  try {
    const response = await axios.post(`${API_URL}api/makes`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error saving make data:", error);
    throw error;
  }
}

export const partialUpdateMake = async (id, partialData) => {
  try {
    const response = await axios.patch(`${API_URL}api/makes/${id}`, partialData, {
      headers: {
        "Content-Type": "application/merge-patch+json",
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating make partially:", error);
    throw error;
  }
}


export const FileDownload = async (equipmentId,type) => {
  try {
    const response = await axios.get(
      `${API_URL}api/equipment/${equipmentId}/${type}`,
      {
        headers: authHeader(),
        responseType: "blob"
      }
    );

    const contentDisposition = response.headers["content-disposition"];
    let fileName = "downloaded_file";

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) {
        fileName = match[1];
      }
    }

    return {
      data: response.data,
      fileName,
      contentType: response.headers["content-type"]
    };
  } catch (error) {
    return { data: '0' };
  }
};

export const getEquipmentLogMasterListById = async (equipmentid,fromDate,toDate) => {
  try {
    const response = await axios.get(`${API_URL}api/equipment-usage-logs/${equipmentid}/${fromDate}/${toDate}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching equipment log by ID:", error);
    throw error;
  }
}


export const saveCalibrationData = async (data) => {
  try {
    
    const response = await axios.post(`${API_URL}api/calibration`, data, {
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


export const UpdateCalibration = async (id, Data) => {
  try {
    const response = await axios.put(`${API_URL}api/calibration/${id}`, Data, {
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


export const getCalibrationId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/calibration/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching calibration id:", error);
    throw error;
  }
}


export const getCalibrationMasterListById = async (equipmentid) => {
  try {
    const response = await axios.get(`${API_URL}api/calibration/list/${equipmentid}`, {
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


export const getAmcMasterListById = async (equipmentid) => {
  try {
    const response = await axios.get(`${API_URL}api/amc/list/${equipmentid}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching AMC by ID:", error);
    throw error;
  }
}


export const saveAmcData = async (data) => {
  try {
    
    const response = await axios.post(`${API_URL}api/amc`, data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader()
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error saving AMC data:", error);
    throw error;
  }
}


export const UpdateAmc = async (id, Data) => {
  try {
    const response = await axios.put(`${API_URL}api/amc/${id}`, Data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating AMC:", error);
    throw error;
  }
}

export const getAmcById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/amc/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching AMC id:", error);
    throw error;
  }
}

export const getVendorListService = async () => {
  try {
    const response = await axios.get(`${API_URL}api/master/vendor`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching vendor list:", error);
    throw error;
  }
}

export const saveProjectService = async (data) => {
  try {
    const response = await axios.post(`${API_URL}api/master/project`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error saving Project data:", error);
    throw error;
  }
}

export const getProjectByIdService = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/master/project/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Project by ID:", error);
    throw error;
  }
}



export const updateProjectService = async (id, Data) => {
  try {
    const response = await axios.put(`${API_URL}api/master/project`, Data, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating Project :", error);
    throw error;
  }
};


export const getItemUnitList = async () => {
  try {
    const response = await axios.get(`${API_URL}api/master/itemUnit`, {
      headers: authHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching item Unit list:", error);
    throw error;
  }
}

export const downloadUserManual = async (docType) => {
  try {
    const response = await axios.get(`${API_URL}api/master/download-user-manual/${docType}`, {
      headers: authHeader(),
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"];
    let fileName = docType;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) {
        fileName = match[1];
      }
    }

    return {
      data: response.data,
      fileName,
      contentType: response.headers["content-type"]
    };
  } catch (error) {
    return { data: '0' };
  }
};


export const resetUserPassword = async (loginId) => {
  try {
    const response = await axios.put(`${API_URL}api/master/user-manager/${loginId}/reset-password`, {}, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating Project :", error);
    throw error;
  }
};