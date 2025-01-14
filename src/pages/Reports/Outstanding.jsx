import { ArrowDropDown, WhatsApp } from "@mui/icons-material"
import axios from "axios"
import React, { useContext, useEffect, useMemo, useState } from "react"
import DiliveryReplaceMent from "../../components/DiliveryReplaceMent"
import Header from "../../components/Header"
import { OrderDetails } from "../../components/OrderDetails"
import Sidebar from "../../components/Sidebar"
import Context from "../../context/context"
let typesData = [
	{ index: 0, name: "None" },
	{ index: 1, name: "Visit" },
	{ index: 2, name: "Call" },
	{ index: 3, name: "Self" },
	{ index: 4, name: "Others" },
]
const Outstanding = () => {
	const [outstanding, setOutstanding] = useState()
	const [popupOrder, setPopupOrder] = useState(null)
	const [type, setType] = useState("")
	const [filterTitle, setFilterTitle] = useState("")
	const [routesData, setRoutesData] = useState([])
	const [users, setUsers] = useState([])
	const [counters, setCounters] = useState([])
	const [deliveryPopup, setDeliveryPopup] = useState(false)
	const [datePopup, setDatePopup] = useState(false)
	const [typePopup, setTypePopup] = useState(false)
	const [tagPopup, setTagPopup] = useState(false)
	const [assignTagPopup, setAssignTagPopup] = useState(false)
	const [selectedOrders, setSelectedOrders] = useState([])
	const [tags, setTags] = useState([])
	const getTags = async () => {
		let response = await axios({
			method: "get",
			url: "/collectionTags/getActiveTag",

			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) setTags(response.data.result)
	}

	useEffect(() => {
		getTags()
	}, [assignTagPopup])
	const getUsers = async () => {
		const response = await axios({
			method: "get",
			url: "/users/GetUserList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) setUsers(response.data.result)
	}
	const getOutstanding = async () => {
		const response = await axios({
			method: "get",
			url: "/Outstanding/getOutstanding",

			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) setOutstanding(response.data.result)
	}
	const getCounter = async () => {
		const response = await axios({
			method: "get",
			url: "/counters/GetCounterList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCounters(response.data.result)
	}
	const getRoutesData = async () => {
		const response = await axios({
			method: "get",
			url: "/routes/GetRouteList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setRoutesData(response.data.result)
	}
	useEffect(() => {
		getCounter()
		getUsers()
		getRoutesData()
		getOutstanding()
	}, [])

	const outstandingList = useMemo(
		() =>
			outstanding

				?.map(a => ({
					...a,
					user_title: users.find(b => b.user_uuid === a.user_uuid)?.user_title,
					counter_title: counters.find(b => b.counter_uuid === a.counter_uuid)?.counter_title || "-",
					tag_title:
						tags.find(b => b.collection_tag_uuid === a.collection_tag_uuid)?.collection_tag_title || "-",
					route_title:
						routesData.find(b =>
							counters.find(c => c.counter_uuid === a.counter_uuid && b.route_uuid === c.route_uuid)
						)?.route_title || "-",
				}))
				?.filter(
					a =>
						(!filterTitle ||
							a.counter_title.toLocaleLowerCase().includes(filterTitle.toLocaleLowerCase()) ||
							a?.invoice_number
								?.toString()
								?.toLocaleLowerCase()
								?.includes(filterTitle.toLocaleLowerCase())) &&
						(!type || +type === a.type)
				) || [],
		[counters, filterTitle, outstanding, routesData, type, users]
	)
	const getOrderData = async order => {
		const response = await axios({
			method: "get",
			url: "/orders/GetOrder/" + order.order_uuid,
			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) setPopupOrder(response.data.result)
	}
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Outstanding</h2>
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
						<input
							type="text"
							onChange={e => setFilterTitle(e.target.value)}
							value={filterTitle}
							placeholder="Search ..."
							className="searchInput"
						/>
						<label className="selectLabel">
							Outstanding Type
							<select className="numberInput" value={type} onChange={e => setType(e.target.value)}>
								{/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}

								<option value="">All</option>
								<option value={0}>None</option>
								<option value={1}>Visit</option>
								<option value={2}>Call</option>
								<option value={3}>Self</option>
								<option value={4}>Others</option>
							</select>
						</label>

						<div>Total Items: {outstandingList?.length}</div>
						<button className="theme-btn" onClick={() => setTagPopup(true)}>
							Add Tag
						</button>
						{selectedOrders.length ? (
							<button className="theme-btn" onClick={() => setAssignTagPopup(true)}>
								Assigne Tag
							</button>
						) : (
							""
						)}
						<button
							type="button"
							className="submit flex"
							style={{
								margin: "0",
								padding: "1px 10px",
								fontSize: "15px",
								height: "30px",
							}}
							onClick={() =>
								setSelectedOrders(prev =>
									prev.length === outstandingList.length ? [] : outstandingList
								)
							}>
							<input
								type="checkbox"
								checked={outstandingList.length === selectedOrders.length}
								style={{ marginRight: "5px" }}
							/>
							Select All
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={outstandingList}
						setDeliveryPopup={setDeliveryPopup}
						setDatePopup={setDatePopup}
						setTypePopup={setTypePopup}
						setSelectedOrders={setSelectedOrders}
						selectedOrders={selectedOrders}
						getOrderData={getOrderData}
					/>
				</div>
			</div>
			{popupOrder ? (
				<OrderDetails
					onSave={() => {
						setPopupOrder(null)
						getOutstanding()
					}}
					order_uuid={popupOrder.order_uuid}
					orderStatus="edit"
				/>
			) : (
				""
			)}
			{deliveryPopup ? (
				<DiliveryPopup
					onSave={() => {
						setDeliveryPopup(false)
						getOutstanding()
					}}
					// postOrderData={() => onSubmit({ stage: 5 })}
					// setSelectedOrder={setOrderData}
					order={deliveryPopup}
					counters={counters}
					// items={itemsData}
					// updateBilling={callBilling}
				/>
			) : (
				""
			)}
			{datePopup ? (
				<DateChangePopup
					onSave={() => {
						setDatePopup(false)
						getOutstanding()
					}}
					// postOrderData={() => onSubmit({ stage: 5 })}
					// setSelectedOrder={setOrderData}
					order={datePopup}
					counters={counters}
					// items={itemsData}
					// updateBilling={callBilling}
				/>
			) : (
				""
			)}
			{typePopup ? (
				<TypeChangePopup
					onSave={() => {
						setTypePopup(false)
						getOutstanding()
					}}
					// postOrderData={() => onSubmit({ stage: 5 })}
					// setSelectedOrder={setOrderData}
					order={typePopup}
					counters={counters}
					// items={itemsData}
					// updateBilling={callBilling}
				/>
			) : (
				""
			)}
			{tagPopup ? (
				<TagPopup
					onSave={() => {
						setTagPopup(false)
						getOutstanding()
					}}
				/>
			) : (
				""
			)}
			{assignTagPopup ? (
				<AssignTagPopup
					onSave={() => {
						setAssignTagPopup(false)
						getOutstanding()
					}}
					selectedOrders={selectedOrders}
					tags={tags}
				/>
			) : (
				""
			)}
		</>
	)
}

export default Outstanding

function Table({
	itemsDetails,
	setDeliveryPopup,
	setDatePopup,
	setTypePopup,
	setSelectedOrders,
	selectedOrders,
	getOrderData,
}) {
	const context = useContext(Context)

	const { setNotification } = context
	const sendMessage = async item => {
		let response = await axios({
			method: "post",
			url: "/orders/sendMsg",
			data: {
				...item,
				notification_uuid: "outstanding-manual-reminder",
				user_uuid: localStorage.getItem("user_uuid"),
			},
		})

		
		setNotification(response.data)
		setTimeout(() => setNotification(null), 3000)
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
	function format(date) {
		let time = new Date()
		time = time.getTime() - date

		var hours = time / 3600000
		var minutes = Math.floor(+(hours - +hours.toString().split(".")[0]) * 60)

		minutes = +minutes < 10 ? "0" + minutes : minutes

		var strTime = Math.floor(hours) + ":" + minutes
		return Math.ceil(time / (1000 * 3600 * 24)) - 1
	}
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={3}>Created At</th>
					<th colSpan={3}>Reminder</th>
					<th colSpan={2}>Created By</th>
					<th colSpan={2}>Invoice</th>
					<th colSpan={2}>Counter</th>
					<th colSpan={2}>Route</th>
					<th colSpan={2}>Type</th>
					<th colSpan={2}>Remarks</th>
					<th colSpan={2}>Duration</th>
					<th colSpan={2}>Amount</th>
					<th colSpan={2}>Tag</th>
					<th colSpan={3}></th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					?.sort((a, b) => a.time - b.time)
					?.map((item, i, array) => (
						<tr
							key={Math.random()}
							style={{ height: "30px" }}
							onClick={e => {
								e.stopPropagation()
								setDeliveryPopup(item)
							}}>
							<td
								onClick={e => {
									e.stopPropagation()
									setSelectedOrders(prev =>
										prev.filter(a => a.outstanding_uuid === item.outstanding_uuid).length
											? prev.filter(a => a.outstanding_uuid !== item.outstanding_uuid)
											: [...(prev || []), item]
									)
								}}
								className="flex"
								style={{ justifyContent: "space-between" }}>
								<input
									type="checkbox"
									checked={selectedOrders.find(a => a.outstanding_uuid === item.outstanding_uuid)}
									style={{ transform: "scale(1.3)", marginRight: "10px" }}
								/>
								{i + 1}
							</td>
							<td colSpan={3}>
								{new Date(item.time).toDateString()} - {formatAMPM(new Date(item.time))}
							</td>
							<td colSpan={3}>
								{item?.reminder ? (
									<>
										{`${new Date(item.reminder).toDateString()} - 
                    ${formatAMPM(new Date(item.reminder))}`}
									</>
								) : (
									""
								)}
								<span
									onClick={e => {
										e.stopPropagation()
										setDatePopup(item)
									}}>
									<ArrowDropDown />
								</span>
							</td>
							<td colSpan={2}>{item.user_title || ""}</td>
							<td colSpan={2}>{item.invoice_number || ""}</td>
							<td colSpan={2}>{item.counter_title || ""}</td>
							<td colSpan={2}>{item.route_title || ""}</td>
							<td
								colSpan={2}
								onClick={e => {
									e.stopPropagation()
									setTypePopup(item)
								}}>
								{typesData.find(a => a.index === item.type)?.name || ""}
								<span>
									<ArrowDropDown />
								</span>
							</td>
							<td colSpan={2}>{item.remarks || ""}</td>
							<td colSpan={2}>{format(+item.time)}</td>
							<td colSpan={2}>{item.amount || ""}</td>
							<td colSpan={2}>{item.tag_title || ""}</td>
							<td
								style={{ color: "green" }}
								onClick={e => {
									e.stopPropagation()
									sendMessage(item)
								}}>
								<WhatsApp />
							</td>
							<td colSpan={2}>
								<button
									className="theme-btn"
									onClick={e => {
										e.stopPropagation()
										getOrderData(item)
									}}>
									Order
								</button>
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
function DiliveryPopup({
	onSave,

	order,
	updateBilling,
}) {
	const [PaymentModes, setPaymentModes] = useState([])
	const [modes, setModes] = useState([])
	const [error, setError] = useState("")
	const [popup, setPopup] = useState(false)
	const [waiting, setWaiting] = useState(false)

	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState({})
	const [outstanding, setOutstanding] = useState({})

	const GetPaymentModes = async () => {
		const cachedData = localStorage.getItem('paymentModesData');
	  
		if (cachedData) {
		  setPaymentModes(JSON.parse(cachedData));
		} else {
		  const response = await axios({
			method: "get",
			url: "/paymentModes/GetPaymentModesList",
			headers: {
			  "Content-Type": "application/json",
			},
		  });
		  if (response.data.success) {
			localStorage.setItem('paymentModesData', JSON.stringify(response.data.result));
			setPaymentModes(response.data.result);
		  }
		}
	  };
	
	useEffect(() => {
		GetPaymentModes()
	}, [])

	useEffect(() => {
		if (PaymentModes?.length)
			setModes(
				PaymentModes?.map(a => ({
					...a,
					amt: "",
					coin: "",
					status:
						a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002" ||
						a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002"
							? "0"
							: 1,
				}))
			)
	}, [PaymentModes])
	
	const submitHandler = async () => {
		if (waiting) {
			return
		}
		setWaiting(true)

		setError("")
		let modeTotal = modes?.map(a => +a.amt || 0)?.reduce((a, b) => a + b)
		let amount = +order.amount - modeTotal
		if (amount < 0) {
			setError("Amount should not be greater than outstanding")
			setWaiting(false)
			return ""
		}
		let response
		if (modeTotal) {
			response = await axios({
				method: "post",
				url: "/receipts/postReceipt",
				data: {
					modes,
					order_uuid: order.order_uuid,
					invoice_number: order.invoice_number,
					counter_uuid: order.counter_uuid,
					order_grandtotal: order?.order_grandtotal,
					collection_tag_uuid: order.collection_tag_uuid || "",
					entry: 0,
					user_uuid: localStorage.getItem("user_uuid"),
				},
				headers: {
					"Content-Type": "application/json",
				},
			})
		}

		response = await axios({
			method: "put",
			url: "/Outstanding/putOutstanding",
			data: {
				...outstanding,
				order_uuid: order.order_uuid,
				counter_uuid: order.counter_uuid,
				outstanding_uuid: order.outstanding_uuid,
				amount,
			},
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (response.data.success) {
			onSave()
		}

		setWaiting(false)
	}

	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Payments</h3>
						<h3>Rs. {order.amount}</h3>
					</div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "fit-content",
						}}>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup">
									{PaymentModes?.map(item => (
										<div
											className="row"
											style={{ flexDirection: "row", alignItems: "center" }}
											key={item.mode_uuid}>
											<div style={{ width: "50px" }}>{item.mode_title}</div>
											<label className="selectLabel flex" style={{ width: "80px" }}>
												<input
													type="number"
													name="route_title"
													className="numberInput"
													value={modes.find(a => a.mode_uuid === item.mode_uuid)?.amt}
													style={{ width: "80px" }}
													onChange={e =>
														setModes(prev =>
															prev?.map(a =>
																a.mode_uuid === item.mode_uuid
																	? {
																			...a,
																			amt: e.target.value,
																	  }
																	: a
															)
														)
													}
													maxLength={42}
													onWheel={e => e.preventDefault()}
												/>
												{/* {popupInfo.conversion || 0} */}
											</label>
										</div>
									))}

									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<button
											type="button"
											className="submit"
											style={{ color: "#fff", backgroundColor: "#7990dd" }}
											onClick={() => setPopup(true)}>
											Deductions
										</button>
									</div>
									<i style={{ color: "red" }}>{error}</i>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button
										type="button"
										style={{ backgroundColor: "red" }}
										className="submit"
										onClick={onSave}>
										Cancel
									</button>
									<button type="button" className="submit" onClick={submitHandler}>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			{waiting ? (
				<div className="overlay" style={{ zIndex: "999999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
								<animateTransform
									attributeName="transform"
									type="rotate"
									dur="1s"
									repeatCount="indefinite"
									keyTimes="0;1"
									values="0 50 51;360 50 51"></animateTransform>
							</path>
						</svg>
					</div>
				</div>
			) : (
				""
			)}
			{popup ? (
				<DiliveryReplaceMent
					onSave={() => {
						setPopup(false)
					}}
					setData={setData}
					updateBilling={e =>
						updateBilling({
							...order,
							replacement: e?.replacement || 0,
							shortage: e?.shortage || 0,
							adjustment: e?.adjustment || 0,
							adjustment_remarks: e?.adjustment_remarks || "",
						})
					}
					data={data}
				/>
			) : (
				""
			)}
		</>
	)
}
function DateChangePopup({
	onSave,

	order,
}) {
	const [error, setError] = useState("")
	const [popup, setPopup] = useState(false)
	const [waiting, setWaiting] = useState(false)

	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState({})

	useEffect(() => {
		let time = new Date(order.reminder)
		let curTime = "yy-mm-dd"
			.replace("mm", ("00" + (time?.getMonth() + 1).toString()).slice(-2))
			.replace("yy", ("0000" + time?.getFullYear().toString()).slice(-4))
			.replace("dd", ("00" + time?.getDate().toString()).slice(-2))
		setData(curTime)
	}, [order.reminder])
	const submitHandler = async () => {
		setWaiting(true)

		let response = await axios({
			method: "put",
			url: "/Outstanding/putOutstandingReminder",
			data: {
				order_uuid: order.order_uuid,
				counter_uuid: order.counter_uuid,
				reminder: new Date(data).getTime(),
				outstanding_uuid: order.outstanding_uuid,
			},
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (response.data.success) {
			onSave()
		}

		setWaiting(false)
	}

	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Reminder</h3>
					</div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "fit-content",
						}}>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup">
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<label className={"selectLabel"}>
											Reminder
											<input
												type="date"
												name="category_title"
												className={"numberInput"}
												value={data || ""}
												onChange={e => setData(e.target.value)}
												style={{ width: "250px" }}
												// maxLength={60}
											/>
										</label>
									</div>
									<i style={{ color: "red" }}>{error}</i>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button
										type="button"
										style={{ backgroundColor: "red" }}
										className="submit"
										onClick={onSave}>
										Cancel
									</button>
									<button type="button" className="submit" onClick={submitHandler}>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			{waiting ? (
				<div className="overlay" style={{ zIndex: "999999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
								<animateTransform
									attributeName="transform"
									type="rotate"
									dur="1s"
									repeatCount="indefinite"
									keyTimes="0;1"
									values="0 50 51;360 50 51"></animateTransform>
							</path>
						</svg>
					</div>
				</div>
			) : (
				""
			)}
		</>
	)
}
function TypeChangePopup({
	onSave,

	order,
}) {
	const [error, setError] = useState("")

	const [waiting, setWaiting] = useState(false)

	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState(0)

	useEffect(() => {
		setData(order.type || 0)
	}, [order.type])
	const submitHandler = async () => {
		setWaiting(true)

		let response = await axios({
			method: "put",
			url: "/Outstanding/putOutstandingType",
			data: {
				invoice_number: order.invoice_number,
				order_uuid: order.order_uuid,
				counter_uuid: order.counter_uuid,
				outstanding_uuid: order.outstanding_uuid,
				type: data,
			},
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (response.data.success) {
			onSave()
		}

		setWaiting(false)
	}

	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Reminder</h3>
					</div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "fit-content",
						}}>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup">
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<label className="selectLabel">
											Outstanding Type
											<select
												className="numberInput"
												value={data}
												onChange={e => setData(e.target.value)}>
												{/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}

												<option value={0}>None</option>
												<option value={1}>Visit</option>
												<option value={2}>Call</option>
												<option value={3}>Self</option>
												<option value={4}>Others</option>
											</select>
										</label>
									</div>
									<i style={{ color: "red" }}>{error}</i>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button
										type="button"
										style={{ backgroundColor: "red" }}
										className="submit"
										onClick={onSave}>
										Cancel
									</button>
									<button type="button" className="submit" onClick={submitHandler}>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			{waiting ? (
				<div className="overlay" style={{ zIndex: "999999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
								<animateTransform
									attributeName="transform"
									type="rotate"
									dur="1s"
									repeatCount="indefinite"
									keyTimes="0;1"
									values="0 50 51;360 50 51"></animateTransform>
							</path>
						</svg>
					</div>
				</div>
			) : (
				""
			)}
		</>
	)
}
function AssignTagPopup({ onSave, selectedOrders, tags }) {
	const [error, setError] = useState("")

	const [waiting, setWaiting] = useState(false)

	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState("")

	const submitHandler = async () => {
		setWaiting(true)

		let response = await axios({
			method: "put",
			url: "/Outstanding/putOutstandingTag",
			data: {
				selectedOrders: selectedOrders.map(a => a.outstanding_uuid),
				collection_tag_uuid: data,
			},
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (response.data.success) {
			onSave()
		}

		setWaiting(false)
	}

	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}></div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "fit-content",
						}}>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup">
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<label className="selectLabel">
											Collection Tags
											<select
												className="numberInput"
												value={data}
												onChange={e => setData(e.target.value)}>
												{/* <option selected={occasionsTemp.length===occasionsData.length} value="all">All</option> */}

												<option value={0}>None</option>
												{tags.map(a => (
													<option value={a.collection_tag_uuid}>
														{a.collection_tag_title}
													</option>
												))}
											</select>
										</label>
									</div>
									<i style={{ color: "red" }}>{error}</i>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button
										type="button"
										style={{ backgroundColor: "red" }}
										className="submit"
										onClick={onSave}>
										Cancel
									</button>
									<button type="button" className="submit" onClick={submitHandler}>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			{waiting ? (
				<div className="overlay" style={{ zIndex: "999999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
								<animateTransform
									attributeName="transform"
									type="rotate"
									dur="1s"
									repeatCount="indefinite"
									keyTimes="0;1"
									values="0 50 51;360 50 51"></animateTransform>
							</path>
						</svg>
					</div>
				</div>
			) : (
				""
			)}
		</>
	)
}
function TagPopup({ onSave }) {
	const [error, setError] = useState("")
	const [users, setUsers] = useState([])
	const [waiting, setWaiting] = useState(false)

	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState({
		collection_tag_title: "",
		assigned_to: [],
	})

	const submitHandler = async () => {
		setWaiting(true)

		let response = await axios({
			method: "post",
			url: "/collectionTags/postTag",
			data,
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (response.data.success) {
			onSave()
		}

		setWaiting(false)
	}
	const getUsers = async () => {
		const response = await axios({
			method: "get",
			url: "/users/GetActiveUserList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		
		if (response.data.success) setUsers(response.data.result)
	}

	useEffect(() => {
		getUsers()
	}, [])
	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>New Tag</h3>
					</div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "fit-content",
						}}>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup">
									<div className="row">
										<label className="selectLabel">
											Title
											<input
												type="text"
												name="route_title"
												className="numberInput"
												value={data?.collection_tag_title}
												onChange={e =>
													setData({
														...data,
														collection_tag_title: e.target.value,
													})
												}
												maxLength={42}
											/>
										</label>
									</div>
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<label className="selectLabel" style={{ width: "100%" }}>
											Assigned to
											<div className="formGroup" style={{ height: "200px", overflow: "scroll" }}>
												<div
													style={{
														marginBottom: "5px",
														textAlign: "center",
														backgroundColor: data.assigned_to?.filter(a => a === "none")
															.length
															? "#caf0f8"
															: "#fff",
													}}
													onClick={e => {
														e.stopPropagation()
														setData(prev => ({
															...prev,
															assigned_to: prev?.assigned_to?.find(a => a === "none")
																? prev?.assigned_to?.filter(a => a !== "none")
																: prev?.assigned_to?.length &&
																  !prev.assigned_to.filter(a => +a === 1).length
																? [...prev?.assigned_to, "none"]
																: ["none"],
														}))
													}}>
													None
												</div>
												<div
													style={{
														marginBottom: "5px",
														textAlign: "center",
														backgroundColor: data.assigned_to?.filter(a => +a === 1).length
															? "#caf0f8"
															: "#fff",
													}}
													onClick={e => {
														e.stopPropagation()
														setData(prev => ({
															...prev,
															assigned_to: [1],
														}))
													}}>
													All
												</div>
												{users
													?.sort((a, b) => a?.user_title?.localeCompare(b.user_title))
													.map(occ => (
														<div
															style={{
																marginBottom: "5px",
																textAlign: "center",
																backgroundColor: data.assigned_to?.filter(
																	a => a === occ.user_uuid
																).length
																	? "#caf0f8"
																	: "#fff",
															}}
															onClick={e => {
																e.stopPropagation()
																setData(prev => ({
																	...prev,
																	assigned_to: prev?.assigned_to?.find(
																		a => a === occ.user_uuid
																	)
																		? prev?.assigned_to?.filter(
																				a => a !== occ.user_uuid
																		  )
																		: prev?.assigned_to?.length &&
																		  !prev.assigned_to.filter(a => +a === 1).length
																		? [...prev?.assigned_to, occ?.user_uuid]
																		: [occ?.user_uuid],
																}))
															}}>
															{occ.user_title}
														</div>
													))}
											</div>
										</label>
									</div>
									<i style={{ color: "red" }}>{error}</i>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button
										type="button"
										style={{ backgroundColor: "red" }}
										className="submit"
										onClick={onSave}>
										Cancel
									</button>
									<button type="button" className="submit" onClick={submitHandler}>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			{waiting ? (
				<div className="overlay" style={{ zIndex: "999999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
								<animateTransform
									attributeName="transform"
									type="rotate"
									dur="1s"
									repeatCount="indefinite"
									keyTimes="0;1"
									values="0 50 51;360 50 51"></animateTransform>
							</path>
						</svg>
					</div>
				</div>
			) : (
				""
			)}
		</>
	)
}
