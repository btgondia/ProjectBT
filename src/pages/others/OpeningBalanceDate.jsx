import axios from "axios";
import React, { useState, useContext, useEffect } from "react";
import context from "../../context/context";
import {
  getFormateDate,
  getMidnightTimestamp,
} from "../../utils/helperFunctions";

export default function OpeningBalanceDate() {
  const [data, setData] = useState(new Date().getTime());

  const { setNotification, setOpeningBalanceDatePopup } = useContext(context);

  //post request to save bank statement import
  const saveBankStatementImport = async (e) => {
    e.preventDefault();

    const res = await axios({
      method: "put",
      url: "/details/putOpeningBalanceDate",
      data: {
        date: data,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    setNotification(res.data);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
    if (res.data.success) setOpeningBalanceDatePopup(false);
  };
  //get request to get bank statement import
  const getBankStatementImport = async () => {
    try {
      const res = await axios.get("/details/getOpeningBalanceDate");
      setData(res.data.result);
    } catch (error) {
     
    }
  };
  useEffect(() => {
    getBankStatementImport();
  }, []);

  return (
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
            width: "fit-content",
          }}
        >
          <div style={{ overflowY: "scroll" }}>
            <form className="form" onSubmit={saveBankStatementImport}>
              <div className="row">
                <h1>Opening Balance Default Date</h1>
              </div>

              <div className="form">
                <div className="row">
                  <label className="selectLabel">
                    Date
                    <input
                      type="date"
                      onChange={(e) =>
                        setData(new Date(e.target.value).getTime())
                      }
                      value={getFormateDate(new Date(+data))}
                      placeholder="Search Counter Title..."
                      className="searchInput"
                      pattern="\d{4}-\d{2}-\d{2}"
                    />
                  </label>
                </div>
              </div>

              <button type="submit" className="submit">
                Save changes
              </button>
            </form>
          </div>
          <button
            onClick={() => setOpeningBalanceDatePopup(false)}
            className="closeButton"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
