import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import Header from "../../components/Header"
import { OrderDetails } from "../../components/OrderDetails"
import Sidebar from "../../components/Sidebar"
import Select from "react-select"
import DiliveryReplaceMent from "../../components/DiliveryReplaceMent"
const CounterLeger = () => {
	const [searchData, setSearchData] = useState({
		startDate: "",
		endDate: "",
		counter_uuid: "",
	})
	const [popupOrder, setPopupOrder] = useState(null)
	const [popupRecipt, setPopupRecipt] = useState(null)
	const [items, setItems] = useState([])
	const [counter, setCounter] = useState([])

	const getCounter = async () => {
		const response = await axios({
			method: "post",
			url: "/counters/GetCounterList",
			data: { counters: [] },
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCounter(response.data.result)
	}
	const getCompleteOrders = async () => {
		let startDate = new Date(searchData.startDate + " 00:00:00 AM")
		startDate = startDate.getTime()
		let endDate = new Date(searchData.endDate + " 00:00:00 AM")
		endDate = endDate.getTime()
		const response = await axios({
			method: "post",
			url: "/orders/getCounterLedger",
			data: { startDate, endDate, counter_uuid: searchData.counter_uuid },
			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("activity", response)
		if (response.data.success) setItems(response.data.result)
	}

	useEffect(() => {
		let time = new Date()
		let curTime = "yy-mm-dd"
			.replace("mm", ("00" + (time?.getMonth() + 1).toString()).slice(-2))
			.replace("yy", ("0000" + time?.getFullYear().toString()).slice(-4))
			.replace("dd", ("00" + time?.getDate().toString()).slice(-2))
		let sTime = "yy-mm-dd"
			.replace("mm", ("00" + time?.getMonth().toString()).slice(-2))
			.replace("yy", ("0000" + time?.getFullYear().toString()).slice(-4))
			.replace("dd", ("00" + time?.getDate().toString()).slice(-2))
		setSearchData(prev => ({
			...prev,
			startDate: sTime,
			endDate: curTime,
		}))
		getCounter()
	}, [])
	useEffect(() => {
		if (counter.length) setSearchData({ ...searchData, counter_uuid: counter[0].counter_uuid })
	}, [counter])
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Ledger</h2>
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
							type="date"
							onChange={e =>
								setSearchData(prev => ({
									...prev,
									startDate: e.target.value,
								}))
							}
							value={searchData.startDate}
							placeholder="Search Counter Title..."
							className="searchInput"
							pattern="\d{4}-\d{2}-\d{2}"
						/>
						<input
							type="date"
							onChange={e => setSearchData(prev => ({ ...prev, endDate: e.target.value }))}
							value={searchData.endDate}
							placeholder="Search Route Title..."
							className="searchInput"
							pattern="\d{4}-\d{2}-\d{2}"
						/>
						<div className="inputGroup" style={{ width: "50%" }}>
							<Select
								options={counter.map(a => ({
									value: a.counter_uuid,
									label: a.counter_title,
								}))}
								onChange={doc =>
									setSearchData(prev => ({
										...prev,
										counter_uuid: doc.value,
									}))
								}
								value={
									searchData?.counter_uuid
										? {
												value: searchData?.counter_uuid,
												label: counter?.find(j => j.counter_uuid === searchData.counter_uuid)
													?.counter_title,
										  }
										: ""
								}
								openMenuOnFocus={true}
								menuPosition="fixed"
								menuPlacement="auto"
								placeholder="Select"
							/>
						</div>
						<button className="theme-btn" onClick={() => getCompleteOrders()}>
							Search
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={items}
						setPopupOrder={setPopupOrder}
						counter={counter}
						setPopupRecipt={setPopupRecipt}
					/>
				</div>
			</div>
			{popupOrder ? (
				<OrderDetails
					onSave={() => {
						setPopupOrder(null)
						getCompleteOrders()
					}}
					order_uuid={popupOrder.order_uuid}
					orderStatus="edit"
				/>
			) : (
				""
			)}
			{popupRecipt ? (
				<DiliveryPopup
					onSave={() => {
						setPopupRecipt(null)
						getCompleteOrders()
					}}
					order={popupRecipt}
					orderStatus="edit"
				/>
			) : (
				""
			)}
		</>
	)
}

export default CounterLeger

function Table({ itemsDetails, setPopupOrder, setPopupRecipt }) {
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
					<th colSpan={3}>Date</th>
					<th colSpan={2}>Reference Number</th>
					<th colSpan={1}>Amt</th>
					<th colSpan={1}>Amt</th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					?.sort((a, b) => a.order_date - b.order_date)
					?.map((item, i, array) => (
						<tr
							key={Math.random()}
							style={{ height: "30px" }}
							onClick={() => (item.receipt_number ? setPopupRecipt(item) : setPopupOrder(item))}>
							<td>{i + 1}</td>
							<td colSpan={3}>
								{new Date(item.order_date).toDateString()} - {formatAMPM(new Date(item.order_date))}
							</td>
							<td colSpan={2}>{item.reference_number}</td>
							<td colSpan={1}>{item.amt1 || ""}</td>
							<td colSpan={1}>{item.amt2 || "0"}</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
function DiliveryPopup({ onSave, postOrderData, order, updateBilling, deliveryPopup }) {
	const [PaymentModes, setPaymentModes] = useState([])
	const [modes, setModes] = useState([])
	const [counters, setCounters] = useState([])
	const [error, setError] = useState("")
	const [popup, setPopup] = useState(false)
	const [waiting, setWaiting] = useState(false)

	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState({})
	const [outstanding, setOutstanding] = useState({})
	const time2 = new Date()
	time2.setHours(12)
	let reminder = useMemo(() => {
		return new Date(
			time2.setDate(
				time2.getDate() +
					(counters.find(a => a.counter_uuid === order.counter_uuid)?.payment_reminder_days || 0)
			)
		).getTime()
	}, [counters, order.counter_uuid])
	let type = useMemo(() => {
		return counters.find(a => a.counter_uuid === order.counter_uuid)?.outstanding_type || 0
	}, [counters, order.counter_uuid])
	console.log(outstanding)
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
	const GetPaymentModes = async () => {
		const response = await axios({
			method: "get",
			url: "/paymentModes/GetPaymentModesList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setPaymentModes(response.data.result)
			GetReciptsModes()
		}
	}
	const GetReciptsModes = async () => {
		const response = await axios({
			method: "post",
			url: "/receipts/getSingleRecipt",
			data: {
				order_uuid: order.order_uuid,
				counter_uuid: order.counter_uuid,
				receipt_number: order.receipt_number,
			},
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setModes(response.data.result.modes)
	}
	const GetOutstanding = async () => {
		const response = await axios({
			method: "post",
			url: "/Outstanding/getOutstanding",
			data: { order_uuid: order.order_uuid, counter_uuid: order.counter_uuid },

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setOutstanding(response.data.result)
		else {
			let time = new Date()

			setOutstanding({
				order_uuid: order.order_uuid,
				amount: "",
				user_uuid: localStorage.getItem("user_uuid"),
				time: time.getTime(),
				invoice_number: order.invoice_number,
				trip_uuid: order.trip_uuid,
				counter_uuid: order.counter_uuid,
				reminder,
				type,
			})
		}
	}
	useEffect(() => {
		if (deliveryPopup === "put" || deliveryPopup === "edit") {
			GetOutstanding()
		} else {
			let time = new Date()
			setOutstanding({
				order_uuid: order.order_uuid,
				amount: "",
				user_uuid: localStorage.getItem("user_uuid"),
				time: time.getTime(),
				invoice_number: order.invoice_number,
				trip_uuid: order.trip_uuid,
				counter_uuid: order.counter_uuid,
				reminder,
				type,
			})
		}
		GetPaymentModes()
	}, [deliveryPopup, order.counter_uuid, order.invoice_number, order.order_uuid, order.trip_uuid, reminder, type])
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
	useEffect(() => {
		getCounter()
	}, [])
	const submitHandler = async () => {
		if (waiting) {
			return
		}
		setWaiting(true)
		updateBilling({
			...order,
			replacement: data?.actual || 0,
			shortage: data?.shortage || 0,
			adjustment: data?.adjustment || 0,
			adjustment_remarks: data?.adjustment_remarks || "",
		})
		setError("")
		let modeTotal = modes?.map(a => +a.amt || 0)?.reduce((a, b) => a + b)
		//console.log(
		// Tempdata?.order_grandtotal,
		//   +(+modeTotal + (+outstanding?.amount || 0))
		// );
		if (+order?.order_grandtotal !== +(+modeTotal + (+outstanding?.amount || 0))) {
			setError("Invoice Amount and Payment mismatch")
			setWaiting(false)
			return
		}
		if (
			window.location.pathname.includes("completeOrderReport") ||
			window.location.pathname.includes("signedBills") ||
			window.location.pathname.includes("pendingEntry") ||
			window.location.pathname.includes("upiTransactionReport")
		) {
			let response
			if (modeTotal) {
				response = await axios({
					method: "put",
					url: "/receipts/putSingleReceipt",
					data: {
						modes,
						order_uuid: order.order_uuid,
						counter_uuid: order.counter_uuid,
						receipt_number: order.receipt_number,
					},
					headers: {
						"Content-Type": "application/json",
					},
				})
			}
			if (outstanding?.amount) {
				response = await axios({
					method: "put",
					url: "/Outstanding/putOutstanding",
					data: {
						...outstanding,
						order_uuid: order.order_uuid,
						counter_uuid: order.counter_uuid,
					},
					headers: {
						"Content-Type": "application/json",
					},
				})
			}
			if (response.data.success) {
				onSave()
			}
		} else {
			// let obj = modes.find((a) => a.mode_title === "Cash");
			// if (obj?.amt && obj?.coin === "") {
			//   setCoinPopup(true);
			//   return;
			// }
			let time = new Date()
			let obj = {
				user_uuid: localStorage.getItem("user_uuid"),
				time: time.getTime(),
				order_uuid: order.order_uuid,
				counter_uuid: order.counter_uuid,
				trip_uuid: order.trip_uuid,
				invoice_number: order.invoice_number,
				modes: modes?.map(a => (a.mode_title === "Cash" ? { ...a, coin: 0 } : a)),
			}
			let response
			if (modeTotal) {
				response = await axios({
					method: "post",
					url: "/receipts/postReceipt",
					data: obj,
					headers: {
						"Content-Type": "application/json",
					},
				})
			}
			if (outstanding?.amount)
				response = await axios({
					method: "post",
					url: "/Outstanding/postOutstanding",
					data: outstanding,
					headers: {
						"Content-Type": "application/json",
					},
				})
			if (response.data.success) {
				postOrderData()
				onSave()
			}
		}
		setWaiting(false)
	}

	return (
		<>
			<div className="overlay" style={{ zIndex: 9999999999 }}>
				<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Payments</h3>
						<h3>Rs. {order.order_grandtotal}</h3>
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
											{item.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002" &&
											modes.find(a => a.mode_uuid === item.mode_uuid)?.amt ? (
												<label className="selectLabel flex" style={{ width: "200px" }}>
													<input
														type="text"
														name="route_title"
														className="numberInput"
														value={item?.remarks}
														placeholder={"Cheque Number"}
														style={{
															width: "100%",
															backgroundColor: "light",
															fontSize: "12px",
														}}
														onChange={e =>
															setModes(prev =>
																prev?.map(a =>
																	a.mode_uuid === item.mode_uuid
																		? { ...a, remarks: e.target.value }
																		: a
																)
															)
														}
														maxLength={42}
														onWheel={e => e.preventDefault()}
													/>
												</label>
											) : (
												""
											)}
										</div>
									))}
									{/* <div
                    className="row"
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <div style={{ width: "50px" }}>UnPaid</div>
                    <label
                      className="selectLabel flex"
                      style={{ width: "80px" }}
                    >
                      <input
                        type="number"
                        name="route_title"
                        className="numberInput"
                        value={outstanding?.amount}
                        placeholder={""}
                        style={
                          !credit_allowed === "Y"
                            ? {
                                width: "90px",
                                backgroundColor: "light",
                                fontSize: "12px",
                                color: "#fff",
                              }
                            : { width: "80px" }
                        }
                        onChange={(e) =>
                          setOutstanding((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        maxLength={42}
                        onWheel={(e) => e.preventDefault()}
                      />
                       {popupInfo.conversion || 0} 
                    </label>
                  </div> */}
									{outstanding?.amount ? (
										<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
											<label className="selectLabel flex" style={{ width: "100%" }}>
												<input
													type="text"
													name="route_title"
													className="numberInput"
													value={outstanding?.remarks}
													placeholder={"Remarks"}
													style={{
														width: "100%",
														backgroundColor: "light",
														fontSize: "12px",
														color: "#fff",
													}}
													onChange={e =>
														setOutstanding(prev => ({
															...prev,
															remarks: e.target.value,
														}))
													}
													maxLength={42}
													onWheel={e => e.preventDefault()}
												/>
												{/* {popupInfo.conversion || 0} */}
											</label>
										</div>
									) : (
										""
									)}
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										{deliveryPopup === "put" ? (
											""
										) : (
											<button
												type="button"
												className="submit"
												style={{ color: "#fff", backgroundColor: "#7990dd" }}
												onClick={() => setPopup(true)}>
												Deductions
											</button>
										)}
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
							replacement: e?.actual || 0,
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
