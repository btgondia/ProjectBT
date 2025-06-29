import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import Select from "react-select"
import { v4 as uuid } from "uuid"
import { jumpToNextIndex } from "../Apis/functions"
import { CheckCircle } from "@mui/icons-material"
import { useReactToPrint } from "react-to-print"
import { AddCircle as AddIcon, RemoveCircle } from "@mui/icons-material"

export default function VoucherDetails({ order, onSave, orderStatus }) {
	const [itemsData, setItemsData] = useState([])
	const [editOrder, setEditOrder] = useState(false)
	const [category, setCategory] = useState([])
	const [warehouse, setWarehouse] = useState([])

	const [orderData, setOrderData] = useState()
	const [printData, setPrintData] = useState({ item_details: [], status: [] })

	const [focusedInputId, setFocusedInputId] = useState(0)
	const reactInputsRef = useRef({})
	const componentRef = useRef(null)
	const GetWarehouseList = async () => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setWarehouse(response.data.result.filter(a => a.warehouse_title))
	}
	const getItemCategories = async () => {
		const response = await axios({
			method: "get",
			url: "/itemCategories/GetItemCategoryList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setCategory(response.data.result)
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
	const appendNewRow = () => {
		let item_uuid = uuid()
		setFocusedInputId(`REACT_SELECT_COMPONENT_ITEM_TITLE@${item_uuid}`)
		setTimeout(
			() =>
				setOrderData(prev => ({
					...prev,
					item_details: [
						...prev.item_details,
						{
							uuid: item_uuid,
							b: 0,
							p: 0,
							sr: prev.item_details.length + 1
						}
					]
				})),
			250
		)
	}

	const shiftFocus = id => jumpToNextIndex(id, reactInputsRef, setFocusedInputId, appendNewRow)

	const reactToPrintContent = useCallback(() => {
		return componentRef.current
	}, [])

	const handlePrint = useReactToPrint({
		content: reactToPrintContent,
		removeAfterPrint: true
	})
	// const getUsers = async () => {
	//   const response = await axios({
	//     method: "get",
	//     url: "/users/GetUserList",

	//     headers: {
	//       "Content-Type": "application/json",
	//     },
	//   });
	//   
	//   if (response.data.success) setUsers(response.data.result);
	// };

	const getAutoBill = async () => {
		let data = []
		const response = await axios({
			method: "get",
			url: "/autoBill/autoBillItem",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) data = response
		const response1 = await axios({
			method: "get",
			url: "/autoBill/autoBillQty",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response1.data.success) data = data ? response1.data.result : [...data, ...response1.data.result]
		
	}

	useEffect(() => {
		setOrderData({
			...order,
			item_details: order.item_details
				.map(a => ({
					...a,
					category_sort: +category?.find(
						c => c.category_uuid === itemsData?.find(d => d.item_uuid === a.item_uuid)?.category_uuid
					)?.sort_order
				}))
				.sort((a, b) => a.category_sort - b.category_sort)
				.map((a, i) => ({
					...itemsData?.find(b => b.item_uuid === a.item_uuid),
					...a,
					uuid: uuid(),
					default: true,
					sr: i + 1
				}))
		})
	}, [itemsData, category, order])
	
	useEffect(() => {
		setPrintData({
			...printData,
			...orderData,
			item_details:
				orderData?.item_details
					?.filter(a => +a.status !== 3)
					?.map((a, i) => ({
						...a,
						sr: i + 1
					})) || []
		})
	}, [orderData])
	

	const getItemsData = async () => {
		const cachedData = localStorage.getItem('itemsData');
		if (cachedData) {
			setItemsData(JSON.parse(cachedData));
		} else {
		  const response = await axios({
			method: "get",
			url: "/items/GetItemList",
			headers: {
			  "Content-Type": "application/json",
			},
		  });
		  if (response.data.success) {
			localStorage.setItem('itemsData', JSON.stringify(response.data.result));
			setItemsData(response.data.result);
		  }
		}
	  };

	useEffect(() => {
		getItemsData()
		getAutoBill()

		getItemCategories()
		GetWarehouseList()
	}, [])

	const onSubmit = async (type = { stage: 0 }) => {
		const response = await axios({
			method: "put",
			url: "/vouchers/PutVoucher",
			data: {
				voucher_uuid: orderData?.voucher_uuid,
				item_details: orderData?.item_details,
				from_warehouse: orderData?.from_warehouse,
				to_warehouse: orderData?.to_warehouse
			},
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setEditOrder(false)
		}
	}

	useEffect(() => {
		if (!editOrder) return
		reactInputsRef.current?.[orderData?.item_details?.[0]?.uuid]?.focus()
	}, [editOrder, orderData?.item_details])

	let listItemIndexCount = 0

	return (
		<>
			<div className="overlay">
				<div
					className="modal"
					style={{
						maxHeight: "100vh",
						height: "max-content",
						width: "90vw",
						padding: "10px 50px",
						zIndex: "999999999",
						border: "2px solid #000",
						fontSize: "12px"
					}}
				>
					<div className="inventory" style={{ height: "max-content", maxHeight: "100vh" }}>
						<div
							className="accountGroup"
							id="voucherForm"
							action=""
							style={{
								height: "max-content",
								maxHeight: "75vh",
								overflow: "scroll"
							}}
						>
							<div className="inventory_header" style={{ backgroundColor: "#fff", color: "#000" }}>
								{editOrder ? (
									<>
										{" "}
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
														setOrderData(prev => ({
															...prev,
															from_warehouse: doc.value
														}))
													}
													value={
														orderData?.from_warehouse
															? {
																	value: orderData?.from_warehouse,
																	label: warehouse?.find(j => j.warehouse_uuid === orderData.from_warehouse)
																		?.warehouse_title
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
													onChange={doc =>
														setOrderData(prev => ({
															...prev,
															to_warehouse: doc.value
														}))
													}
													value={
														orderData?.to_warehouse
															? {
																	value: orderData?.to_warehouse,
																	label: warehouse?.find(j => j.warehouse_uuid === orderData.to_warehouse)
																		?.warehouse_title
															  }
															: ""
													}
													openMenuOnFocus={true}
													menuPosition="fixed"
													menuPlacement="auto"
													placeholder="Select"
												/>
											</div>
										</div>
									</>
								) : (
									<>
										<h2>From:{orderData?.from_warehouse_title || ""}</h2>
										<h2>To:{orderData?.to_warehouse_title || ""}</h2>
									</>
								)}
							</div>
							<div className="inventory_header">
								<h2>Voucher Details</h2>
							</div>
							<div
								className="inventory_header"
								style={{
									fontWeght: 400,
									color: "black",
									background: "none",
									alignItems: "start"
								}}
							>
								<h2>Voucher Number: {orderData?.vocher_number || ""}</h2>
							</div>

							<div className="topInputs">
								<div
									className="inputGroup flex"
									style={{
										width: "100%",
										flexDirection: "row",
										justifyContent: "space-between"
									}}
								>
									<button
										style={{ width: "fit-Content", backgroundColor: "black" }}
										className="theme-btn"
										onClick={() => {
											handlePrint()
										}}
									>
										Print
									</button>

									{+orderData?.delivered === 0 ? (
										<button
											style={{ width: "fit-Content" }}
											className="theme-btn"
											onClick={e => {
												reactInputsRef.current = {}
												e.target.blur()
												setEditOrder(prev => !prev)
											}}
										>
											Edit
										</button>
									) : (
										""
									)}
								</div>
							</div>

							<div className="items_table" style={{ flex: "1", paddingLeft: "10px" }}>
								<table className="f6 w-100 center" cellSpacing="0">
									<thead className="lh-copy" style={{ position: "static" }}>
										<tr className="white">
											<th className="pa2 tl bb b--black-20 w-30">#</th>
											{editOrder ? <th className="pa2 tc bb b--black-20 "></th> : ""}
											<th className="pa2 tl bb b--black-20 w-30">Item Name</th>
											<th className="pa2 tl bb b--black-20 w-30">MRP</th>
											<th className="pa2 tc bb b--black-20">Quantity(b)</th>
											<th className="pa2 tc bb b--black-20">Quantity(p)</th>
											{orderData?.type?.toLowerCase() === "adjustment" && (
												<th className="pa2 tl bb b--black-20">Remarks</th>
											)}
										</tr>
										
									</thead>
									<tbody className="lh-copy">
										{orderData?.item_details.map((item, i) => {
											const item_title_component_id = `REACT_SELECT_COMPONENT_ITEM_TITLE@${item.uuid}`
											return (
												<tr
													key={i}
													style={{
														height: "20px",
														backgroundColor:
															item.price_approval === "N"
																? "#00edff"
																: +item.status === 1
																? "green"
																: +item.status === 2
																? "yellow"
																: +item.status === 3
																? "red"
																: "#fff",
														color:
															item.price_approval === "N"
																? "#000"
																: +item.status === 1 || +item.status === 3
																? "#fff"
																: "#000",
														borderBottom: "2px solid #fff"
													}}
												>
													<td
														className="ph2 pv1 tl bb b--black-20 bg-white"
														style={{
															textAlign: "center",
															width: "3ch"
														}}
													>
														{item.sr}
													</td>
													{editOrder ? (
														<>
															<td>
																{item.price_approval === "N" ? (
																	<span
																		onClick={() =>
																			setOrderData(prev => ({
																				...prev,
																				item_details: prev.item_details.map(a =>
																					a.uuid === item.uuid
																						? {
																								...a,
																								price_approval: "Y"
																						  }
																						: a
																				)
																			}))
																		}
																	>
																		<CheckCircle
																			sx={{ fontSize: 20 }}
																			style={{
																				cursor: "pointer",
																				color: "blue"
																			}}
																		/>
																	</span>
																) : (
																	""
																)}
																<span
																	onClick={() =>
																		setOrderData(prev => ({
																			...prev,
																			item_details: prev.item_details.filter(a => !(a.uuid === item.uuid))
																		}))
																	}
																>
																	<RemoveCircle
																		sx={{ fontSize: 20 }}
																		style={{
																			cursor: "pointer",
																			color: "red"
																		}}
																	/>
																</span>
															</td>
														</>
													) : (
														""
													)}
													<td className="ph2 pv1 tl bb b--black-20 bg-white">
														<div
															className="inputGroup"
															index={!item.default ? listItemIndexCount++ : ""}
															id={!item.default ? item_title_component_id : ""}
														>
															{editOrder && !item.default ? (
																<Select
																	ref={ref => (reactInputsRef.current[item_title_component_id] = ref)}
																	id={"1_item_uuid" + item.uuid}
																	styles={{
																		control: styles => ({
																			...styles,
																			minHeight: 20,
																			maxHeight: 20,
																			borderRadius: 2,
																			padding: 0
																		}),
																		option: (a, b) => {
																			return {
																				...a,
																				color: "#000"
																			}
																		}
																	}}
																	options={itemsData
																		.filter(
																			a =>
																				!order.item_details.filter(b => a.item_uuid === b.item_uuid).length &&
																				a.status !== 0
																		)
																		.sort((a, b) => a?.item_title?.localeCompare(b.item_title))
																		.map((a, j) => ({
																			value: a.item_uuid,
																			label: a.item_title + "______" + a.mrp,
																			key: a.item_uuid
																		}))}
																	onChange={e => {
																		setOrderData(prev => ({
																			...prev,
																			item_details: prev.item_details.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							...itemsData.find(b => b.item_uuid === e.value),
																							price: itemsData.find(b => b.item_uuid === e.value)?.item_price
																					  }
																					: a
																			)
																		}))
																		shiftFocus(item_title_component_id)
																	}}
																	value={{
																		value: item.item_uuid || "",
																		label: item.item_title ? item.item_title + "______" + item.mrp : "",
																		key: item.item_uuid || item.uuid
																	}}
																	openMenuOnFocus={true}
																	autoFocus={
																		focusedInputId === item_title_component_id || (i === 0 && focusedInputId === 0)
																	}
																	menuPosition="fixed"
																	menuPlacement="auto"
																	placeholder="Item"
																/>
															) : (
																itemsData.find(a => a.item_uuid === item.item_uuid)?.item_title || ""
															)}
														</div>
													</td>
													<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
														{item.mrp || ""}
													</td>

													<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
														{editOrder ? (
															<input
																id={"q" + item.uuid}
																type="number"
																className="numberInput"
																index={listItemIndexCount++}
																style={{ width: "10ch", height: "20px" }}
																value={item.b || ""}
																onChange={e => {
																	setOrderData(prev => {
																		return {
																			...prev,
																			item_details: prev.item_details.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							b: e.target.value
																					  }
																					: a
																			)
																		}
																	})
																}}
																onFocus={e => {
																	e.target.onwheel = () => false
																	e.target.select()
																}}
																onKeyDown={e => (e.key === "Enter" ? shiftFocus(e.target.id) : "")}
																disabled={!item.item_uuid}
																onWheel={e => e.preventDefault()}
															/>
														) : (
															item.b || 0
														)}
													</td>
													<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
														{editOrder ? (
															<input
																id={"p" + item.uuid}
																style={{ width: "10ch", height: "20px" }}
																type="number"
																className="numberInput"
																onWheel={e => e.preventDefault()}
																index={listItemIndexCount++}
																value={item.p || ""}
																onChange={e => {
																	setOrderData(prev => {
																		return {
																			...prev,
																			item_details: prev.item_details.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							p: e.target.value
																					  }
																					: a
																			)
																		}
																	})
																}}
																onFocus={e => {
																	e.target.onwheel = () => false
																	e.target.select()
																}}
																onKeyDown={e => (e.key === "Enter" ? shiftFocus(e.target.id) : "")}
																disabled={!item.item_uuid}
															/>
														) : (
															item.p || 0
														)}
													</td>
													{orderData?.type?.toLowerCase() === "adjustment" && (
														<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
															{editOrder ? (
																<input
																	id={"remarks-" + item.uuid}
																	style={{ width: "--webkit-fill-available", height: "20px" }}
																	type="text"
																	className="numberInput"
																	index={listItemIndexCount++}
																	value={item.remarks || ""}
																	onChange={e =>
																		setOrderData(prev => ({
																			...prev,
																			item_details: prev.item_details.map(a =>
																				a.uuid === item.uuid
																					? {
																							...a,
																							remarks: e.target.value
																					  }
																					: a
																			)
																		}))
																	}
																	onKeyDown={e => (e.key === "Enter" ? shiftFocus(e.target.id) : "")}
																/>
															) : (
																item?.remarks
															)}
														</td>
													)}
												</tr>
											)
										})}

										{editOrder ? (
											<tr>
												<td
													onClick={() =>
														setOrderData(prev => ({
															...prev,
															item_details: [
																...prev.item_details,
																{
																	uuid: uuid(),
																	b: 0,
																	p: 0,
																	edit: true,
																	sr: prev.item_details.length + 1
																}
															]
														}))
													}
												>
													<AddIcon sx={{ fontSize: 40 }} style={{ color: "#32bd33", cursor: "pointer" }} />
												</td>
											</tr>
										) : (
											""
										)}
										<tr
											style={{
												height: "50px",

												borderBottom: "2px solid #fff"
											}}
										>
											<td></td>
											<td></td>
											<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
												<div className="inputGroup">Total</div>
											</td>
											{editOrder ? (
												<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}></td>
											) : (
												""
											)}
											<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
												{(orderData?.item_details?.length > 1
													? orderData?.item_details.map(a => +a?.b || 0).reduce((a, b) => a + b)
													: orderData?.item_details[0]?.b) || 0}
											</td>
											<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}>
												{(orderData?.item_details.length > 1
													? orderData?.item_details.map(a => +a?.p || 0).reduce((a, b) => a + b)
													: orderData?.item_details[0]?.p) || 0}
											</td>
											<td className="ph2 pv1 tc bb b--black-20 bg-white" style={{ textAlign: "center" }}></td>
											{editOrder ? <td></td> : ""}
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<button onClick={onSave} className="closeButton">
							x
						</button>
					</div>

					<div
						className="bottomContent"
						style={{
							background: "white",
							justifyContent: "center",
							paddingTop: "20px"
						}}
					>
						{editOrder ? (
							<button type="button" onClick={onSubmit}>
								Save
							</button>
						) : (
							""
						)}
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
										width: "84mm",
										backgroundColor: "#fff",
										fontWeight: "900"
									}}
								>
									Voucher Number: {orderData?.vocher_number}
								</th>
							</tr>
							<tr>
								<th
									colSpan={2}
									style={{
										width: "84mm",
										backgroundColor: "#fff",
										fontWeight: "900"
									}}
								>
									From: {orderData?.from_warehouse_title}
								</th>
								<th
									colSpan={3}
									style={{
										width: "85mm",
										backgroundColor: "#fff",
										fontWeight: "900"
									}}
								>
									To: {orderData?.to_warehouse_title}
								</th>
							</tr>
							<tr>
								<th colSpan={2} style={{ backgroundColor: "#fff", fontWeight: "900" }}>
									Created At: {new Date(orderData?.created_at).toDateString()} -{" "}
									{formatAMPM(new Date(orderData?.created_at))}
								</th>
								<th colSpan={3} style={{ backgroundColor: "#fff", fontWeight: "900" }}>
									Created By: {orderData?.created_by_user}
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
								.filter(a => orderData?.item_details?.filter(b => a.category_uuid === b.category_uuid).length)
								.map((a, index) => (
									<>
										<tr style={{ pageBreakAfter: "auto", width: "100%" }}>
											<td colSpan={11}>{a.category_title}</td>
										</tr>
										{orderData?.item_details
											?.filter(b => a.category_uuid === b.category_uuid)
											?.map((item, i, array) => (
												<tr key={Math.random()}>
													<td className="flex" style={{ justifyContent: "space-between" }}>
														{item.sr}
													</td>

													<td>{item.item_title || ""}</td>
													<td>{item.mrp || 0}</td>
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
									{orderData?.item_details?.length > 1
										? orderData?.item_details?.map(a => +a.b || 0)?.reduce((a, b) => +a + b)
										: orderData?.item_details[0]?.b || 0}
								</td>

								<td>
									{orderData?.item_details?.length > 1
										? orderData?.item_details?.map(a => +a.p || 0)?.reduce((a, b) => +a + b)
										: orderData?.item_details[0]?.p || 0}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</>
	)
}
