import QrCode from "react-qr-code";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";

const OrderPrint2 = ({
  renderID,
  counter,
  order = { item_details: [] },
  allOrderItems,
  date = "",
  user = {},
  itemData = [],
  item_details = [],
  reminderDate,
  footer = false,
  route = [],
  defaultOrder = { item_details: [] },
  hsn_code = [],
  total_page = 0,
  current_page = 0,
}) => {
  const isEstimate = order?.order_type === "E";
  const [gstValues, setGstVAlues] = useState([]);
  const [cessValues, setCESSVAlues] = useState([]);
  const [appliedCounterCharges, setAppliedCounterCharges] = useState(null);

  const css_percentage = useMemo(() => {
    let css = 0;
    for (let a of item_details) {
      if (a.css_percentage) css += a.css_percentage;
    }
    return css;
  }, [item_details]);
  const chcekIfDecimal = (value) => {
    if (value.toString().includes(".")) {
      return parseFloat(value || 0).toFixed(2);
    } else {
      return value;
    }
  };
  const getAppliedCounterCharges = async (charges_uuid) => {
    try {
      const response = await axios.post(`/counterCharges/list`, {
        charges_uuid,
      });
      if (response.data.success) setAppliedCounterCharges(response.data.result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (order?.counter_charges?.length)
      getAppliedCounterCharges(order?.counter_charges);
  }, [order?.counter_charges]);

  const itemDetails = useMemo(() => {
    let items = item_details?.map((a) => ({
      ...a,
      ...(itemData?.find((b) => b.item_uuid === a.item_uuid) || {}),
    }));
    if (!items?.length) return [];
    else if (items?.length === 1) return items;
    else return items;
  }, [item_details, itemData]);

  useEffect(() => {
    if (!defaultOrder?.item_details?.length) return;
    const arr = [];

    let itemsData = [];
    for (let item of defaultOrder.item_details) {
      let final_Amount =
        item.item_total /
        (1 + ((item?.gst_percentage || 0) + (item?.css_percentage || 0)) / 100);
      console.log({ final_Amount });
      itemsData.push({
        ...item,
        final_Amount: final_Amount,
      });
    }

    const gst_value = Array.from(
      new Set(itemsData.map((a) => +a.gst_percentage))
    );
    const css_value = Array.from(
      new Set(itemsData.map((a) => +a.css_percentage))
    );
    let css_arr = [];

    for (let a of gst_value) {
      const data = itemsData.filter((b) => +b.gst_percentage === a);
      const amt =
        data.length > 1
          ? data.map((b) => +b?.final_Amount).reduce((a, b) => a + b, 0)
          : data.length
          ? +data[0].final_Amount
          : 0;
      console.log({ amt, a });

      const value = (+amt * a) / 100;

      if (value)
        arr.push({
          value: a,
          tex_amt: amt.toFixed(2),
          amount: value.toFixed(2),
        });
    }

    for (let a of css_value) {
      const data = itemsData.filter((b) => +b.css_percentage === a);
      const amt = data.length
        ? data.map((b) => +b?.final_Amount).reduce((a, b) => a + b, 0)
        : 0;
      const value = (amt * a) / 100;
      if (value)
        css_arr.push({
          value: a,
          tex_amt: amt.toFixed(2),
          amount: value.toFixed(2),
        });
    }

    setCESSVAlues(css_arr);

    setGstVAlues(arr);
  }, [defaultOrder]);




  const itemDetailsMemo = useMemo(() => {
    return itemDetails?.map((item) => {
      const itemInfo = itemData.find((a) => a.item_uuid === item.item_uuid);
      let itemQty =
        (+item.b || 0) * (+itemInfo?.conversion || 1) + (+item.p || 0);
      let unit_price = (+item.item_total || 0) / (+itemQty || 1);
      let tex_amt =
        (+unit_price || 0) -
        ((+unit_price || 0) * 100) / (100 + (+item.gst_percentage || 0));

      let net_amt = item.item_total / (1 + item.gst_percentage / 100);
      let desc_a = item?.charges_discount?.length
        ? item?.charges_discount[0]?.value || 0
        : 0;
      let desc_b = item?.charges_discount?.length
        ? item?.charges_discount[1]?.value || 0
        : 0;

      let desc_amt_a = +unit_price * (desc_a || 0);
      let desc_amt_b = +unit_price * (desc_b || 0);
      let taxable_value = +item.item_total - desc_amt_a - desc_amt_b;
      return {
        ...item,
        item_total: item.item_total.toFixed(2),
        desc_amt_a: desc_amt_a.toFixed(2),
        desc_amt_b: desc_amt_b.toFixed(2),
        net_amt: net_amt.toFixed(2),
        tex_amt: tex_amt.toFixed(2),
        desc_a,
        desc_b,
        itemQty,
        taxable_value: taxable_value.toFixed(2),

      };
    });
  }, [itemDetails, itemData]);
  return (
    <div
      id={renderID}
      style={{
        width: "170mm",
        height: "128mm",

        pageBreakAfter: "always",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <table style={{ width: "100%", borderSpacing: "0px" }}>
        <tr style={{ height: "30mm" }}>
          <td style={{ fontSize: "8px" }}>
            {current_page}/{total_page}
          </td>
          <th style={{ textAlign: "start", fontSize: "small" }}>Tax Invoice</th>
        </tr>
        <tr style={{ height: "10mm" }}>
          <th style={{ textAlign: "start", fontSize: "small" }}>Seller Copy</th>
        </tr>

        <tr>
          <td style={{ width: "100%" }} colSpan={5}>
            <table style={{ width: "100%", borderSpacing: "0px" }}>
              <tr style={{ width: "100%" }}>
                <td>
                  <table
                    style={{
                      border: "1px solid black",
                      width: "100%",
                      borderSpacing: "0px",
                      height: "10mm",
                      padding: "1mm",
                    }}
                  >
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "2mm",
                          width: "",
                        }}
                      >
                        FROM:- BHARAT TRADERS
                      </td>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                          width: "30%",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          GST No:-
                        </span>{" "}
                        27ABIPR1186M1Z2
                      </td>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                          width: "40%",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          Invoice No:-
                        </span>{" "}
                        IN-215578-43171
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        Seller Address:- BEHIND SALES TAX OFFICE,
                      </td>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          PAN No:-
                        </span>{" "}
                        ABIPR11B6M
                      </td>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          Invoice No:-
                        </span>{" "}
                        IN-215578-43171
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        SHASTRI WARD GONDIA
                      </td>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          Phone No:-
                        </span>{" "}
                        9403061071
                      </td>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          Invoice No:-
                        </span>{" "}
                        IN-215578-43171
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                            fontSize: "2mm",
                          }}
                        >
                          Fssai Number:-{" "}
                        </span>
                        11517058000427
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <table
                    style={{
                      border: "1px solid black",
                      width: "100%",
                      borderSpacing: "0px",
                      height: "14mm",
                      padding: "1mm",
                    }}
                  >
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "2mm",
                          width: "30%",
                        }}
                      >
                        To:- {counter?.dms_buyer_name}
                      </td>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                            width: "40%",
                          }}
                        >
                          GST No:-
                        </span>{" "}
                        {counter?.gst_no}
                      </td>

                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                          width: "30%",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          Buyer Erp Id:-
                        </span>{" "}
                        {counter?.dms_buyer_id || ""}
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        Seller Address:- {counter?.dms_buyer_address || ""}
                      </td>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          PAN No:-
                        </span>{" "}
                      </td>

                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          Salesman Name:-
                        </span>{" "}
                        {user?.user_title}
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        Fssai Number:-
                      </td>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          Phone No:-
                        </span>{" "}
                        {counter?.mobile?.length
                          ? counter.mobile[0].mobile
                          : ""}
                      </td>

                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          Beat Name:-
                        </span>{" "}
                        {counter?.dms_beat_name || ""}
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      ></td>
                      <td></td>

                      <td
                        style={{
                          // fontWeight: "600",
                          fontSize: "2mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                          }}
                        >
                          Employee Contact No:-
                        </span>
                        {user?.user_mobile || ""}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
          <td>
            <table
              style={{
                border: "1px solid black",
                textAlign: "left",
                borderSpacing: "0px",
                marginLeft: "2mm",
                width: "25mm",
                height: "25mm",
                padding: "1mm",
              }}
            >
              <tr>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                  }}
                >
                  Company QR Code:
                </th>
              </tr>
              <tr>
                <td>
                  <QrCode
                    value={"abhbnhbh"}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    style={{ width: "18mm", height: "18mm", marginTop: "2mm" }}
                    level="H"
                  />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td colSpan={6}>
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                margin: 0,
                borderSpacing: "0px",
              }}
            >
              <tr
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  width: "100%",
                }}
              >
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  S No.
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "10%",
                  }}
                >
                  Item ERP id
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "30%",
                  }}
                  colSpan={3}
                >
                  Item Name
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  MRP (₹)
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "7%",
                  }}
                >
                  Free Qty
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  Invoice/Delivery Qty
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  Price/Piece
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  Net Amt. (₹)
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  Secondary Dis. ₹(%)
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "10%",
                  }}
                >
                  Cash Dis. ₹(%)
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  Taxable Value (₹)
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  GST (%)
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  GST Amt. (₹)
                </th>
                <th
                  style={{
                    fontWeight: "600",
                    fontSize: "2mm",
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "0 1px",
                    borderTop: "none",
                    width: "5%",
                  }}
                >
                  Total Value (₹)
                </th>
              </tr>

              {itemDetailsMemo?.map((item, i) => {
                return (
                  <tr
                    style={{ border: "1px solid black" }}
                    className="order_item"
                  >
                    <td
                      style={{
                        padding: "0 5px",
                        fontWeight: "600",
                        fontSize: "2mm",
                        textAlign: "right",
                      }}
                    >
                      {item?.sr || i + 1}
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "center",
                        border: "1px solid black",
                      }}
                    >
                      {item?.dms_erp_id}
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontWeight: "600",
                        border: "1px solid #000",
                        fontSize: "2mm",
                        width: "100mm",
                      }}
                      colSpan={3}
                    >
                      {item?.dms_item_name}
                    </td>

                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {item?.mrp || 0}
                    </td>

                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      0 Cs, {item.free} Pcs
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                        fontWeight: "600",
                      }}
                    >
                      {item.itemQty}
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {((item.net_amt || 0) / (item.itemQty || 1)).toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {item.net_amt}
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {item.desc_amt_a} ({item.desc_a})
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {item.desc_amt_b} ({item.desc_b})
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {item.taxable_value}
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {item.gst_percentage || 0}
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {item.tex_amt}
                    </td>
                    <td
                      style={{
                        padding: "0 5px",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                        fontWeight: "600",
                      }}
                    >
                      {item.item_total || 0}
                    </td>
                  </tr>
                );
              })}

              {footer ? (
                <>
                  <tr style={{ border: "1px solid black" }}>
                    <th
                      style={{
                        fontWeight: "600",
                        fontSize: "2mm",
                        border: "1px solid black",
                      }}
                    >
                      Total
                    </th>
                    <td style={{ border: "1px solid black" }}></td>
                    <td colSpan={3} style={{ border: "1px solid black" }}></td>
                    <td
                      style={{
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                        padding: "0 5px",
                      }}
                    >
                      {order.item_details.reduce(
                        (a, b) => a + +(b.mrp || 0),
                        0
                      ) || 0}
                    </td>
                    <td
                      style={{
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                        padding: "0 5px",
                      }}
                    >
                      0 Cs{" "}
                      {order.item_details.reduce(
                        (a, b) => a + (b.free || 0),
                        0
                      ) || 0}{" "}
                      Pcs
                    </td>
                    <td
                      style={{
                        fontWeight: "600",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                        padding: "0 5px",
                      }}
                    >
                      {itemDetailsMemo.reduce(
                        (a, b) => a + +(b.itemQty || 0),
                        0
                      ) || 0}
                    </td>
                    <td style={{ border: "1px solid black" }}></td>
                    <td
                      style={{
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                        padding: "0 5px",
                      }}
                    >
                      {(
                        itemDetailsMemo.reduce(
                          (a, b) => a + +(b.net_amt || 0),
                          0
                        ) || 0
                      ).toFixed(2)}
                    </td>
                    <td
                      style={{
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {(
                        itemDetailsMemo.reduce(
                          (a, b) => a + +(b.desc_amt_a || 0),
                          0
                        ) || 0
                      ).toFixed(2)}
                    </td>
                    <td
                      style={{
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                        padding: "0 5px",
                      }}
                    >
                      {(
                        itemDetailsMemo.reduce(
                          (a, b) => a + +(b.desc_amt_b || 0),
                          0
                        ) || 0
                      ).toFixed(2)}
                    </td>
                    <td
                      style={{
                        fontWeight: "600",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {order.item_details.reduce(
                        (a, b) => a + (b.taxable_value || 0),
                        0
                      ) || 0}
                    </td>

                    <td style={{ border: "1px solid black" }}></td>
                    <td
                      style={{
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {(
                        itemDetailsMemo.reduce(
                          (a, b) => a + +(b.tex_amt || 0),
                          0
                        ) || 0
                      ).toFixed(2)}
                    </td>
                    <td
                      style={{
                        fontWeight: "600",
                        fontSize: "2mm",
                        textAlign: "right",
                        border: "1px solid black",
                      }}
                    >
                      {(
                        order.item_details.reduce(
                          (a, b) => a + (b.item_total || 0),
                          0
                        ) || 0
                      ).toFixed(2)}
                    </td>
                  </tr>
                </>
              ) : (
                ""
              )}
            </table>
          </td>
        </tr>

        {footer ? (
          <tr>
            <td colSpan={6}>
              <table
                style={{
                  borderSpacing: "0px",
                }}
              >
                <tr>
                  <td>
                    <table
                      style={{
                        border: "1px solid black",
                        textAlign: "start",
                        width: "56.58mm",
                        height: "20mm",
                        borderSpacing: "0px",
                        padding: "1mm",
                      }}
                    >
                      <tr>
                        <td
                          style={{
                            fontWeight: "600",
                            fontSize: "2mm",
                            width: "30%",
                          }}
                        >
                          CGST - 158.77 , SGST - 158.77 , IGST - 0.00 , UTGST -
                          0.00
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            fontSize: "2mm",
                            width: "30%",
                          }}
                        >
                          CREDIT NOTE Remarks: --
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            fontSize: "2mm",
                            width: "30%",
                          }}
                        >
                          DEBIT NOTE Remarks: --
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            fontSize: "2mm",
                            width: "30%",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "600",
                            }}
                          >
                            Amount in words:
                          </span>
                          {numberToWords(+order?.order_grandtotal || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            fontSize: "2mm",
                            width: "30%",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "600",
                            }}
                          >
                            Remarks:
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td>
                    <table
                      style={{
                        border: "1px solid black",
                        textAlign: "start",
                        width: "56.58mm",
                        height: "20mm",
                        borderSpacing: "0px",
                        padding: "1mm",
                      }}
                    >
                      <tr>
                        <td
                          style={{
                            fontWeight: "600",
                            fontSize: "2mm",
                            width: "30%",
                          }}
                        >
                          Additional Information:
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            fontWeight: "600",
                            fontSize: "2mm",
                            width: "30%",
                          }}
                        >
                          1.
                        </td>
                      </tr>
                      <tr>
                        <td></td>
                      </tr>
                      <tr>
                        <td></td>
                      </tr>
                      <tr>
                        <td></td>
                      </tr>
                    </table>
                  </td>
                  <td>
                    <table
                      style={{
                        border: "1px solid black",
                        textAlign: "start",
                        width: "56.58mm",
                        height: "20mm",
                        borderSpacing: "0px",
                        padding: "1mm",
                      }}
                    >
                      <tr>
                        <td
                          style={{
                            fontSize: "2mm",
                            width: "",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "600",
                            }}
                          >
                            CREDIT NOTE Adjustment:
                          </span>{" "}
                          + 0
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            fontSize: "2mm",
                            width: "",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "600",
                            }}
                          >
                            DEBIT NOTE Adjustment:
                          </span>{" "}
                          - 0
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            fontSize: "2mm",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "600",
                            }}
                          >
                            Round Oﬀ:
                          </span>{" "}
                          ₹ {order?.round_off || 0}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            fontSize: "10px",

                            fontWeight: "600",
                          }}
                        >
                          Total Value: ₹ {order?.order_grandtotal || 0}
                        </td>
                        <td></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        ) : (
          <></>
        )}
      </table>
    </div>
  );
};
function numberToWords(num) {
  if (num === 0) return "zero";

  const belowTwenty = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const thousands = ["", "thousand", "million", "billion"];

  function convert(n) {
    if (n === 0) return "";
    else if (n < 20) return belowTwenty[n] + " ";
    else if (n < 100)
      return tens[Math.floor(n / 10)] + " " + belowTwenty[n % 10] + " ";
    else
      return belowTwenty[Math.floor(n / 100)] + " hundred " + convert(n % 100);
  }

  let word = "";
  let i = 0;

  while (num > 0) {
    if (num % 1000 !== 0) {
      word = convert(num % 1000) + thousands[i] + " " + word;
    }
    num = Math.floor(num / 1000);
    i++;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).trim();
}
export default OrderPrint2;
