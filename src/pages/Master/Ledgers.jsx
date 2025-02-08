import React, { useState, useEffect, useMemo, useContext } from "react";
import axios from "axios";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid";
import {
  AddCircle,
  DeleteOutline,
  DeleteOutlineOutlined,
} from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { IoIosCloseCircle } from "react-icons/io";
import { v4 as uuid } from "uuid";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import context from "../../context/context";
import { FaSave } from "react-icons/fa";
import Prompt from "../../components/Prompt";
import { getFormateDate } from "../../utils/helperFunctions";

const LedgersPage = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerGroup, setLedgerGroup] = useState([]);
  const [popupForm, setPopupForm] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [filterTitle, setFilterTitle] = useState("");

  const { setNotification } = useContext(context);

  const getLedgerData = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/ledger/getLedger",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setLedgerData(response.data.result);
  };
  const getLedgerGroup = async (controller = new AbortController()) => {
    const response = await axios({
      method: "get",
      url: "/ledgerGroup/getLedgerGroup",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setLedgerGroup(response.data.result);
  };

  useEffect(() => {
    const controller = new AbortController();
    getLedgerData(controller);
    getLedgerGroup(controller);
    return () => {
      controller.abort();
    };
  }, [popupForm]);
  const filterLedgerData = useMemo(
    () =>
      ledgerData
        .map((a) => ({
          ...a,
          ledger_group_title: ledgerGroup.find(
            (b) => b.ledger_group_uuid === a.ledger_group_uuid
          )?.ledger_group_title,
        }))
        .filter(
          (a) =>
            a.ledger_title &&
            (!filterTitle ||
              a.ledger_title
                .toLocaleLowerCase()
                .includes(filterTitle.toLocaleLowerCase()))
        ),
    [filterTitle, ledgerData, ledgerGroup]
  );

  useEffect(() => {
    const controller = new AbortController();

    return () => {
      controller.abort(controller);
    };
  }, []);

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading" style={{ position: "relative" }}>
          <h2>Ledger</h2>
          <span
            style={{
              position: "absolute",
              right: "30px",
              top: "50%",
              translate: "0 -50%",
            }}
          >
            Total Ledger: {filterLedgerData.length}
          </span>
        </div>
        <div id="item-sales-top">
          <div
            id="date-input-container"
            style={{
              overflow: "visible",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="text"
                onChange={(e) => setFilterTitle(e.target.value)}
                value={filterTitle}
                placeholder="Search Ledger Title..."
                className="searchInput"
              />
            </div>

            <button className="theme-btn" onClick={() => setPopupForm(true)}>
              Add
            </button>
          </div>
        </div>
        <div className="table-container-user item-sales-container">
          <Table
            itemsDetails={filterLedgerData}
            setPopupForm={setPopupForm}
            setDeletePopup={setDeletePopup}
          />
        </div>
      </div>
      {popupForm ? (
        <NewUserForm
          onSave={() => {
            setPopupForm(false);
            getLedgerData();
          }}
          setLedgerData={setLedgerData}
          popupInfo={popupForm}
          items={ledgerData}
          setNotification={setNotification}
          ledgerGroup={ledgerGroup}
        />
      ) : (
        ""
      )}
      {deletePopup ? (
        <DeleteItemPopup
          onSave={() => {
            setDeletePopup(false);
            getLedgerData();
          }}
          setLedgerData={setLedgerData}
          popupInfo={deletePopup}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default LedgersPage;
function Table({ itemsDetails, setPopupForm, setDeletePopup }) {
  const [items, setItems] = useState("sort_order");
  const [order, setOrder] = useState("");
  const [pricesListState, setPricesListState] = useState();
  return (
    <>
      <div
        style={{ maxWidth: "100vw", height: "fit-content", overflowX: "auto" }}
      >
        <table className="user-table" style={{ tableLayout: "auto" }}>
          <thead>
            <tr>
              <th>S.N</th>

              <th>
                <div className="t-head-element">
                  <span>Ledger Title</span>
                  <div className="sort-buttons-container">
                    <button
                      onClick={() => {
                        setItems("ledger_title");
                        setOrder("asc");
                      }}
                    >
                      <ChevronUpIcon className="sort-up sort-button" />
                    </button>
                    <button
                      onClick={() => {
                        setItems("ledger_title");
                        setOrder("desc");
                      }}
                    >
                      <ChevronDownIcon className="sort-down sort-button" />
                    </button>
                  </div>
                </div>
              </th>
              <th>
                <div className="t-head-element">
                  <span>Ledger Group Title</span>
                  <div className="sort-buttons-container">
                    <button
                      onClick={() => {
                        setItems("ledger_group_title");
                        setOrder("asc");
                      }}
                    >
                      <ChevronUpIcon className="sort-up sort-button" />
                    </button>
                    <button
                      onClick={() => {
                        setItems("ledger_group_title");
                        setOrder("desc");
                      }}
                    >
                      <ChevronDownIcon className="sort-down sort-button" />
                    </button>
                  </div>
                </div>
              </th>
              <th>
                <div className="t-head-element">
                  <span>Closing Balance</span>
                  <div className="sort-buttons-container">
                    <button
                      onClick={() => {
                        setItems("closing_balance");
                        setOrder("asc");
                      }}
                    >
                      <ChevronUpIcon className="sort-up sort-button" />
                    </button>
                    <button
                      onClick={() => {
                        setItems("closing_balance");
                        setOrder("desc");
                      }}
                    >
                      <ChevronDownIcon className="sort-down sort-button" />
                    </button>
                  </div>
                </div>
              </th>

              <th></th>
            </tr>
          </thead>
          <tbody className="tbody">
            {itemsDetails

              .sort((a, b) =>
                order === "asc"
                  ? typeof a[items] === "string"
                    ? a[items]?.localeCompare(b[items])
                    : a[items] - b[items]
                  : typeof a[items] === "string"
                  ? b[items]?.localeCompare(a[items])
                  : b[items] - a[items]
              )
              ?.map((item, i) => (
                <tr
                  key={Math.random()}
                  style={{ height: "30px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupForm({ type: "edit", data: item });
                  }}
                >
                  <td>{i + 1}</td>

                  <td>{item.ledger_title}</td>
                  <td>{item.ledger_group_title}</td>
                  <td>{item.closing_balance}</td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <DeleteOutline
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePopup(item);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pricesListState?.active && (
        <CounterPrices
          item={pricesListState?.item}
          close={() => setPricesListState()}
        />
      )}
    </>
  );
}
function NewUserForm({ onSave, popupInfo, ledgerGroup }) {
  const [data, setData] = useState({ item_group_uuid: [] });
  const [default_opening_balance_date, setDefaultOpeningBalanceDate] = useState(
    new Date().getTime()
  );

  const [errMassage, setErrorMassage] = useState("");
  const getBankStatementImport = async () => {
    try {
      const res = await axios.get("/details/getOpeningBalanceDate");
      setDefaultOpeningBalanceDate(res.data.result);
    } catch (error) {
     
    }
  };
  useEffect(() => {
    getBankStatementImport();
    if (popupInfo?.type === "edit")
      setData({
        ...popupInfo.data,
        opening_balance: popupInfo?.data?.opening_balance?.map((a) => ({
          ...a,
          uuid: a.uuid || uuid(),
        })),
      });
  }, [popupInfo.data, popupInfo?.data?.opening_balance, popupInfo?.type]);

  const submitHandler = async (e) => {
    let obj = { ...data, ledger_uuid: data.ledger_uuid || uuid() };
    e.preventDefault();

    if (popupInfo?.type === "edit" || popupInfo.type === "price") {
      const response = await axios({
        method: "put",
        url: "/ledger/putLedger",
        data: obj,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        onSave();
      }
    } else {
      const response = await axios({
        method: "post",
        url: "/ledger/postLedger",
        data: obj,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        onSave();
      }
    }
  };

  return (
    <div className="overlay" style={{ zIndex: 9999999 }}>
      <div
        className="modal"
        style={{
          height: "65vh",
          width: "fit-content",
        }}
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
            <form className="form" onSubmit={submitHandler}>
              <div className="row">
                <h1>
                  {popupInfo.type === "edit" ? "Edit Ledger" : "Add Ledger"}
                </h1>
              </div>

              <div className="formGroup">
                <div className="row">
                  <label className="selectLabel">
                    Ledger Title
                    <input
                      type="text"
                      name="route_title"
                      className="numberInput"
                      value={data?.ledger_title}
                      onChange={(e) =>
                        setData({
                          ...data,
                          ledger_title: e.target.value,
                        })
                      }
                      maxLength={60}
                    />
                  </label>
                </div>

                <div className="row">
                  <label className="selectLabel">
                    Ledger Group
                    <select
                      name="user_type"
                      className="select"
                      value={data?.ledger_group_uuid}
                      onChange={(e) =>
                        setData({
                          ...data,
                          ledger_group_uuid: e.target.value,
                        })
                      }
                    >
                      <option value="">Select</option>
                      {ledgerGroup.map((a) => (
                        <option value={a.ledger_group_uuid}>
                          {a.ledger_group_title}
                        </option>
                      ))}
                    </select>
                  </label>
                  {data.ledger_group_uuid ===
                  "9c2a6c85-c0f0-4acf-957e-dcea223f3d00" ? (
                    <label className="selectLabel">
                      Transaction tags
                      <textarea
                        type="number"
                        onWheel={(e) => e.target.blur()}
                        name="sort_order"
                        className="numberInput"
                        value={data?.transaction_tags
                          ?.toString()
                          ?.replace(/,/g, "\n")}
                        style={{ height: "50px" }}
                        onChange={(e) =>
                          setData({
                            ...data,
                            transaction_tags: e.target.value.split("\n"),
                          })
                        }
                      />
                    </label>
                  ) : (
                    ""
                  )}
                </div>
                <div className="row">
                  <label className="selectLabel" style={{ width: "50%" }}>
                    Opening Balance{" "}
                    <span
                      onClick={() => {
                        setData((prev) => {
                          return {
                            ...prev,
                            opening_balance: [
                              ...(prev.opening_balance || []),
                              {
                                uuid: uuid(),
                                date: default_opening_balance_date,
                                amount: "",
                              },
                            ],
                          };
                        });
                      }}
                    >
                      <AddCircle
                        sx={{ fontSize: 40 }}
                        style={{ color: "#32bd33", cursor: "pointer" }}
                      />
                    </span>
                    <div>
                      {data?.opening_balance?.map((a) => (
                        <div
                          key={a.uuid}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            margin: "5px 0",
                          }}
                        >
                          <div style={{ width: "200px" }}>
                            <input
                              type="date"
                              onChange={(e) =>
                                setData((prev) => ({
                                  ...prev,
                                  opening_balance: prev.opening_balance.map(
                                    (b) =>
                                      b.uuid === a.uuid
                                        ? {
                                            ...b,
                                            date: new Date(
                                              e.target.value
                                            ).getTime(),
                                          }
                                        : b
                                  ),
                                }))
                              }
                              value={getFormateDate(new Date(a.date))}
                              placeholder="Search Counter Title..."
                              className="searchInput"
                              pattern="\d{4}-\d{2}-\d{2}"
                            />
                          </div>
                          <input
                            type="number"
                            name="route_title"
                            className="numberInput"
                            value={a?.amount}
                            style={{ width: "15ch" }}
                            onChange={(e) => {
                              setData((prev) => ({
                                ...prev,
                                opening_balance: prev.opening_balance.map((b) =>
                                  b.uuid === a.uuid
                                    ? { ...b, amount: e.target.value }
                                    : b
                                ),
                              }));
                            }}
                            maxLength={10}
                            placeholder="Amount"
                          />
                          <span
                            style={{
                              color: "red",

                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              setData((prev) => ({
                                ...prev,
                                opening_balance: prev.opening_balance.filter(
                                  (b) => b.uuid !== a.uuid
                                ),
                              }));
                            }}
                          >
                            <DeleteOutlineOutlined
                              style={{ color: "red" }}
                              className="table-icon"
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </label>
                  <label className="selectLabel">
                    GST
                    <input
                      type="text"
                      name="GST"
                      className="numberInput"
                      value={data?.gst}
                      onChange={(e) =>
                        setData({
                          ...data,
                          gst: e.target.value,
                        })
                      }
                      maxLength={42}
                    />
                  </label>
                </div>
                <div className="row">
                  <label className="selectLabel" style={{ width: "50%" }}>
                    Closing Balance{" "}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        margin: "5px 0",
                      }}
                    >
                      <input
                        type="number"
                        name="route_title"
                        className="numberInput"
                        value={data?.closing_balance}
                        style={{ width: "15ch" }}
                        onChange={(e) => {
                          setData((prev) => ({
                            ...prev,
                            closing_balance: e.target.value,
                          }));
                        }}
                        maxLength={10}
                        placeholder="Amount"
                      />
                    </div>
                  </label>
                  <label className="selectLabel">
                    Transaction tags
                    <textarea
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      name="sort_order"
                      className="numberInput"
                      value={data?.transaction_tags
                        ?.toString()
                        ?.replace(/,/g, "\n")}
                      style={{ height: "50px" }}
                      onChange={(e) =>
                        setData({
                          ...data,
                          transaction_tags: e.target.value.split("\n"),
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              <i style={{ color: "red" }}>
                {errMassage === "" ? "" : "Error: " + errMassage}
              </i>

              <button type="submit" className="submit">
                Save changes
              </button>
            </form>
          </div>

          <button onClick={onSave} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
function DeleteItemPopup({ onSave, popupInfo, setLedgerData }) {
  const [errMassage, setErrorMassage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios({
        method: "delete",
        url: "/ledger/deleteLedger",
        data: { ledger_uuid: popupInfo.ledger_uuid },
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        onSave();
      }
    } catch (err) {
     
      setErrorMassage("Order already exist");
    }
    setLoading(false);
  };

  return (
    <div className="overlay">
      <div className="modal" style={{ width: "fit-content" }}>
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
            width: "fit-content",
          }}
        >
          <div style={{ overflowY: "scroll" }}>
            <form className="form" onSubmit={submitHandler}>
              <div className="row">
                <h1>Delete Items</h1>
              </div>
              <div className="row">
                <h1>{popupInfo.ledger_title}</h1>
              </div>

              <i style={{ color: "red" }}>
                {errMassage === "" ? "" : "Error: " + errMassage}
              </i>
              <div className="flex" style={{ justifyContent: "space-between" }}>
                {loading ? (
                  <button
                    className="submit"
                    id="loading-screen"
                    style={{ background: "red", width: "120px" }}
                  >
                    <svg viewBox="0 0 100 100">
                      <path
                        d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50"
                        fill="#ffffff"
                        stroke="none"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          dur="1s"
                          repeatCount="indefinite"
                          keyTimes="0;1"
                          values="0 50 51;360 50 51"
                        ></animateTransform>
                      </path>
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="submit"
                    style={{ background: "red" }}
                  >
                    Confirm
                  </button>
                )}
                <button type="button" className="submit" onClick={onSave}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
function CounterPrices({ close, item }) {
  const [countersList, setCountersList] = useState();
  const [modifiedPrices, setModifiedPrices] = useState({});
  const [loadingState, setLoadingState] = useState();
  const [promptState, setPromptState] = useState();

  const saveCounterPrice = async (counter_uuid) => {
    setLoadingState((prev) => ({ ...prev, [counter_uuid]: true }));
    try {
      await axios({
        method: "patch",
        url: "/counters/item_special_price/" + counter_uuid,
        data: [
          {
            ledger_uuid: item.ledger_uuid,
            price: modifiedPrices?.[counter_uuid],
          },
        ],
      });

      setCountersList((prev) =>
        prev.map((i) =>
          i.counter_uuid === counter_uuid
            ? { ...i, special_price: modifiedPrices?.[counter_uuid] }
            : i
        )
      );
    } catch (error) { console.error(error) }
    setLoadingState((prev) => ({ ...prev, [counter_uuid]: false }));
  };

  const deleteSpecialPrice = async (counter_uuid) => {
    setLoadingState((prev) => ({ ...prev, [counter_uuid]: true }));
    try {
      await axios({
        method: "patch",
        url: "/counters/delete_special_price",
        data: { counter_uuid, ledger_uuid: item.ledger_uuid },
      });
      setPromptState(null);
      setCountersList((prev) =>
        prev.filter((i) => i.counter_uuid !== counter_uuid)
      );
    } catch (error) { console.error(error) }
    setLoadingState((prev) => ({ ...prev, [counter_uuid]: false }));
  };

  const deleteConfirmation = (counter) => {
    setPromptState({
      message: `Item ${item?.ledger_title}'s special price will be removed from counter '${counter?.counter_title}'. Continue?`,
      actions: [
        { label: "Cancel", classname: "black", action: () => setPromptState() },
        {
          label: "Continue",
          classname: "delete",
          action: () => deleteSpecialPrice(counter?.counter_uuid),
        },
      ],
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(
          `/counters/counter-special-prices/${item?.ledger_uuid}`
        );
        if (response.data) setCountersList(response.data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <>
      <div className="overlay" style={{ zIndex: 9999999 }}>
        <div
          className="modal"
          style={{ padding: 0, maxHeight: "unset", overflow: "hidden" }}
        >
          <div>
            <div className="theme-heading">
              <h2>Counter Special Prices</h2>
              <button className="close-btn" onClick={close}>
                <IoIosCloseCircle />
              </button>
            </div>
            <div
              className="table-container-user"
              style={{
                height: "80vh",
                width: "80vw",
                padding: "0 0 10px",
                overflow: "auto",
              }}
            >
              <table className="user-table performance-summary-table nohover">
                <thead>
                  <tr>
                    <th>Counter Title</th>
                    <th>Route Title</th>
                    <th>Special Price (Original Price: {item?.item_price})</th>
                  </tr>
                </thead>
                <tbody className="tbody">
                  {countersList?.map((counter) => (
                    <tr key={counter?.counter_uuid} style={{ height: "30px" }}>
                      <td>
                        {counter?.counter_title || (
                          <small style={{ opacity: ".45", fontWeight: "600" }}>
                            N/A
                          </small>
                        )}
                      </td>
                      <td>
                        {counter?.route_title || (
                          <small style={{ opacity: ".45", fontWeight: "600" }}>
                            N/A
                          </small>
                        )}
                      </td>
                      <td>
                        <div>
                          <input
                            type="text"
                            value={
                              modifiedPrices[counter?.counter_uuid] ||
                              counter?.special_price
                            }
                            onChange={(e) =>
                              setModifiedPrices((prev) => ({
                                ...prev,
                                [counter?.counter_uuid]: e.target.value,
                              }))
                            }
                          />
                          <div>
                            {loadingState?.[counter?.counter_uuid] ? (
                              <span
                                className="loader"
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderWidth: "2px",
                                }}
                              />
                            ) : (
                              <>
                                {+counter?.special_price ===
                                  +modifiedPrices[counter?.counter_uuid] ||
                                !modifiedPrices[counter?.counter_uuid] ? (
                                  <span
																			className="table-icon checkmark"
                                      style={{ margin: 0 }}
                                  >{"S"}</span>
                                ) : (
                                  <FaSave
                                    style={{ margin: 0 }}
                                    className="table-icon"
                                    title="Save current price as special item price"
                                    onClick={() =>
                                      saveCounterPrice(counter.counter_uuid)
                                    }
                                  />
                                )}
                                <DeleteOutlineIcon
                                  style={{ color: "red" }}
                                  className="table-icon"
                                  onClick={() => deleteConfirmation(counter)}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {promptState && <Prompt {...promptState} />}
    </>
  );
}
