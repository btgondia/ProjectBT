/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import "./index.css"
import * as XLSX from "xlsx"

import { AddCircle as AddIcon } from "@mui/icons-material"
import { v4 as uuid } from "uuid"
import Select from "react-select"

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import { useReactToPrint } from "react-to-print"
import { AiFillCaretDown } from "react-icons/ai"
let time = new Date()

const CovertedQty = (qty, conversion) => {
	let b = qty / +conversion
	b = Math.sign(b) * Math.floor(Math.sign(b) * b)
	let p = Math.floor(qty % +conversion)
	return b + ":" + p
}

const initials = {
	type: "ST",
	created_by: localStorage.getItem("user_uuid"),
	from_warehouse: 0,
	to_warehouse: "",
	created_at: time.getTime(),
	item_details: [{ uuid: uuid(), b: 0, p: 0, sr: 1 }]
}

export default function AddStock() {
	const [order, setOrder] = useState(initials)
	const [warehouse, setWarehouse] = useState([])
	const [category, setCategory] = useState([])
	const [itemsData, setItemsData] = useState([])
	const [qty_details, setQtyDetails] = useState(false)
	const [notification, setNotification] = useState()
	const [focusedInputId, setFocusedInputId] = useState(0)
	const [suggestionPopup, setSuggestionPopup] = useState(false)

	const reactInputsRef = useRef({})
	const componentRef = useRef(null)

	const getItemCategories = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/itemCategories/GetItemCategoryList",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setCategory(response.data.result)
	}

	const readUploadFile = e => {
		e.preventDefault()
		if (e.target.files) {
			const reader = new FileReader()
			reader.onload = e => {
				const data = e.target.result
				const workbook = XLSX.read(data, { type: "array" })
				const sheetName = workbook.SheetNames[0]
				const worksheet = workbook.Sheets[sheetName]
				const json = XLSX.utils.sheet_to_json(worksheet)

				let dataJson = []
				for (let item in json) {
					// console.log(json[item]["Item Code"] || json[item]["ITEM CODE"]);
					if (!json[item]["ITEM CODE"] && !json[item]["ITEM CODE"]) {
						setNotification("Excel Error: CODE not found in Line Number " + json[item]?.__rowNum__)
						setTimeout(() => setNotification(false), 5000)
						return
					}
					let itemData = itemsData.find(
						a =>
							a.item_code &&
							(a.item_code === json[item]["Item Code"] ||
								+a.item_code === json[item]["Item Code"] ||
								a.item_code === +json[item]["Item Code"] ||
								a.item_code === json[item]["ITEM CODE"] ||
								+a.item_code === json[item]["ITEM CODE"] ||
								a.item_code === +json[item]["ITEM CODE"])
					)
					console.log(itemData)
					if (!itemData) {
						setNotification(
							"BT Error: ITEM not found for Item Code " + (json[item]["ITEM CODE"] || json[item]["ITEM CODE"])
						)
						setTimeout(() => setNotification(false), 5000)
						return
					}
					let qty = json[item]["Qty"] || json[item]["QTY"] || 0
					if (itemData) {
						let b = Math.floor(+(qty || 0) / (+itemData.conversion || 1))
						let p = Math.floor(+(qty || 0) % (+itemData.conversion || 1))
						dataJson.push({ ...itemData, b, p, uuid: itemData.item_uuid })
					}
				}
				if (dataJson.length)
					setOrder(prev => ({
						...prev,
						item_details: [...(prev.item_details.filter(a => a.item_uuid) || []), ...dataJson]
					}))
			}
			reader.readAsArrayBuffer(e.target.files[0])
		}
	}

	const reactToPrintContent = useCallback(() => {
		return componentRef.current
	}, [])
	const handlePrint = useReactToPrint({
		content: reactToPrintContent,
		removeAfterPrint: true,
		onAfterPrint: () => setOrder(initials)
	})
	const getItemsData = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/items/GetItemStockList/" + order.from_warehouse,
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setItemsData(response.data.result)
	}
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
	const GetWarehouseList = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setWarehouse(response.data.result.filter(a => a.warehouse_title))
	}

	useEffect(() => {
		const controller = new AbortController()
		GetWarehouseList(controller)

		getItemCategories(controller)
		// escFunction({ key: "Enter" });
		return () => {
			controller.abort()
		}
	}, [])
	useEffect(() => {
		const controller = new AbortController()
		getItemsData(controller)
		return () => {
			controller.abort()
		}
	}, [order.from_warehouse])

	useEffect(() => {
		setOrder(prev => ({
			...prev,
			item_details: prev.item_details.map(a => ({
				...a
			}))
		}))
	}, [qty_details])

	const onSubmit = async type => {
		const response = await axios({
			method: "post",
			url: "/vouchers/postVoucher",
			data: {
				...order,
				item_details: order.item_details.map(a => ({ ...a, status: 0 }))
			},
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setOrder(Prev => ({
				...Prev,
				vocher_number: response.data.result.vocher_number
			}))
			handlePrint()
		}
	}
	const Quantity = useMemo(() => {
		let q =
			order.item_details.length > 1
				? order.item_details.map(a => +a.b || 0).reduce((a, b) => a + b)
				: order.item_details.length
				? order.item_details[0].b
				: 0
		let p =
			order.item_details.length > 1
				? order.item_details.map(a => +a.p || 0).reduce((a, b) => a + b)
				: order.item_details.length
				? order.item_details[0].p
				: 0
		return q + " : " + p
	}, [order?.item_details])
	const jumpToNextIndex = id => {
		//console.log(id);
		document.querySelector(`#${id}`).blur()
		const index = document.querySelector(`#${id}`).getAttribute("index")
		//console.log("this is index", index);

		const nextElem = document.querySelector(`[index="${+index + 1}"]`)

		if (nextElem) {
			if (nextElem.id.includes("selectContainer-")) {
				//console.log("next select container id: ", nextElem.id);
				reactInputsRef.current[nextElem.id.replace("selectContainer-", "")].focus()
			} else {
				//console.log("next input id: ", nextElem.id);
				setFocusedInputId("")
				setTimeout(() => document.querySelector(`[index="${+index + 1}"]`).focus(), 10)
				return
			}
		} else {
			let nextElemId = uuid()
			setFocusedInputId(`selectContainer-${nextElemId}`)
			setTimeout(
				() =>
					setOrder(prev => ({
						...prev,
						item_details: [
							...prev.item_details,
							{
								uuid: nextElemId,
								b: 0,
								p: 0,
								sr: prev.item_details.length + 1
							}
						]
					})),
				250
			)
		}
	}

	let listItemIndexCount = 0

	return (
		<>
			<Sidebar />
			<div className="right-side">
				<Header />
				<div className="inventory">
					<div className="accountGroup" id="voucherForm" action="">
						<div className="inventory_header">
							<h2>Stock Transfer </h2>
							{/* {type === 'edit' && <XIcon className='closeicon' onClick={close} />} */}
						</div>

						<div className="topInputs" style={{ alignItems: "flex-end" }}>
							<div className="inputGroup">
								<label htmlFor="Warehouse">From Warehouse</label>
								<div className="inputGroup" style={{ width: "400px" }}>
									<Select
										ref={ref => (reactInputsRef.current["0"] = ref)}
										options={[
											{ value: 0, label: "None" },
											...warehouse.map(a => ({
												value: a.warehouse_uuid,
												label: a.warehouse_title
											}))
										]}
										onChange={doc =>
											setOrder(prev => ({
												...prev,
												from_warehouse: doc.value
											}))
										}
										value={
											order?.from_warehouse
												? {
														value: order?.from_warehouse,
														label: warehouse?.find(j => j.warehouse_uuid === order.from_warehouse)?.warehouse_title
												  }
												: { value: 0, label: "None" }
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
								<label htmlFor="Warehouse">To Warehouse</label>
								<div className="inputGroup" style={{ width: "400px" }}>
									<Select
										ref={ref => (reactInputsRef.current["1"] = ref)}
										options={warehouse.map(a => ({
											value: a.warehouse_uuid,
											label: a.warehouse_title
										}))}
										onChange={doc => setOrder(prev => ({ ...prev, to_warehouse: doc.value }))}
										value={
											order?.to_warehouse
												? {
														value: order?.to_warehouse,
														label: warehouse?.find(j => j.warehouse_uuid === order.to_warehouse)?.warehouse_title
												  }
												: ""
										}
										autoFocus={!order?.to_warehouse}
										openMenuOnFocus={true}
										menuPosition="fixed"
										menuPlacement="auto"
										placeholder="Select"
									/>
								</div>
							</div>
							{order.to_warehouse && (
								<>
									<label htmlFor="upload" className="theme-btn" style={{ fontSize: ".825rem" }}>
										Upload Bulk
										<input
											style={{ display: "none" }}
											className="numberInput"
											onWheel={e => e.preventDefault()}
											index={listItemIndexCount++}
											type="file"
											name="upload"
											id="upload"
											onChange={readUploadFile}
										/>
									</label>
									<button
										className="theme-btn"
										style={{ fontSize: ".825rem" }}
										onClick={() => setSuggestionPopup(order.to_warehouse)}
									>
										Suggestions
									</button>
								</>
							)}
						</div>

						<div className="items_table" style={{ flex: "1", height: "75vh", overflow: "scroll" }}>
							<table className="f6 w-100 center" cellSpacing="0">
								<thead className="lh-copy" style={{ position: "static" }}>
									<tr className="white">
										<th className="pa2 tl bb b--black-20 w-30">Item Name</th>
										<th className="pa2 tl bb b--black-20 w-30">MRP</th>
										<th className="pa2 tc bb b--black-20">Boxes</th>
										<th className="pa2 tc bb b--black-20">Pcs</th>
										<th className="pa2 tc bb b--black-20 "></th>
									</tr>
								</thead>
								{order.to_warehouse ? (
									<tbody className="lh-copy">
										{order?.item_details?.map((item, i) => (
											<tr key={item.uuid}>
												<td className="ph2 pv1 tl bb b--black-20 bg-white" style={{ width: "300px" }}>
													<div
														className="inputGroup"
														id={`selectContainer-${item.uuid}`}
														index={listItemIndexCount++}
														style={{ width: "300px" }}
													>
														<Select
															ref={ref => (reactInputsRef.current[item.uuid] = ref)}
															id={"item_uuid" + item.uuid}
															options={itemsData
																.filter(
																	a =>
																		!order.item_details.filter(b => a.item_uuid === b.item_uuid).length &&
																		a.status !== 0
																)
																.sort((a, b) => a?.item_title?.localeCompare(b.item_title))
																.map((a, j) => ({
																	value: a.item_uuid,
																	label:
																		a.item_title +
																		"______" +
																		(a?.mrp || "") +
																		(a?.qty > 0 ? " _______[" + CovertedQty(a.qty || 0, a.conversion) + "]" : ""),
																	key: a.item_uuid,
																	qty: a.qty
																}))}
															styles={{
																option: (a, b) => {
																	return {
																		...a,
																		color: b.data.qty === 0 ? "" : b.data.qty > 0 ? "#4ac959" : "red"
																	}
																}
															}}
															onChange={e => {
																setOrder(prev => ({
																	...prev,
																	item_details: prev.item_details.map(a => {
																		if (a.uuid === item.uuid) {
																			let item = itemsData.find(b => b.item_uuid === e.value)
																			return {
																				...a,
																				...item,
																				p_price: item.item_price,
																				b_price: Math.floor(item.item_price * item.conversion || 0)
																			}
																		} else return a
																	})
																}))
																jumpToNextIndex(`selectContainer-${item.uuid}`)
															}}
															value={
																itemsData
																	.filter(a => a.item_uuid === (item.uuid || item.item_uuid))
																	.map((a, j) => ({
																		value: a.item_uuid,
																		label:
																			a.item_title +
																			"______" +
																			a.mrp +
																			(a.qty > 0 ? "[" + CovertedQty(a.qty || 0, a.conversion) + "]" : ""),
																		key: a.item_uuid
																	}))[0]
															}
															openMenuOnFocus={true}
															autoFocus={
																focusedInputId === `selectContainer-${item.uuid}` ||
																(i === 0 && focusedInputId === 0)
															}
															menuPosition="fixed"
															menuPlacement="auto"
															placeholder="Item"
														/>
													</div>
												</td>
												<td className="ph2 pv1 tl bb b--black-20 bg-white" style={{ textAlign: "center" }}>
													{item.mrp}
												</td>
												<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
													<input
														id={"q" + item.uuid}
														style={{ width: "100px" }}
														type="number"
														className="numberInput"
														onWheel={e => e.preventDefault()}
														index={listItemIndexCount++}
														value={item.b || ""}
														onChange={e => {
															setOrder(prev => ({
																...prev,
																item_details: prev.item_details.map(a =>
																	a.uuid === item.uuid ? { ...a, b: e.target.value } : a
																)
															}))
														}}
														onFocus={e => e.target.select()}
														onKeyDown={e => (e.key === "Enter" ? jumpToNextIndex("q" + item.uuid) : "")}
														disabled={!item.item_uuid}
													/>
												</td>
												<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
													<input
														id={"p" + item.uuid}
														style={{ width: "100px" }}
														type="number"
														className="numberInput"
														onWheel={e => e.preventDefault()}
														index={listItemIndexCount++}
														value={item.p || ""}
														onChange={e => {
															setOrder(prev => {
																setTimeout(() => setQtyDetails(prev => !prev), 2000)
																return {
																	...prev,
																	item_details: prev.item_details.map(a =>
																		a.uuid === item.uuid ? { ...a, p: e.target.value } : a
																	)
																}
															})
														}}
														onFocus={e => e.target.select()}
														onKeyDown={e => (e.key === "Enter" ? jumpToNextIndex("p" + item.uuid) : "")}
														disabled={!item.item_uuid}
													/>
												</td>

												<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
													<DeleteOutlineIcon
														style={{ color: "red", cursor: "pointer" }}
														onClick={() => {
															setOrder({
																...order,
																item_details: order.item_details.filter(a => a.uuid !== item.uuid)
															})
															//console.log(item);
														}}
													/>
												</td>
											</tr>
										))}
										<tr>
											<td
												onClick={() =>
													setOrder(prev => ({
														...prev,
														item_details: [...prev.item_details, { uuid: uuid(), b: 0, p: 0 }]
													}))
												}
											>
												<AddIcon sx={{ fontSize: 40 }} style={{ color: "#4AC959", cursor: "pointer" }} />
											</td>
										</tr>
									</tbody>
								) : (
									""
								)}
							</table>
						</div>

						<div className="bottomContent" style={{ background: "white" }}>
							<button
								type="button"
								onClick={() => {
									if (!order.item_details.filter(a => a.item_uuid).length) return
									onSubmit()
								}}
							>
								Save
							</button>
							{order.item_details.length ? (
								<button
									type="button"
									onClick={() => {
										// if (!order.item_details.filter((a) => a.item_uuid).length)
										//   return;
										// onSubmit();
									}}
								>
									{Quantity}
								</button>
							) : (
								""
							)}
						</div>
					</div>
				</div>
			</div>
			<div
				style={{
					position: "fixed",
					top: -100,
					left: -180,
					zIndex: "-1000"
				}}
			>
				<div
					ref={componentRef}
					id="item-container"
					style={{
						// margin: "45mm 40mm 30mm 60mm",
						// textAlign: "center",
						height: "128mm"
						// padding: "10px"
					}}
				>
					<table
						className="user-table"
						style={{
							width: "170mm",
							// marginTop: "20mm",
							// marginLeft: "20mm",
							// marginRight: "20mm",
							border: "1px solid black",
							pageBreakInside: "auto",
							display: "block",
							fontSize: "small",
							fontWeight: "900"
						}}
					>
						<thead>
							<tr>
								<th
									colSpan={5}
									style={{
										width: "85mm",
										backgroundColor: "#fff",
										fontWeight: "900"
									}}
								>
									Voucher Number: {order?.vocher_number || "0"}
								</th>
							</tr>
							<tr>
								<th
									colSpan={2}
									style={{
										width: "85mm",
										backgroundColor: "#fff",
										fontWeight: "900"
									}}
								>
									From: {warehouse.find(a => a.warehouse_uuid === order.from_warehouse)?.warehouse_title || "None"}
								</th>
								<th
									colSpan={3}
									style={{
										width: "85mm",
										backgroundColor: "#fff",
										fontWeight: "900"
									}}
								>
									To: {warehouse.find(a => a.warehouse_uuid === order.to_warehouse)?.warehouse_title}
								</th>
							</tr>
							<tr>
								<th colSpan={2} style={{ backgroundColor: "#fff", fontWeight: "900" }}>
									Created At: {new Date(order?.created_at).toDateString()} -{" "}
									{formatAMPM(new Date(order?.created_at))}
								</th>
								<th colSpan={3} style={{ backgroundColor: "#fff", fontWeight: "900" }}>
									Created By: {localStorage.getItem("user_title")}
								</th>
							</tr>
							<tr>
								<th
									style={{
										width: "10mm",
										backgroundColor: "#fff",
										fontWeight: "900"
									}}
								>
									S.N
								</th>
								<th style={{ backgroundColor: "#fff", fontWeight: "900" }}>Item Name</th>
								<th style={{ backgroundColor: "#fff", fontWeight: "900" }}>MRP</th>
								<th style={{ backgroundColor: "#fff", fontWeight: "900" }}>Box</th>
								<th style={{ backgroundColor: "#fff", fontWeight: "900" }}>Pcs</th>
							</tr>
						</thead>
						<tbody className="tbody">
							{category
								.sort((a, b) => a?.category_title?.localeCompare(b?.category_title))
								.filter(a => order?.item_details?.filter(b => a.category_uuid === b.category_uuid).length)
								.map(a => (
									<>
										<tr style={{ pageBreakAfter: "auto", width: "100%" }}>
											<td colSpan={11}>{a.category_title}</td>
										</tr>
										{order?.item_details
											?.filter(b => a.category_uuid === b.category_uuid)
											?.sort((a, b) => a?.item_title?.localeCompare(b?.item_title))
											.map((item, i, array) => (
												<tr key={Math.random()}>
													<td className="flex" style={{ justifyContent: "space-between" }}>
														{i + 1}
													</td>

													<td>{item.item_title || ""}</td>
													<td>{item.mrp || ""}</td>
													<td>{item.b || 0}</td>
													<td>{item.p || 0}</td>
												</tr>
											))}
									</>
								))}
							<tr key={Math.random()}>
								<td className="flex" style={{ justifyContent: "space-between" }}></td>
								<td>Total</td>
								<td></td>
								<td>
									{" "}
									{order?.item_details.length > 1
										? order?.item_details.map(a => +a.b || 0).reduce((a, b) => a + b)
										: order?.item_details.length
										? order?.item_details[0].b
										: 0}
								</td>

								<td>
									{" "}
									{order?.item_details.length > 1
										? order?.item_details.map(a => +a.p || 0).reduce((a, b) => a + b)
										: order?.item_details.length
										? order?.item_details[0].p
										: 0}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
			{suggestionPopup ? (
				<SuggestionsPopup
					onSave={() => {
						setSuggestionPopup(null)
					}}
					warehouse={warehouse.find(a => a.warehouse_uuid === suggestionPopup)}
					warehouseData={warehouse}
					itemsData={itemsData}
					order={order}
					setOrder={setOrder}
					category={category}
				/>
			) : (
				""
			)}
			{notification ? (
				<div className="notification-container active-red">
					<p className="notification-message">{notification}</p>
				</div>
			) : (
				""
			)}
		</>
	)
}

export function SuggestionsPopup({ onSave, warehouse, itemsData, order, warehouseData, setOrder, category }) {
	const [items, setItems] = useState([])
	const [selectedItems, setSeletedItems] = useState([])

	const getItemSuggestionsData = async () => {
		const response = await axios.get(`warehouse/suggestions/${warehouse.warehouse_uuid}`)
		if (response.status !== 200) return
		setItems(response.data)
	}

	useEffect(() => {
		getItemSuggestionsData()
	}, [])

	return (
		<>
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
								<h2>{warehouse?.warehouse_title || ""} Suggestions</h2>
							</div>
							<div className="table-container-user item-sales-container">
								<Table
									warehouse_uuid={warehouse?.warehouse_uuid}
									itemsDetails={items}
									setSelectedOrders={setSeletedItems}
									selectedOrders={selectedItems}
									warehouseData={warehouseData}
									order={order}
									category={category}
								/>
							</div>
							<div className="flex" style={{ justifyContent: "space-between" }}>
								<button
									type="button"
									className="submit"
									style={{ opacity: items.length ? 1 : "0.5" }}
									onClick={() => {
										setOrder(prev => ({
											...prev,
											item_details: selectedItems.map(i => ({ ...i, uuid: i.item_uuid }))
										}))
										onSave()
									}}
									disabled={!items.length}
								>
									Load All
								</button>
								<h3 style={{ margin: 0, padding: 0 }}>
									Quantity:{" "}
									{items.length > 1
										? items.map(a => +a.b || 0).reduce((a, b) => a + b)
										: items.length
										? items[0].b
										: 0}
								</h3>

								<button type="button" className="submit" onClick={onSave}>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
function Table({
	itemsDetails,
	warehouse_uuid,
	selectedOrders,
	setSelectedOrders,
	warehouseData,
	order,
	category
}) {
	const [categoryVisibility, setCategoryVisibility] = useState({})
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>Item Title</th>
					<th>MRP</th>
					<th colSpan={2}>Suggestion Box</th>
					<th colSpan={2}>
						{
							warehouseData.find(a => a.warehouse_uuid === (order?.from_warehouse || order?.to_warehouse))
								?.warehouse_title
						}
					</th>
					{/* <th></th>
					<th colSpan={3}>Category</th>
					<th></th> */}
				</tr>
			</thead>
			<tbody className="tbody">
				{category
					.sort((a, b) => a?.category_title?.localeCompare(b?.category_title))
					.filter(a => itemsDetails?.filter(b => a.category_uuid === b.category_uuid).length)
					.map(a => (
						<>
							<tr onClick={() => setCategoryVisibility(i => ({ ...i, [a.category_uuid]: !i[a.category_uuid] }))}>
								<td
									onClick={e => {
										e.stopPropagation()
										setSelectedOrders(prev =>
											prev.filter(c =>
												itemsDetails?.find(b => a.category_uuid === b.category_uuid && c.item_uuid === b.item_uuid)
											).length
												? prev.filter(
														c =>
															!itemsDetails?.find(
																b => a.category_uuid === b.category_uuid && c.item_uuid === b.item_uuid
															)
												  )
												: [...(prev || []), ...itemsDetails?.filter(b => a.category_uuid === b.category_uuid)]
										)
									}}
								>
									<input
										type="checkbox"
										style={{ transform: "scale(1.3)" }}
										checked={
											selectedOrders.filter(c =>
												itemsDetails?.find(b => a.category_uuid === b.category_uuid && c.item_uuid === b.item_uuid)
											).length === itemsDetails?.filter(b => a.category_uuid === b.category_uuid).length
										}
									/>
								</td>
								<td colSpan={5}>
									<span>
										<b>{a.category_title}</b>
									</span>
								</td>
								<td>
									<AiFillCaretDown style={{ display: "block", margin: "auto" }} />
								</td>
							</tr>
							<>
								{categoryVisibility[[a.category_uuid]]
									? itemsDetails
											?.filter(b => a.category_uuid === b.category_uuid)
											?.sort((a, b) => +a.item_uuid - +b.item_uuid)
											?.map((item, i, array) => {
												let qty = +item.stock.find(a => a.warehouse_uuid === warehouse_uuid)?.qty
												return (
													<tr
														key={Math.random()}
														style={{ height: "30px" }}
														onClick={e => {
															e.stopPropagation()
															setSelectedOrders(prev =>
																prev.filter(a => a.item_uuid === item.item_uuid).length
																	? prev.filter(a => a.item_uuid !== item.item_uuid)
																	: [...(prev || []), item]
															)
														}}
													>
														<td className="flex" style={{ justifyContent: "flex-end", gap: "10px" }}>
															<input
																type="checkbox"
																checked={selectedOrders.find(a => a.item_uuid === item.item_uuid)}
																style={{ transform: "scale(1.2)" }}
															/>
															<span>{i + 1}</span>
														</td>
														<td colSpan={2}>{item.item_title || ""}</td>
														<td>{item.mrp || ""}</td>
														<td>{+item.b ? item.b : +item.b === 0 ? 0 : ""}</td>
														{order.from_warehouse ? (
															<td
																style={{
																	color: qty === 0 ? "" : qty > 0 ? "#4ac959" : "red"
																}}
															>
																{CovertedQty(
																	+item?.stock?.find(a => a.warehouse_uuid === order.from_warehouse)?.qty || 0,
																	+item.conversion || 1
																) || ""}
															</td>
														) : (
															""
														)}
														<td
															colSpan={2}
															style={{
																color: qty === 0 ? "" : qty > 0 ? "#4ac959" : "red"
															}}
														>
															{CovertedQty(qty || 0, +item.conversion || 1) || ""}
														</td>
													</tr>
												)
											})
									: ""}
							</>
						</>
					))}
			</tbody>
		</table>
	)
}
