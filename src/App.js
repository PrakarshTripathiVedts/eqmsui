import './App.css';
import { Route, Routes } from 'react-router-dom';
import LoginPage from './components/Login/login';
import Dashboard from './components/dashboard/dashboard';
import Equipment from './components/masters/equipment';
import EquipmentLog from './components/masters/equipmentLog';
import Make from './components/masters/make';
import Model from './components/masters/model';
import PrivateRoute from './common/privateRoute';
import Calibration from './components/masters/calibration';
import ComponentList from './components/inventory/componentlist';
import UserManager from './components/admin/userManager';
import AuditStamping from './components/admin/auditStamping';
import EmployeeComponent from './components/masters/employee';
import ProjectComponent from './components/masters/project';
import RoleAccessComponent from './components/masters/roleAccess';
import ChangePasswordComponent from './components/admin/changePassword';
import AMCComponent from './components/masters/amc';
import GatePassEntry from './components/gatepass/gatepassEntry';
import GatepassReport from './components/gatepass/gatepassReport';
import GatepassSearch from './components/gatepass/gatepassSearch';
import GatepassPendingReport from './components/gatepass/gatepassPendingReport';
import ComponentIssued from './components/inventory/componentIssued';
import SSRItems from './components/inventory/ssrItems';
import ProjectItems from './components/inventory/projectItems';
import StockVerification from './components/inventory/stockVerification';
import InventoryIssue from './components/inventory/inventoryIssue';
import Condemnation from './components/inventory/condemantion'; 
import Category from './components/masters/category';



function App() {
  return (

    <div className="App dms-font " >
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/equipmentlog" element={<EquipmentLog />} />
          <Route path="/calibration" element={<Calibration />} />
          <Route path="/componentlist" element={<ComponentList />} />
          <Route path="/componentissued" element={<ComponentIssued />} />
          <Route path="/make" element={<Make />} />
          <Route path="/model" element={<Model />} />
          <Route path="/usermanager" element={<UserManager />} />
          <Route path="/auditstamping" element={<AuditStamping />} />
          <Route path="/employee" element={<EmployeeComponent />} />
          <Route path="/projectmaster" element={<ProjectComponent />} />
          <Route path="/roleaccess" element={<RoleAccessComponent />} />
          <Route path="/change-password" element={<ChangePasswordComponent />} />
          <Route path="/amc" element={<AMCComponent />} />
          <Route path="/gatepassentry" element={<GatePassEntry />} />
          <Route path="/gatepassreport" element={<GatepassReport />} />
          <Route path="/gatepasssearch" element={<GatepassSearch />} />
          <Route path="/gatepasspendingreport" element={<GatepassPendingReport />} />
          <Route path="/ssritems" element={<SSRItems />} />
          <Route path="/projectitems" element={<ProjectItems />} />
          <Route path="/stockverification" element={<StockVerification />} />
          <Route path="/inventoryissue" element={<InventoryIssue />} />
          <Route path="/condemnation" element={<Condemnation />} />
          <Route path="/category" element={<Category />} />
        </Route>
      </Routes>
    </div>

  );
}

export default App;
