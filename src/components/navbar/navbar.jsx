import { Link, useNavigate } from 'react-router-dom';
import { getFormDetailsList, getFormModuleList, logout } from "../../services/admin.service";
import './navbar.css';
import { FaCaretDown, FaHome } from "react-icons/fa";
import { useState, useEffect, useMemo } from 'react';
import * as MdIcons from "react-icons/md";
import { downloadUserManual } from '../../services/masterservice';
import Swal from 'sweetalert2';

export const handleDownload = async (docType) => {
  let response = await downloadUserManual(docType);

  const { data, fileName, contentType } = response;

  if (data === '0') {
    Swal.fire("Error", "File not found", "error");
    return;
  }

  const blob = new Blob([data], { type: contentType });

  if (contentType === "application/pdf") {
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
  } else {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
  
const Navbar = () => {
  const [formModuleList, setFormModuleList] = useState([]);
  const [formDetailsList, setFormDetailsList] = useState([]);
  const navigate = useNavigate();
  const roleId = localStorage.getItem("roleId");
  const empName = localStorage.getItem("empName");

  const handleLogout = (e) => {
    e.preventDefault();
    logout('L');
    navigate("/");
  };

  useEffect(() => {
    const fetchList = async () => {
      try {
        const formModules = await getFormModuleList();
        const formDetails = await getFormDetailsList(roleId);

        const moduleArray = Array.isArray(formModules) ? formModules : formModules?.data ?? [];
        const detailArray = Array.isArray(formDetails) ? formDetails : formDetails?.data ?? [];

        setFormModuleList(moduleArray);
        setFormDetailsList(detailArray);
      } catch (error) {
        console.error("Error fetching form module list:", error);
      }
    };
    fetchList();
  }, [roleId]);

  // visibleModules useMemo
  const visibleModules = useMemo(() => {
    return formModuleList
      .filter(module => {
        if (module.isActive !== 1) return false;
        const hasSubItems = formDetailsList.some(
          detail => detail.formModuleId === module.formModuleId && detail.isActive !== 0
        );
        return hasSubItems;
      })
      .sort((a, b) => a.serialNo - b.serialNo);
  }, [formModuleList, formDetailsList]);

  // subItemsMap useMemo
  const subItemsMap = useMemo(() => {
    const map = {};
    formDetailsList
      .filter(detail => detail.isActive !== 0)
      .forEach(detail => {
        if (!map[detail.formModuleId]) map[detail.formModuleId] = [];
        map[detail.formModuleId].push(detail);
      });
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => a.formSerialNo - b.formSerialNo);
    });
    return map;
  }, [formDetailsList]);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark navbar-first px-3">
        <Link className="navbar-brand flex items-center gap-2 group" to="/dashboard">
          <FaHome className="me-1 icon" size={32} />
          <span className="fs-4 fw-semibold label">EQPIMS</span>
<span className="fs-6 fw-normal label ms-2">
  ({empName})
</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">

            {visibleModules.map(module => {
              const subItems = subItemsMap[module.formModuleId] ?? [];

              // Case 1: Only one sub-item → direct link, no dropdown
              if (subItems.length === 1) {
                return (
                  <li key={module.formModuleId} className="nav-item ms-3 me-3">
                    <Link className="nav-link" to={`/${subItems[0].formUrl}`}>
                      {module.formModuleName} 
                    </Link>
                  </li>
                );
              }

              // Case 2: Multiple sub-items → dropdown
              return (
                <li
                  key={module.formModuleId}
                  className="nav-item dropdown hover-dropdown position-relative ms-3 me-3"
                >
                  <div className="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {module.formModuleName}
                  </div>
                  <ul className="dropdown-menu">
                    {subItems.map(detail => (
                      <li key={detail.formDetailId}>
                        <Link className="dropdown-item" to={`/${detail.formUrl}`}>
                          {detail.formDispName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}

           {/* ─── FIXED HOVER-ENABLED HELP DROPDOWN SECTION ─── */}
<li className="nav-item dropdown hover-dropdown ms-3 me-3">
  <div 
    className="nav-link dropdown-toggle nav-animate" 
    role="button"
    style={{ cursor: 'pointer' }}
  >
    <MdIcons.MdHelp style={{ fontSize: '20px', marginBottom: '3px', marginRight: '5px', verticalAlign: 'middle' }} /> 
    Help
  </div>
  <ul className="dropdown-menu mt-0">
    <li>
      <button
        type="button"
        className="dropdown-item"
        onClick={() => navigate("/change-password")}
      >
        Change Password
      </button>
    </li>
    <li>
      <button
        type="button"
        className="dropdown-item"
        onClick={() => navigate("/auditstamping")}
      >
        Audit Stamping
      </button>
    </li>
    <li>
      <button 
        type="button"
        className="dropdown-item" 
        onClick={() => handleDownload('usermanual')}
      >
        User Manual
      </button>
    </li>
  </ul>
</li>

            <li className="nav-item ms-3">
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </li>

          </ul>
        </div>
      </nav>
    </>
  );
};

export default Navbar;