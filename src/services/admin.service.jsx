import axios from 'axios';
import config from "../environment/config";
import { authHeader } from './auth.header';
import { customAuditStampingLogout } from './auth.service';
const API_URL = config.API_URL;


export const authenticationDetails = async (loginData) => {
  try {
    return await axios.post(
      `${API_URL}authenticate`,
      JSON.stringify(loginData),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error occurred in authenticationDetails:', error);
    throw error;
  }
};

export const logout = async (logoutType) => {
  const user = getCurrentUser();
  const keysToRemove = [
    'user', 'empId', 'loginId', 'empName', 'role'
  ];
  sessionStorage.removeItem("hasShownCalibrationModal");
  if (user && user.username) {
    try {
      customAuditStampingLogout(user.username, logoutType);
      keysToRemove.forEach(key => localStorage.removeItem(key));

    } catch (error) {
      console.error('Error occurred in logout:', error);
      throw error;
    }
  } else {
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

export const getUserManagerList = async () => {
  try {
    const response = await axios.get(`${API_URL}api/master/get-user-manager-list`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user manager list:", error);
    throw error;
  }
}


export const getAuditStampingList = async (selUser, fromDate,toDate) => {
  try {
    const response = await axios.get(`${API_URL}api/master/audit-stamping-list`,{ params: {selUser,fromDate,toDate }, headers: authHeader() });
    return response.data;
  } catch (error) {
    console.error("Error fetching audit stamping list:", error);
    throw error;
  }
}

export const getFormModuleList = async () => {
  try {
    const response = await axios.get(`${API_URL}api/master/form-modules`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching form module list:", error);
    throw error;
  }
}


export const getFormDetailsList = async (roleId) => {
  try {
    const response = await axios.get(`${API_URL}api/master/form-details`, { params: { roleId }, headers: authHeader() });
    return response.data;
  } catch (error) {
    console.error("Error fetching form details list:", error);
    throw error;
  }
}

export const getDesignationListService = async () => {
  try {
    const response = await axios.get(`${API_URL}api/master/designations`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching designation list:", error);
    throw error;
  }
}


export const getDivisionListService = async () => {
  try {
    const response = await axios.get(`${API_URL}api/master/divisions`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching division list:", error);
    throw error;
  }
}

export const getEmployeeByIdService = async (employeeId) => {
  try {
    const response = await axios.get(`${API_URL}api/master/employee/${employeeId}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching employee id:", error);
    throw error;
  }
}

export const saveEmployeeService = async (data) => {
  try {
    
    const response = await axios.post(`${API_URL}api/master/employee/save`, data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader()
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error saving employee data:", error);
    throw error;
  }
}


export const updateEmployeeService = async (id, Data) => {
  try {
    const response = await axios.put(`${API_URL}api/master/employee/update/${id}`, Data, {
      headers: {
         'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating employee:", error);
    throw error;
  }
}

export const getRolesList = async () => {
  try {
    const response = await axios.get(`${API_URL}api/master/roles`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching roles list:", error);
    throw error;
  }
}

export const getFormRoleAccessList = async (roleId, formDetailId) => {
  try {
    const payload = { roleId, formDetailId };
    return (await axios.get(`${API_URL}api/master/role-access`, { params: payload, headers: { 'Content-Type': 'application/json', ...authHeader() } })).data;
  } catch (error) {
    console.error("Error fetching form role access list:", error);
    return null;
  }
}


export const updateFormRoleAccess = async (formRoleAccessId, isActive, forView, forAdd, forEdit, forDelete, formDetailsId, roleId) => {
  try {
    const values = {
      formRoleAccessId: formRoleAccessId,
      isActive: isActive,
      forView: forView,
      forAdd: forAdd,
      forEdit: forEdit,
      forDelete: forDelete,
      formDetailId: formDetailsId,
      roleId: roleId
    };
    const response = await axios.post(
      `${API_URL}api/master/eqms-form-role-accesses`,
      values,
      { headers: { 'Content-Type': 'application/json', ...authHeader() } }
    );
    return response.data;
  } catch (error) {
    console.error('Error occurred in updateFormRoleAccess:', error);
    throw error;
  }
};


export const changePassWord = async (data) => {
  try {
    const res = await axios.put( `${API_URL}api/master/change-password`, data,   {
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      }
    );
    return res; 
  } catch (error) {
    return error.response; 
  }
};

export const saveUserService = async (data) => {
  try {
    const response = await axios.post(`${API_URL}api/master/user-manager`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error saving UserManager data:", error);
    throw error;
  }
}

export const getUserByIdService = async (id) => {
  try {
    const response = await axios.get(`${API_URL}api/master/user-manager/${id}`, {
      headers: {
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching User by ID:", error);
    throw error;
  }
}



export const updateUserService = async (Data) => { // 💡 Removed 'id' parameter since the backend gets it from the body
  try {
    const response = await axios.put(`${API_URL}api/master/user-manager`, Data, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating UserManager :", error);
    throw error;
  }
};

export const checkUsernameExistsService = async (username) => {
  try {
    const response = await axios.get(`${API_URL}api/gatepass//user-manager/check-username?userName=${encodeURIComponent(username)}`, {
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