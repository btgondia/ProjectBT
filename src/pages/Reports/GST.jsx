import axios from "axios";
import React, { useState, useContext, useEffect } from "react";
import context from "../../context/context";
import { getLastWeekDates } from "../../utils/helperFunctions";
import CheckAccountingBalance from "../QuikAccess/CheckAccountingBalance";
export default function GSTReport() {
  const [data, setData] = useState();
  const [gstCounterError, setGstCounterError] = useState([]);
  const [gstReporttitle, setGstReporttitle] = useState("");
  const [accounting_voucher_uuid, setAccounting_voucher_uuid] = useState([]);
  const [searchData, setSearchData] = useState({
    startDate: "",
    endDate: "",
    user_uuid: 0,
    status: 0,
  });
  const [expanded, setExpanded] = useState({});
  const [returnsPopup, setReturnsPopup] = useState();

  const toggleExpand = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  const { setNotification, setGstReportPopup } = useContext(context);

  useEffect(() => {
    let time = new Date();
    let curTime = "yy-mm-dd"
      .replace("mm", ("00" + (time?.getMonth() + 1)?.toString()).slice(-2))
      .replace("yy", ("0000" + time?.getFullYear()?.toString()).slice(-4))
      .replace("dd", ("00" + time?.getDate()?.toString()).slice(-2));
    let sTime = getLastWeekDates();
    sTime = "yy-mm-dd"
      .replace("mm", ("00" + (sTime?.getMonth() + 1)?.toString()).slice(-2))
      .replace("yy", ("0000" + sTime?.getFullYear()?.toString()).slice(-4))
      .replace("dd", ("00" + sTime?.getDate()?.toString()).slice(-2));
    console.log({ sTime, curTime });
    setSearchData((prev) => ({
      ...prev,
      startDate: sTime,
      endDate: curTime,
    }));
  }, []);
  const postGSTReport = async () => {
    if (!gstReporttitle) {
      setNotification({
        message: "Please enter GST Report title!",
        success: false,
      });
      return;
    }
    const response = await axios({
      method: "post",
      url: "/gstReturns/postGSTReturns",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        title: gstReporttitle,
        created_by: localStorage.getItem("user_uuid"),
        type: "gstr1",
        status: 0,
        accounting_voucher_uuid,
        json_data:JSON.stringify(data),
        from_date: new Date(searchData.startDate).getTime(),
        to_date: new Date(searchData.endDate).getTime(),
      },
    });
    if (response.data.success) {
      copyJson();
      setReturnsPopup(null);
      setGstReporttitle("");
    } else {
      setNotification({
        message: "Failed to save GST Report!",
        success: false,
      });
    }
  };

  const submitHandler = async () => {
    getGSTCounterError();
    let startDate = new Date(
      new Date(searchData.startDate).setHours(0, 0, 0, 0)
    ).getTime();
    let endDate = new Date().setDate(
      new Date(searchData.endDate).getDate() + 1
    );
    endDate = new Date(new Date(endDate).setHours(0, 0, 0, 0)).getTime();

    const response = await axios({
      method: "get",
      url:
        "/counters/getGSTReport?startDate=" + startDate + "&endDate=" + endDate,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setData(response.data.result);
      setAccounting_voucher_uuid(response.data.accounting_voucher_uuid);
    }
  };
  const renderJson = (data, parentKey = "") => {
    if (typeof data === "object" && data !== null) {
      return (
        <ul>
          {Object.keys(data).map((key) => {
            const newKey = parentKey ? `${parentKey}.${key}` : key;
            return (
              <li key={newKey}>
                {typeof data[key] === "object" ? (
                  <div>
                    <span onClick={() => toggleExpand(newKey)}>
                      {expanded[newKey] ? "-" : "+"} {key}:
                    </span>
                    {expanded[newKey] && renderJson(data[key], newKey)}
                  </div>
                ) : (
                  <div>
                    {key}: {String(data[key])}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      );
    }
    return <div>{String(data)}</div>;
  };

  const getGSTCounterError = async () => {
    const response = await axios({
      method: "get",
      url: "/counters/getGSTCounterErrorReport",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setGstCounterError(response.data.result);
    }
  };
  const copyJson = () => {
    navigator.clipboard
      .writeText(JSON.stringify(data, null, 2))
      .then(() => {
        setNotification({
          message: "JSON copied to clipboard!",
          success: true,
        });
      })
      .catch((err) => {
        setNotification({
          message: "Failed to copy JSON to clipboard!",
          success: false,
        });
      });
  };

  return (
    <>
      {returnsPopup ? (
        <div className="overlay" style={{ zIndex: "999999" }}>
          <div
            className="modal"
            style={{ height: "fit-content", width: "fit-content" }}
          >
            <div
              className="content"
              style={{
                height: "fit-content",
                padding: "20px",
                minWidth: "500px",
              }}
            >
              <div style={{ overflowY: "scroll" }}>
                <div className="form">
                  <div className="row">
                    <h1>GST Report</h1>
                  </div>

                  <div className="form">
                    <div className="row" style={{ alignItems: "end" }}>
                      <label className="selectLabel">
                        GST Return title
                        <input
                          type="text"
                          onChange={(e) => setGstReporttitle(e.target.value)}
                          value={gstReporttitle}
                          placeholder="title..."
                          className="searchInput"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="submit"
                    style={{
                      maxWidth: "250px",
                    }}
                    onClick={postGSTReport}
                  >
                    Save
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setReturnsPopup(null);
                }}
                className="closeButton"
              >
                x
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overlay" style={{ zIndex: "999999" }}>
          <div
            className="modal"
            style={{ height: "fit-content", width: "fit-content" }}
          >
            <div
              className="content"
              style={{
                height: "fit-content",
                padding: "20px",
                minWidth: "500px",
              }}
            >
              <div style={{ overflowY: "scroll" }}>
                <div className="form">
                  <div className="row">
                    <h1>GST Report</h1>
                  </div>

                  <div className="form">
                    <div className="row" style={{ alignItems: "end" }}>
                      <label className="selectLabel">
                        From
                        <input
                          type="date"
                          onChange={(e) =>
                            setSearchData((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          value={searchData.startDate}
                          placeholder="Search Counter Title..."
                          className="searchInput"
                          pattern="\d{4}-\d{2}-\d{2}"
                        />
                      </label>
                      <label className="selectLabel">
                        To
                        <input
                          type="date"
                          onChange={(e) =>
                            setSearchData((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          value={searchData.endDate}
                          placeholder="Search Route Title..."
                          className="searchInput"
                          pattern="\d{4}-\d{2}-\d{2}"
                        />
                      </label>
                      <button
                        type="button"
                        className="submit"
                        style={{
                          maxWidth: "250px",
                        }}
                        onClick={() => {
                          submitHandler();
                        }}
                      >
                        Search
                      </button>
                    </div>
                  </div>
                  {data ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {renderJson(data)}
                    </div>
                  ) : (
                    ""
                  )}

                  {data ? (
                    <button
                      type="button"
                      className="submit"
                      style={{
                        maxWidth: "250px",
                      }}
                      onClick={() => setReturnsPopup(true)}
                    >
                      Copy Json
                    </button>
                  ) : (
                    ""
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setGstReportPopup(null);
                }}
                className="closeButton"
              >
                x
              </button>
            </div>
          </div>
        </div>
      )}
      {gstCounterError?.length ? (
        <CheckAccountingBalance
          itemsData={gstCounterError}
          type={"counterGST"}
          onSave={() => {
            setGstCounterError([]);
          }}
        />
      ) : (
        ""
      )}
    </>
  );
}
