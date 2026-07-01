import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, } from "formik";
import * as Yup from "yup";
import "../datatable/master.css";
import { saveEquipmentLogData, partialUpdateEquipmentLog, getEquipmentLogById, getEquipmentListService,getEmployeeListService,UpdateEquipmentLog } from "../../services/masterservice";
import { showAlert, showConfirmation } from "../datatable/swalHelper";
import EquipmentLog from "./equipmentLog";
import Navbar from "../navbar/navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FormikSelect from "../../common/formikSelect";
import Select from "react-select";


const EquipmentLogAddEditComponent = ({ mode, equpmentLogId, equipmentValue, equipmentName }) => {

  const [status, setStatus] = useState('');
  const [equipmentList, setEquipmentList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);

  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    totalHours: "",
    
    equipmentId: equipmentValue || "",
    description: "",
    usedBy:"",
    equipmentName:"",

  });



  const getDataById = async (equpmentLogId) => {
    try {
      const data = await getEquipmentLogById(equpmentLogId);
      if (!data) return;

      setFormData(prev => ({
        ...prev,
        id: data?.id ?? "",
        startTime: data.startTime ? new Date(data.startTime) : "",
        endTime: data.endTime ? new Date(data.endTime) : "",
        
        totalHours: formatDuration(data?.totalHours) ?? "",
        equipmentId: data?.equipmentId ?? "",
        description: data?.description ?? "",
        usedBy:data?.usedBy ??"",

      }));
    } catch (err) {
      console.error("Failed to fetch equipment log data:", err);
    }
  };

  useEffect(() => {
    if (equpmentLogId) {
      getDataById(equpmentLogId);
    }
    getEquipmentMasterList();
  }, [equpmentLogId]);


  const getEquipmentMasterList = async () => {
    try {
      const data = await getEquipmentListService();
      if (Array.isArray(data) && data.length > 0) {
        // const formattedData = data.map(item => ({
        //   value: item.equipmentId,
        //   label: item.equipmentName,
        // }));


        setEquipmentList(data);
      } else {
        setEquipmentList([]);
        console.error("Equipment list is empty or invalid.");
      }


     const employeeData = await getEmployeeListService();
      if (Array.isArray(employeeData) && employeeData.length > 0) {
        setEmployeeList(employeeData);
      } else {
        setEmployeeList([]);
        console.error("Employee list is empty or invalid.");
      }


    } catch (err) {
      console.error("Failed to fetch equipment master list:", err);
      setEquipmentList([]);
      setEmployeeList([]);
    }
  };

  function AutoCalculateTotalHours({ startTime, endTime, setFieldValue }) {
    useEffect(() => {
      if (startTime && endTime) {
        const diff =
  (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);

if (!isNaN(diff)) {
  setFieldValue("totalHours", formatDuration(diff));
}
      }
    }, [startTime, endTime, setFieldValue]);

    return null;
  }

  const getMinDate = () => {
    const currentDate = new Date();
    const minYear = currentDate.getFullYear() - 20;
    return new Date(minYear, currentDate.getMonth(), currentDate.getDate());
  };

  const getMaxDate = () => {
    const currentDate = new Date();
    const maxYear = currentDate.getFullYear() + 50;
    return new Date(maxYear, currentDate.getMonth(), currentDate.getDate());
  };

  // Form Validation Schema

  const requiredField = Yup.string().required("This field is required");

  const validationSchema = Yup.object().shape({

    startTime: requiredField,
    endTime: requiredField,
   
    description: requiredField,
    totalHours: requiredField,
    usedBy: requiredField,

  });

  const convertToDecimalHours = (time) => {
  if (!time) return 0;

  const [hh, mm] = time.split(":").map(Number);

  return (hh + mm / 60).toFixed(2);
};

  const handleSubmit = async (values) => {

    console.log("values",values);
    const payload = {
  ...values,
  startTime: values.startTime
    ? values.startTime.toISOString()
    : "",

  endTime: values.endTime
    ? values.endTime.toISOString()
    : "",

  totalHours: convertToDecimalHours(values.totalHours),
};
    try {
      if (mode === "add") {
        const confirmed = await showConfirmation();
        if (confirmed) {
          const response = await saveEquipmentLogData(payload);
          if (response.id != null && response.id > 0) {
            setStatus('list');
            showAlert("Success", "Equipment Log added successfully", "success");
          }
          else {
            showAlert("Error", "Failed to add equipment log. Please try again.", "error");
          }
        }
      } else {
        const confirmed = await showConfirmation();
        if (confirmed) {
          const response = await UpdateEquipmentLog(equpmentLogId, payload);
          if (response.id != null && response.id > 0) {
            setStatus('list');
            showAlert("Success", "Equipment log updated successfully", "success");
          }
          else {
            showAlert("Error", "Failed to update equipment log. Please try again.", "error");
          }
        }
      }
    } catch (error) {
      showAlert("Error", "Something went wrong. Please try again later.", "error");
    }
     
  };

 

  const redirectEquipmentLogList = () => {
    setStatus('list');
  }

  // const equipmentOptions = equipmentList.map(equip => ({
  //   value: equip.equipmentId,
  //   label: equip.equipmentName
  // }));



    const empOptions = employeeList.map(emp => ({
    value: emp.empId,
    label: emp.salutation ? emp.salutation + ' ' + emp.empName : emp.empName
  }));

const formatDuration = (hours) => {
  if (hours == null || hours === "") return "";

  const totalMinutes = Math.round(hours * 60);

  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");

  return `${hh}:${mm}`;
};


  switch (status) {
    case 'list':
  return (
    <EquipmentLog
      selectedEquipmentId={formData.equipmentId}
      selectedEquipmentName={equipmentName}
    />
  );
    default:
      return (
        <div>
          <Navbar />
          <div className="expert-form-container">
            <div className="form-card" style={{ marginLeft: "25%", marginRight: "25%" }}>
              <h4 className="form-title">{mode === "add" ? "Add Equipment Usage Log" : "Edit Equipment Usage Log"} - {equipmentName}</h4>
              <Formik
                initialValues={formData}
                validationSchema={validationSchema}
                onSubmit={(values) => {
                  const payload = {
                    ...values,
                    startTime: values.startTime ? values.startTime.toISOString() : "",
                    endTime: values.endTime ? values.endTime.toISOString() : "",
                    
                  };
                  handleSubmit(payload);
                }}
                enableReinitialize={true}
              >
                {({ setFieldValue, setFieldTouched, values }) => (
                  <>
                    <AutoCalculateTotalHours
                      startTime={values.startTime}
                      endTime={values.endTime}
                      setFieldValue={setFieldValue}
                    />
                    <Form>
                      <div className="column" align="center">

                   
                        <div className="col-md-4">
                          <div className="form-group" >
                            <label htmlFor="startTime" className="text-start d-block">Start Time : <span className="text-danger">*</span></label>

                            <DatePicker
                              selected={values.startTime}
                              onChange={(date) => {
                                setFieldValue("startTime", date);
                                if (values.endTime && date > values.endTime) {
                                  setFieldValue("endTime", null);
                                  setFieldValue("totalHours", "");
                                }
                              }}
                              className="form-control mb-2"
                              placeholderText="Select Start Time"
                              dateFormat="dd-MM-yyyy h:mm aa"
                              showYearDropdown
                              showMonthDropdown
                              dropdownMode="select"  
                              showTimeSelect                             
                              timeIntervals={15}                         
                              timeCaption="Time"
                              minDate={getMinDate()}
                              maxDate={getMaxDate()}
                              onKeyDown={(e) => e.preventDefault()}
                              
                            />


                            <ErrorMessage name="startTime" component="div" className="text-danger text-start" />

                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="endTime" className="text-start d-block">End Time : <span className="text-danger">*</span></label>

                            <DatePicker
                              selected={values.endTime}
                              onChange={(date) => setFieldValue("endTime", date)}
                              className="form-control mb-2"
                              placeholderText="Select End Time"
                              dateFormat="dd-MM-yyyy h:mm aa"  
                              showYearDropdown
                              showMonthDropdown
                              dropdownMode="select"
                              showTimeSelect                             
                              timeIntervals={15}                        
                              timeCaption="Time"
                              minDate={values.startTime || getMinDate()} 
                              maxDate={getMaxDate()}
                              onKeyDown={(e) => e.preventDefault()}
                              
                            />

                            <ErrorMessage name="endTime" component="div" className="text-danger text-start" />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="totalHours" className="text-start d-block">Total Hours: <span className="text-danger">*</span></label>
                            <Field
                              type="text"
                              name="totalHours"
                              className="form-control mb-2"
                              placeholder="Enter Total Hours"
                              readOnly 

                            />
                            <ErrorMessage name="totalHours" component="div" className="text-danger text-start" />
                          </div>
                        </div>



                        <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="usedBy" className="text-start d-block">Used By : <span className="text-danger">*</span></label>
                          <Select
                            className="text-start"
                            options={empOptions}
                            value={empOptions.find(opt => opt.value === values.usedBy) || null}
                            onChange={(selected) => setFieldValue("usedBy", selected ? selected.value : "")}
                            isClearable
                            placeholder="Select"
                          />
                          <ErrorMessage name="usedBy" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                        <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="description" className="text-start d-block">Description : <span className="text-danger">*</span></label>
                          <Field
                            type="text"
                            name="description"
                            className="form-control mb-2"
                            placeholder="Enter Description"
                          />
                          <ErrorMessage name="description" component="div" className="text-danger text-start" />
                        </div>
                      </div>

                      

                      </div>
                      <div align="center">
                        <button type="submit" className={`btn ${mode === "add" ? "submit" : "edit"} mt-3`} >
                          {mode === "add" ? "SUBMIT" : "UPDATE"}
                        </button>
                        <button className="btn back mt-3" onClick={() => redirectEquipmentLogList()}>BACK</button>
                      </div>
                    </Form>
                  </>
                )}
              </Formik>
            </div>
          </div>
        </div>
      );
  }
};

export default EquipmentLogAddEditComponent;
