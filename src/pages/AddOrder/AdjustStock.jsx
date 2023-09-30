/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import "./index.css";

import Select from "react-select";

import { useReactToPrint } from "react-to-print";
let time = new Date();
const CovertedQty = (qty, conversion) => {
  let b = +qty / +conversion;
  b = Math.sign(b) * Math.floor(Math.sign(b) * b);
  let p = Math.floor(+qty % +conversion);
  return b + ":" + p;
};
const initials = {
  type: "SA",
  created_by: localStorage.getItem("user_uuid"),
  from_warehouse: 0,
  to_warehouse: "",
  created_at: time.getTime(),
  item_details: [],
};
export default function AdjustStock() {
  const [order, setOrder] = useState(initials);
  const [warehouse, setWarehouse] = useState([]);
  const [counterFilter] = useState("");
  const [category, setCategory] = useState([]);
  const [balanceOnly, setBalenceOnly] = useState(false);
  const [filterItems, setFilterItem] = useState("");

  // const selectRef = useRef();
  const [itemsData, setItemsData] = useState([]);
  const [qty_details, setQtyDetails] = useState(false);

  const reactInputsRef = useRef({});

  const [suggestionPopup, setSuggestionPopup] = useState(false);
  const componentRef = useRef(null);
  const getItemCategories = async () => {
    const response = await axios({
      method: "get",
      url: "/itemCategories/GetItemCategoryList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCategory(response.data.result);
  };

  const reactToPrintContent = useCallback(() => {
    return componentRef.current;
  }, []);
  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: "Statement",
    removeAfterPrint: true,
    onAfterPrint: () => setOrder(initials),
  });
  const getItemsData = async () => {
    const response = await axios({
      method: "get",
      url: "/items/GetItemStockList/" + order.from_warehouse,

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setItemsData(response.data.result);
  };
  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
  }
  const GetWarehouseList = async () => {
    const response = await axios({
      method: "get",
      url: "/warehouse/GetWarehouseList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success)
      setWarehouse(response.data.result.filter((a) => a.warehouse_title));
  };

  useEffect(() => {
    GetWarehouseList();
    getItemsData();
    getItemCategories();
    // escFunction({ key: "Enter" });
  }, []);

  useEffect(() => {
    setOrder((prev) => ({
      ...prev,
      item_details: prev.item_details.map((a) => ({
        ...a,
      })),
    }));
  }, [qty_details]);

  const onSubmit = async () => {
    let item_details = order.item_details
      .map((item) => ({
        ...item,
        b: 0,
        p:
          (+item.b || 0) * (+item.conversion || 0) +
          (+item.p || 0) -
          (+item.qty || 0),
      }))
      .filter((a) => a.p);
    setOrder((prev) => ({ ...prev, item_details }));
    const response = await axios({
      method: "post",
      url: "/vouchers/postVoucher",
      data: { ...order, item_details },
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response);
    if (response.data.success) {
      handlePrint();
    }
  };

  useEffect(() => {
    if (order.to_warehouse)
      setOrder((prev) => ({
        ...prev,
        item_details: itemsData
          .filter((a) => a.item_title && a.item_uuid)
          .sort((a, b) => a?.item_title?.localeCompare(b.item_title))
          .map((a) => {
            let qty =
              a?.stock?.find((b) => b.warehouse_uuid === order.to_warehouse)
                ?.qty || 0;
            let b = qty / +a.conversion;

            b = Math.sign(b) * Math.floor(Math.sign(b) * b);

            let p = Math.floor(qty % +a.conversion);
            console.log(qty, b, p);
            return {
              ...a,
              uuid: a.item_uuid,
              qty,
              b,
              p,
              adjusment: 0,
            };
          })
          .filter((a) => !balanceOnly || a.qty),
      }));
  }, [order.to_warehouse, balanceOnly]);

  return (
    <>
      <Sidebar />
      <div className="right-side">
        <Header />
        <div className="inventory">
          <div className="accountGroup" id="voucherForm" action="">
            <div className="inventory_header">
              <h2>Adjust Stock </h2>
            </div>

            <div className="topInputs">
              <div className="inputGroup">
                <label htmlFor="Warehouse">Warehouse</label>
                <div className="inputGroup" style={{ width: "400px" }}>
                  <Select
                    ref={(ref) => (reactInputsRef.current["1"] = ref)}
                    options={warehouse
                      ?.filter(
                        (a) =>
                          !counterFilter ||
                          a.warehouse_title
                            ?.toLocaleLowerCase()
                            ?.includes(counterFilter.toLocaleLowerCase())
                      )
                      .map((a) => ({
                        value: a.warehouse_uuid,
                        label: a.warehouse_title,
                      }))}
                    onChange={(doc) =>
                      setOrder((prev) => ({ ...prev, to_warehouse: doc.value }))
                    }
                    value={
                      order?.to_warehouse
                        ? {
                            value: order?.to_warehouse,
                            label: warehouse?.find(
                              (j) => j.warehouse_uuid === order.to_warehouse
                            )?.warehouse_title,
                          }
                        : ""
                    }
                    autoFocus={!order?.to_warehouse}
                    openMenuOnFocus={true}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder="Select"
                  />
                </div>
              </div>

              {order.to_warehouse ? (
                <>
                  <div className="inputGroup">
                    <label htmlFor="Warehouse">Item Title</label>
                    <input
                      type="text"
                      onChange={(e) => setFilterItem(e.target.value)}
                      value={filterItems}
                      placeholder="Item Title..."
                      className="searchInput"
                    />
                  </div>
                  <div className="inputGroup">
                    <div
                      className="inputGroup"
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingLeft: "60px",
                      }}
                    >
                      <input
                        type="checkbox"
                        value={balanceOnly}
                        onChange={(doc) => setBalenceOnly(doc.target.checked)}
                        style={{ transform: "scale(2)" }}
                      />
                      <label>Balance Only</label>
                    </div>
                  </div>
                </>
              ) : (
                ""
              )}
            </div>

            <div className="items_table" style={{ flex: "1", height: "auto" }}>
              <table className="f6 w-100 center" cellSpacing="0">
                <thead className="lh-copy" style={{ position: "static" }}>
                  <tr className="white">
                    <th className="pa2 tl bb b--black-20 w-30">Item Name</th>
                    <th className="pa2 tl bb b--black-20 w-30">MRP</th>
                    <th className="pa2 tc bb b--black-20">Boxes</th>
                    <th className="pa2 tc bb b--black-20">Pcs</th>
                    <th className="pa2 tc bb b--black-20">Adjustment</th>

                    <th className="pa2 tc bb b--black-20 "></th>
                  </tr>
                </thead>
                {order.to_warehouse ? (
                  <tbody className="lh-copy">
                    {order?.item_details
                      ?.filter(
                        (a) =>
                          !filterItems ||
                          a.item_title
                            .toLocaleLowerCase()
                            .includes(filterItems.toLocaleLowerCase())
                      )
                      .map((item, i) => (
                        <tr key={item.uuid}>
                          <td
                            className="ph2 pv1 tl bb b--black-20 bg-white"
                            style={{ width: "300px" }}
                          >
                            <div
                              className="inputGroup"
                              style={{ width: "300px" }}
                            >
                              {item.item_title}
                            </div>
                          </td>
                          <td
                            className="ph2 pv1 tl bb b--black-20 bg-white"
                            style={{ textAlign: "center" }}
                          >
                            {item.mrp}
                          </td>
                          <td
                            className="ph2 pv1 tc bb b--black-20 bg-white"
                            style={{ textAlign: "center" }}
                          >
                            <input
                              id={"q" + item.uuid}
                              style={{ width: "100px" }}
                              type="number"
                              className="numberInput"
                              onWheel={(e) => e.preventDefault()}
                              value={item.b || ""}
                              onChange={(e) => {
                                setOrder((prev) => {
                                  // setTimeout(
                                  //   () => setQtyDetails((prev) => !prev),
                                  //   2000
                                  // );
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
                              disabled={!item.item_uuid}
                            />
                          </td>
                          <td
                            className="ph2 pv1 tc bb b--black-20 bg-white"
                            style={{ textAlign: "center" }}
                          >
                            <input
                              id={"p" + item.uuid}
                              style={{ width: "100px" }}
                              type="number"
                              className="numberInput"
                              onWheel={(e) => e.preventDefault()}
                              value={item.p || ""}
                              onChange={(e) => {
                                setOrder((prev) => {
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
                              disabled={!item.item_uuid}
                            />
                          </td>
                          <td
                            className="ph2 pv1 tc bb b--black-20 bg-white"
                            style={{ textAlign: "center" }}
                          >
                            {CovertedQty(
                              (+item.b || 0) * (+item.conversion || 0) +
                                (+item.p || 0) -
                                (+item.qty || 0),
                              item.conversion
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                ) : (
                  ""
                )}
              </table>
            </div>

            <div className="bottomContent" style={{ background: "white" }}>
              <button
                type="button"
                onClick={() => {
                  if (!order.item_details.filter((a) => a.item_uuid).length)
                    return;
                  onSubmit();
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          top: -100,
          left: -180,
          zIndex: "-1000",
        }}
      >
        <div
          ref={componentRef}
          id="item-container"
          style={{
            // margin: "45mm 40mm 30mm 60mm",
            // textAlign: "center",
            height: "128mm",
            // padding: "10px"
          }}
        >
          <table
            className="user-table"
            style={{
              width: "170mm",
              // marginTop: "20mm",
              // marginLeft: "20mm",
              // marginRight: "20mm",
              border: "1px solid black",
              pageBreakInside: "auto",
              display: "block",
              fontSize: "small",
              fontWeight: "900",
            }}
          >
            <thead>
              <tr>
                <th
                  colSpan={5}
                  style={{
                    width: "170mm",
                    backgroundColor: "#fff",
                    fontWeight: "900",
                  }}
                >
                  In:{" "}
                  {
                    warehouse.find(
                      (a) => a.warehouse_uuid === order.to_warehouse
                    )?.warehouse_title
                  }
                </th>
              </tr>
              <tr>
                <th
                  colSpan={2}
                  style={{ backgroundColor: "#fff", fontWeight: "900" }}
                >
                  Created At: {new Date(order?.created_at).toDateString()} -{" "}
                  {formatAMPM(new Date(order?.created_at))}
                </th>
                <th
                  colSpan={3}
                  style={{ backgroundColor: "#fff", fontWeight: "900" }}
                >
                  Created By: {localStorage.getItem("user_title")}
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    width: "10mm",
                    backgroundColor: "#fff",
                    fontWeight: "900",
                  }}
                >
                  S.N
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  Item Name
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  MRP
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  Box
                </th>
                <th style={{ backgroundColor: "#fff", fontWeight: "900" }}>
                  Pcs
                </th>
              </tr>
            </thead>
            <tbody className="tbody">
              {category
                .sort((a, b) =>
                  a?.category_title?.localeCompare(b?.category_title)
                )
                .filter(
                  (a) =>
                    order?.item_details?.filter(
                      (b) => a.category_uuid === b.category_uuid
                    ).length
                )
                .map((a) => (
                  <>
                    <tr style={{ pageBreakAfter: "always", width: "100%" }}>
                      <td colSpan={11}>{a.category_title}</td>
                    </tr>
                    {order?.item_details
                      .filter((b) => a.category_uuid === b.category_uuid)
                      ?.sort((a, b) =>
                        a?.item_title?.localeCompare(b?.item_title)
                      )
                      .map((item, i, array) => (
                        <tr key={Math.random()}>
                          <td
                            className="flex"
                            style={{ justifyContent: "space-between" }}
                          >
                            {i + 1}
                          </td>

                          <td>{item.item_title || ""}</td>
                          <td>{item.mrp || ""}</td>
                          <td>{item.b || 0}</td>

                          <td>{item.p || 0}</td>
                        </tr>
                      ))}
                  </>
                ))}
              <tr key={Math.random()}>
                <td
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                ></td>

                <td>Total</td>
                <td></td>
                <td>
                  {" "}
                  {order?.item_details?.length > 1
                    ? order?.item_details
                        .map((a) => +a.b || 0)
                        .reduce((a, b) => a + b)
                    : order?.item_details.length
                    ? order?.item_details[0].b
                    : 0}
                </td>

                <td>
                  {" "}
                  {order?.item_details.length > 1
                    ? order?.item_details
                        .map((a) => +a.p || 0)
                        .reduce((a, b) => a + b)
                    : order?.item_details.length
                    ? order?.item_details[0].p
                    : 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {suggestionPopup ? (
        <SuggestionsPopup
          onSave={() => {
            setSuggestionPopup(null);
          }}
          warehouse={warehouse.find(
            (a) => a.warehouse_uuid === suggestionPopup
          )}
          itemsData={itemsData}
          order={order}
          setOrder={setOrder}
        />
      ) : (
        ""
      )}
    </>
  );
}

export function SuggestionsPopup({
  onSave,
  warehouse,
  itemsData,
  order,
  setOrder,
}) {
  const [items, setItems] = useState([]);
  const [selectedItems, setSeletedItems] = useState([]);
  const getItemSuggestionsData = async () => {
    const response = await axios.get(`warehouse/suggestions/${warehouse.warehouse_uuid}`)
		if (response.status !== 200) return
		setItems(response.data)
		setSeletedItems(response.data)
  };
  useEffect(() => {
    getItemSuggestionsData();
  }, []);
  return (
    <>
      <div className="overlay">
        <div
          className="modal"
          style={{
            height: "fit-content",
            width: "90vw",
            padding: "50px",
            zIndex: "999999999",
            border: "2px solid #000",
          }}
        >
          <div className="inventory">
            <div
              className="accountGroup"
              id="voucherForm"
              action=""
              style={{
                height: "400px",
                maxHeight: "500px",
                overflow: "scroll",
              }}
            >
              <div className="inventory_header">
                <h2>{warehouse?.warehouse_title || ""} Suggestions</h2>
              </div>
              <div className="table-container-user item-sales-container">
                <Table
                  warehouse_uuid={warehouse?.warehouse_uuid}
                  itemsDetails={items}
                  setSelectedOrders={setSeletedItems}
                  selectedOrders={selectedItems}
                />
              </div>
              <div className="flex" style={{ justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="submit"
                  style={{ opacity: items.length ? 1 : "0.5" }}
                  onClick={() => {
                    setOrder((prev) => ({
                      ...prev,
                      item_details: selectedItems,
                    }));
                    onSave();
                  }}
                  disabled={!items.length}
                >
                  Load All
                </button>
                <h3 style={{ margin: 0, padding: 0 }}>
                  Quantity:{" "}
                  {items.length > 1
                    ? items.map((a) => +a.b || 0).reduce((a, b) => a + b)
                    : items.length
                    ? items[0].b
                    : 0}
                </h3>

                <button type="button" className="submit" onClick={onSave}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function Table({
  itemsDetails,
  warehouse_uuid,
  selectedOrders,
  setSelectedOrders,
}) {
  console.log(selectedOrders);
  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
          <th colSpan={2}>Item Title</th>
          <th colSpan={2}>MRP</th>
          <th colSpan={2}>Suggestion Box</th>
          <th colSpan={2}>Stock</th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails
          ?.sort((a, b) => +a.item_uuid - +b.item_uuid)
          ?.map((item, i, array) => {
            let qty = item.stock.find(
              (a) => a.warehouse_uuid === warehouse_uuid
            )?.qty;
            return (
              <tr key={Math.random()} style={{ height: "30px" }}>
                <td
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrders((prev) =>
                      prev.filter((a) => a.item_uuid === item.item_uuid).length
                        ? prev.filter((a) => a.item_uuid !== item.item_uuid)
                        : [...(prev || []), item]
                    );
                  }}
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrders.find(
                      (a) => a.item_uuid === item.item_uuid
                    )}
                    style={{ transform: "scale(1.3)" }}
                  />
                  {i + 1}
                </td>

                <td colSpan={2}>{item.item_title || ""}</td>
                <td colSpan={2}>{item.mrp || ""}</td>
                <td colSpan={2}>{item.b || ""}</td>
                <td
                  colSpan={2}
                  style={{
                    color: qty === 0 ? "" : qty > 0 ? "#4ac959" : "red",
                  }}
                >
                  {CovertedQty(qty || 0, item.conversion || 1) || ""}
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}
