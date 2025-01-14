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
			width: 250,
		},
	},
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
	"Kelly Snyder",
]
const PartyWiseCompanyDiscount = () => {
	const [countersData, setCountersData] = useState([])
	const [filterTitle, setFilterTitle] = useState("")
	const [filteritem, setFilterItems] = useState([])
	const [itemEditPopup, setItemEditPopup] = useState("")
	const [item, setItem] = useState("")
	const [filterCategory, setFilterCategory] = useState("")
	const [routes, setRoutes] = useState([])
	const [companies, setCompanies] = useState([])
	const [showsale, setShowsale] = useState(false)
	const [showsalePopup, setShowsalePopup] = useState(false)

	const [selectedOptions, setSelectedOptions] = useState([])
	const [personName, setPersonName] = React.useState([])

	const handleChange = event => {
		const {
			target: { value },
		} = event
		setPersonName(
			// On autofill we get a stringified value.
			typeof value === "string" ? value.split(",") : value
		)
	}
	const fileExtension = ".xlsx"
	const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/counters/GetCounterList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) setCountersData(response.data.result.filter(a => a.counter_title))
	}
	const getRoutesData = async () => {
		const response = await axios({
			method: "get",
			url: "/routes/GetRouteList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setRoutes(response.data.result)
	}

	const getCompanies = async () => {
		const cachedData = localStorage.getItem('companiesData');

		if (cachedData) {
			const localData = JSON.parse(cachedData);
			setCompanies(
				localData.map(a => ({
					...a,
					id: a.company_uuid,
					name: a.company_title,
					slug: a.company_title,
					type: "Main",
					locale: "en",
					created_at: "2021-11-15T08:27:23.000Z",
					updated_at: "2021-11-15T08:27:23.000Z",
					cover: null,
				}))
			)
		} else {
			const response = await axios({
				method: "get",
				url: "/companies/getCompanies",

				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				localStorage.setItem('companiesData', JSON.stringify(response.data.result));
				setCompanies(
					response.data.result.map(a => ({
						...a,
						id: a.company_uuid,
						name: a.company_title,
						slug: a.company_title,
						type: "Main",
						locale: "en",
						created_at: "2021-11-15T08:27:23.000Z",
						updated_at: "2021-11-15T08:27:23.000Z",
						cover: null,
					}))
				)
			}
		}
	}
	useEffect(() => {
		getCompanies()
		getRoutesData()
		getItemsData()
	}, [])
	// useEffect(() => {
	//   if (!showsale) getItemsData();
	// }, [showsale]);

	useEffect(() => {
		setSelectedOptions(companies)
	}, [companies])
	let sheetData = useMemo(() => {
		let data = []
		for (let item of filteritem?.sort((a, b) => +a.sort_order - +b.sort_order)) {
			let obj = {
				"Route Name": item.route_title,
				"Counter Name": item.counter_title,
			}
			for (let a of companies) {
				obj = {
					...obj,
					[a.company_title || ""]:
						item?.company_discount?.find(b => b.company_uuid === a.company_uuid)?.discount || 0,
				}
			}
			data.push(obj)
		}
		return data
	}, [filteritem, companies])
	
	const downloadHandler = async () => {
		const ws = XLSX.utils.json_to_sheet(sheetData)
		const wb = { Sheets: { data: ws }, SheetNames: ["data"] }
		const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
		const data = new Blob([excelBuffer], { type: fileType })
		FileSaver.saveAs(data, "Company Discounts" + fileExtension)
	}
	useEffect(
		() =>
			setFilterItems(
				countersData
					.map(b => ({
						...b,
						route_title: routes.find(a => a.route_uuid === b.route_uuid)?.route_title || "-",
						route_sort_order: routes.find(a => a.route_uuid === b.route_uuid)?.sort_order || 0,
					}))
					.filter(a => a.counter_title)
					.filter(
						a =>
							!filterTitle ||
							a.counter_title.toLocaleLowerCase().includes(filterTitle.toLocaleLowerCase())
					)
					.filter(a => !filterCategory || a.route_uuid === filterCategory) || []
			),
		[countersData, filterTitle, filterCategory, routes]
	)
	const handleWarhouseOptionsChange = event => {
		const {
			target: { value },
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
	return (
		<>
			<Sidebar />
			<Headers />
			<div className="item-sales-container orders-report-container">
				<div id="heading" className="flex">
					<h2 style={{ width: "70%" }}>Party Wise Company Discount</h2>
				</div>
				<div id="item-sales-top">
					<div
						id="date-input-container"
						style={{
							overflow: "visible",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							width: "100%",
						}}>
						<div className="inputGroup">
							<label htmlFor="Warehouse">Counter</label>
							<div className="inputGroup" style={{ width: "200px" }}>
								<input
									type="text"
									onChange={e => setFilterTitle(e.target.value)}
									value={filterTitle}
									placeholder="Search Counter Title..."
									className="searchInput"
								/>
							</div>
						</div>

						<div className="inputGroup">
							<label htmlFor="Warehouse">Route</label>
							<div className="inputGroup" style={{ width: "200px" }}>
								<Select
									options={[
										{ value: "", label: "All" },
										...routes.map(a => ({
											value: a.route_uuid,
											label: a.route_title,
										})),
									]}
									onChange={doc => setFilterCategory(doc.value)}
									value={
										filterCategory
											? {
													value: filterCategory,
													label: routes?.find(j => j.route_uuid === filterCategory)
														?.route_title,
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
							<label htmlFor="Warehouse">Companies</label>
							<div className="inputGroup" style={{ width: "200px" }}>
								<Selected
									labelId="demo-multiple-checkbox-label"
									id="demo-multiple-checkbox"
									multiple
									value={selectedOptions}
									onChange={handleWarhouseOptionsChange}
									// input={<OutlinedInput label="Warehouses" />}
									renderValue={selected =>
										selected.length === companies.length
											? "All"
											: !selected.length
											? "None"
											: selected.map(x => x.name).join(", ")
									}
									MenuProps={MenuProps}>
									{companies.map(variant => (
										<MenuItem key={variant.id} value={variant}>
											<Checkbox
												checked={selectedOptions.findIndex(item => item.id === variant.id) >= 0}
											/>
											<ListItemText placeholder="variant.name" primary={variant.name} />
										</MenuItem>
									))}
								</Selected>
							</div>
						</div>
						<div className="inputGroup">
							<div
								className="inputGroup"
								style={{
									width: "200px",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
								}}>
								<input
									type="checkbox"
									onChange={e => {
										if (showsale) {
											setShowsale(false)
										} else {
											setShowsalePopup(true)
										}
									}}
									value={showsale}
									placeholder="Search Counter Title..."
									className="searchInput"
									style={{ transform: "scale(2)" }}
								/>
								<label htmlFor="Warehouse" style={{ width: "170px" }}>
									Show Sales
								</label>
							</div>
						</div>
						<div>Total Items: {filteritem.length}</div>
						<button className="theme-btn" onClick={downloadHandler}>
							Excel
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={filteritem}
						setItemData={setItem}
						setItemEditPopup={setItemEditPopup}
						warehouseData={selectedOptions}
						showsale={showsale}
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
			{showsalePopup ? (
				<ShowSaleValue
					setShowsale={setShowsale}
					onSave={() => {
						setShowsalePopup(false)
					}}
					setCountersData={setCountersData}
				/>
			) : (
				""
			)}
		</>
	)
}

export default PartyWiseCompanyDiscount

const CovertedQty = (qty, conversion) => {
	let b = qty / +conversion

	b = Math.sign(b) * Math.floor(Math.sign(b) * b)

	let p = Math.floor(qty % +conversion)

	return b + ":" + p
}
function Table({ itemsDetails, warehouseData, setItemEditPopup, setItemData, showsale }) {
	const [items, setItems] = useState("sort_order")
	const [order, setOrder] = useState("")
	return (
		<table
			className="user-table"
			style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll", fontSize: "10px" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Router Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("route_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("route_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Counter Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("counter_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("counter_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					{warehouseData.map(a => (
						<>
							<th style={{ width: "120px" }}>
								<div className="t-head-element">
									<span>{a.company_title}</span>
									<div className="sort-buttons-container">
										<button
											onClick={() => {
												setItems(a)
												setOrder("asc")
											}}>
											<ChevronUpIcon className="sort-up sort-button" />
										</button>
										<button
											onClick={() => {
												setItems(a)
												setOrder("desc")
											}}>
											<ChevronDownIcon className="sort-down sort-button" />
										</button>
									</div>
								</div>
							</th>
							{showsale ? <th style={{ width: "90px" }}>Sale</th> : ""}
						</>
					))}
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					.sort((a, b) =>
						items?.company_uuid
							? order === "asc"
								? (a?.company_discount?.find(c => items.company_uuid === c.company_uuid)?.discount ||
										0) -
								  (b?.company_discount?.find(c => items.company_uuid === c.company_uuid)?.discount || 0)
								: (b?.company_discount?.find(c => items.company_uuid === c.company_uuid)?.discount ||
										0) -
								  (a?.company_discount?.find(c => items.company_uuid === c.company_uuid)?.discount || 0)
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

							<td colSpan={2}>{item.route_title || ""}</td>
							<td colSpan={2}>{item.counter_title || ""}</td>
							{warehouseData.map(a => {
								let data = item?.company_discount?.find(b => b.company_uuid === a.company_uuid)
								let value = item?.sales?.find(b => b.company_uuid === a.company_uuid)?.value || 0
								return (
									<>
										<td
											style={{
												textAlign: "left",
												cursor: "pointer",
											}}
											onClick={e => {
												e.stopPropagation()
												setItemEditPopup(a)
												setItemData(item)
											}}>
											{data?.discount || 0}
										</td>
										{showsale ? (
											<td
												style={{
													textAlign: "left",
													cursor: "pointer",
												}}
												onClick={e => {
													e.stopPropagation()
													setItemEditPopup(a)
													setItemData(item)
												}}>
												{value || 0}
											</td>
										) : (
											""
										)}
									</>
								)
							})}
						</tr>
					))}
			</tbody>
		</table>
	)
}
function QuantityChanged({ onSave, popupInfo, item, update }) {
	const [data, setdata] = useState({})

	useEffect(() => {
		let CompanyData = item.company_discount?.find(a => a.company_uuid === popupInfo.company_uuid)

		if (CompanyData) {
			setdata(CompanyData)
		} else
			setdata({
				company_uuid: popupInfo.company_uuid,
				discount: 0,
			})
	}, [item.company_discount, popupInfo.company_uuid])

	const submitHandler = async e => {
		e.preventDefault()

		let company_discount = item.company_discount
		company_discount = company_discount?.filter(a => a.company_uuid === popupInfo.company_uuid)?.length
			? company_discount.map(a => (a.company_uuid === popupInfo.company_uuid ? data : a))
			: company_discount?.length
			? +popupInfo.company_uuid === 0
				? company_discount || []
				: [...company_discount, data]
			: [data]
		
		const response = await axios({
			method: "put",
			url: "/counters/putCounter",
			data: [{ counter_uuid: item.counter_uuid, company_discount }],
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.result[0].success) {
			onSave()
			update()
		}
	}

	return (
		<div className="overlay">
			<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="formGroup">
								<div className="row" style={{ flexDirection: "row", alignItems: "flex-start" }}>
									<label className="selectLabel flex" style={{ width: "100px" }}>
										Discount
										<input
											type="number"
											name="route_title"
											className="numberInput"
											value={data?.discount}
											style={{ width: "100px" }}
											onChange={e =>
												setdata({
													...data,
													discount: e.target.value,
												})
											}
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

					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
function ShowSaleValue({ onSave, setShowsale, setCountersData }) {
	const [data, setdata] = useState(0)
	const [loading, setLoading] = useState(0)

	const submitHandler = async e => {
		e.preventDefault()
		if (!data) return
		setLoading(true)
		const response = await axios({
			method: "get",
			url: "/counters/getCounterSales/" + data,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setCountersData(response.data.result)
			setShowsale(true)
			onSave()
		}
		setLoading(false)
	}

	return (
		<div className="overlay">
			<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="formGroup">
								<div className="row" style={{ flexDirection: "row", alignItems: "flex-start" }}>
									<label className="selectLabel flex" style={{ width: "100px" }}>
										Days
										<input
											type="number"
											name="route_title"
											className="numberInput"
											value={data}
											style={{ width: "100px" }}
											onChange={e => setdata(e.target.value)}
											maxLength={42}
											onWheel={e => e.preventDefault()}
										/>
									</label>
								</div>
							</div>
							{loading ? (
								<button className="submit" id="loading-screen" style={{ width: "120px" }}>
									<svg viewBox="0 0 100 100">
										<path
											d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50"
											fill="#ffffff"
											stroke="none">
											<animateTransform
												attributeName="transform"
												type="rotate"
												dur="1s"
												repeatCount="indefinite"
												keyTimes="0;1"
												values="0 50 51;360 50 51"></animateTransform>
										</path>
									</svg>
								</button>
							) : (
								<button type="submit" className="submit">
									Search
								</button>
							)}
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
