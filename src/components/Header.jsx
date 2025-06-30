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

const Header = ({headerActions}) => {
  const Navigate = useNavigate();
  const [logoutPopup, setLogoutPopup] = useState("");
  const Context = useContext(context);
  const { view } = Context;
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const hasTripView = user?.permissions?.includes("trip_view");
  
  return (
    <>
      <div className="header">
        <div id="header-title">
          <h2>Bharat Traders</h2>
          <h4>{localStorage.getItem("user_title") || ""}</h4>
        </div>

        <div className="header-actions">
          {headerActions}
          <GreenSwitch
            onClick={(e) => {
              if (view && hasTripView) Navigate("/trip");
              else Navigate("/accounting_dashboard");
            }}
            checked={Boolean(view)}
          />
        </div>
        <div className="header_right">
          <div
            className="header_right_link"
            onClick={() => {
              if (!view && hasTripView) Navigate("/trip");
              else Navigate("/accounting_dashboard");
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
