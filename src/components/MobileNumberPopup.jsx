import { Phone, WhatsApp } from "@mui/icons-material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import Context from "../context/context";
const MobileNumberPopup = ({ onSave, counter, getCounter }) => {
  const [data, setdata] = useState({});
  const [otppoup, setOtpPopup] = useState(false);
  const [otp, setOtp] = useState("");
  const context = useContext(Context);

  const { setNotification } = context;
 
  useEffect(() => {
    setdata({
      ...counter,
      mobile: [
        ...(counter?.mobile?.map((a) => ({
          ...a,
          uuid: a?.uuid || uuid(),
        })) || []).filter(a=>a.mobile),
        ...[1, 2, 3, 4].map((a) => ({ uuid: uuid(), mobile: "", type: "" })),
      ].slice(0, 4),
    });
  }, [counter]);
  const submitHandler = async (e) => {
    e.preventDefault();
    for (let item of data.mobile) {
      if (
        data?.mobile?.filter((a) => a.mobile && a.mobile === item.mobile)
          .length > 1
      ) {
        setNotification({ success: false, message: "Dublicate Number Present" });
        setTimeout(() => setNotification(null), 5000);
        return;
      }
    }
    const response = await axios({
      method: "put",
      url: "/counters/putCounter",
      data: [
        {
          ...data,
          payment_modes: data.payment_modes.filter((a) => a !== "unpaid"),
        },
      ],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      getCounter();
      setOtp("");
      onSave();
    }
  };
  const sendOtp = async (mobile) => {
    if (
      data?.mobile?.filter((a) => a.mobile && a.mobile === mobile.mobile)
        .length > 1
    ) {
      setNotification({ success: false, message: "Dublicat Number Present" });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    if (!mobile.mobile) {
      return;
    }
    setOtpPopup(mobile);
    const response = await axios({
      method: "post",
      url: "/counters/sendWhatsappOtp",
      data: {
        ...data,
        ...mobile,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
    }
  };
  const sendCallOtp = async (mobile) => {
    if (
      data?.mobile?.filter((a) => a.mobile && a.mobile === mobile.mobile)
        .length > 1
    ) {
      setNotification({ success: false, message: "Dublicat Number Present" });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    if (!mobile.mobile) {
      return;
    }
    setOtpPopup(mobile);
    const response = await axios({
      method: "post",
      url: "/counters/sendCallOtp",
      data: {
        ...data,
        ...mobile,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
    }
  };
  const VerifyOtp = async (e) => {
    e.preventDefault();
    const response = await axios({
      method: "post",
      url: "/counters/verifyOtp",
      data: {
        ...data,
        ...otppoup,
        otp,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      getCounter();
      setOtpPopup("");
      setOtp("");
    }
    setNotification(response.data);
    setTimeout(() => setNotification(null), 5000);
  };
  return (
    <>
      <div className="overlay">
        <div
          className="modal"
          style={{ height: "fit-content", width: "max-content" }}
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
                <div className="formGroup">
                  <div
                    className="row"
                    style={{ flexDirection: "row", alignItems: "flex-start" }}
                  >
                    <label className="selectLabel flex">
                      Mobile
                      <div>
                        {data?.mobile?.map((a) => (
                          <div
                            key={a.uuid}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              margin: "5px 0",
                              width: "200px",
                            }}
                          >
                            <input
                              type="number"
                              name="route_title"
                              className="numberInput"
                              value={a?.mobile}
                              style={{ width: "15ch" }}
                              disabled={a.lable?.find(
                                (c) =>
                                  (c.type === "cal" || c.type === "wa") &&
                                  +c.varification
                              )}
                              onChange={(e) => {
                                if (
                                  e.target.value.length > 10 ||
                                  a.lable?.find(
                                    (c) =>
                                      (c.type === "cal" || c.type === "wa") &&
                                      +c.varification
                                  )
                                ) {
                                  return;
                                }
                                setdata((prev) => ({
                                  ...prev,
                                  mobile: prev.mobile.map((b) =>
                                    b.uuid === a.uuid
                                      ? { ...b, mobile: e.target.value }
                                      : b
                                  ),
                                }));
                              }}
                              maxLength={10}
                            />
                            <span
                              style={{
                                color: a.lable?.find(
                                  (c) => c.type === "wa" && !+c.varification
                                )
                                  ? "red"
                                  : a.lable?.find(
                                      (c) => c.type === "wa" && +c.varification
                                    )
                                  ? "green"
                                  : "gray",
                                cursor: "pointer",
                              }}
                              onClick={(e) => {
                                if (a.mobile) sendOtp({ ...a, lable: "wa" });
                                //   setdata((prev) => ({
                                //     ...prev,
                                //     mobile: prev.mobile.map((b) =>
                                //       b.uuid === a.uuid
                                //         ? {
                                //             ...b,
                                //             lable: b.lable?.find(
                                //               (c) => c.type === "wa"
                                //             )
                                //               ? b.lable.filter(
                                //                   (c) => c.type !== "wa"
                                //                 )
                                //               : [
                                //                   ...(b?.lable || []),
                                //                   { type: "wa", varification: 0 },
                                //                 ],
                                //           }
                                //         : b
                                //     ),
                                //   }));
                              }}
                            >
                              <WhatsApp />
                            </span>
                            <span
                              style={{
                                color: a.lable?.find(
                                  (c) => c.type === "cal" && !+c.varification
                                )
                                  ? "red"
                                  : a.lable?.find(
                                      (c) => c.type === "cal" && +c.varification
                                    )
                                  ? "green"
                                  : "gray",
                                cursor: "pointer",
                              }}
                              onClick={(e) => {
                                if (a.mobile)
                                  sendCallOtp({ ...a, lable: "cal" });
                                //   setdata((prev) => ({
                                //     ...prev,
                                //     mobile: prev.mobile.map((b) =>
                                //       b.uuid === a.uuid
                                //         ? {
                                //             ...b,
                                //             lable: b.lable?.find(
                                //               (c) => c.type === "cal"
                                //             )
                                //               ? b.lable.filter(
                                //                   (c) => c.type !== "cal"
                                //                 )
                                //               : [
                                //                   ...(b?.lable || []),
                                //                   { type: "cal", varification: 0 },
                                //                 ],
                                //           }
                                //         : b
                                //     ),
                                //   }));
                              }}
                            >
                              <Phone />
                            </span>
                          </div>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>

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
      {otppoup ? (
        <div className="overlay" style={{ zindex: "999999999" }}>
          <div
            className="modal"
            style={{ height: "fit-content", width: "max-content" }}
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
                <form className="form" onSubmit={VerifyOtp}>
                  <div className="formGroup">
                    <div
                      className="row"
                      style={{ flexDirection: "row", alignItems: "flex-start" }}
                    >
                      <label className="selectLabel flex">
                        OTP
                        <input
                          type="number"
                          name="route_title"
                          className="numberInput"
                          value={otp}
                          style={{ width: "15ch" }}
                          onChange={(e) => {
                            setOtp(e.target.value);
                          }}
                          maxLength={10}
                        />
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="submit">
                    Confirm
                  </button>
                </form>
              </div>
              <button
                onClick={() => setOtpPopup(false)}
                className="closeButton"
              >
                x
              </button>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default MobileNumberPopup;
