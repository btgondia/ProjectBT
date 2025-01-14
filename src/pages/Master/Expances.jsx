import React, { useState, useEffect, useMemo, useContext } from "react";
import axios from "axios";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid";
import { DeleteOutline } from "@mui/icons-material";
import { v4 as uuid } from "uuid";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import context from "../../context/context";

const ExpansesPage = () => {
    const [itemsData, setItemsData] = useState([]);
    const [popupForm, setPopupForm] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const [filterTitle, setFilterTitle] = useState("");

    const { setNotification } = useContext(context);
  
    const getItemsData = async (controller = new AbortController()) => {
      const response = await axios({
        method: "get",
        url: "/expense/GetAllExpenses",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) setItemsData(response.data.result);
    };
    useEffect(() => {
      const controller = new AbortController();
      getItemsData(controller);
      return () => {
        controller.abort();
      };
    }, [popupForm]);
    const filterItemsData = useMemo(
      () =>
        itemsData
  
          .filter(
            (a) =>
              a.expense_title &&

              (!filterTitle ||
                a.expense_title
                  .toLocaleLowerCase()
                  .includes(filterTitle.toLocaleLowerCase()))
              
          ),
      [filterTitle, itemsData]
    );
   
   
  
    return (
      <>
        <Sidebar />
        <Header />
        <div className="item-sales-container orders-report-container">
          <div id="heading" style={{ position: "relative" }}>
            <h2>Expense</h2>
            <span
              style={{
                position: "absolute",
                right: "30px",
                top: "50%",
                translate: "0 -50%",
              }}
            >
              Total Items: {filterItemsData.length}
            </span>
          </div>
          <div id="item-sales-top">
            <div
              id="date-input-container"
              style={{
                overflow: "visible",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="text"
                  onChange={(e) => setFilterTitle(e.target.value)}
                  value={filterTitle}
                  placeholder="Search Expense Title..."
                  className="searchInput"
                />
               
        
              </div>
  
              <button className="theme-btn" onClick={() => setPopupForm(true)}>
                Add
              </button>
            </div>
          </div>
          <div className="table-container-user item-sales-container">
            <Table
              itemsDetails={filterItemsData}
              setPopupForm={setPopupForm}
              setDeletePopup={setDeletePopup}
            />
          </div>
        </div>
        {popupForm ? (
          <NewUserForm
            onSave={() => {
              setPopupForm(false);
              getItemsData();
            }}
            setItemsData={setItemsData}

            popupInfo={popupForm}
            items={itemsData}
            setNotification={setNotification}
          />
        ) : (
          ""
        )}
        {deletePopup ? (
          <DeleteItemPopup
            onSave={() => {
              setDeletePopup(false);
              getItemsData();
            }}
            setItemsData={setItemsData}
            popupInfo={deletePopup}
          />
        ) : (
          ""
        )}
      </>
    );
}

export default ExpansesPage

function Table({ itemsDetails, setPopupForm, setDeletePopup }) {
    const [items, setItems] = useState("sort_order");
    const [order, setOrder] = useState("");
    return (
      <>
        <div
          style={{ maxWidth: "100vw", height: "fit-content", overflowX: "auto" }}
        >
          <table className="user-table" style={{ tableLayout: "auto" }}>
            <thead>
              <tr>
                <th>S.N</th>
                <th>
                  <div className="t-head-element">
                    <span>Expense Title</span>
                    <div className="sort-buttons-container">
                      <button
                        onClick={() => {
                          setItems("expense_title");
                          setOrder("asc");
                        }}
                      >
                        <ChevronUpIcon className="sort-up sort-button" />
                      </button>
                      <button
                        onClick={() => {
                          setItems("expense_title");
                          setOrder("desc");
                        }}
                      >
                        <ChevronDownIcon className="sort-down sort-button" />
                      </button>
                    </div>
                  </div>
                </th>

                <th></th>
              </tr>
            </thead>
            <tbody className="tbody">
              {itemsDetails
                .map((a) => ({ ...a, item_discount: +a.item_discount || 0 }))
                .sort((a, b) =>
                  order === "asc"
                    ? typeof a[items] === "string"
                      ? a[items]?.localeCompare(b[items])
                      : a[items] - b[items]
                    : typeof a[items] === "string"
                    ? b[items]?.localeCompare(a[items])
                    : b[items] - a[items]
                )
                ?.map((item, i) => (
                  <tr
                    key={Math.random()}
                    style={{ height: "30px" }}
                    onClick={() => setPopupForm({ type: "edit", data: item })}
                  >
                    <td>{i + 1}</td>
                   
                    <td>{item.expense_title}</td>
        
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                       
                        <DeleteOutline
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletePopup(item);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        
      </>
    );
  }
  function NewUserForm({
    onSave,
    popupInfo,



    items,
    setNotification,
  }) {
    const [data, setData] = useState({item_group_uuid:[]});
  
  
    const [errMassage, setErrorMassage] = useState("");
  

    useEffect(() => {
      if (popupInfo?.type === "edit")
        setData({
       
          ...popupInfo.data,
        });
   
    }, [popupInfo.data, popupInfo?.type]);
  
    const submitHandler = async (e) => {
      let obj = { ...data, expense_uuid: data.expense_uuid || uuid() };
      e.preventDefault();

      if (!obj.expense_title) {
        setErrorMassage("Please insert Expense Title");
        return;
      }
  
    
      if (popupInfo?.type === "edit") {
        const response = await axios({
          method: "put",
          url: "/expense/UpdateExpense",
          data: [obj],
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.data.result[0].success) {
          onSave();
        }
      } else {
        if (obj?.item_code && items.find((a) => a.item_code === obj.item_code)) {
          setErrorMassage("Please insert Different Item Code");
          return;
        }
        const response = await axios({
          method: "post",
          url: "/expense/PostExpense",
          data: obj,
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.data.success) {
          onSave();
        }
      }
    };
  
    return (
      <div className="overlay" style={{ zIndex: 9999999 }}>
        <div className="modal" style={{ height: "350px", width: "fit-content" }}>
          <div
            className="content"
            style={{
              height: "fit-content",
              padding: "20px",
              width: "fit-content",
            }}
          >
            <div style={{ overflowY: "scroll" }}>
              <form className="form" onSubmit={submitHandler}>
                <div className="row">
                  <h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Items</h1>
                </div>
  
                <div className="formGroup">
                  <div className="row">
                    <label className="selectLabel">
                      Expense Title
                      <input
                        type="text"
                        name="route_title"
                        className="numberInput"
                        value={data?.expense_title}
                        onChange={(e) =>
                          setData({
                            ...data,
                            expense_title: e.target.value,
                            pronounce: e.target.value,
                          })
                        }
                        maxLength={60}
                      />
                    </label>
                
         </div>
  
    
                </div>
                <i style={{ color: "red" }}>
                  {errMassage === "" ? "" : "Error: " + errMassage}
                </i>
  
                <button type="submit" className="submit">
                  Save changes
                </button>
              </form>
            </div>
  
            <button onClick={onSave} className="closeButton">
              x
            </button>
          </div>
        </div>
      </div>
    );
  }
  function DeleteItemPopup({ onSave, popupInfo, setItemsData }) {
    const [errMassage, setErrorMassage] = useState("");
    const [loading, setLoading] = useState(false);
  
    const submitHandler = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const response = await axios({
          method: "delete",
          url: "/expense/DeleteExpense/"+popupInfo.expense_uuid,
        
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.data.success) {
          onSave();
        }
      } catch (err) {
       
        setErrorMassage("Order already exist");
      }
      setLoading(false);
    };
  
    return (
      <div className="overlay">
        <div className="modal" style={{ width: "fit-content" }}>
          <div
            className="content"
            style={{
              height: "fit-content",
              padding: "20px",
              width: "fit-content",
            }}
          >
            <div style={{ overflowY: "scroll" }}>
              <form className="form" onSubmit={submitHandler}>
                <div className="row">
                  <h1>Delete Items</h1>
                </div>
                <div className="row">
                  <h1>{popupInfo.expense_title}</h1>
                </div>
  
                <i style={{ color: "red" }}>
                  {errMassage === "" ? "" : "Error: " + errMassage}
                </i>
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  {loading ? (
                    <button
                      className="submit"
                      id="loading-screen"
                      style={{ background: "red", width: "120px" }}
                    >
                      <svg viewBox="0 0 100 100">
                        <path
                          d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50"
                          fill="#ffffff"
                          stroke="none"
                        >
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            dur="1s"
                            repeatCount="indefinite"
                            keyTimes="0;1"
                            values="0 50 51;360 50 51"
                          ></animateTransform>
                        </path>
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="submit"
                      style={{ background: "red" }}
                    >
                      Confirm
                    </button>
                  )}
                  <button type="button" className="submit" onClick={onSave}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  