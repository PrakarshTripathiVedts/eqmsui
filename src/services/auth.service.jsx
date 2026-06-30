import axios from 'axios';
import config from '../environment/config';
import { authenticationDetails } from './admin.service';
import { authHeader } from './auth.header';


const API_URL = config.API_URL;

export const login = async (username, password) => {
  try {
    const loginData = {
      username: username,
      password: password
    };

    const response = await authenticationDetails(loginData);
    if (response.data.token) {
      localStorage.setItem(
        'user',
        JSON.stringify({
          token: response.data.token,
          username
        })
      );
      const emp = await getEmpDetails(username);
      localStorage.setItem('empId', emp.empId);
      localStorage.setItem('loginId', emp.loginId);
      localStorage.setItem('empName', emp.empName);
      localStorage.setItem('role', emp.roleName);
      localStorage.setItem('roleId', emp.roleId);
      localStorage.setItem('userName', username);

      await customAuditStampingLogin(username);
      return response.data;
      } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Error occurred in login:', error);
    throw error;

  }
};

export const getEmpDetails = async (username) => {
  if (!username) {
    throw new Error('No user found');
  } try {
    return (await axios.post(`${API_URL}api/master/get-emp-details`, {}, { headers: { 'Content-Type': 'application/json', ...authHeader() } })).data;
  } catch (error) {
    localStorage.removeItem("user");
    console.error('Error occurred in getEmpDetails():', error);
    throw error;
  }
};


export const formatfromtoDate = (date) => {
  if (!(date instanceof Date)) return "";
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};


export const customAuditStampingLogin = async (username) => {
  if (!username) {
    throw new Error('No user found');
  }

  try {
    const response = await axios.post(
      `${API_URL}api/master/custom-audit-stamping-login`,
      username,
      { headers: { 'Content-Type': 'application/json', ...authHeader() } }
    );
    return response.data;
  } catch (error) {
    console.error('Error occurred in customAuditStampingLogin:', error);
    throw error;
  }
};

export const customAuditStampingLogout = async (username, logoutType) => {
  if (!username) {
    throw new Error('No user found');
  }

  try {
    const response = await axios.post(
      `${API_URL}api/master/custom-audit-stamping-logout`,
      { username, logoutType },
      { headers: { 'Content-Type': 'application/json', ...authHeader() } }
    );
    return response.data;
  } catch (error) {
    console.error('Error occurred in customAuditStampingLogout:', error);
    throw error;
  }
}

