import axios from "axios";
import React, { useState, useContext, useEffect } from "react";

import Select from "react-select";
import context from "../../context/context";

const dateFormats = [
  "dd/mm/yy",
  "dd/mm/yyyy",
  "dd-mm-yy",
  "dd-mm-yyyy",
  "mm/dd/yy",
  "mm/dd/yyyy",
  "mm-dd-yy",
  "mm-dd-yyyy",
];
export default function BankStatementImport() {
  const [data, setData] = useState({});

  const { setBankStatementImport, setNotification, view } = useContext(context);

  //post request to save bank statement import
  const saveBankStatementImport = async (e) => {
    e.preventDefault();

      const res = await axios({
        method: "put",
        url: "/details/putBankStatementItem",
        data,
        headers: {
          "Content-Type": "application/json",
        },
      });
      setNotification(res.data);
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      if(res.data.success)
      setBankStatementImport(false);
    
  };
  //get request to get bank statement import
  const getBankStatementImport = async () => {
    try {
      const res = await axios.get("/details/getBankStatementItem");
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
                <h1>Bank Statement Import</h1>
              </div>

              <div className="form">
                <div className="row">
                  <label className="selectLabel">
                    Start From Line
                    <input
                      type="number"
                      name="route_title"
                      className="numberInput"
                      value={data?.start_from_line}
                      onChange={(e) =>
                        setData({
                          ...data,
                          start_from_line: e.target.value,
                        })
                      }
                      maxLength={42}
                    />
                  </label>
                </div>
                <div className="row">
                  <label className="selectLabel">
                    Data Column
                    <input
                      type="text"
                      name="route_title"
                      className="numberInput"
                      value={data?.data_column}
                      onChange={(e) => {
                        if (
                          /^[A-Za-z]+$/.test(e.target.value) ||
                          e.target.value === ""
                        ) {
                          setData({
                            ...data,
                            data_column: e.target.value.toUpperCase(),
                          });
                        }
                      }}
                      maxLength={42}
                    />
                  </label>
                </div>
                <div className="row">
                  <label className="selectLabel">
                    Narration Column
                    <input
                      type="text"
                      name="route_title"
                      className="numberInput"
                      value={data?.narration_column}
                      onChange={(e) => {
                        if (
                          /^[A-Za-z]+$/.test(e.target.value) ||
                          e.target.value === ""
                        ) {
                          setData({
                            ...data,
                            narration_column: e.target.value.toUpperCase(),
                          });
                        }
                      }}
                      maxLength={42}
                    />
                  </label>
                </div>
                <div className="row">
                  <label className="selectLabel">
                    Received Amount Column
                    <input
                      type="text"
                      name="route_title"
                      className="numberInput"
                      value={data?.received_amount_column}
                      onChange={(e) => {
                        if (
                          /^[A-Za-z]+$/.test(e.target.value) ||
                          e.target.value === ""
                        ) {
                          setData({
                            ...data,
                            received_amount_column:
                              e.target.value.toUpperCase(),
                          });
                        }
                      }}
                      maxLength={42}
                    />
                  </label>
                </div>
                <div className="row">
                  <label className="selectLabel">
                    Paid Amount Column
                    <input
                      type="text"
                      name="route_title"
                      className="numberInput"
                      value={data?.paid_amount_column}
                      onChange={(e) => {
                        if (
                          /^[A-Za-z]+$/.test(e.target.value) ||
                          e.target.value === ""
                        ) {
                          setData({
                            ...data,
                            paid_amount_column: e.target.value.toUpperCase(),
                          });
                        }
                      }}
                      maxLength={42}
                    />
                  </label>
                </div>
                <div className="row">
                  <label className="selectLabel">
                    Date Column
                    <Select
                      options={dateFormats.map((a) => ({
                        label: a,
                        value: a,
                      }))}
                      onChange={(e) => {
                        setData({
                          ...data,
                          date_column: e.value,
                        });
                      }}
                      value={
                        {
                          label: data?.date_column,
                          value: data?.date_column,
                        } || ""
                      }
                      openMenuOnFocus={true}
                      menuPosition="fixed"
                      menuPlacement="auto"
                      placeholder="Select"
                    />
                  </label>
                </div>
                <div className="row">
                  <label className="selectLabel">
                    Separator
                    <textarea
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      name="sort_order"
                      className="numberInput"
                      value={data?.separator?.toString()?.replace(/,/g, "\n")}
                      style={{ height: "50px" }}
                      onChange={(e) =>
                        setData({
                          ...data,
                          separator: e.target.value.split("\n"),
                        })
                      }
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
            onClick={() => setBankStatementImport(false)}
            className="closeButton"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
