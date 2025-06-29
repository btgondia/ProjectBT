import React from "react";

const TransactionsStatement = ({ cash_register, data }) => {
  const getDate = (value) => new Date(value)?.toLocaleString();
  const getListUserWise = data?.transactions
    ?.filter((a) => a.type === "in")
    .reduce((acc, curr) => {
      if (acc[curr.user_title]) {
        acc[curr.user_title] += curr.amount;
      } else {
        acc[curr.user_title] = curr.amount;
      }
      return acc;
    }, {});
  return (
    <>
      <table style={{ width: "100%", margin: "10px" }}>
        <tr style={{ width: "100%" }}>
          <td
            colSpan={2}
            style={{
              width: "100%",
              fontSize: "xx-large",
              fontWeight: "bolder",
            }}
          >
            Cash Register Details
          </td>
        </tr>
        <tr>
          <td
            style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}
          ></td>
          <td></td>
        </tr>
        <tr>
          <td
            style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}
          >
            Cash Register UUID : {cash_register?.register_uuid}
          </td>
          <td></td>
        </tr>
        <tr>
          <td
            style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}
          >
            Cash Register Created At : {getDate(cash_register?.created_at)}
          </td>
          <td></td>
        </tr>
        <tr>
          <td
            style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}
          >
            Statement Printed At : {getDate(Date.now())}
          </td>
          <td></td>
        </tr>
        <tr>
          <td
            style={{
              paddingTop: "10px",
              fontWeight: "600",
              fontSize: "small",
              textAlign: "left",
            }}
          >
            <b>Total Received : {data?.grand_total}</b>
          </td>
        </tr>
        <tr>
          <td
            style={{
              paddingTop: "10px",
              fontWeight: "600",
              fontSize: "small",
              textAlign: "left",
            }}
          >
            <b>Expense Total : {data?.expense_total}</b>
          </td>
        </tr>
      </table>
      <table style={{ margin: "10px", width: "calc(100% - 18px)" }}>
        <tr>
          <td
            style={{
              fontWeight: "600",
              fontSize: "small",
              textAlign: "left",
            }}
          >
            Received:
          </td>
        </tr>
        <tr>
          <th style={{ border: "1px solid #000" }}>Created At</th>
          <th style={{ border: "1px solid #000" }}>Amount</th>
          <th style={{ border: "1px solid #000" }}>Delivered by</th>
          <th style={{ border: "1px solid #000" }}>Invoice Number</th>
        </tr>
        {data?.transactions
          ?.filter((a) => a.type === "in")
          .map((i) => (
            <tr>
              <td style={{ border: "1px solid #000" }}>
                {getDate(+i.created_at)}
              </td>
              <td style={{ border: "1px solid #000", textAlign: "right" }}>
                Rs.{i.amount}
              </td>
              <td style={{ border: "1px solid #000", textAlign: "right" }}>
                {i.user_title}
              </td>
              <td style={{ border: "1px solid #000", textAlign: "right" }}>
                {i.counter_title}-{i.invoice_number}
              </td>
            </tr>
          ))}
      </table>
      {getListUserWise ? (
        <table style={{ margin: "10px", width: "calc(100% - 18px)" }}>
          <tr>User Total</tr>
          {Object.keys(getListUserWise).map((i) => (
            <tr>
              <td>{i || "None"}</td>
              <td style={{ textAlign: "right" }}>
                Rs.{getListUserWise[i]?.toFixed(2)}
              </td>
            </tr>
          ))}
        </table>
      ) : (
        ""
      )}
      {data?.transactions?.filter((a) => a.type === "out")?.length ? (
        <table style={{ margin: "10px", width: "calc(100% - 18px)" }}>
          <tr>
            <td
              style={{
                fontWeight: "600",
                fontSize: "small",
                textAlign: "left",
              }}
            >
              Expanses:
            </td>
          </tr>
          <tr>
            <th style={{ border: "1px solid #000" }}>Created At</th>
            <th style={{ border: "1px solid #000" }}>Amount</th>
            <th style={{ border: "1px solid #000" }}>Category</th>
            <th style={{ border: "1px solid #000" }}>Remarks</th>
          </tr>
          {data?.transactions
            .filter((a) => a.type === "out")
            ?.map((i) => (
              <tr>
                <td style={{ border: "1px solid #000" }}>
                  {getDate(+i.created_at)}
                </td>
                <td style={{ border: "1px solid #000", textAlign: "right" }}>
                  Rs.{-i.amount}
                </td>
                <td style={{ border: "1px solid #000", textAlign: "right" }}>
                  {i.expense_title}
                </td>
                <td style={{ border: "1px solid #000", textAlign: "right" }}>
                  {i.remarks}
                </td>
              </tr>
            ))}
        </table>
      ) : (
        ""
      )}
    </>
  );
};

export default TransactionsStatement;
