import axios from "axios"
import React, { useState, useEffect, useMemo } from "react"
import Sidebar from "../../components/Sidebar"
import Headers from "../../components/Header"
import * as XLSX from "xlsx"
import * as FileSaver from "file-saver"
import Select from "react-select"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"

import MenuItem from "@mui/material/MenuItem"
import Selected from "@mui/material/Select"
import ListItemText from "@mui/material/ListItemText"
import Checkbox from "@mui/material/Checkbox"
const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
			width: 250
		}
	}
}
const names = [
	"Oliver Hansen",
	"Van Henry",
	"April Tucker",
	"Ralph Hubbard",
	"Omar Alexander",
	"Carlos Abbott",
	"Miriam Wagner",
	"Bradley Wilkerson",
	"Virginia Andrews",
	"Kelly Snyder"
]
const CurrentStock = () => {
	const [itemsData, setItemsData] = useState([])
	const [filterTitle, setFilterTitle] = useState("")

	const [itemEditPopup, setItemEditPopup] = useState("")
	const [item, setItem] = useState("")
	const [filterCategory, setFilterCategory] = useState("")
	const [filterCompany, setFilterCompany] = useState("")
	const [itemCategories, setItemCategories] = useState([])
	const [companies, setCompanies] = useState([])
	const [warehouseData, setWarehouseData] = useState([])
	const [selectedOptions, setSelectedOptions] = useState([])
	const [personName, setPersonName] = React.useState([])
	const [disabledItem, setDisabledItem] = useState(false)
	const [flushPopup, setFlushPopup] = useState(false)
	const filteritem = useMemo(
		() =>
			(
				itemsData.filter(
					a =>
						a.item_title &&
						(disabledItem || a.status) &&
						(!filterTitle || a.item_title.toLocaleLowerCase().includes(filterTitle.toLocaleLowerCase())) &&
						(!filterCompany || a.company_uuid === filterCompany) &&
						(!filterCategory || a.category_uuid === filterCategory)
				) || []
			)
				?.map(a => ({
					...a,
					category_title: itemCategories.find(b => b.category_uuid === a.category_uuid)?.category_title
				}))
				.sort(
					(a, b) =>
						a?.category_title?.localeCompare(b.category_title) || a?.item_title?.localeCompare(b.item_title)
				),
		[itemsData, disabledItem, filterTitle, filterCompany, filterCategory, itemCategories]
	)
	const handleChange = event => {
		const {
			target: { value }
		} = event
		setPersonName(
			// On autofill we get a stringified value.
			typeof value === "string" ? value.split(",") : value
		)
	}
	const fileExtension = ".xlsx"
	const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"

	const getItemsData = async () => {
		const cachedData = localStorage.getItem("itemsData")
		if (cachedData) {
			const localData = JSON.parse(cachedData)
			setItemsData(localData.filter(a => a.item_title))
		} else {
			const response = await axios({
				method: "get",
				url: "/items/GetItemList",
				headers: {
					"Content-Type": "application/json"
				}
			})
			
			if (response.data.success) {
				localStorage.setItem("itemsData", JSON.stringify(response.data.result))
				setItemsData(response.data.result.filter(a => a.item_title))
			}
		}
	}

	const getItemCategories = async () => {
		const response = await axios({
			method: "get",
			url: "/itemCategories/GetItemCategoryList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setItemCategories(response.data.result)
	}
	const getCompanies = async () => {
		const cachedData = localStorage.getItem("companiesData")

		if (cachedData) {
			setCompanies(JSON.parse(cachedData))
		} else {
			const response = await axios({
				method: "get",
				url: "/companies/getCompanies",
				headers: {
					"Content-Type": "application/json"
				}
			})

			if (response.data.success) {
				localStorage.setItem("companiesData", JSON.stringify(response.data.result))
				setCompanies(response.data.result)
			}
		}
	}
	useEffect(() => {
		getCompanies()
		getItemCategories()
	}, [])
	const GetWarehouseList = async () => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success)
			setWarehouseData(
				response.data.result
					.filter(a => a.warehouse_title)
					.map(a => ({
						...a,
						id: a.warehouse_uuid,
						name: a.warehouse_title,
						slug: a.warehouse_title,
						type: "Main",
						locale: "en",
						created_at: "2021-11-15T08:27:23.000Z",
						updated_at: "2021-11-15T08:27:23.000Z",
						cover: null
					}))
			)
	}

	useEffect(() => {
		getItemsData()
		GetWarehouseList()
		return () => {
			sessionStorage.removeItem("password")
		}
	}, [])
	useEffect(() => {
		setSelectedOptions(warehouseData)
	}, [warehouseData])
	let sheetData = useMemo(() => {
		let data = []
		for (let item of filteritem
			?.map(a => ({
				...a,
				category_title: itemCategories.find(b => b.category_uuid === a.category_uuid)?.category_title
			}))
			.sort(
				(a, b) => a?.category_title?.localeCompare(b.category_title) || a?.item_title?.localeCompare(b.item_title)
			)) {
			let obj = { "Item Name": item.item_title }
			for (let a of selectedOptions) {
				let objData = item?.stock?.find(b => b.warehouse_uuid === a.warehouse_uuid)
				obj = {
					...obj,
					[a.warehouse_title || ""]: CovertedQty(objData?.qty || 0, item.conversion)
				}
			}
			let stock = item?.stock?.filter(a => selectedOptions?.find(b => b.warehouse_uuid === a.warehouse_uuid))
			obj = {
				...obj,
				total: CovertedQty(
					stock?.length > 1
						? stock.map(a => +a.qty || 0).reduce((a, b) => a + b)
						: stock?.length
						? stock[0]?.qty
						: 0,
					item.conversion
				)
			}
			data.push(obj)
		}
		return data
	}, [filteritem, itemCategories, selectedOptions])

	const downloadHandler = async () => {
		const ws = XLSX.utils.json_to_sheet(sheetData)
		const wb = { Sheets: { data: ws }, SheetNames: ["data"] }
		const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
		const data = new Blob([excelBuffer], { type: fileType })
		FileSaver.saveAs(data, "Stocks" + fileExtension)
	}

	const handleWarhouseOptionsChange = event => {
		const {
			target: { value }
		} = event

		

		const filterdValue = value.filter(item => selectedOptions.findIndex(o => o.id === item.id) >= 0)

		let duplicatesRemoved = value.filter((item, itemIndex) =>
			value.findIndex((o, oIndex) => o.id === item.id && oIndex !== itemIndex)
		)

		

		// let map = {};

		// for (let list of value) {
		//   map[Object.values(list).join('')] = list;
		// }

		let duplicateRemoved = []

		value.forEach(item => {
			if (duplicateRemoved.findIndex(o => o.id === item.id) >= 0) {
				duplicateRemoved = duplicateRemoved.filter(x => x.id === item.id)
			} else {
				duplicateRemoved.push(item)
			}
		})

		setSelectedOptions(duplicateRemoved)
	}
	const categoryOptions = useMemo(() => {
		return [
			{ value: "", label: "All" },
			...itemCategories
				.filter(a => a.company_uuid === filterCompany || !filterCompany)
				.map(a => ({
					value: a.category_uuid,
					label: a.category_title
				}))
		]
	}, [filterCompany, itemCategories])
	return (
		<>
			<Sidebar />
			<Headers />
			<div className="item-sales-container orders-report-container">
				<div id="heading" className="flex">
					<h2 style={{ width: "70%" }}>Current Stock</h2>
				</div>
				<div id="item-sales-top">
					<div
						id="date-input-container"
						style={{
							overflow: "visible",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							width: "100%"
						}}
					>
						<div className="inputGroup">
							<label htmlFor="Warehouse">Item</label>
							<div className="inputGroup" style={{ width: "150px" }}>
								<input
									type="text"
									onChange={e => setFilterTitle(e.target.value)}
									value={filterTitle}
									placeholder="Search Item Title..."
									className="searchInput"
								/>
							</div>
						</div>
						<div className="inputGroup">
							<label htmlFor="Warehouse">Companies</label>
							<div className="inputGroup" style={{ width: "150px" }}>
								<Select
									options={[
										{ value: "", label: "All" },
										...companies.map(a => ({
											value: a.company_uuid,
											label: a.company_title
										}))
									]}
									onChange={doc => {
										setFilterCompany(doc.value)
										setFilterCategory("")
									}}
									value={
										filterCompany
											? {
													value: filterCompany,
													label: companies?.find(j => j.company_uuid === filterCompany)?.company_title
											  }
											: { value: "", label: "All" }
									}
									// autoFocus={!order?.from_warehouse}
									openMenuOnFocus={true}
									menuPosition="fixed"
									menuPlacement="auto"
									placeholder="Select"
								/>
							</div>
						</div>
						<div className="inputGroup">
							<label htmlFor="Warehouse">Categories</label>
							<div className="inputGroup" style={{ width: "150px" }}>
								<Select
									options={categoryOptions}
									onChange={doc => setFilterCategory(doc.value)}
									value={
										filterCategory
											? categoryOptions.find(j => j.value === filterCategory)
											: { value: "", label: "All" }
									}
									// autoFocus={!order?.from_warehouse}
									openMenuOnFocus={true}
									menuPosition="fixed"
									menuPlacement="auto"
									placeholder="Select"
								/>
							</div>
						</div>
						<div className="inputGroup">
							<label htmlFor="Warehouse">Warehouse</label>
							<div className="inputGroup" style={{ width: "150px" }}>
								<Selected
									labelId="demo-multiple-checkbox-label"
									id="demo-multiple-checkbox"
									multiple
									value={selectedOptions}
									onChange={handleWarhouseOptionsChange}
									// input={<OutlinedInput label="Warehouses" />}
									renderValue={selected =>
										selected.length === warehouseData.length
											? "All"
											: !selected.length
											? "None"
											: selected.map(x => x.name).join(", ")
									}
									MenuProps={MenuProps}
								>
									{warehouseData.map(variant => (
										<MenuItem key={variant.id} value={variant}>
											<Checkbox checked={selectedOptions.findIndex(item => item.id === variant.id) >= 0} />
											<ListItemText placeholder="variant.name" primary={variant.name} />
										</MenuItem>
									))}
								</Selected>
							</div>
						</div>
						<div
							style={{
								display: "flex",
								width: "120px",
								alignItems: "center",
								justifyContent: "space-between"
							}}
						>
							<input
								type="checkbox"
								onChange={e => setDisabledItem(e.target.checked)}
								value={disabledItem}
								className="searchInput"
								style={{ scale: "1.2" }}
							/>
							<div style={{ width: "100px" }}>Disabled Items</div>
						</div>
						<button className="theme-btn" onClick={() => setFlushPopup(true)}>
							Flush
						</button>
						<div>Total Items: {filteritem.length}</div>
						<button className="theme-btn" onClick={downloadHandler}>
							Excel
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={filteritem
							.map(a => ({
								...a,
								category_title: itemCategories.find(b => b.category_uuid === a.category_uuid)?.category_title
							}))
							.sort(
								(a, b) =>
									a?.category_title?.localeCompare(b.category_title) || a?.item_title?.localeCompare(b.item_title)
							)}
						setItemData={setItem}
						setItemEditPopup={setItemEditPopup}
						warehouseData={selectedOptions}
					/>
				</div>
			</div>
			{itemEditPopup ? (
				<QuantityChanged
					popupInfo={itemEditPopup}
					item={item}
					onSave={() => {
						setItemEditPopup("")
					}}
					update={getItemsData}
				/>
			) : (
				""
			)}
			{flushPopup ? (
				<FlushPopup
					warehouseData={warehouseData}
					onSave={() => {
						setFlushPopup("")
						getItemsData()
					}}
				/>
			) : (
				""
			)}
		</>
	)
}

export default CurrentStock

const CovertedQty = (qty, conversion) => {
	let b = qty / +conversion

	b = Math.sign(b) * Math.floor(Math.sign(b) * b)

	let p = Math.floor(qty % +conversion)

	return b + ":" + p
}
function Table({ itemsDetails, warehouseData, setItemEditPopup, setItemData }) {
	const [items, setItems] = useState("sort_order")
	const [order, setOrder] = useState(null)
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Item Name</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("item_title")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("item_title")
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
							<span>MRP</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("mrp")
										setOrder("asc")
									}}
								>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("mrp")
										setOrder("desc")
									}}
								>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					{warehouseData.map(a => (
						<th colSpan={2}>
							<div className="t-head-element">
								<span>{a.warehouse_title}</span>
								<div className="sort-buttons-container">
									<button
										onClick={() => {
											setItems(a)
											setOrder("asc")
										}}
									>
										<ChevronUpIcon className="sort-up sort-button" />
									</button>
									<button
										onClick={() => {
											setItems(a)
											setOrder("desc")
										}}
									>
										<ChevronDownIcon className="sort-down sort-button" />
									</button>
								</div>
							</div>
						</th>
					))}
					<th>Total</th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					.sort((a, b) =>
						order == null
							? 0
							: items?.warehouse_uuid
							? order === "asc"
								? (a?.stock?.find(c => items.warehouse_uuid === c.warehouse_uuid)?.qty || 0) -
								  (b?.stock?.find(c => items.warehouse_uuid === c.warehouse_uuid)?.qty || 0)
								: (b?.stock?.find(c => items.warehouse_uuid === c.warehouse_uuid)?.qty || 0) -
								  (a?.stock?.find(c => items.warehouse_uuid === c.warehouse_uuid)?.qty || 0)
							: order === "asc"
							? typeof a[items] === "string"
								? a[items].localeCompare(b[items])
								: a[items] - b[items]
							: typeof a[items] === "string"
							? b[items].localeCompare(a[items])
							: b[items] - a[items]
					)
					?.map((item, i, array) => (
						<tr key={Math.random()} style={{ height: "30px" }}>
							<td className="flex" style={{ justifyContent: "space-between" }}>
								{i + 1}
							</td>

							<td colSpan={2}>{item.item_title || ""}</td>
							<td colSpan={2}>{item.mrp || ""}</td>
							{warehouseData.map(a => {
								let data = item?.stock?.find(b => b.warehouse_uuid === a.warehouse_uuid)
								return (
									<>
										<td
											style={{
												textAlign: "left",
												cursor: "pointer"
											}}
											onClick={e => {
												e.stopPropagation()
												setItemEditPopup({
													...a,
													type: "qty",
													conversion: item.conversion
												})
												setItemData(item)
											}}
										>
											{CovertedQty(data?.qty || 0, item.conversion)}
										</td>
										<td
											style={{
												textAlign: "right",
												cursor: "pointer"
											}}
											className="hoverLink"
											onClick={e => {
												e.stopPropagation()
												setItemEditPopup({ ...a, type: "min_level" })
												setItemData(item)
											}}
										>
											({data?.min_level || 0})
										</td>
									</>
								)
							})}
							<td>
								{CovertedQty(
									item?.stock?.length > 1
										? item?.stock.map(a => +a.qty || 0).reduce((a, b) => a + b)
										: item?.stock?.length
										? item.stock[0]?.qty
										: 0,
									item.conversion
								)}
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
function QuantityChanged({ onSave, popupInfo, item, update }) {
	const [data, setdata] = useState({})
	const [total, setTotal] = useState(null)
	const [warning, setWarning] = useState()
	const [itemDetails, setItemDetails] = useState([])
	const [passwordPopup, setPasswordPopup] = useState(false)
	const [password, setPassword] = useState(sessionStorage.getItem("password") || "")
	const [searchData, setSearchData] = useState({
		startDate: "",
		endDate: ""
	})
	useEffect(() => {
		if (!item.status) setWarning(true)
	}, [item.status])
	useEffect(() => {
		let warehouseData = item.stock?.find(a => a.warehouse_uuid === popupInfo.warehouse_uuid)

		if (warehouseData) {
			let b = +warehouseData.qty / +item.conversion
			b = Math.sign(b) * Math.floor(Math.sign(b) * b)

			setdata({
				...warehouseData,
				b,
				p: Math.floor(+warehouseData.qty % +item.conversion)
			})
		} else
			setdata({
				warehouse_uuid: popupInfo.warehouse_uuid,
				b: 0,
				p: 0,
				min_level: 0
			})
	}, [item.conversion, item.stock, popupInfo.warehouse_uuid])
	const dateConverter = () => {
		let dateIn = new Date()

		dateIn.setHours(12)
		let dateFor10days = new Date(dateIn.setDate(dateIn.getDate() - 10))

		let strFor10Days =
			dateFor10days.getFullYear() +
			"-" +
			("0" + (dateFor10days.getMonth() + 1)).slice(-2) +
			"-" +
			("0" + dateFor10days.getDate()).slice(-2)
		strFor10Days = new Date(strFor10Days)

		return strFor10Days
	}

	useEffect(() => {
		if (popupInfo.type !== "qty") {
			let time = new Date()
			let curTime = "yy-mm-dd"
				.replace("mm", ("00" + (time?.getMonth() + 1)?.toString()).slice(-2))
				.replace("yy", ("0000" + time?.getFullYear()?.toString()).slice(-4))
				.replace("dd", ("00" + time?.getDate()?.toString()).slice(-2))
			let sTime = "yy-mm-dd"
				.replace("mm", ("00" + (dateConverter()?.getMonth() + 1)?.toString()).slice(-2))
				.replace("yy", ("0000" + dateConverter()?.getFullYear()?.toString()).slice(-4))
				.replace("dd", ("00" + dateConverter()?.getDate()?.toString()).slice(-2))
			setSearchData(prev => ({
				...prev,
				startDate: sTime,
				endDate: curTime
			}))
		}
	}, [popupInfo.type])
	const submitHandler = async e => {
		e.preventDefault()
		let qty = +(+data.b * +item.conversion) + +data.p
		let stock = item.stock
		stock = stock?.filter(a => a.warehouse_uuid === popupInfo.warehouse_uuid)?.length
			? stock.map(a => (a.warehouse_uuid === popupInfo.warehouse_uuid ? { ...data, qty } : a))
			: stock?.length
			? +popupInfo.warehouse_uuid === 0
				? stock || []
				: [
						...stock,
						{
							...data,
							qty
						}
				  ]
			: [
					{
						...data,
						qty
					}
			  ]
		
		const response = await axios({
			method: "put",
			url: "/items/putItem",
			data: [{ item_uuid: item.item_uuid, stock }],
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.result[0].success) {
			onSave()
			update()
		}
	}
	const getItemData = async () => {
		let startDate = new Date(searchData.startDate + " 00:00:00 AM")
		startDate = startDate.getTime()
		let endDate = new Date(searchData.endDate + " 00:00:00 AM")
		endDate = endDate.getTime()
		const response = await axios({
			method: "post",
			url: "/orders/getStockDetails",
			data: {
				startDate,
				endDate,
				counter_uuid: searchData.counter_uuid,
				item_uuid: item.item_uuid,
				warehouse_uuid: popupInfo.warehouse_uuid
			},
			headers: {
				"Content-Type": "application/json"
			}
		})
		
		if (response.data.success) {
			setItemDetails(response.data.result)
			setTotal(response.data.total)
		} else {
			setItemDetails([])
			setTotal(null)
		}
	}
	
	const checkPassword = async e => {
		e.preventDefault()
		const response = await axios({
			method: "get",
			url: "/details/checkPassword/" + password,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setPasswordPopup(false)
			sessionStorage.setItem("password", password)
			submitHandler(e)
		}
	}

	return popupInfo.type === "qty" ? (
		<div className="overlay">
			<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content"
					}}
				>
					{warning ? (
						<div style={{ overflowY: "scroll" }}>
							<form
								className="form"
								onSubmit={e => {
									e.preventDefault()
									setWarning(false)
								}}
							>
								<div className="formGroup">
									<h2>Item Status is Off</h2>
								</div>

								<button type="submit" className="submit">
									Okay
								</button>
							</form>
						</div>
					) : passwordPopup ? (
						<div style={{ overflowY: "scroll" }}>
							<form className="form" onSubmit={checkPassword}>
								<div className="formGroup">
									<div className="row" style={{ flexDirection: "row", alignItems: "flex-start" }}>
										<label className="selectLabel flex" style={{ width: "100px" }}>
											Password
											<input
												type="number"
												name="password"
												className="numberInput"
												value={password}
												style={{ width: "100px" }}
												onChange={e => setPassword(e.target.value)}
												maxLength={42}
												onWheel={e => e.preventDefault()}
											/>
										</label>
									</div>
								</div>

								<button type="submit" className="submit">
									Save changes
								</button>
							</form>
						</div>
					) : (
						<div style={{ overflowY: "scroll" }}>
							<form
								className="form"
								onSubmit={e => {
									e.preventDefault()
									if (password) {
										submitHandler(e)
									} else setPasswordPopup(true)
								}}
							>
								<div className="formGroup">
									<div className="row" style={{ flexDirection: "row", alignItems: "flex-start" }}>
										<label className="selectLabel flex" style={{ width: "100px" }}>
											Box
											<input
												type="number"
												name="route_title"
												className="numberInput"
												value={data.b}
												style={{ width: "100px" }}
												onChange={e =>
													setdata({
														...data,
														b: e.target.value
													})
												}
												maxLength={42}
												onWheel={e => e.preventDefault()}
											/>
											{popupInfo.conversion || 0}
										</label>
										<label className="selectLabel flex" style={{ width: "100px" }}>
											Pcs
											<input
												type="number"
												name="route_title"
												className="numberInput"
												value={data.p}
												style={{ width: "100px" }}
												onChange={e =>
													setdata({
														...data,
														p: e.target.value
													})
												}
												maxLength={42}
												onWheel={e => e.preventDefault()}
												autoFocus={true}
											/>
										</label>
									</div>
								</div>

								<button type="submit" className="submit">
									Save changes
								</button>
							</form>
						</div>
					)}
					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	) : (
		<div className="overlay">
			<div
				className="modal"
				style={{
					height: "fit-content",
					width: "90vw",
					padding: "50px",
					zIndex: "999999999",
					border: "2px solid #000"
				}}
			>
				<div className="inventory">
					<div
						className="accountGroup"
						id="voucherForm"
						action=""
						style={{
							height: "400px",
							maxHeight: "500px",
							overflow: "scroll"
						}}
					>
						<div className="inventory_header">
							<h2>
								{item.item_title}{" "}
								{CovertedQty(
									item.stock?.find(a => a.warehouse_uuid === popupInfo.warehouse_uuid)?.qty || 0,
									item.conversion
								)}
							</h2>
						</div>
						<div id="item-sales-top">
							<div
								id="date-input-container"
								style={{
									overflow: "visible",
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									width: "100%"
								}}
							>
								<input
									type="date"
									onChange={e =>
										setSearchData(prev => ({
											...prev,
											startDate: e.target.value
										}))
									}
									value={searchData.startDate}
									placeholder="Search Counter Title..."
									className="searchInput"
									pattern="\d{4}-\d{2}-\d{2}"
								/>
								<input
									type="date"
									onChange={e =>
										setSearchData(prev => ({
											...prev,
											endDate: e.target.value
										}))
									}
									value={searchData.endDate}
									placeholder="Search Route Title..."
									className="searchInput"
									pattern="\d{4}-\d{2}-\d{2}"
								/>

								<button className="theme-btn" onClick={getItemData}>
									Search
								</button>
							</div>
						</div>
						<div className="table-container-user item-sales-container">
							<table
								className="user-table"
								style={{
									maxWidth: "100vw",
									height: "fit-content",
									overflowX: "scroll"
								}}
							>
								<thead>
									<tr>
										<th>S.N</th>
										<th colSpan={2}>Date</th>
										<th colSpan={2}>To</th>
										<th colSpan={2}>Invoice Number</th>
										<th colSpan={2}>Added</th>
										<th colSpan={2}>Reduce</th>
									</tr>
								</thead>
								<tbody className="tbody">
									{itemDetails?.map((item, i, array) => {
										return (
											<tr key={Math.random()} style={{ height: "30px" }}>
												<td>{i + 1}</td>
												<td colSpan={2}>{new Date(item.date)?.toDateString() || ""}</td>
												<td colSpan={2}>{item.to || ""}</td>
												<td colSpan={2}>N{item.invoice_number || ""}</td>
												<td colSpan={2}>{item.added || 0}</td>
												<td colSpan={2}>{item.reduce || 0}</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
						<div className="flex" style={{ justifyContent: "space-between" }}>
							<h3>Total: </h3>
							<div style={{ width: "30vw" }}></div>
							<h3>
								{total?.addedB || 0}:{total?.addedP || 0}
							</h3>
							<h3>
								{total?.reduceB || 0}:{total?.reduceP || 0}
							</h3>
						</div>
					</div>
					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
function FlushPopup({ onSave, warehouseData }) {
	const [data, setdata] = useState([])
	const [loading, setLoading] = useState()

	const submitHandler = async e => {
		setLoading(true)
		e.preventDefault()
		
		const response = await axios({
			method: "put",
			url: "/items/flushWarehouse",
			data: data.map(a => a.warehouse_uuid),
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			onSave()
		}
		setLoading(false)
	}
	const handleWarhouseOptionsChange = event => {
		const {
			target: { value }
		} = event

		

		const filterdValue = value.filter(item => data.findIndex(o => o.id === item.id) >= 0)

		let duplicatesRemoved = value.filter((item, itemIndex) =>
			value.findIndex((o, oIndex) => o.id === item.id && oIndex !== itemIndex)
		)

		

		// let map = {};

		// for (let list of value) {
		//   map[Object.values(list).join('')] = list;
		// }

		let duplicateRemoved = []

		value.forEach(item => {
			if (duplicateRemoved.findIndex(o => o.id === item.id) >= 0) {
				duplicateRemoved = duplicateRemoved.filter(x => x.id === item.id)
			} else {
				duplicateRemoved.push(item)
			}
		})

		setdata(duplicateRemoved)
	}
	return (
		<div className="overlay" style={{ zIndex: "9" }}>
			<div
				className="modal"
				style={{
					height: "fit-content",
					width: "400px",
					padding: "50px",
					zIndex: "999",
					border: "2px solid #000"
				}}
			>
				<div className="inventory">
					<div
						className="accountGroup"
						id="voucherForm"
						action=""
						style={{
							height: "200px",
							maxHeight: "500px",
							overflow: "scroll"
						}}
					>
						<div className="inventory_header">
							<h2>Select Warehouses</h2>
						</div>

						<div className="table-container-user item-sales-container">
							<div className="inputGroup">
								<label htmlFor="Warehouse">Warehouse</label>
								<div className="inputGroup" style={{ width: "250px" }}>
									<Selected
										labelId="demo-multiple-checkbox-label"
										id="demo-multiple-checkbox"
										multiple
										value={data}
										onChange={handleWarhouseOptionsChange}
										// input={<OutlinedInput label="Warehouses" />}
										renderValue={selected =>
											selected.length === warehouseData.length
												? "All"
												: !selected.length
												? "None"
												: selected.map(x => x.name).join(", ")
										}
										MenuProps={MenuProps}
										style={{ zIndex: 99999999999 }}
									>
										{warehouseData.map(variant => (
											<MenuItem key={variant.id} value={variant} style={{ zIndex: 99999999999 }}>
												<Checkbox checked={data.findIndex(item => item.id === variant.id) >= 0} />
												<ListItemText placeholder="variant.name" primary={variant.name} />
											</MenuItem>
										))}
									</Selected>
								</div>
								{!loading ? (
									<button type="button" className="submit" onClick={submitHandler}>
										Confirm
									</button>
								) : (
									<button type="button" className="submit" onClick={() => {}}>
										<svg viewBox="0 0 100 100" style={{ width: "25px" }}>
											<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
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
							</div>
						</div>
					</div>
					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
