import { useEffect, useState } from "react";
import { getCategoryList } from "../../services/masterservice";
import { FaEdit } from "react-icons/fa";
import Navbar from "../navbar/navbar";
import { Link } from "react-router-dom";
import CategoryAddEditComponent from "./categoryAddEditComponent";
import Datatable from "../datatable/datatable";
import { getFormDetailsList } from "../../services/admin.service";

const FORM_URL = "category";

const Category = () => {

    const [categoryList, setCategoryList] = useState([]);

    const [rawCategoryList, setRawCategoryList] = useState([]); // NEW: unformatted data, used for duplicate-code checks

    const [status, setStatus] = useState("list");

    const [categoryId, setCategoryId] = useState(null);

    const [permissions, setPermissions] = useState({
        forView: false, forAdd: false, forEdit: false, forDelete: false,
    });

    const [showModal, setShowModal] = useState(false);

    /* ── Load permissions ── */

    useEffect(() => {
        const roleId = localStorage.getItem("roleId");

        const loadPermissions = async () => {
            try {
                const details = await getFormDetailsList(roleId);
                const detailArray = Array.isArray(details) ? details : details?.data ?? [];
                const match = detailArray.find((d) => d.formUrl?.toLowerCase() === FORM_URL.toLowerCase());

                if (match) {
                    setPermissions({
                        forView: match.forView === true || match.forView === 1 || match.forView === "Y",
                        forAdd: match.forAdd === true || match.forAdd === 1 || match.forAdd === "Y",
                        forEdit: match.forEdit === true || match.forEdit === 1 || match.forEdit === "Y",
                        forDelete: match.forDelete === true || match.forDelete === 1 || match.forDelete === "Y",
                    });
                }
            }
            catch (error) {
                console.error("Failed to load permisions", error)
            }
        };
        loadPermissions();
    }, []);

    // /* ── Actions ── */ 
    // const addCategory = () => setStatus("add");
    // const editCategory = (id) => { setCategoryId(id);  setStatus("edit"); };

    const addCategory = () => {
        setCategoryId(null);
        setShowModal(true);
    };

    const editCategory = (id) => {
        setCategoryId(id);
        setShowModal(true);
    };


    /* ── Columns ── */
    const baseColumns = [
        { name: "SN", selector: (row) => row.sn, sortable: true, },
        { name: "Category Code", selector: (row) => row.categoryCode, sortable: true, align: 'text-start' },
        { name: "Category Name", selector: (row) => row.categoryName, sortable: true, align: 'text-start' },
    ];
    const columns = permissions.forEdit
        ? [...baseColumns, { name: "Action", selector: (row) => row.action }] : baseColumns;

    /* ── Table Data ── */
    const setTableData = (data) => {
        setCategoryList(
            data.map((item, index) => ({
                sn: index + 1 + ".",
                categoryCode: item.categoryCode ?? "-",
                categoryName: item.categoryName ?? "-",
                action:
                    permissions.forEdit ? (
                        <button
                            className="btn btn-warning btn-sm"
                            onClick={() =>
                                item.categoryId != null &&
                                editCategory(item.categoryId)
                            }
                            title="Edit Category"
                        >
                            <FaEdit size={16} />
                        </button>
                    ) : "-"
            }))
        );
    };
    /* ── Fetch Category List ── */
    const getCategoryMasterList = async () => {
        try {
            const data = await getCategoryList();
            const list = Array.isArray(data) && data.length > 0 ? data : [];
            setRawCategoryList(list);  // NEW: keep raw data (has categoryId + categoryCode) for validation
            setTableData(list);
        }
        catch (error) {
            setRawCategoryList([]);
            setTableData([]);
        }
    };

    useEffect(() => {
        if (permissions.forView) {
            getCategoryMasterList();
        }
    }, [permissions.forView]);

    /* ── No Permission ── */
    if (!permissions.forView) {
        return (
            <div>
                <Navbar />
                <div className="card p-2">
                    <div className="card-body text-center">
                        <h3>Category List</h3>
                        <p className="text-danger mt-3">
                            You do not have permission to view this page.
                        </p>
                        <Link className="mt-2 btn back" to="/dashboard"  >BACK</Link>
                    </div>
                </div>
            </div>
        );
    }
    /* ── Sub Routing ── */
    // with out modal 
    // switch(status){
    //     case "add":
    //         return(
    //             <CategoryAddEditComponent
    //                 mode="add"
    //                 setStatus={setStatus}
    //                 refreshList={getCategoryMasterList}
    //                 existingCategories={rawCategoryList}
    //             />
    //         );
    //     case "edit":
    //         return(
    //             <CategoryAddEditComponent
    //                 mode="edit"
    //                 categoryId={categoryId}
    //                 setStatus={setStatus}
    //                 refreshList={getCategoryMasterList}
    //                 existingCategories={rawCategoryList}
    //             />
    //         );

    //     default:
    return (
        <div>
            <Navbar />
            <div className="card p-2">
                <div className="card-body text-center">
                    <h3>Category List</h3>
                    {/* Show Modal */}
                    {
                        showModal && (
                            <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                                <div className="modal-dialog modal-lg">
                                    <div className="modal-content">
                                        <div className="modal-header bg-primary text-white">
                                            <h5>
                                                {categoryId ? "Edit Category" : "Add Category"}
                                            </h5>
                                            <button className="btn-close" onClick={() => setShowModal(false)} />
                                        </div>
                                        <div className="modal-body">
                                            <CategoryAddEditComponent
                                                mode={categoryId ? "edit" : "add"}
                                                categoryId={categoryId}
                                                refreshList={getCategoryMasterList}
                                                existingCategories={rawCategoryList}
                                                onClose={() => setShowModal(false)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    <div id="card-body customized-card">
                        <Datatable columns={columns} data={categoryList} />
                    </div>
                    <div align="center">
                        {permissions.forAdd && (
                            <button
                                className="mt-2 btn add me-2"
                                onClick={addCategory}
                            >
                                ADD
                            </button>
                        )}

                        <Link className="mt-2 btn back" to="/dashboard">
                            BACK
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
// };


export default Category;