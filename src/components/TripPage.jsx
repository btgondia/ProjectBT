import React from "react";

const TripPage = ({
  trip_title,
  users,
  trip_uuid,
  created_at,
  cheque,
  replacement,
  sales_return,
  coin,
  cash,
  amt,
  formatAMPM,
  unpaid_invoice,
}) => {
  if (!trip_title) return <div />;
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
            {trip_title}
          </td>
        </tr>
        <tr>
          <td
            colSpan={2}
            style={{
              fontWeight: "600",
              fontSize: "larger",
            }}
          >
            {users.map((a, i) =>
              i === 0 ? a?.user_title : ", " + a?.user_title
            )}
          </td>{" "}
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
            Trip UUID : {trip_uuid}
          </td>
          <td></td>
        </tr>
        <tr>
          <td
            style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}
          >
            Trip Created At : {created_at}
          </td>
          <td></td>
        </tr>
        <tr>
          <td
            style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}
          >
            Statement Printed At : {formatAMPM(new Date())}
          </td>
          <td></td>
        </tr>
      </table>
      <table style={{ margin: "10px" }}>
        <tr>
          <td
            style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}
          >
            Total Cash : {cash}
          </td>
        </tr>
        <tr>
          <td
            style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}
          >
            Coin : {coin}
          </td>
        </tr>
        <tr>
          <td
            style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}
          >
            Total amount : {amt}
          </td>
        </tr>
      </table>
      {cheque?.length ? (
        <table style={{ margin: "10px", width: "100%" }}>
          <tr>
            <td
              style={{
                fontWeight: "600",
                fontSize: "small",
                textAlign: "left",
              }}
            >
              Cheque Details
            </td>
          </tr>
          <tr>
            <th style={{ border: "1px solid #000" }}>Counter</th>
            <th style={{ border: "1px solid #000" }}>Amount</th>
            <th style={{ border: "1px solid #000" }}>Invoice Number</th>
          </tr>
          {cheque.map((item) => (
            <tr>
              <td style={{ border: "1px solid #000" }}>{item.counter_title}</td>
              <td style={{ border: "1px solid #000" }}>{item.amt}</td>
              <td style={{ border: "1px solid #000" }}>
                {item.invoice_number}
              </td>
            </tr>
          ))}
        </table>
      ) : (
        ""
      )}

      {unpaid_invoice?.length ? (
        <table style={{ margin: "10px", width: "100%" }}>
          <tr>
            <td
              style={{
                fontWeight: "600",
                fontSize: "small",
                textAlign: "left",
              }}
            >
              Unpaid Invoice:
            </td>
          </tr>
          <tr>
            <th style={{ border: "1px solid #000" }}>Counter</th>
            <th style={{ border: "1px solid #000" }}>Amount</th>
            <th style={{ border: "1px solid #000" }}>Invoice Number</th>
          </tr>
          {unpaid_invoice.map((item) => (
            <tr>
              <td style={{ border: "1px solid #000" }}>{item.counter_title}</td>
              <td style={{ border: "1px solid #000" }}>{item.amount}</td>
              <td style={{ border: "1px solid #000" }}>
                {item.invoice_number}
              </td>
            </tr>
          ))}
        </table>
      ) : (
        ""
      )}
      {replacement?.length ? (
        <table style={{ margin: "10px", width: "100%" }}>
          <tr>
            <td
              style={{
                fontWeight: "600",
                fontSize: "small",
                textAlign: "left",
              }}
            >
              Counter Wise Replacements:
            </td>
          </tr>
          <tr>
            <th style={{ border: "1px solid #000" }}>Counter</th>
            <th style={{ border: "1px solid #000" }}>Replacement</th>
            <th style={{ border: "1px solid #000" }}>Shortage</th>
            <th style={{ border: "1px solid #000" }}>Adjustment</th>
            <th style={{ border: "1px solid #000" }}>Invoice Number</th>
          </tr>
          {replacement.map((item) => (
            <tr>
              <td style={{ border: "1px solid #000" }}>{item.counter_title}</td>
              <td style={{ border: "1px solid #000" }}>{item.replacement}</td>
              <td style={{ border: "1px solid #000" }}>{item.shortage}</td>
              <td style={{ border: "1px solid #000" }}>{item.adjustment}</td>
              <td style={{ border: "1px solid #000" }}>
                {item.invoice_number}
              </td>
            </tr>
          ))}
          <tr style={{ fontWeight: "bold" }}>
            <td style={{ border: "1px solid #000" }}>Total</td>
            <td style={{ border: "1px solid #000" }}>
              {replacement?.length > 1
                ? replacement
                    .map((a) => +a.replacement || 0)
                    .reduce((a, b) => a + b)
                : replacement[0].replacement}
            </td>
            <td style={{ border: "1px solid #000" }}>
              {replacement?.length > 1
                ? replacement
                    .map((a) => +a.shortage || 0)
                    .reduce((a, b) => a + b)
                : replacement[0].shortage}
            </td>
            <td style={{ border: "1px solid #000" }}>
              {replacement?.length > 1
                ? replacement
                    .map((a) => +a.adjustment || 0)
                    .reduce((a, b) => a + b)
                : replacement[0].adjustment}
            </td>
            <td style={{ border: "1px solid #000" }}></td>
          </tr>
        </table>
      ) : (
        ""
      )}
      {sales_return?.length ? (
        <table style={{ margin: "10px", width: "100%" }}>
          <tr>
            <td
              style={{
                fontWeight: "600",
                fontSize: "small",
                textAlign: "left",
              }}
            >
              Sales Return Items:
            </td>
          </tr>
          <tr>
            <th style={{ border: "1px solid #000" }}>Item</th>
            <th style={{ border: "1px solid #000" }}>Quantity</th>
          </tr>
          {sales_return
            .sort((a, b) => a.item_title?.localeCompare(b.item_title))
            .map((item) => (
              <tr>
                <td style={{ border: "1px solid #000" }}>{item.item_title}</td>
                <td style={{ border: "1px solid #000" }}>
                  {item.b}:{item.p}
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

export default TripPage;
