import React, { useState, useEffect } from "react";
import axios from "axios";

function NotesPopup({
  onSave: close,
  order,
  setSelectedOrder,
  notesPopup,
  HoldOrder,
  customSubmit,
  orderInfo,
  counterName,
  mainDashboard,
  isCreditNote,
  isPurchaseInvoice,
}) {
  const [notes, setNotes] = useState([]);
  const [narrations, setNarration] = useState([]);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    if (customSubmit && mainDashboard && order.notes?.length)
      return customSubmit(order);
    if (order?.notes?.length) setNotes(order?.notes);
    if (order?.narrations?.length) setNarration(order?.narrations);
  }, [customSubmit, mainDashboard, order]);

  const submitHandler = async () => {
    if (isPurchaseInvoice) {
      const response = await axios({
        method:"put",
        url: `/purchaseInvoice/putPurchaseInvoice`,
        data: {...order, notes},
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        setSelectedOrder((prev) => ({
          ...prev,
          notes,
        }));
        close();
      }
      return;
    }
    if(isCreditNote){
      const response = await axios({
        method:"put",
        url: `/creditNote/putCreditNote`,
        data: {...order, notes, narrations},
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        setSelectedOrder((prev) => ({
          ...prev,
          notes,
          narrations,
        }));
        close();
      }
      return;
    }
    if (customSubmit) return customSubmit({ ...order, notes });
    const response = await axios({
      method: "put",
      url: "/orders/putOrderNotes",
      data: { notes, invoice_number: order?.invoice_number },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      setSelectedOrder((prev) => ({
        ...prev,
        notes,
      }));
      if (notesPopup === "hold") setTimeout(HoldOrder, 2000);
      close();
    }
  };

  return (
    <>
      <div className="overlay" style={{ zIndex: 9999999999 }}>
        <div
          className="modal"
          style={{ height: "fit-content", width: "max-content" }}
        >
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <div>
              <h3>Order Notes</h3>
              {orderInfo && (
                <div style={{ marginBottom: "10px" }}>
                  <small>
                    In <b>{counterName || "<Counter>"}</b> for order{" "}
                    <b>{order?.invoice_number}</b> -{" "}
                    <b>
                      Rs.
                      {order?.order_grandtotal}
                    </b>
                  </small>
                </div>
              )}
            </div>
            {notesPopup === "hold" ? <h3>Please Enter Notes</h3> : ""}
          </div>
          <div
            className="content"
            style={{
              height: "fit-content",
              padding: "10px",
              width: "fit-content",
            }}
          >
            <div style={{ overflowY: "scroll" }}>
              <form className="form">
                <div className="formGroup">
                  <div
                    className="row"
                    style={{ flexDirection: "row", alignItems: "start" }}
                  >
                    <div style={{ width: "50px" }}>Notes</div>
                    <label
                      className="selectLabel flex"
                      style={{ width: "200px" }}
                    >
                      <textarea
                        name="route_title"
                        className="numberInput"
                        style={{ width: "200px", height: "200px" }}
                        value={notes?.toString()?.replace(/,/g, "\n")}
                        onChange={(e) => {
                          setNotes(e.target.value.split("\n"));
                          setEdit(true);
                        }}
                      />
                    </label>
                  </div>
                  {isCreditNote ? (
                    <div
                      className="row"
                      style={{ flexDirection: "row", alignItems: "start" }}
                    >
                      <div style={{ width: "50px" }}>Narration</div>
                      <label
                        className="selectLabel flex"
                        style={{ width: "200px" }}
                      >
                        <textarea
                          name="route_title"
                          className="numberInput"
                          style={{ width: "200px", height: "200px" }}
                          value={narrations?.toString()?.replace(/,/g, "\n")}
                          onChange={(e) => {
                            setNarration(e.target.value.split("\n"));
                            setEdit(true);
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    ""
                  )}
                </div>

                <div
                  className="flex"
                  style={{ justifyContent: "space-between" }}
                >
                  <button onClick={close} className="closeButton">
                    x
                  </button>
                  {edit ? (
                    <button
                      type="button"
                      className="submit"
                      onClick={submitHandler}
                    >
                      Save
                    </button>
                  ) : (
                    ""
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotesPopup;
