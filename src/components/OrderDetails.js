import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import { v4 as uuid } from "uuid";
import { Billing, AutoAdd } from "../functions";
import {
  ContentCopy,
  ReplayCircleFilledOutlined,
  Cancel,
} from "@mui/icons-material";
import { AddCircle as AddIcon, RemoveCircle } from "@mui/icons-material";
export function OrderDetails({ order, onSave, orderStatus }) {
  const [counters, setCounters] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [editOrder, setEditOrder] = useState(false);
  const [otherDetails, setOtherDetails] = useState(false);
  const [orderData, setOrderData] = useState();
  const [popup, setPopup] = useState(false);
  const [autoBills, setAutoBills] = useState([]);
  const [qty_details, setQtyDetails] = useState(false);
  const [users, setUsers] = useState([]);
  const [uuids, setUuid] = useState();
  const [popupDetails, setPopupDetails] = useState();
  const [copymsg, setCopymsg] = useState();
  const [focusedInputId, setFocusedInputId] = useState(0);
  const reactInputsRef = useRef({});
  const [deletePopup, setDeletePopup] = useState(false);
  const getUsers = async () => {
    const response = await axios({
      method: "get",
      url: "/users/GetUserList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("users", response);
    if (response.data.success) setUsers(response.data.result);
  };

  const getAutoBill = async () => {
    let data = [];
    const response = await axios({
      method: "get",
      url: "/autoBill/autoBillItem",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) data = response;
    const response1 = await axios({
      method: "get",
      url: "/autoBill/autoBillQty",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response1.data.success)
      data = data ? response1.data.result : [...data, ...response1.data.result];
    setAutoBills(data);
    console.log(data);
  };
  useEffect(() => {
    setOrderData({
      ...order,
      item_details: order.item_details.map((a) => ({
        ...itemsData.find((b) => b.item_uuid === a.item_uuid),
        ...a,
        uuid: uuid(),
        default: true,
      })),
    });
  }, []);
  const getItemsData = async () => {
    const response = await axios({
      method: "get",
      url: "/items/GetItemList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setItemsData(response.data.result);
  };

  const getCounter = async () => {
    const response = await axios({
      method: "get",
      url: "/counters/GetCounterList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounters(response.data.result);
  };
  useEffect(() => {
    getCounter();
    getItemsData();
    getAutoBill();
    getUsers();
  }, []);
  console.log(
    +order.status.map((a) => +a.stage || 0).reduce((c, d) => Math.max(c, d))
  );
  const jumpToNextIndex = (id) => {
    console.log(id);
    document.querySelector(`#${id}`).blur();
    const index = document.querySelector(`#${id}`).getAttribute("index");
    console.log("this is index", index);

    const nextElem = document.querySelector(`[index="${+index + 1}"]`);

    if (nextElem) {
      if (nextElem.id.includes("selectContainer-")) {
        console.log("next select container id: ", nextElem.id);
        reactInputsRef.current[
          nextElem.id.replace("selectContainer-", "")
        ].focus();
      } else {
        console.log("next input id: ", nextElem.id);
        setFocusedInputId("");
        setTimeout(
          () => document.querySelector(`[index="${+index + 1}"]`).focus(),
          250
        );
        return;
      }
    } else {
      let nextElemId = uuid();
      setFocusedInputId(`selectContainer-${nextElemId}`);
      setTimeout(
        () =>
          setOrderData((prev) => ({
            ...prev,
            item_details: [
              ...prev.item_details,
              {
                uuid: nextElemId,
                b: 0,
                p: 0,
                sr: prev.item_details.length + 1,
              },
            ],
          })),
        250
      );
    }
  };
  const onSubmit = async (type) => {
    let counter = counters.find(
      (a) => orderData.counter_uuid === a.counter_uuid
    );
    let data = {
      ...orderData,
      item_details: orderData.item_details.filter((a) => a.item_uuid),
    };
    if (type === "auto_add") {
      let autoAdd = await AutoAdd({
        counter,
        items: orderData.item_details,
        dbItems: orderData.item_details,
        autobills: autoBills,
      });
      data = { ...data, ...autoAdd, item_details: autoAdd.items };
    }

    let autoBilling = await Billing({
      counter,
      items: data.item_details,
      others: {},
      add_discounts: true,
    });
    data = {
      ...data,
      ...autoBilling,
      item_details: autoBilling.items,
    };
    data = {
      ...order,
      ...data,

      item_details: data.item_details.map((a) => ({
        ...a,
        unit_price: a.price,
        gst_percentage: a.item_gst,
        status: 0,
        price: a.item_price,
      })),

      orderStatus,
    };
    console.log(data);
    const response = await axios({
      method: "put",
      url: "/orders/putOrder",
      data,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setEditOrder(false);
    }
  };
  let listItemIndexCount = 0;
  return (
    <>
      <div className="overlay">
        <div
          className="modal"
          style={{ height: "fit-content", width: "80vw", padding: "50px" }}
        >
          <div className="inventory">
            <div
              className="accountGroup"
              id="voucherForm"
              action=""
              style={{
                height: "max-content",
                maxHeight: "500px",
                overflow: "scroll",
              }}
            >
              <div className="inventory_header">
                <h2>Order Details</h2>
              </div>

              <div className="topInputs">
                <div
                  className="inputGroup flex"
                  style={{
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <h2>
                    {counters.find(
                      (a) => a.counter_uuid === orderData.counter_uuid
                    )?.counter_title || ""}
                  </h2>
                  <button
                    style={{ width: "fit-Content" }}
                    className="item-sales-search"
                    onClick={() => setOtherDetails((prev) => !prev)}
                  >
                    Other Details
                  </button>
                  <button
                    style={{ width: "fit-Content", backgroundColor: "red" }}
                    className="item-sales-search"
                    onClick={() => setDeletePopup((prev) => true)}
                  >
                    Cancel Order
                  </button>
                  <button
                    style={{ width: "fit-Content" }}
                    className="item-sales-search"
                    onClick={() => setEditOrder((prev) => !prev)}
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div
                className="items_table"
                style={{ flex: "1", paddingLeft: "10px" }}
              >
                {otherDetails ? (
                  <table>
                    <thead
                      className="bb b--green"
                      style={{ position: "sticky", top: 0, zIndex: "100" }}
                    >
                      <>
                        <tr>
                          <th>Grand Total</th>
                          <th>{orderData?.order_grandtotal || 0}</th>
                          <th>Payment Total</th>
                          <th>{orderData?.payment_total || 0}</th>
                          <th style={{ width: "12%" }}>UUID</th>
                          <th
                            onClick={() => {
                              setCopymsg(true);
                              navigator.clipboard.writeText(
                                orderData?.order_uuid
                              );
                              setTimeout(() => setCopymsg(false), 1000);
                            }}
                            style={{
                              cursor: "pointer",
                              position: "relative",
                              width: "12%",
                            }}
                            onMouseOver={() => setUuid(true)}
                            onMouseLeave={() => setUuid(false)}
                          >
                            {orderData?.order_uuid?.substring(0, 7) + "..."}
                            {copymsg && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                }}
                              >
                                <div id="talkbubble">COPIED!</div>
                              </div>
                            )}
                            {"   "}
                            <ContentCopy
                              style={
                                uuids
                                  ? {
                                      fontSize: "12px",
                                      transform: "scale(1.5)",
                                    }
                                  : { fontSize: "12px" }
                              }
                              onClick={() => {
                                setCopymsg(true);
                                navigator.clipboard.writeText(
                                  orderData?.order_uuid
                                );
                                setTimeout(() => setCopymsg(false), 1000);
                              }}
                            />
                            {uuids && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                }}
                              >
                                <div id="talkbubble">
                                  {orderData?.order_uuid}
                                </div>
                              </div>
                            )}
                          </th>
                        </tr>
                        <tr>
                          <th colSpan={2} style={{ textAlign: "center" }}>
                            <button
                              style={{ width: "fit-Content" }}
                              className="item-sales-search"
                              onClick={() =>
                                setPopupDetails({
                                  type: "Status",
                                  data: orderData.status,
                                })
                              }
                            >
                              Status
                            </button>
                          </th>
                          <th colSpan={2} style={{ textAlign: "center" }}>
                            <button
                              style={{ width: "fit-Content" }}
                              className="item-sales-search"
                              onClick={() =>
                                setPopupDetails({
                                  type: "Delivery Return",
                                  data: orderData.delivery_return,
                                })
                              }
                            >
                              Delivery Return
                            </button>
                          </th>
                          <th colSpan={2} style={{ textAlign: "center" }}>
                            <button
                              style={{ width: "fit-Content" }}
                              className="item-sales-search"
                              onClick={() =>
                                setPopupDetails({
                                  type: "Auto Added",
                                  data: orderData.auto_Added,
                                })
                              }
                            >
                              Auto Added
                            </button>
                          </th>
                        </tr>
                      </>
                    </thead>
                  </table>
                ) : (
                  ""
                )}
                <table className="f6 w-100 center" cellSpacing="0">
                  <thead className="lh-copy" style={{ position: "static" }}>
                    <tr className="white">
                      <th className="pa2 tl bb b--black-20 w-30">Item Name</th>
                      <th className="pa2 tc bb b--black-20">Quantity(b)</th>
                      <th className="pa2 tc bb b--black-20">Quantity(p)</th>
                      <th className="pa2 tc bb b--black-20 ">Price</th>
                      {editOrder ? (
                        <th className="pa2 tc bb b--black-20 "></th>
                      ) : (
                        ""
                      )}
                    </tr>
                  </thead>
                  <tbody className="lh-copy">
                    {orderData?.item_details?.map((item, i) => {
                      return (
                        <tr key={i} style={{ height: "50px" }}>
                          <td className="ph2 pv1 tl bb b--black-20 bg-white">
                            <div className="inputGroup">
                              {editOrder && !item.default ? (
                                <Select
                                  ref={(ref) =>
                                    (reactInputsRef.current[item.uuid] = ref)
                                  }
                                  id={"item_uuid" + item.uuid}
                                  options={itemsData
                                    .sort((a, b) =>
                                      a.item_title.localeCompare(b.item_title)
                                    )
                                    .map((a, j) => ({
                                      value: a.item_uuid,
                                      label: a.item_title + "______" + a.mrp,
                                      key: a.item_uuid,
                                    }))}
                                  z
                                  onChange={(e) => {
                                    setTimeout(
                                      () => setQtyDetails((prev) => !prev),
                                      2000
                                    );
                                    setOrderData((prev) => ({
                                      ...prev,
                                      item_details: prev.item_details.map((a) =>
                                        a.uuid === item.uuid
                                          ? {
                                              ...a,
                                              ...itemsData.find(
                                                (b) => b.item_uuid === e.value
                                              ),
                                            }
                                          : a
                                      ),
                                    }));
                                    jumpToNextIndex(
                                      `selectContainer-${item.uuid}`
                                    );
                                  }}
                                  value={{
                                    value: item.item_uuid || "",
                                    label: item.item_title
                                      ? item.item_title + "______" + item.mrp
                                      : "",
                                    key: item.item_uuid || item.uuid,
                                  }}
                                  openMenuOnFocus={true}
                                  autoFocus={
                                    focusedInputId ===
                                      `selectContainer-${item.uuid}` ||
                                    (i === 0 && focusedInputId === 0)
                                  }
                                  menuPosition="fixed"
                                  menuPlacement="auto"
                                  placeholder="Item"
                                />
                              ) : (
                                itemsData.find(
                                  (a) => a.item_uuid === item.item_uuid
                                )?.item_title || ""
                              )}
                            </div>
                          </td>
                          <td
                            className="ph2 pv1 tc bb b--black-20 bg-white"
                            style={{ textAlign: "center" }}
                          >
                            {editOrder ? (
                              <input
                                id={"q" + item.uuid}
                                type="number"
                                className="numberInput"
                                onWheel={(e) => e.preventDefault()}
                                index={listItemIndexCount++}
                                value={item.b || 0}
                                onChange={(e) => {
                                  setOrderData((prev) => {
                                    setTimeout(
                                      () => setQtyDetails((prev) => !prev),
                                      2000
                                    );
                                    return {
                                      ...prev,
                                      item_details: prev.item_details.map((a) =>
                                        a.uuid === item.uuid
                                          ? { ...a, b: e.target.value }
                                          : a
                                      ),
                                    };
                                  });
                                }}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) =>
                                  e.key === "Enter"
                                    ? jumpToNextIndex("q" + item.uuid)
                                    : ""
                                }
                                disabled={!item.item_uuid}
                              />
                            ) : (
                              item.b || 0
                            )}
                          </td>
                          <td
                            className="ph2 pv1 tc bb b--black-20 bg-white"
                            style={{ textAlign: "center" }}
                          >
                            {editOrder ? (
                              <input
                                id={"p" + item.uuid}
                                type="number"
                                className="numberInput"
                                onWheel={(e) => e.preventDefault()}
                                index={listItemIndexCount++}
                                value={item.p || 0}
                                onChange={(e) => {
                                  setOrderData((prev) => {
                                    setTimeout(
                                      () => setQtyDetails((prev) => !prev),
                                      2000
                                    );
                                    return {
                                      ...prev,
                                      item_details: prev.item_details.map((a) =>
                                        a.uuid === item.uuid
                                          ? { ...a, p: e.target.value }
                                          : a
                                      ),
                                    };
                                  });
                                }}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) =>
                                  e.key === "Enter"
                                    ? jumpToNextIndex("p" + item.uuid)
                                    : ""
                                }
                                disabled={!item.item_uuid}
                              />
                            ) : (
                              item.p || 0
                            )}
                          </td>
                          <td
                            className="ph2 pv1 tc bb b--black-20 bg-white"
                            style={{ textAlign: "center" }}
                          >
                            Rs {item?.item_price || 0}
                          </td>
                          {editOrder ? (
                            <td
                              onClick={() =>
                                setOrderData((prev) => ({
                                  ...prev,
                                  item_details: prev.item_details.filter(
                                    (a) => !(a.uuid === item.uuid)
                                  ),
                                }))
                              }
                            >
                              <RemoveCircle
                                sx={{ fontSize: 40 }}
                                style={{ cursor: "pointer", color: "red" }}
                              />
                            </td>
                          ) : (
                            ""
                          )}
                        </tr>
                      );
                    })}
                    {editOrder ? (
                      <tr>
                        <td
                          onClick={() =>
                            setOrderData((prev) => ({
                              ...prev,
                              item_details: [
                                ...prev.item_details,
                                { uuid: uuid(), b: 0, p: 0 },
                              ],
                            }))
                          }
                        >
                          <AddIcon
                            sx={{ fontSize: 40 }}
                            style={{ color: "#4AC959", cursor: "pointer" }}
                          />
                        </td>
                      </tr>
                    ) : (
                      ""
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bottomContent"></div>
            </div>
            <button onClick={onSave} className="closeButton">
              x
            </button>
          </div>
          {editOrder ? (
            <div className="bottomContent" style={{ background: "white" }}>
              <button
                type="button"
                onClick={() => {
                  if (!order.item_details.filter((a) => a.item_uuid).length)
                    return;
                  setPopup(true);
                }}
              >
                Bill
              </button>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
      {popup ? (
        <NewUserForm onClose={() => setPopup(false)} onSubmit={onSubmit} />
      ) : (
        ""
      )}
      {popupDetails ? (
        <CheckingValues
          onSave={() => setPopupDetails(false)}
          popupDetails={popupDetails}
          users={users}
          items={itemsData}
        />
      ) : (
        ""
      )}
      {deletePopup ? (
        <DeleteOrderPopup
          onSave={() => {
            setDeletePopup(false);
            
          }}
          onDeleted={() => {
            setDeletePopup(false);
            onSave();
          }}
          order={order}
          counters={counters}
          items={itemsData}
        />
      ) : (
        ""
      )}
    </>
  );
}
const DeleteOrderPopup = ({ onSave, order, counters, items,onDeleted }) => {
  const [disable, setDisabled] = useState(true);
  useEffect(() => {
    setTimeout(() => setDisabled(false), 5000);
  }, []);
  const PutOrder = async () => {
    let time = new Date();
    let stage = order?.status?.length
      ? order?.status?.map((a) => +a.stage || 0)?.reduce((a, b) => Math.max(a, b))
      : order?.status[0]?.stage || 0;
    let data = {
      ...order,
      status: [
        ...order.status,
        {
          stage: 5,
          user_uuid: localStorage.getItem("user_uuid"),
          time: time.getTime(),
        },
      ],
      processing_canceled:
        +stage === 2
          ? order.processing_canceled.length
            ? [...order.processing_canceled, ...order.item_details]
            : order.item_details
          : order.processing_canceled || [],
      delivery_return:
        +stage === 4
          ? order.delivery_return.length
            ? [...order.delivery_return, ...order.item_details]
            : order.item_details
          : order.delivery_return || [],
      item_details: order.item_details.map((a) => ({ ...a, b: 0, p: 0 })),
    };

    let billingData = await Billing({
      replacement: data.replacement,
      counter: counters.find((a) => a.counter_uuid === data.counter_uuid),

      items: data.item_details.map((a) => {
        let itemData = items.find((b) => a.item_uuid === b.item_uuid);
        return {
          ...itemData,
          ...a,
          price: itemData?.price || 0,
        };
      }),
    });
    data = {
      ...data,
      ...billingData,
      item_details: billingData.items,
    };
    const response = await axios({
      method: "put",
      url: "/orders/putOrders",
      data: [data],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      onDeleted();
    }
  };
  return (
    <div className="overlay">
      <div
        className="modal"
        style={{
          height: "fit-content",
          width: "max-content",
          paddingTop: "50px",
        }}
      >
        <h3>Complete Order will be CANCELED</h3>

        <div className="flex">
          <button
            type="button"
            className="submit"
            onClick={() => PutOrder()}
            disabled={disable}
            style={{ opacity: disable ? "0.5" : "1" }}
          >
            Confirm
          </button>
        </div>

        <button onClick={onSave} className="closeButton">
          x
        </button>
      </div>
    </div>
  );
};
function NewUserForm({ onSubmit, onClose }) {
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
          <div style={{ overflowY: "scroll" }}>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit("auto_add");
                onClose();
              }}
            >
              <div className="row">
                <h1> Auto Add</h1>
              </div>

              <div className="formGroup">
                <div className="row">
                  <button type="submit" className="submit">
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSubmit();
                    }}
                    className="submit"
                  >
                    No
                  </button>
                </div>
              </div>
            </form>
          </div>
          <button onClick={onClose} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
function CheckingValues({ onSave, popupDetails, users, items }) {
  return (
    <div className="overlay" style={{ zIndex: 999999999 }}>
      <div
        className="modal"
        style={{ height: "fit-content", width: "max-content" }}
      >
        <h1>{popupDetails.type}</h1>
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
            width: "fit-content",
          }}
        >
          <div style={{ overflowY: "scroll", width: "100%" }}>
            {popupDetails.type === "Status" ? (
              <div
                className="flex"
                style={{ flexDirection: "column", width: "100%" }}
              >
                <table
                  className="user-table"
                  style={{
                    width: "max-content",
                    height: "fit-content",
                  }}
                >
                  <thead>
                    <tr>
                      <th colSpan={2}>
                        <div className="t-head-element">Type</div>
                      </th>
                      <th>
                        <div className="t-head-element">User</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {popupDetails.data?.map((item, i) => (
                      <tr
                        key={item?.item_uuid || Math.random()}
                        style={{
                          height: "30px",
                        }}
                      >
                        <td colSpan={2}>
                          {+item.stage === 1
                            ? "Order Placed By"
                            : +item.stage === 2
                            ? "Order Processed By"
                            : +item.stage === 3
                            ? "Order Checked By"
                            : +item.stage === 4
                            ? "Order Delivered By"
                            : ""}
                        </td>
                        <td>
                          {users.find((a) => a.user_uuid === item?.user_uuid)
                            ?.user_title || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : popupDetails.type === "Delivery Return" ? (
              <div
                className="flex"
                style={{ flexDirection: "column", width: "100%" }}
              >
                <table
                  className="user-table"
                  style={{
                    width: "max-content",
                    height: "fit-content",
                  }}
                >
                  <thead>
                    <tr>
                      <th colSpan={2}>
                        <div className="t-head-element">Item</div>
                      </th>
                      <th>
                        <div className="t-head-element">Quantity</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {popupDetails.data?.map((item, i) => (
                      <tr
                        key={item?.item_uuid || Math.random()}
                        style={{
                          height: "30px",
                        }}
                      >
                        <td colSpan={2}>
                          {items.find((a) => a.item_uuid === item.item_uuid)
                            ?.item_title || ""}
                        </td>
                        <td>
                          {item?.b || 0}:{item.p || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : popupDetails.type === "Auto Added" ? (
              <div
                className="flex"
                style={{ flexDirection: "column", width: "100%" }}
              >
                <table
                  className="user-table"
                  style={{
                    width: "max-content",
                    height: "fit-content",
                  }}
                >
                  <thead>
                    <tr>
                      <th colSpan={2}>
                        <div className="t-head-element">Item</div>
                      </th>
                      <th>
                        <div className="t-head-element">Quantity</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {popupDetails.data?.map((item, i) => (
                      <tr
                        key={item?.item_uuid || Math.random()}
                        style={{
                          height: "30px",
                        }}
                      >
                        <td colSpan={2}>
                          {items.find((a) => a.item_uuid === item.item_uuid)
                            ?.item_title || ""}
                        </td>
                        <td>
                          {item?.b || 0}:{item.p || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              ""
            )}

            <div className="flex" style={{ justifyContent: "space-between" }}>
              <button type="button" className="submit" onClick={onSave}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}