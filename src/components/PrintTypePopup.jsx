import React, { useState } from "react";

const PrintTypePopup = ({ onClose }) => {
  const [value, setValue] = useState();

  useState(() => {
    setValue(sessionStorage.getItem("print_type"));
  }, []);

  const updateDetails = async (controller) => {
    sessionStorage.setItem("print_type", value);
    onClose();
  };

  return (
    <div
      className="overlay"
      style={{ position: "fixed", top: 0, left: 0, zIndex: 9999999 }}
    >
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

                updateDetails();
              }}
            >
              <div className="formGroup">
                <div className="row">
                  <label className="selectLabel" style={{ width: "50%" }}>
                    Select Print Type
                    <select
                      className="numberInput"
                      value={value}
                      name="routes"
                      onChange={(e) => {
                        setValue(e.target.value);
                      }}
                    >
                      {[
                        { value: 0, name: "Normal" },
                        { value: 1, name: "DMS" },
                      ]?.map((occ) => (
                        <option
                          value={occ.value}
                          style={{
                            marginBottom: "5px",
                            textAlign: "center",
                          }}
                        >
                          {occ.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="row">
                  <button className="simple_Logout_button" type="submit">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <button onClick={onClose} className="closeButton">
          x
        </button>
      </div>
    </div>
  );
};

export default PrintTypePopup;
