import React, { useState, useEffect } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
import VoucherDetails from "../../components/VoucherDetails"
import { DeleteOutline } from "@mui/icons-material"
import axios from "axios"

const StockTransferVouchers = () => {
	const [itemsData, setItemsData] = useState([])
	const [filterItemsData, setFilterItemsData] = useState([])
	const [filterToWarehouse, setFilterToWarehouse] = useState()
	const [filterFromWarehouse, setFilterFromWarehouse] = useState()
	const [filterType, setFilterType] = useState("ST")
	const [warehouse, setWarehouse] = useState([])
	const [popupForm, setPopupForm] = useState(false)
	const [popupOrder, setPopupOrder] = useState(null)
	const [users, setUsers] = useState([])
	const [completed, setCompleted] = useState(0)
	const [searchData, setSearchData] = useState({
		startDate: "",
		endDate: ""
	})

	const getUsers = async () => {
		const response = await axios({
			method: "get",
			url: "/users/GetUserList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		
		if (response.data.success) setUsers(response.data.result)
	}

	const GetWarehouseList = async () => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setWarehouse(response.data.result)
	}

	const getItemsData = async () => {
		const response = await axios.get("/vouchers/GetPendingVoucharsList")
		if (response.data.success)
			setItemsData(
				response.data.result.map(b => ({
					...b,
					created_by_user:
						+b.created_by === 240522 ? "Admin" : users.find(a => a.created_by === b.user_uuid)?.user_title || "-",
					from_warehouse_title:
						+b.from_warehouse === 0
							? "None"
							: warehouse.find(a => a.warehouse_uuid === b.from_warehouse)?.warehouse_title || "-",
					to_warehouse_title:
						+b.to_warehouse === 0
							? "None"
							: warehouse.find(a => a.warehouse_uuid === b.to_warehouse)?.warehouse_title || "-"
				}))
			)
		else setItemsData([])
	}

	useEffect(() => {
		if (+completed !== 1) getItemsData()
		else setItemsData([])
	}, [popupForm, warehouse, users, completed])

	useEffect(() => {
		setFilterItemsData(
			itemsData
				?.filter(
					a =>
						(!filterFromWarehouse ||
							a.from_warehouse_title?.toLocaleLowerCase().includes(filterFromWarehouse?.toLocaleLowerCase())) &&
						(!filterToWarehouse ||
							a.to_warehouse_title?.toLocaleLowerCase().includes(filterToWarehouse?.toLocaleLowerCase())) &&
						(!filterType || a.type?.toLocaleLowerCase().includes(filterType?.toLocaleLowerCase()))
				)
				.map(a => {
					let itemsDetails = a.item_details
					let qty =
						itemsDetails.length > 1
							? itemsDetails.reduce((c, d) => ({
									b: +c.b + +d.b,
									p: +c.p + +d.p
							  }))
							: itemsDetails.length
							? itemsDetails[0]
							: { b: 0, p: 0 }
							let estValue = 0
							itemsDetails.forEach(item => {
								estValue += item.estValue
							})
					return {
						...a,
						type: a.type === "ST" ? "Stock Transfer" : "Adjustment",
						qty,
						estValue: estValue.toFixed(2)
					}
				})
		)
	}, [completed, filterFromWarehouse, filterToWarehouse, filterType, itemsData])

	useEffect(() => {
		GetWarehouseList()
		getUsers()
	}, [])

	const fetchDeliveredVouchers = async e => {
		e.preventDefault()
		try {
			const response = await axios.post("/vouchers/deliveredVouchers", {
				fromDate: searchData?.startDate ? new Date(searchData?.startDate).setHours(5, 30, 0, 0) : null,
				toDate: searchData?.endDate ? new Date(searchData?.endDate).setHours(23, 59, 59, 999) : null
			})
			if (response.data.success)
				setItemsData(
					response.data.result.map(b => ({
						...b,
						created_by_user:
							+b.created_by === 240522
								? "Admin"
								: users.find(a => a.created_by === b.user_uuid)?.user_title || "-",
						from_warehouse_title:
							+b.from_warehouse === 0
								? "None"
								: warehouse.find(a => a.warehouse_uuid === b.from_warehouse)?.warehouse_title || "-",
						to_warehouse_title:
							+b.to_warehouse === 0
								? "None"
								: warehouse.find(a => a.warehouse_uuid === b.to_warehouse)?.warehouse_title || "-"
					}))
				)
			else setItemsData([])
		} catch (error) { console.error(error) }
	}

	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading" style={{ position: "relative" }}>
					<h2>Vouchers</h2>
					<div
						style={{
							position: "absolute",
							right: "30px",
							top: "50%",
							translate: "0 -50%",
							color: "white"
						}}
					>
						<div>Total Vouchers: {filterItemsData.length}</div>
					</div>
				</div>
				<div id="item-sales-top">
					<div
						id="date-input-container"
						style={{
							overflow: "visible",
							display: "flex",
							alignItems: "center",
							width: "100%"
						}}
					>
						{" "}
						<div className="inputGroup">
							<label htmlFor="Warehouse">From Warehouse</label>
							<input
								type="text"
								onChange={e => setFilterFromWarehouse(e.target.value)}
								placeholder="..."
								value={filterFromWarehouse}
								className="searchInput"
								style={{ width: "150px" }}
							/>
						</div>
						<div className="inputGroup">
							<label htmlFor="Warehouse">To Warehouse</label>
							<input
								type="text"
								onChange={e => setFilterToWarehouse(e.target.value)}
								placeholder="..."
								value={filterToWarehouse}
								className="searchInput"
								style={{ width: "150px" }}
							/>
						</div>
						<div className="inputGroup">
							<label htmlFor="Warehouse">Type</label>
							<select
								type="text"
								onChange={e => {
									setFilterType(e.target.value)
								}}
								value={filterType}
								placeholder="Type..."
								className="searchInput"
							>
								<option value="ST">Stock Transfer</option>
								<option value="SA">Adjustment</option>
							</select>
						</div>
						<div className="inputGroup">
							<label htmlFor="Warehouse">Status</label>
							<select
								type="text"
								onChange={e => {
									setCompleted(e.target.value)
								}}
								value={completed}
								placeholder="Search User..."
								className="searchInput"
							>
								<option value={0}>Pending</option>
								<option value={1}>Delivered</option>
							</select>
						</div>
						{+completed === 1 && (
							<form
								onSubmit={fetchDeliveredVouchers}
								style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}
							>
								<div className="inputGroup">
									<label htmlFor="Warehouse">Start Date</label>
									<input
										type="date"
										onChange={e =>
											setSearchData(prev => ({
												...prev,
												startDate: e.target.value
											}))
										}
										value={searchData.startDate}
										className="searchInput"
										pattern="\d{4}-\d{2}-\d{2}"
										required={!searchData?.startDate && !searchData?.endDate}
									/>
								</div>
								<div className="inputGroup">
									<label htmlFor="Warehouse">End Date</label>
									<input
										type="date"
										onChange={e =>
											setSearchData(prev => ({
												...prev,
												endDate: e.target.value
											}))
										}
										value={searchData.endDate}
										className="searchInput"
										pattern="\d{4}-\d{2}-\d{2}"
										required={!searchData?.startDate && !searchData?.endDate}
									/>
								</div>
								<button type="submit" className="theme-btn">
									Search
								</button>
							</form>
						)}
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={filterItemsData}
						setPopupForm={setPopupForm}
						completed={completed}
						setPopupOrder={setPopupOrder}
					/>
				</div>
			</div>
			{popupForm ? (
				<NewUserForm
					onSave={() => setPopupForm(false)}
					setItemsData={setItemsData}
					popupInfo={popupForm}
					users={users}
				/>
			) : (
				""
			)}
			{popupOrder ? (
				<VoucherDetails
					onSave={() => {
						setPopupOrder(null)
						getItemsData()
					}}
					order={popupOrder}
					orderStatus="edit"
					completed={completed}
				/>
			) : (
				""
			)}
		</>
	)
}

export default StockTransferVouchers
function Table({ itemsDetails, setPopupForm, completed, setPopupOrder }) {
	const [items, setItems] = useState("sort_order")
	const [order, setOrder] = useState("")

	function formatAMPM(date) {
		var hours = date.getHours()
		var minutes = date.getMinutes()
		var ampm = hours >= 12 ? "pm" : "am"
		hours = hours % 12
		hours = hours ? hours : 12 // the hour '0' should be '12'
		minutes = minutes < 10 ? "0" + minutes : minutes
		var strTime = hours + ":" + minutes + " " + ampm
		return strTime
	}
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>

					<th colSpan={3}>
						<div className="t-head-element">
							<span>Type</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("type")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("type")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Voucher Number</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("type")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("type")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Created by</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("created_by_user")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("created_by_user")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>Created At</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("created_at")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("created_at")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>From Warehouse</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("from_warehouse_title")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("from_warehouse_title")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={3}>
						<div className="t-head-element">
							<span>To Warehouse</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("to_warehouse_title")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("to_warehouse_title")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Quantity</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("qty")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("qty")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Est. Value</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("qty")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("qty")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					{+completed ? "" : <th colSpan={3}></th>}
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					.sort((a, b) =>
						order === "asc"
							? typeof a[items] === "string"
								? a[items]?.localeCompare(b[items])
								: typeof a[items] === "object"
								? a[items]?.b - b[items]?.b + (a[items]?.p - b[items]?.p)
								: a[items] - b[items]
							: typeof a[items] === "string"
							? b[items]?.localeCompare(a[items])
							: typeof a[items] === "object"
							? b[items]?.b - a[items]?.b + (b[items]?.p - a[items]?.p)
							: b[items] - a[items]
					)
					?.map((item, i) => (
						<tr
							key={Math.random()}
							style={{ height: "30px" }}
							onClick={e => {
								e.stopPropagation()
								setPopupOrder(item)
							}}
						>
							<td>{i + 1}</td>
							<td colSpan={3}>{item.type}</td>
							<td colSpan={3}>{item?.vocher_number || ""}</td>
							<td colSpan={3}>{item.created_by_user}</td>
							<td colSpan={3}>
								{new Date(+item.created_at).toDateString()} - {formatAMPM(new Date(+item.created_at))}
							</td>
							<td colSpan={3}>{item.from_warehouse_title || ""}</td>
							<td colSpan={3}>{item.to_warehouse_title || ""}</td>
							<td colSpan={2}>
								{item.qty.b || 0}:{item.qty.p || 0}
							</td>
							<td colSpan={2}>
								{item.estValue}
							</td>
							{+completed ? (
								""
							) : (
								<>
									<td colSpan={2}>
										<button
											className="theme-btn"
											onClick={e => {
												e.stopPropagation()

												setPopupForm({ type: "Delivery", data: item })
											}}
										>
											Confirm Delivery
										</button>
									</td>
									<td
										onClick={e => {
											e.stopPropagation()

											setPopupForm({ type: "Delete", data: item })
										}}
									>
										<DeleteOutline />
									</td>
								</>
							)}
						</tr>
					))}
			</tbody>
		</table>
	)
}
function NewUserForm({ onSave, popupInfo }) {
	const [data, setdata] = useState({})
	const [disabled, setDisabled] = useState(true)

	useEffect(() => {
		setdata(popupInfo.data)

		setDisabled(false)
	}, [popupInfo.data])

	const submitHandler = async e => {
		setDisabled(true)
		e.preventDefault()
		if (popupInfo?.type === "Delete") {
			const response = await axios({
				method: "delete",
				url: "/vouchers/DeleteVoucher",
				data,
				headers: {
					"Content-Type": "application/json"
				}
			})
			if (response.data.success) {
				onSave()
			}
		} else {
			const response = await axios({
				method: "put",
				url: "/vouchers/ConfirmVoucher",
				data,
				headers: {
					"Content-Type": "application/json"
				}
			})
			if (response.data.success) {
				onSave()
			}
		}
		setDisabled(false)
	}

	
	return (
		<div className="overlay">
			<div className="modal" style={{ width: "fit-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>Confirm {popupInfo.type}</h1>
							</div>

							<button style={{ opacity: disabled ? 0.5 : 1 }} type="submit" className="submit" disabled={disabled}>
								{disabled ? "Please Wait..." : "Confirm"}
							</button>
						</form>
					</div>
					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
