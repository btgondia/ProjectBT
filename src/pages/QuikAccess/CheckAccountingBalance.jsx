import axios from "axios";
import React, { useContext, useMemo } from "react";
import context from "../../context/context";


const CheckAccountingBalance = ({ onSave, itemsData, type }) => {
  const {fixAllGST} = useContext(context)
  const items = useMemo(() => itemsData, [itemsData]);
  const [checked, setChecked] = React.useState([]);
  const fixAll = async () => {
    const response = await axios({
      method: "put",
      url: "/ledger/fixeBalance",
      data: itemsData,
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log({ response });
    if (response.data.success) {
      onSave();
    }
  };

  return (
    <div className="overlay" style={{ zIndex: 99999999999 }}>
      <div
        className="modal"
        style={{
          height: "fit-content",
          width: "max-content",
          minWidth: "250px",
        }}
      >
        <div className="row">
          <h1>
            {type === "accounting"
              ? "Accounting Balance"
              : type === "GST Error"
              ? type
              : "Debit Credit"}
          </h1>
          {type === "accounting" ? (
            <button
              type="button"
              onClick={fixAll}
              className="submit"
              style={{ width: "300px", marginRight: "100px" }}
            >
              Fix All
            </button>
          ) : (
            ""
          )}
          {checked.length? (
            <button
              type="button"
              onClick={()=>{
                fixAllGST(checked)
                onSave()
              }}
              className="submit"
              style={{ width: "300px", marginRight: "100px" }}
            >
              Fix
            </button>
          ) : (
            ""
          )}
        </div>

        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
            width: "fit-content",
          }}
        >
          <div style={{ overflowY: "scroll", width: "100%" }}>
            {items.length ? (
              <div
                className="flex"
                style={{ flexDirection: "column", width: "100%" }}
              >
                <table
                  className="user-table"
                  style={{
                    width: "100%",
                    height: "fit-content",
                  }}
                >
                  <thead>
                    {type === "GST Error" ? (
                      <tr>
                        <th colSpan={2}>
                          <div className="t-head-element">Counter Title</div>
                        </th>
                        <th>
                          <div className="t-head-element">Invoice Number</div>
                        </th>
                        <th>
                          <div className="t-head-element">Date</div>
                        </th>

                        <th>
                          <div className="t-head-element">Error Type</div>
                        </th>
                        <th>
                          <div className="t-head-element">
                
                            <input
                              type="checkbox"
                              checked={checked.length === items.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setChecked(items.map((item) => item.accounting_voucher_uuid));
                                } else {
                                  setChecked([]);
                                }
                              }}
                            />
                          </div>
                        </th>
                      </tr>
                    ) : type === "accounting" ? (
                      <tr>
                        <th colSpan={3}>
                          <div className="t-head-element">Title</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">Opening Balance</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">Closing Balance</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">
                            Accounting Voucher Balance
                          </div>
                        </th>
                      </tr>
                    ) : (
                      <tr>
                        <th colSpan={2}>
                          <div className="t-head-element">Voucher Date</div>
                        </th>

                        <th colSpan={2}>
                          <div className="t-head-element">Voucher Amt</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">Debit</div>
                        </th>
                        <th colSpan={2}>
                          <div className="t-head-element">Credit</div>
                        </th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="tbody">
                    {items?.map((item, i) =>
                      type === "GST Error" ? (
                        <tr
                          key={
                            item?.ledger_uuid ||
                            item.counter_uuid ||
                            Math.random()
                          }
                          style={{
                            height: "30px",
                          }}
                        >
                          <td colSpan={2}>{item.title}</td>
                          <td>{(item.invoice_number || []).join(", ")}</td>
                          <td>
                            {new Date(item.voucher_date).toLocaleDateString()}
                          </td>
                          <td>{item.error_type}</td>
                          <td>
                            
                            <input
                              type="checkbox"
                              checked={checked.find(
                                (a) => a === item.accounting_voucher_uuid
                              )}
                              onChange={(e) => {
                                setChecked((prev) =>
                                  prev.find(
                                    (a) => a === item.accounting_voucher_uuid
                                  )
                                    ? prev.filter(
                                        (a) =>
                                          a !== item.accounting_voucher_uuid
                                      )
                                    : [...prev, item.accounting_voucher_uuid]
                                );
                              }}
                            />
                          </td>
                        </tr>
                      ) : type === "accounting" ? (
                        <tr
                          key={
                            item?.ledger_uuid ||
                            item.counter_uuid ||
                            Math.random()
                          }
                          style={{
                            height: "30px",
                          }}
                        >
                          <td colSpan={3}>{item.title}</td>
                          <td colSpan={2}>{item.opening_balance}</td>
                          <td colSpan={2}>{item.closing_balance}</td>
                          <td colSpan={2}>{item.amount}</td>
                        </tr>
                      ) : (
                        <tr
                          key={
                            item?.ledger_uuid ||
                            item.counter_uuid ||
                            Math.random()
                          }
                          style={{
                            height: "30px",
                          }}
                        >
                          <td colSpan={2}>
                            {new Date(item.voucher_date).toLocaleDateString()}
                          </td>
                          <td colSpan={2}>{item.amt}</td>
                          <td colSpan={2}>{item.credit}</td>
                          <td colSpan={2}>{item.debit}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="flex"
                style={{ flexDirection: "column", width: "100%" }}
              >
                <i>No Data</i>
              </div>
            )}
          </div>
          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckAccountingBalance;
