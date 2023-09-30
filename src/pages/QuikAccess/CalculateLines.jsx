import React, { useContext, useState } from "react";
import context from "../../context/context";

function CalculateLinesPopup() {
  const [data, setdata] = useState(0);
  const [type, setType] = useState("company");
  const { CalculateLines, setcalculationPopup, loading } = useContext(context);

  return (
    <div className="overlay" style={{ zIndex: 9999999 }}>
      <div className="modal" style={{ width: "fit-content" }}>
        <div
          className="content"
          style={{
            height: "fit-content",
            padding: "20px",
            width: "fit-content",
          }}
        >
          <div className="flex">
            <button
              className="fieldEditButton"
              style={
                type === "company"
                  ? { backgroundColor: "var(--main)", color: "#fff" }
                  : { backgroundColor: "#fff", color: "var(--main)" }
              }
              onClick={() => setType("company")}
            >
              Company
            </button>
            <button
              style={
                type === "category"
                  ? { backgroundColor: "var(--main)", color: "#fff" }
                  : { backgroundColor: "#fff", color: "var(--main)" }
              }
              className="fieldEditButton"
              onClick={() => setType("category")}
            >
              Category
            </button>
          </div>
          <div style={{ overflowY: "scroll" }}>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                CalculateLines(data,type);
              }}
            >
              <div className="row">
                <h1>Calculate Lines</h1>
              </div>

              <div className="formGroup">
                <div className="row">
                  <label className="selectLabel">
                    Days
                    <input
                      type="text"
                      name="route_title"
                      className="numberInput"
                      value={data}
                      onChange={(e) => setdata(e.target.value)}
                      maxLength={60}
                    />
                  </label>
                </div>
              </div>

              {!loading ? (
                <button type="submit" className="submit">
                  Calculate
                </button>
              ) : (
                <button
                  type="button"
                  className="submit"
                  style={{ width: "100px", height: "70px" }}
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
              )}
            </form>
          </div>

          <button
            onClick={() => {
              setcalculationPopup(false);
            }}
            className="closeButton"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
export default CalculateLinesPopup;
