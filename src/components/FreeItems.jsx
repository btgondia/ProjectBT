import React, { useEffect, useState } from "react";

const FreeItems = ({ onSave, orders, itemsData, holdPopup, setOrder }) => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    setItems(
      itemsData
        .filter((a) => a.free_issue === "Y" && a.status)
        .map((a) => {
          let itemData = orders?.item_details?.find(
            (b) => b.item_uuid === a.item_uuid
          );
          if (itemData) {
            return { ...a, ...itemData };
          } else {
            return a;
          }
        })
    );
  }, [itemsData, orders?.item_details]);
 
  const postOrderData = async () => {
    let data = orders;
    let itemsdata = items.filter((a) => a.free);
    let filterItem = data?.item_details?.filter(
      (a) => !itemsdata.filter((b) => b.item_uuid === a.item_uuid).length
    );
    let NonFilterItem = data.item_details.filter(
      (a) => itemsdata.filter((b) => b.item_uuid === a.item_uuid).length
    );
    NonFilterItem = itemsdata.map((a) =>
      NonFilterItem.filter((b) => b.item_uuid === a.item_uuid).length
        ? {
            ...NonFilterItem.find((b) => b.item_uuid === a.item_uuid),
            free: a.free,
          }
        : { ...a, b: 0, p: 0, uuid: a.item_uuid, default: true }
    );
    let item_details = filterItem.length
      ? NonFilterItem.length
        ? [...filterItem, ...NonFilterItem]
        : filterItem
      : NonFilterItem.length
      ? NonFilterItem
      : [];
    setOrder((prev) => ({ ...prev, item_details }));
    console.log(item_details);
    onSave();
  };
  console.log(orders);
  return (
    <div className="overlay" style={{ zIndex: 999999999 }}>
      <div
        className="modal"
        style={{
          height: "fit-content",
          width: "max-content",
          minWidth: "250px",
        }}
      >
        <h1>Free Items</h1>
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
                    <tr>
                      <th colSpan={3}>
                        <div className="t-head-element">Item</div>
                      </th>
                      <th colSpan={2}>
                        <div className="t-head-element">Qty</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {items?.map((item, i) => (
                      <tr
                        key={item?.item_uuid || Math.random()}
                        style={{
                          height: "30px",
                        }}
                      >
                        <td colSpan={3}>{item.item_title}</td>
                        <td colSpan={2}>
                          <input
                            type="number"
                            onWheel={(e) => e.target.blur()}
                            name="route_title"
                            className="numberInput"
                            value={item?.free || ""}
                            style={{
                              width: "100px",
                              backgroundColor: "transparent",
                              color: "#000",
                            }}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((a) =>
                                  a.item_uuid === item.item_uuid
                                    ? { ...a, free: e.target.value }
                                    : a
                                )
                              )
                            }
                            maxLength={42}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="flex"
                style={{ flexDirection: "column", width: "100%" }}
              >
                <i>No Data Present</i>
              </div>
            )}

            {items.filter((a) => a.free).length ? (
              <div className="flex" style={{ justifyContent: "space-between" }}>
                {/* <button
                      type="button"
                      style={{ backgroundColor: "red" }}
                      className="submit"
                      onClick={onSave}
                    >
                      Cancel
                    </button> */}
                <button
                  type="button"
                  className="submit"
                  onClick={postOrderData}
                >
                  Save
                </button>
              </div>
            ) : (
              ""
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

export default FreeItems;
