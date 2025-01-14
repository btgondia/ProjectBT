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
import * as XLSX from "xlsx"
import * as FileSaver from "file-saver"
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Fragment } from "react";

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

const ItemDetails = () => {
  const [counterGroup, setCounterGroup] = useState([]);
  const [itemGroup, setItemGroup] = useState([]);
  const [counter, setCounter] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState();
  const tableRef = useRef();

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    company_uuid: "",
    counter_uuid: "",
    item_group_uuid: "",
    counter_group_uuid: "",
  });

  const getCounter = async () => {
    const response = await axios({
      method: "post",
      url: "/counters/GetCounterData",
      data: ["counter_title", "counter_uuid"],
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounter(response.data.result);
  };

  const getItemGroup = async () => {
    const response = await axios({
      method: "get",
      url: "/itemGroup/GetItemGroupList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setItemGroup(response.data.result);
  };

  const getCounterGroup = async () => {
    const response = await axios({
      method: "get",
      url: "/counterGroup/GetCounterGroupList",

      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success) setCounterGroup(response.data.result);
  };

  const getCompanies = async () => {
    const cachedData = localStorage.getItem('companiesData');
    
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
        localStorage.setItem('companiesData', JSON.stringify(response.data.result));
        setCompanies(response.data.result);
      }
    }
  };  

  const search = async (last_item) => {
    if (!last_item) {
      FETCH_MORE = true;
      setLoading(true);
    }
    try {
      const response = await axios.post("/items/report", {
        ...filters,
        last_item: last_item
          ? {
              item_title: last_item.item_title,
              company_uuid: last_item.company_uuid,
            }
          : null,
      });
      if (!response.data.success) return;
      if (last_item) {
        if (!response.data.result?.[0]) return -1;
        setData((prev) => (prev || []).concat(response.data.result));
        return;
      }

      setData(response.data.result);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  const ExcelDownload = async () => {
	const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
	let sheetData = data.map(a => {
			
			return {
				"Item Title": a.item_title,
				"MRP": a.mrp,
				"Sales": a.sales?.p || "0",
				"Sales Amount":a.sales.price,
				"Delivery Returned": a.delivery_returned?.p||"0",
				"Delivery Amount":a.delivery_returned?.price || "0",
				"Processing Cancelled": a.processing_cancelled?.p||"0",
				"Processing Cancelled Amount":a.processing_cancelled?.price || "0",
				"Auto Added": a.auto_added?.p ||"0",
				"Auto Added Amount":a.auto_added?.price || "0",
				
			}
		})
		
		const ws = XLSX.utils.json_to_sheet(sheetData)
		const wb = { Sheets: { data: ws }, SheetNames: ["data"] }
		const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
		const dataExel = new Blob([excelBuffer], { type: fileType })
		FileSaver.saveAs(dataExel, "item Report.xlsx")
  }

  useEffect(() => {
    let time = new Date();
    let curTime = "yy-mm-dd"
      .replace("mm", ("00" + (time?.getMonth() + 1).toString()).slice(-2))
      .replace("yy", ("0000" + time?.getFullYear().toString()).slice(-4))
      .replace("dd", ("00" + time?.getDate().toString()).slice(-2));
    setFilters((prev) => ({
      ...prev,
      startDate: curTime,
      endDate: curTime,
    }));
    getCompanies();
    getCounterGroup();
    getItemGroup();
    getCounter();
  }, []);

  const onScroll = async (e) => {
    if (!FETCH_MORE) return;
    const viewportHeight = e.target.clientHeight;
    const percentageScrolled =
      (e.target.scrollTop / (e.target.scrollHeight - viewportHeight)) * 100;
    if (percentageScrolled >= 90) {
      FETCH_MORE = false;
      setLoading(true);
      const result = await search(data?.at(-1));
      setLoading(false);
      if (result !== -1)
        setTimeout(() => {
          FETCH_MORE = true;
        }, 1000);

     
    }
  };

  const options = [
    {
      options: companies,
      label: "Company",
      value_key: "company_uuid",
      label_key: "company_title",
    },
    {
      options: counter,
      label: "Counter",
      value_key: "counter_uuid",
      label_key: "counter_title",
    },
    {
      options: counterGroup,
      label: "Counter Group",
      value_key: "counter_group_uuid",
      label_key: "counter_group_title",
    },
    {
      options: itemGroup,
      label: "Item Group",
      value_key: "item_group_uuid",
      label_key: "item_group_title",
    },
  ];

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
              <span>Start</span>
              <input
                type="date"
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                value={filters.startDate}
                placeholder="Search Counter Title..."
                className="searchInput report_date_filter"
              />
            </div>
            <div className="label-input-container">
              <span>End</span>
              <input
                type="date"
                className="searchInput report_date_filter"
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                value={filters.endDate}
                placeholder="Search Route Title..."
              />
            </div>
            {options?.map((i) => (
              <div className="label-input-container">
                <span>{i.label}</span>
                <FormControl sx={{ width: 180 }}>
                  <Select
                    displayEmpty
                    className={"mui-multi-select"}
                    value={filters[i.value_key]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        [i.value_key]: e.target.value,
                      }))
                    }
                    title={
                      i?.options?.find(
                        (_i) => _i[i.value_key] === filters[i.value_key]
                      )?.[i.label_key] || ""
                    }
                    MenuProps={MenuProps}
                  >
                    <MenuItem sx={{ fontSize: ".88rem" }} value={""}>
                      <em>All</em>
                    </MenuItem>
                    {i?.options?.map((a) => (
                      <MenuItem
                        sx={{ fontSize: ".88rem" }}
                        value={a[[i.value_key]]}
                      >
                        {a[i.label_key]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            ))}
            <button className="theme-btn" onClick={() => search()}>
              Search
            </button>
			<button className="theme-btn" onClick={() => ExcelDownload()}>
              Excel
            </button>
          </div>
        </div>
        <div
          className="table-container-user item-sales-container"
          onScroll={onScroll}
          style={{ scrollBehavior: "smooth", overflow: "auto" }}
        >
          <Table tableRef={tableRef} data={data} loading={loading} />
        </div>
      </div>
    </>
  );
};

export default ItemDetails;
function Table({ data = [], loading, tableRef }) {
  const fields = [
    "Sales",
    "Delivery Returned",
    "Processing Cancelled",
    "Auto Added",
  ];
  const keys = fields.map(
    (i) => i.toLowerCase().split(" ")[1] || i.toLowerCase()
  );
  const columns = ["Item Name", "MRP"]?.concat(
    fields.reduce((arr, i) => arr.concat([i, "Amount"].filter((_i) => _i)), [])
  );
  const [sortingState, setSortingState] = useState({});
  const [salesIn, setSalesIn] = useState("p");
  // const sortData = keys => {
  // 	const sortTarget = sortingState?.sort_target?.toLowerCase()
  // 	const sortMethod = sortingState[sortingState?.sort_target]
  // 	const sortedData = keys?.sort(
  // 		(a, b) =>
  // 			(sortTarget === "user"
  // 				? data[a]?.user_title?.localeCompare(data[b]?.user_title)
  // 				: (data[a]?.[sortTarget]?.amount || 0) - (data[b]?.[sortTarget]?.amount || 0)) * sortMethod
  // 	)
  // 	return sortedData
  // }

  function formatIndianCurrency(number) {
    const indianNumberFormat = new Intl.NumberFormat("en-IN");
    return indianNumberFormat.format(number);
  }
  const CovertedQty = (qty, conversion) => {
    let b = qty / +conversion;
    b = Math.sign(b) * Math.floor(Math.sign(b) * b);
    let p = Math.floor(qty % +conversion);
    return b + ":" + p;
  };
  return (
    <table
      ref={tableRef}
      className="user-table performance-summary-table counter-report"
    >
      <thead>
        <tr>
          {columns?.map((i) => (
            <th
              onClick={(e) => {
                e.stopPropagation();
                if (i.toLowerCase() !== "sales")
                  setSortingState((prev) => ({
                    ...prev,
                    [i]: (prev[i] || 1) * -1,
                    sort_target: i,
                  }));
              }}
            >
              <div>
                <span className="flex">
                  {i}
                  {i.toLowerCase() === "sales" ? (
                    <select
                      value={salesIn}
                      className={"mui-multi-select"}
                      onChange={(e) => {
                        e.stopPropagation();
                       
                        setSalesIn(e.target.value);
                      }}
                      style={{
                        width: "50px",
                        fontSize: "10px",
                        padding: "0px",
                        margin: "0px",
                        marginLeft: "5px",
                      }}
                    >
                      <option value="b">Box</option>
                      <option value="p">Pcs</option>
                    </select>
                  ) : (
                    ""
                  )}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (i.toLowerCase() === "sales")
                      setSortingState((prev) => ({
                        ...prev,
                        [i]: (prev[i] || 1) * -1,
                        sort_target: i,
                      }));
                  }}
                >
                  {sortingState?.[i] === 1 ? (
                    <TiArrowSortedUp />
                  ) : sortingState?.[i] === -1 ? (
                    <TiArrowSortedDown />
                  ) : (
                    <TiArrowUnsorted />
                  )}
                </span>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="tbody">
        {data?.map((item) => (
          <tr key={item?.item_uuid}>
            <td>{item.item_title}</td>
            <td>{formatIndianCurrency(item?.mrp || 0)}</td>
            {keys?.map((key, idx) => (
              <Fragment key={item?.item_uuid + key}>
                <td>
                  <div>
                    <span>
                      <b>
                        {key === "sales"
                          ? salesIn === "p"
                            ? item?.[key]?.p
                            : CovertedQty(item?.[key]?.p, item?.conversion)
                          : item?.[key]?.p || 0}
                      </b>
                    </span>
                    {idx > 0 && item?.[key]?.p ? (
                      <span>{item?.[key]?.pct || 0}%</span>
                    ) : (
                      ""
                    )}
                  </div>
                </td>
                <td>{formatIndianCurrency(item?.[key]?.price || 0)}</td>
              </Fragment>
            ))}
          </tr>
        ))}
        {loading && (
          <tr>
            <td colSpan={columns?.length}>
              <div style={{ width: "calc(100vw - 100px)" }}>
                <span
                  className="loader"
                  style={{
                    width: "20px",
                    height: "20px",
                    borderWidth: "4px",
                    display: "block",
                    margin: "0 auto",
                    background: "white",
                  }}
                ></span>
              </div>
            </td>
          </tr>
        )}
        {/* <tr
					style={{
						height: "30px",
						position: "sticky",
						bottom: 0,
						background: "#ffffff",
						boxShadow: "0px 0px 25px -15px black"
					}}
				>
					<td colSpan={2}>
						<b>TOTAL: </b>
					</td>
					{companies?.map(({ company_uuid: key }) => (
						<td>
							<div>
								<span>
									<b>₹{formatIndianCurrency(total_values?.[key]?.total_amount || 0)}</b>
								</span>
								<span>
									{total_values?.[key]?.b || 0}:{total_values?.[key]?.p || 0}
								</span>
							</div>
						</td>
					))}
				</tr> */}
      </tbody>
    </table>
  );
}
