import { ToggleOff } from "@mui/icons-material";
import { Switch } from "@mui/material";
import { green } from "@mui/material/colors";
import { alpha, styled } from "@mui/system";
import axios from "axios";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import MessagePopup from "./MessagePopup";
import context from "../context/context";
const GreenSwitch = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: green[500],
    "&:hover": {
      backgroundColor: alpha(green[500], theme?.palette?.action?.hoverOpacity),
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: green[500],
  },
}));
const Header = () => {
  const Navigate = useNavigate();
  const [logoutPopup, setLogoutPopup] = useState("");
  const [dropdown, setDropdown] = useState("");
  const [routesData, setRoutesData] = useState([]);
  const Context = useContext(context);
  const { view, setView } = Context;
  const getRoutesData = async () => {
    const response = await axios({
      method: "post",
      url: "/routes/GetRouteList",

      data: ["route_uuid", "order_status", "route_title"],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setRoutesData(response.data.result);
  };
  const handleClick = async (e, item) => {
    const response = await axios({
      method: "put",
      url: "/routes/putRoute",
      data: {
        route_uuid: item.route_uuid,
        order_status: +item.order_status ? 0 : 1,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) {
      getRoutesData();
    }
  };

  return (
    <>
      <div className="header">
        <div className="name">
          <h2>Bharat Traders</h2>
          <h4>{localStorage.getItem("user_title") || ""}</h4>
        </div>

        <div className="header_toggle_btn" style={{ position: "relative" }}>
          <div style={{ right: "150px", position: "absolute" }}>
            <GreenSwitch
              onClick={(e) => {
                if (view) {
                  Navigate("/trip");
                } else {
                  Navigate("/accounting_dashboard");
                }
              }}
              checked={view}
            />
          </div>
          <ToggleOff
            className="icon_btn"
            onClick={() => {
              !dropdown && getRoutesData();
              setDropdown((prevState) => !prevState);
            }}
          />
          {dropdown ? (
            <div className="toggle_dropdown">
              {/* Toggle buttons */}
              {routesData
                .filter((a) => a.route_uuid)
                .map((item, index) => (
                  <div
                    key={item + "_" + index}
                    className="toggle_dropdown_item"
                  >
                    {item.route_title}{" "}
                    <GreenSwitch
                      onClick={(e) => handleClick(e, item)}
                      checked={item.order_status}
                    />
                  </div>
                ))}
            </div>
          ) : (
            ""
          )}
        </div>
        <div className="header_right">
          <div
            className="header_right_link"
            onClick={() => {
              if (!view) {
                Navigate("/trip");
              } else {
                Navigate("/accounting_dashboard");
              }
            }}
          >
            Dashboard
          </div>
          <div
            className="header_right_link"
            onClick={() => {
              setLogoutPopup(true);
            }}
          >
            Logout
          </div>
        </div>
      </div>
      {logoutPopup ? (
        <MessagePopup
          onClose={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
            Navigate("/login");
          }}
          onSave={() => setLogoutPopup(false)}
          message="Confirm Logout"
          button1="Logout"
          button2="Cancel"
        />
      ) : (
        ""
      )}
    </>
  );
};

export default Header;
