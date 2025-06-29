import React, { useState, useEffect, useMemo } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import SetupModal from "../../components/setupModel/SetupModel";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid";
import axios from "axios";
import { DeleteOutline } from "@mui/icons-material";
const LedgerGroups = () => {
  const [LedgerGroups, setLedgerGroups] = useState([]);
  const [LedgerGroupsTitle, setLedgerGroupsTitle] = useState("");
  const [popupForm, setPopupForm] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const getCounterGroup = async () => {
    const response = await axios({
      method: "get",
      url: "/ledgerGroup/getLedgerGroup",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setLedgerGroups(response.data.result);
  };

  useEffect(() => {
    getCounterGroup();
  }, [popupForm]);

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Ledger Group</h2>
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
            <input
              type="text"
              onChange={(e) => setLedgerGroupsTitle(e.target.value)}
              value={LedgerGroupsTitle}
              placeholder="Search Ledger Group Title..."
              className="searchInput"
            />

            <div>
              Total Items:{" "}
              {
                LedgerGroups.filter((a) => a.ledger_group_title).filter(
                  (a) =>
                    !LedgerGroupsTitle ||
                    a.ledger_group_title
                      ?.toLocaleLowerCase()
                      ?.includes(LedgerGroupsTitle.toLocaleLowerCase())
                ).length
              }
            </div>
            <button className="theme-btn" onClick={() => setPopupForm(true)}>
              Add
            </button>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={LedgerGroups.filter(
              (a) => a.ledger_group_title
            ).filter(
              (a) =>
                !LedgerGroupsTitle ||
                a.ledger_group_title
                  ?.toLocaleLowerCase()
                  ?.includes(LedgerGroupsTitle.toLocaleLowerCase())
            )}
            setPopupForm={setPopupForm}
       
            setDeletePopup={setDeletePopup}
          />
        </div>
      </div>
      {popupForm ? (
        <NewUserForm
          onSave={() => setPopupForm(false)}
          popupInfo={popupForm}
          setRoutesData={setLedgerGroups}
        />
      ) : (
        ""
      )}
 
      {deletePopup ? (
        <DeleteCounterPopup
          onSave={() => setDeletePopup(false)}
          getCounterGroup={getCounterGroup}
          popupInfo={deletePopup}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default LedgerGroups;
function Table({ itemsDetails, setPopupForm, setDeletePopup }) {
  const [items, setItems] = useState("ledger_group_title");
  const [order, setOrder] = useState("asc");
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
              <span>Ledger Group Title</span>
              <div className="sort-buttons-container">
                <button
                  onClick={() => {
                    setItems("ledger_group_title");
                    setOrder("asc");
                  }}
                >
                  <ChevronUpIcon className="sort-up sort-button" />
                </button>
                <button
                  onClick={() => {
                    setItems("ledger_group_title");
                    setOrder("desc");
                  }}
                >
                  <ChevronDownIcon className="sort-down sort-button" />
                </button>
              </div>
            </div>
          </th>
          <th colSpan={2}></th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          .filter((a) => a.ledger_group_title)
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
            <tr
              key={Math.random()}
              style={{ height: "30px" }}
              onClick={(e) => {
                e.stopPropagation();
                setPopupForm({ type: "edit", data: item });
              }}
            >
              <td>{i + 1}</td>
              <td colSpan={2}>{item.ledger_group_title}</td>
              
              <td
                colSpan={1}
                onClick={(e) => {
                  e.stopPropagation();

                  setDeletePopup(item);
                }}
              >
                <DeleteOutline />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
function NewUserForm({ onSave, popupInfo, setRoutesData }) {
  const [data, setdata] = useState({});
  const [errMassage, setErrorMassage] = useState("");
  useEffect(
    popupInfo.type === "edit"
      ? () => {
          setdata(popupInfo.data);
        }
      : () => {},
    []
  );
  const submitHandler = async (e) => {
    e.preventDefault();
    if (!data.ledger_group_title) {
      setErrorMassage("Please insert Group Title");
      return;
    }
    if (popupInfo?.type === "edit") {
      const response = await axios({
        method: "put",
        url: "/ledgerGroup/putLedgerGroup",
        data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        setRoutesData((prev) =>
          prev?.map((i) => (i.user_uuid === data.user_uuid ? data : i))
        );
        onSave();
      }
    } else {
      const response = await axios({
        method: "post",
        url: "/ledgerGroup/postLedgerGroup",
        data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        setRoutesData((prev) => [...prev, data]);
        onSave();
      }
    }
  };

  return (
    <div className="overlay">
      <div
        className="modal"
        style={{ height: "fit-content", width: "max-content" }}
      >
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
                <h1>
                  {popupInfo.type === "edit" ? "Edit" : "Add"} Leger Group
                </h1>
              </div>

              <div className="formGroup">
                <div className="row">
                  <label className="selectLabel">
                    Item Group Title
                    <input
                      type="text"
                      name="category_title"
                      className="numberInput"
                      value={data?.ledger_group_title}
                      onChange={(e) =>
                        setdata({
                          ...data,
                          ledger_group_title: e.target.value,
                        })
                      }
                      maxLength={42}
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

function DeleteCounterPopup({ onSave, popupInfo, getCounterGroup }) {
  const [errMassage, setErrorMassage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios({
        method: "delete",
        url: "/ledgerGroup/deleteLedgerGroup",
        data: { ledger_group_uuid: popupInfo.ledger_group_uuid },
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        getCounterGroup();
        onSave();
      }
    } catch (err) {
     
      // setErrorMassage("Order already exist");
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
                <h1>Delete Ledger Group</h1>
              </div>
              <div className="row">
                <h1>{popupInfo.ledger_group_title}</h1>
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
