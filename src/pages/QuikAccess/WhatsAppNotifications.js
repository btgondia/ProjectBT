import React, { useState, useEffect, useMemo, useRef } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MenuAlt2Icon,
} from "@heroicons/react/solid";
import { v4 as uuid } from "uuid";
import axios from "axios";
import { Add, Delete, DeleteOutline } from "@mui/icons-material";
import { Switch } from "@mui/material";
import { green } from "@mui/material/colors";
import { alpha, styled } from "@mui/material/styles";

const GreenSwitch = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: green[500],
    "&:hover": {
      backgroundColor: alpha(green[500], theme.palette.action.hoverOpacity),
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: green[500],
  },
}));
const WhatsAppNotifications = () => {
  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2 style={{ width: "100%" }}>WhatsApp Notifications</h2>
        </div>
        <Incetives />
      </div>
    </>
  );
};
const Incetives = () => {
  const [popupForm, setPopupForm] = useState(false);
  const [itemsData, setItemsData] = useState([]);
  const [deletePopup, setDeletePopup] = useState(false);
  const getItemsData = async () => {
    const response = await axios({
      method: "get",
      url: "/whatsapp_notifications/getWhatsapp_notifications",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setItemsData(response.data.result);
  };
  useEffect(() => {
    getItemsData();
  }, [popupForm]);
  const DeleteAutoAdd = async (data) => {
    const response = await axios({
      method: "delete",
      url: "/whatsapp_notifications/DeleteWhatsapp_notifications",
      data,
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response);
    if (response.data.success) {
      setDeletePopup(false);
      getItemsData();
    }
  };
  return (
    <>
      <div id="item-sales-top">
        <div
          id="date-input-container"
          style={{
            overflow: "visible",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <button
            className="item-sales-search"
            onClick={() => setPopupForm(true)}
          >
            Add
          </button>
        </div>
      </div>
      <div className="table-container-user item-sales-container">
        <Table
          itemsDetails={itemsData}
          setPopupForm={setPopupForm}
          setDeletePopup={setDeletePopup}
          getItemsData={getItemsData}
        />
      </div>

      {popupForm ? (
        <IncentivePopup
          onSave={() => setPopupForm(false)}
          popupForm={popupForm}
        />
      ) : (
        ""
      )}
      {deletePopup ? (
        <div className="overlay">
          <div
            className="modal"
            style={{ height: "fit-content", width: "fit-content" }}
          >
            <div
              className="content"
              style={{
                height: "fit-content",
                paddingTop: "40px",
                width: "fit-content",
              }}
            >
              <div style={{ overflowY: "scroll" }}>Sure You Want to Delete</div>

              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <button
                  className="fieldEditButton"
                  onClick={() => DeleteAutoAdd(deletePopup)}
                >
                  Confirm
                </button>
              </div>

              <button
                onClick={() => setDeletePopup(false)}
                className="closeButton"
              >
                x
              </button>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default WhatsAppNotifications;
function Table({
  itemsDetails = [],
  setPopupForm,
  setDeletePopup,
  getItemsData,
}) {
  const [items, setItems] = useState("incentive_title");
  const [order, setOrder] = useState("asc");
  const updateStatus = async (data) => {
    const response = await axios({
      method: "put",
      url: "/whatsapp_notifications/UpdateWhatsapp_notifications",
      data,
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response);
    if (response.data.success) {
      getItemsData();
    }
  };

  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
          <th colSpan={2}>
            <div className="t-head-element">
              <span>Out For Delivery Notification</span>
              <div className="sort-buttons-container">
                <button
                  onClick={() => {
                    setItems("message");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button>
                <button
                  onClick={() => {
                    setItems("message");
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
          ?.filter((a) => a.type)
          .sort((a, b) =>
            order === "asc"
              ? typeof a[items] === "string"
                ? a[items].localeCompare(b[items])
                : a[items] - b[items]
              : typeof a[items] === "string"
              ? b[items].localeCompare(a[items])
              : b[items] - a[items]
          )
          ?.map((item, i) => (
            <tr key={item.item_uuid} style={{ height: "30px" }}>
              <td>{i + 1}</td>
              <td
                colSpan={2}
                onClick={(e) => {
                  e.stopPropagation();
                  setPopupForm({ type: "edit", data: item });
                }}
              >
                {item.type}
              </td>

              <td>
                <GreenSwitch
                  checked={item?.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateStatus({ ...item, status: item.status ? 0 : 1 });
                  }}
                />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

function IncentivePopup({ onSave, popupForm }) {
  const [objData, setObgData] = useState({
    type: "",
    message: [],
  });
  const [active, setActive] = useState("");

  useEffect(() => {
    if (popupForm?.type === "edit") setObgData(popupForm.data);
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    let data = objData;
    for (let message of data.message?.filter((a) => a.img)) {
      const previousFile = message.img;
      const newFile = new File([previousFile], message.uuid + ".png");
      const form = new FormData();
      form.append("file", newFile);
      await axios({
        method: "post",
        url: "/uploadImage",
        data: form,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    if (popupForm?.type === "edit") {
      const response = await axios({
        method: "put",
        url: "/whatsapp_notifications/UpdateWhatsapp_notifications",
        data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      if (response.data.success) {
        onSave();
      }
    } else {
      const response = await axios({
        method: "post",
        url: "/whatsapp_notifications/CreateWhatsapp_notifications",
        data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      if (response.data.success) {
        onSave();
      }
    }
  };
  const addVariable = (name) => {
    setObgData((prev) => ({
      ...prev,
      message: prev.message.map((a) =>
        a.uuid === active
          ? {
              ...a,
              text: a.text + `{${name}}`,
            }
          : a
      ),
    }));
  };
  return (
    <div className="overlay">
      <div
        className="modal"
        style={{ height: "fit-content", width: "fit-content" }}
      >
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
            width: "fit-content",
          }}
        >
          <div style={{ overflowY: "scroll", maxHeight: "400px" }}>
            <table
              className="user-table"
              style={{
                width: "fit-content",
              }}
            >
              <tbody>
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      width: "400px",
                    }}
                  >
                    <b style={{ width: "100px" }}>Type : </b>
                    <input
                      onWheel={(e) => e.target.blur()}
                      type="text"
                      className="searchInput"
                      style={{
                        border: "none",
                        borderBottom: "2px solid black",
                        borderRadius: "0px",
                      }}
                      placeholder=""
                      value={objData.type}
                      onChange={(e) =>
                        setObgData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <b style={{ width: "100px" }}>Message : </b>
                    <span
                      onClick={(e) => {
                        console.log(objData);
                        setObgData((prev) => ({
                          ...prev,
                          message: [
                            ...(prev.message || []),
                            { type: "text", uuid: uuid() },
                          ],
                        }));
                      }}
                      className="fieldEditButton"
                    >
                      <Add />
                    </span>
                  </td>
                </tr>
                {objData?.message?.map((item) => (
                  <tr key={item.uuid}>
                    <td
                      colSpan={2}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <span
                        onClick={() =>
                          setObgData((prev) => ({
                            ...prev,
                            message: prev.message.filter(
                              (a) => a.uuid !== item.uuid
                            ),
                          }))
                        }
                      >
                        <DeleteOutline />
                      </span>
                      <select
                        className="searchInput"
                        value={item.type}
                        onChange={(e) => {
                          setObgData((prev) => ({
                            ...prev,
                            message: prev.message.map((a) =>
                              a.uuid === item.uuid
                                ? { ...a, type: e.target.value }
                                : a
                            ),
                          }));
                        }}
                      >
                        <option value="text">Text</option>
                        <option value="img">Image</option>
                      </select>

                      {item?.type === "text" ? (
                        <textarea
                          onWheel={(e) => e.target.blur()}
                          className="searchInput"
                          style={{
                            border: "none",
                            borderBottom: "2px solid black",
                            borderRadius: "0px",
                            height: "100px",
                          }}
                          id={item.uuid}
                          onFocus={() => {
                            setActive(item.uuid);
                          }}
                          placeholder=""
                          value={item.text}
                          onChange={(e) => {
                            setObgData((prev) => ({
                              ...prev,
                              message: prev.message.map((a) =>
                                a.uuid === item.uuid
                                  ? { ...a, text: e.target.value }
                                  : a
                              ),
                            }));
                          }}
                        />
                      ) : (
                        <input
                          className="searchInput"
                          type="file"
                          onChange={(e) =>
                            setObgData((prev) => ({
                              ...prev,
                              message: prev.message.map((a) =>
                                a.uuid === item.uuid
                                  ? { ...a, img: e.target.files[0] }
                                  : a
                              ),
                            }))
                          }
                        />
                      )}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <button
                      className="item-sales-search"
                      onClick={(e) => addVariable("counter_title")}
                    >
                      Counter Title
                    </button>
                    <button
                      className="item-sales-search"
                      onClick={(e) => addVariable("short_link")}
                    >
                      Counter Link
                    </button>
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <button
                      className="item-sales-search"
                      onClick={(e) => addVariable("invoice_number")}
                    >
                      Invoice Number
                    </button>
                    <button
                      className="item-sales-search"
                      onClick={(e) => addVariable("amount")}
                    >
                      Amount
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              bottom: 0,
              left: 0,
            }}
          >
            <button className="fieldEditButton" onClick={submitHandler}>
              {popupForm?.type === "edit" ? "Update" : "Save"}
            </button>
          </div>

          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
