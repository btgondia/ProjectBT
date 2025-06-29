import React from "react";

const LedgerReportPDF = ({
  data = [],
  from_date = new Date(),
  to_date = new Date(),
  getLedgerNames = (details) => "",
  componentRef,
  openBalance = 0,
  creditTotal = 0,
  debitTotal = 0,
}) => {
  return (
    <div className="order-print-layout">
      <div ref={componentRef}>
        <div
          style={{
            width: "170mm",
            height: "256mm",
            border: "1px solid black",
            pageBreakAfter: "always",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <table style={{ width: "100%" }}>
           
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "larger",
                          lineHeight: 0.5,
                          textAlign: "center",
                        }}
                        colSpan={28}
                      >
                        Bharat Traders
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "x-small",
                          textAlign: "center",
                        }}
                        colSpan={28}
                      >
                        Ganesh Nagar, Near Sharda Convent School,
                        <br /> Ganesh Nagar, Gondia - 441401
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "x-small",
                          textAlign: "center",
                        }}
                        colSpan={28}
                      >
                        Phone: 9422551074
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "x-small",
                          textAlign: "center",
                        }}
                        colSpan={28}
                      >
                        Email: bharattradersgondia96@gmail.com
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "x-small",
                          textAlign: "center",
                        }}
                        colSpan={28}
                      >
                        GSTIN: 27ABIPR1186M1Z2
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "x-small",
                          textAlign: "center",
                        }}
                        colSpan={28}
                      >
                        FSSAI : 11523065000057
                      </td>
                    </tr>
                  
            <tr>
              <th colSpan={28}>
                <hr
                  style={{
                    height: "3px",
                    backgroundColor: "#000",
                    width: "100%",
                  }}
                />
              </th>
            </tr>
            <tr>
              <td
                style={{ fontWeight: "600", fontSize: "x-small" }}
                colSpan={14}
              >
                From Date:{" "}
                {"dd/mm/yy"
                  .replace(
                    "mm",
                    ("00" + (from_date?.getMonth() + 1).toString()).slice(-2)
                  )
                  .replace(
                    "yy",
                    ("0000" + from_date?.getFullYear().toString()).slice(-4)
                  )
                  .replace(
                    "dd",
                    ("00" + from_date?.getDate().toString()).slice(-2)
                  )}
              </td>
              <td
                style={{ fontWeight: "600", fontSize: "x-small" }}
                colSpan={14}
              >
                To Date:{" "}
                {"dd/mm/yy"
                  .replace(
                    "mm",
                    ("00" + (to_date?.getMonth() + 1).toString()).slice(-2)
                  )
                  .replace(
                    "yy",
                    ("0000" + to_date?.getFullYear().toString()).slice(-4)
                  )
                  .replace(
                    "dd",
                    ("00" + to_date?.getDate().toString()).slice(-2)
                  )}
              </td>
            </tr>
            <tr>
              <th colSpan={28}>
                <hr
                  style={{
                    height: "3px",
                    backgroundColor: "#000",
                    width: "100%",
                  }}
                />
              </th>
            </tr>
            <tr
              style={{
                backgroundColor: "#EDEDED",
              }}
            >
              <th style={{ fontWeight: "600", fontSize: "x-small" }}>S.</th>
              <th
                style={{ fontWeight: "600", fontSize: "x-small" }}
                colSpan={3}
              >
                Date
              </th>
              <th
                style={{ fontWeight: "600", fontSize: "x-small" }}
                colSpan={10}
              >
                Ledger
              </th>
              <th
                style={{ fontWeight: "600", fontSize: "x-small" }}
                colSpan={3}
              >
                Ref. #
              </th>
              <th
                style={{ fontWeight: "600", fontSize: "x-small" }}
                colSpan={3}
              >
                Type
              </th>
              <th
                style={{ fontWeight: "600", fontSize: "x-small" }}
                colSpan={2}
              >
                Debit
              </th>
              <th
                style={{ fontWeight: "600", fontSize: "x-small" }}
                colSpan={2}
              >
                Credit
              </th>
              <th
                style={{ fontWeight: "600", fontSize: "x-small" }}
                colSpan={2}
              >
                Balance
              </th>
            </tr>
            <tr>
              <th colSpan={28}>
                <hr
                  style={{
                    height: "3px",
                    backgroundColor: "#000",
                    width: "100%",
                  }}
                />
              </th>
            </tr>

            {data?.map((item, i, array) => (
              <tr
                key={Math.random()}
                style={{
                  height: "30px",
                  cursor: "pointer",
                  width: "fit-content",
                }}
              >
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                >
                  {i + 1}{" "}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={3}
                >
                  {item.voucher_date
                    ? new Date(+item.voucher_date).toDateString()
                    : "Unknown"}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={10}
                >
                  {getLedgerNames(item.details)}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={3}
                >
                  {item.accounting_voucher_number || item.invoice_number || ""}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={3}
                >
                  {item.type}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={2}
                >
                  {item.amount < 0 ? -item.amount : ""}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={2}
                >
                  {item.amount > 0 ? item.amount : ""}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={2}
                >
                  {item.balance || ""}
                </td>
              </tr>
            ))}
            <tr
                key={Math.random()}
                style={{
                  height: "30px",
                  cursor: "pointer",
                  width: "fit-content",
                  borderTop: "1px solid black",
                }}
              >
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                >
              
                </td>
               
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={13}
                >
                  Opening Balance:{openBalance}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={3}
                >
                 
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={3}
                >
       
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={2}
                >
                  {debitTotal}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={2}
                >
                  {creditTotal}
                </td>
                <td
                  style={{
                    fontWeight: "600",
                    fontSize: "x-small",
                    textAlign: "center",
                  }}
                  colSpan={2}
                >
            
                </td>
              </tr>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LedgerReportPDF;
