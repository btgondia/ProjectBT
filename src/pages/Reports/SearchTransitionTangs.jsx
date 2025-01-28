import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Context from "../../context/context";
import { Update } from "@mui/icons-material";

const SearchTransitionTags = () => {
  const [transactionTag, setTransitonTag] = useState("");
  const [ledgerData, setLedgerData] = useState([]);
  const [updateTransitionTagPopup, setUpdateTransitionTagPopup] =
    useState(false);
  const context = useContext(Context);
  const { setNotification } = context;
  const getLedgerData = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/ledger/getLedgerCounterTagsList",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setLedgerData(response.data.result);
  };

  useEffect(() => {
    getLedgerData();
  }, []);
  const itemList = useMemo(
    () =>
      ledgerData
        .filter(
          (a) =>
            transactionTag.length > 2 &&
            (a.transaction_tags || [])
              .join(", ")
              .toLowerCase()
              .includes(transactionTag.toLowerCase())
        )

        .sort((a, b) => a.title.localeCompare(b.title)),
    [ledgerData, transactionTag]
  );

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Search Transition Tags</h2>
        </div>
        <div id="item-sales-top">
          <div
            id="date-input-container"
            style={{
              overflow: "visible",
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <input
              type="text"
              onChange={(e) => setTransitonTag(e.target.value)}
              value={transactionTag}
              placeholder="Search Transition Tags..."
              className="searchInput"
              onWheel={(e) => e.preventDefault()}
            />
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          {itemList.length ? (
            <Table
              itemsDetails={itemList}
              setUpdateTransitionTagPopup={setUpdateTransitionTagPopup}
            />
          ) : (
            ""
          )}
        </div>
      </div>
      {updateTransitionTagPopup ? (
        <UpdateTransitionTagPopup
          onSave={() => {
            setUpdateTransitionTagPopup(false);
            getLedgerData();
          }}
          updateTransitionTagPopup={updateTransitionTagPopup}
          setNotification={setNotification}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default SearchTransitionTags;

function Table({ itemsDetails, setUpdateTransitionTagPopup }) {
  return (
    <table
      className="user-table"
      style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}
    >
      <thead>
        <tr>
          <th>S.N</th>
          <th colSpan={3}>Counter</th>
          <th colSpan={2}>Route</th>
          <th colSpan={2}>Group</th>
          <th colSpan={2}>Transition Tags</th>
        </tr>
      </thead>
      <tbody className="tbody">
        {itemsDetails?.map((item, i, array) => (
          <tr
            key={Math.random()}
            style={{ height: "30px" }}
            onClick={() => setUpdateTransitionTagPopup(item)}
          >
            <td>{i + 1}</td>

            <td colSpan={3}>{item.title || ""}</td>
            <td colSpan={2}>{item.route_title || ""}</td>
            <td colSpan={2}>{item?.ledger_group_title || ""}</td>
            <td colSpan={2}>{item.transaction_tags || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function UpdateTransitionTagPopup({
  onSave,
  updateTransitionTagPopup,
  setNotification,
}) {
  const [transaction_tags, setTransitonTag] = useState([]);

  useEffect(() => {
    setTransitonTag(updateTransitionTagPopup.transaction_tags);
  }, [updateTransitionTagPopup.transaction_tags]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const response = await axios({
      method: "post",
      url: "/ledger/updateLedgerTransitionTags",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        transaction_tags,
        ledger_uuid: updateTransitionTagPopup.ledger_uuid,
        counter_uuid: updateTransitionTagPopup.counter_uuid,
      },
    });
    if (response.data.success) {
      setNotification({
        message: "Transition Tags Updated Successfully",
        success: true,
      });

      onSave();
    } else {
      setNotification({
        message: "Failed to Update Transition Tags",
        success: false,
      });
    }
  };

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
          <div
            className="flex"
            style={{ justifyContent: "flex-start", alignItems: "flex-start" }}
          >
            <div style={{ maxHeight: "500px", overflowY: "scroll" }}>
              <h2>{updateTransitionTagPopup.title || ""}</h2>
              <br />
              <div className="flex">
                <label htmlFor="closing_balance">Transaction Tags</label>
                <textarea
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  name="sort_order"
                  className="numberInput"
                  value={transaction_tags?.toString()?.replace(/,/g, "\n")}
                  style={{ height: "50px" }}
                  onChange={(e) => setTransitonTag(e.target.value.split("\n"))}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button className="fieldEditButton" onClick={submitHandler}>
              Save
            </button>
          </div>

          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
