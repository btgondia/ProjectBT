import axios from "axios";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { useRef } from "react";
import {
  TiArrowSortedDown,
  TiArrowSortedUp,
  TiArrowUnsorted,
} from "react-icons/ti";
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Fragment } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/solid";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

let FETCH_MORE = true;

const PurchaseRate = () => {
  const [categories, setCategories] = useState([]);

  const [companies, setCompanies] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState();
  const tableRef = useRef();

  const [filters, setFilters] = useState({
    company_uuid: "",
    category_uuid: "",
  });

  const getItemGroup = async (company_uuid) => {
    const response = await axios({
      method: "get",
      url: "/itemCategories/GetItemCategoryList?company_uuid=" + company_uuid,

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCategories(response.data.result);
  };

  const getCompanies = async () => {
    const cachedData = localStorage.getItem("companiesData");

    if (cachedData) {
      setCompanies(JSON.parse(cachedData));
    } else {
      const response = await axios({
        method: "get",
        url: "/companies/getCompanies",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        localStorage.setItem(
          "companiesData",
          JSON.stringify(response.data.result)
        );
        setCompanies(response.data.result);
      }
    }
  };

  const search = async (last_item) => {
    try {
      const response = await axios.get(
        "/items/GetItemsPurchaseData?category_uuid=" + filters.category_uuid
      );
      if (!response.data.success) return;
      setData(response.data.result);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {
    getCompanies();
  }, []);

  return (
    <>
      <Sidebar />
      <Header />
      <div className="item-sales-container orders-report-container">
        <div id="heading">
          <h2>Items Report</h2>
        </div>
        <div id="item-sales-top">
          <div id="date-input-container">
            <div className="label-input-container">
              <span>Companies</span>
              <FormControl sx={{ width: 180 }}>
                <Select
                  displayEmpty
                  className={"mui-multi-select"}
                  value={filters.company_uuid}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      company_uuid: e.target.value,
                    }));
                    getItemGroup(e.target.value);
                  }}
                  title={
                    companies?.find(
                      (i) => i.company_uuid === filters.company_uuid
                    )?.company_title
                  }
                  MenuProps={MenuProps}
                >
                  {companies?.map((a) => (
                    <MenuItem
                      sx={{ fontSize: ".88rem" }}
                      value={a.company_uuid}
                    >
                      {a.company_title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {categories.length ? (
              <div className="label-input-container">
                <span>Item Categories</span>
                <FormControl sx={{ width: 180 }}>
                  <Select
                    displayEmpty
                    className={"mui-multi-select"}
                    value={filters.category_uuid}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        category_uuid: e.target.value,
                      }))
                    }
                    title={
                      categories?.find(
                        (i) => i.category_uuid === filters.category_uuid
                      )?.category_title
                    }
                    MenuProps={MenuProps}
                  >
                    <MenuItem sx={{ fontSize: ".88rem" }} value={""}>
                      <em>All</em>
                    </MenuItem>
                    {categories?.map((a) => (
                      <MenuItem
                        sx={{ fontSize: ".88rem" }}
                        value={a.category_uuid}
                      >
                        {a.category_title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            ) : (
              ""
            )}
            
            <button className="theme-btn" onClick={() => search()}>
              Search
            </button>
            {data.length ? (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  cursor: "pointer",
                  height: "50px",
                  
                }}
              >
                <input
                  type="checkbox"
                  onChange={(e) => setFilters({ ...filters, disabledItem: e.target.checked })}
                  value={filters.disabledItem}
                  className="searchInput"
                  style={{ scale: "1.2" }}
                />
                <span style={{width: "200px",}}>Disabled Items</span>
              </label>
            ) : (
              ""
            )}
          </div>
        </div>
        <div
          className="table-container-user item-sales-container"
          style={{ scrollBehavior: "smooth", overflow: "auto" }}
        >
          <Table tableRef={tableRef} data={data.filter(a=>filters.disabledItem||a.status)} loading={loading} />
        </div>
      </div>
    </>
  );
};

export default PurchaseRate;
function Table({ data }) {
  const [items, setItems] = useState("sort_order");
  const [order, setOrder] = useState("");
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
                  <span>Item Title</span>
                  <div className="sort-buttons-container">
                    <button
                      onClick={() => {
                        setItems("item_title");
                        setOrder("asc");
                      }}
                    >
                      <ChevronUpIcon className="sort-up sort-button" />
                    </button>
                    <button
                      onClick={() => {
                        setItems("item_title");
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
                  <span>Purchase Price</span>
                  <div className="sort-buttons-container">
                    <button
                      onClick={() => {
                        setItems("last_purchase_price");
                        setOrder("asc");
                      }}
                    >
                      <ChevronUpIcon className="sort-up sort-button" />
                    </button>
                    <button
                      onClick={() => {
                        setItems("last_purchase_price");
                        setOrder("desc");
                      }}
                    >
                      <ChevronDownIcon className="sort-down sort-button" />
                    </button>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="tbody">
            {data
              .map((a) => ({ ...a, item_discount: +a.item_discount || 0 }))
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
                <tr key={Math.random()} style={{ height: "30px" }}>
                  <td>{i + 1}</td>

                  <td>{item.item_title}</td>
                  <td>{item.last_purchase_price || 0}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
