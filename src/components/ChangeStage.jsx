import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import { Billing } from "../Apis/functions"
import DiliveryReplaceMent from "./DiliveryReplaceMent"
import Select from "react-select"

const ChangeStage = ({ onClose, orders, stage, counters, items, users }) => {
	const [data, setData] = useState({ stage: stage + 1 })
	const [deliveryPopup, setDeliveryPopup] = useState(false)
	const [selectedWarehouseOrders, setSelectedWarehouseOrders] = useState([])
	const [selectedWarehouseOrder, setSelectedWarehouseOrder] = useState(false)
	const [waiting, setWaiting] = useState(false)
	const [cancelPopup, setCancelPopup] = useState()

	useEffect(() => {
		console.log(selectedWarehouseOrders)
		if (selectedWarehouseOrders?.length) {
			setSelectedWarehouseOrder(selectedWarehouseOrders[0])
		} else {
			setSelectedWarehouseOrder(false)
		}
	}, [selectedWarehouseOrders])

	const onSubmit = async (params = {}) => {
		let { selectedData = orders, diliveredUser = "", reasons = {} } = params
		setWaiting(true)
		console.log(selectedData)
		let user_uuid = localStorage.getItem("user_uuid")
		let time = new Date()
		console.log(stage, data)
		let status =
			+data.stage === 0
				? []
				: stage === 1
				? +data.stage === 2
					? [{ stage: 2, time: time.getTime(), user_uuid }]
					: +data.stage === 3
					? [
							{ stage: 2, time: time.getTime(), user_uuid },
							{ stage: 3, time: time.getTime(), user_uuid }
					  ]
					: +data.stage === 4
					? [
							{ stage: 2, time: time.getTime(), user_uuid },
							{ stage: 3, time: time.getTime(), user_uuid },
							{ stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
							{ stage: 4, time: time.getTime(), user_uuid }
					  ]
					: [
							{ stage: 2, time: time.getTime(), user_uuid },
							{ stage: 3, time: time.getTime(), user_uuid },
							{ stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
							{ stage: 4, time: time.getTime(), user_uuid },
							{ stage: 5, time: time.getTime(), user_uuid }
					  ]
				: stage === 2
				? +data.stage === 3
					? [{ stage: 3, time: time.getTime(), user_uuid }]
					: +data.stage === 4
					? [
							{ stage: 3, time: time.getTime(), user_uuid },
							{ stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
							{ stage: 4, time: time.getTime(), user_uuid }
					  ]
					: [
							{ stage: 3, time: time.getTime(), user_uuid },
							{ stage: 4, time: time.getTime(), user_uuid },
							{ stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
							{ stage: 5, time: time.getTime(), user_uuid }
					  ]
				: stage === 3
				? +data.stage === 4
					? [
							{ stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
							{ stage: 4, time: time.getTime(), user_uuid }
					  ]
					: [
							{ stage: 3.5, time: time.getTime(), user_uuid: diliveredUser },
							{ stage: 4, time: time.getTime(), user_uuid },
							{ stage: 5, time: time.getTime(), user_uuid }
					  ]
				: [{ stage: 5, time: time.getTime(), user_uuid }]

		selectedData = selectedData?.map(a => ({
			...a,
			status: +data.stage === 0 ? a.status : [...a.status, ...status],
			hold: +data.stage === 0 ? "Y" : a.hold || "N"
		}))

		console.log(selectedData)
		if (+data.stage === 5) {
			let orderData = []
			for (let obj of selectedData) {
				obj = {
					...obj,

					processing_canceled:
						+stage === 2
							? obj.processing_canceled?.length
								? [...obj.processing_canceled, ...obj.item_details]
								: obj.item_details
							: obj.processing_canceled || [],
					delivery_return:
						+stage === 4
							? obj.delivery_return?.length
								? [...obj.delivery_return, ...obj.item_details]
								: obj.item_details
							: obj.delivery_return || [],
					item_details: obj.item_details.map(a => ({
						...a,
						b: 0,
						p: 0
					}))
				}

				let billingData = await Billing({
					order_uuid: obj?.order_uuid,
					invoice_number: `${obj?.order_type}${obj?.invoice_number}`,
					replacement: obj.replacement,
					adjustment: obj.adjustment,
					shortage: obj.shortage,
					counter: counters.find(a => a.counter_uuid === obj.counter_uuid),
					////add_discounts: true,
					items: obj.item_details.map(a => {
						let itemData = items.find(b => a.item_uuid === b.item_uuid)
						return {
							...itemData,
							...a
						}
					})
				})

				const status = obj?.status?.map(_i => (+_i?.stage === 5 ? { ..._i, cancellation_reason: reasons[obj?.order_uuid] } : _i))

				orderData.push({
					...obj,
					...billingData,
					item_details: billingData.items,
					status
				})
			}

			const response = await axios({
				method: "put",
				url: "/orders/putOrders",
				data: orderData,
				headers: {
					"Content-Type": "application/json"
				}
			})
			if (response.data.success) {
				onClose()
			}

			return
		}
		const response = await axios({
			method: "put",
			url: "/orders/putOrders",
			data: selectedData,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			onClose()
		}
		setWaiting(false)
	}
	const handleWarehouseChacking = async () => {
		let data = []

		for (let orderData of orders) {
			let warehouse_uuid = JSON.parse(localStorage.getItem("warehouse") || "")

			if (warehouse_uuid && +warehouse_uuid !== 0 && warehouse_uuid !== orderData.warehouse_uuid) {
				console.log(orderData.warehouse_uuid)
				if (!orderData.warehouse_uuid) {
					updateWarehouse(warehouse_uuid, orderData)
				} else {
					console.log(warehouse_uuid, orderData)
					data.push({ warehouse_uuid, orderData })
				}
			}
		}

		console.log(data)
		if (data?.length) {
			setSelectedWarehouseOrders(data)
		} else {
			setDeliveryPopup(true)
		}
	}
	const updateWarehouse = async (warehouse_uuid, orderData) => {
		setWaiting(true)
		const response = await axios({
			method: "put",
			url: "/orders/putOrders",
			data: [{ ...orderData, warehouse_uuid }],
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setSelectedWarehouseOrders(prev => {
				console.log(prev)
				if (prev?.length === 1) {
					setDeliveryPopup(true)
					return []
				} else {
					return prev.filter(a => a.orderData.order_uuid !== orderData.order_uuid)
				}
			})
		}
		setWaiting(false)
	}
	return (
		<>
			<div className="overlay">
				<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "20px",
							width: "fit-content"
						}}
					>
						<div style={{ overflowY: "scroll" }}>
							<form
								className="form"
								onSubmit={e => {
									e.preventDefault()
									if (data.stage === 4) {
										handleWarehouseChacking(true)
									} else if (data.stage === 5) {
										setCancelPopup(true)
									} else onSubmit()
								}}
							>
								<div className="formGroup">
									<div className="row">
										<h3>Stage</h3>
										<div
											style={{
												textDecoration: stage >= 1 ? "line-through" : ""
											}}
											onClick={() => {
												if (stage >= 1) return
												setData({ ...data, stage: 1 })
											}}
										>
											<input type="radio" checked={data.stage === 1} />
											Processing
										</div>
										<div
											style={{
												textDecoration: stage >= 2 ? "line-through" : ""
											}}
											onClick={() => {
												if (stage >= 2) return
												setData({ ...data, stage: 2 })
											}}
										>
											<input type="radio" checked={data.stage === 2} />
											Checking
										</div>
										<div
											style={{
												textDecoration: stage >= 3 ? "line-through" : ""
											}}
											onClick={() => {
												if (stage >= 3) return
												setData({ ...data, stage: 3 })
											}}
										>
											<input type="radio" checked={data.stage === 3} />
											Delivery
										</div>
										<div
											style={{
												textDecoration: stage >= 4 ? "line-through" : ""
											}}
											onClick={() => {
												if (stage >= 4) return
												setData({ ...data, stage: 4 })
											}}
										>
											<input type="radio" checked={data.stage === 4} />
											Complete
										</div>
										<div
											onClick={() => {
												setData({ ...data, stage: 0 })
											}}
										>
											<input type="radio" checked={data.stage === 0} />
											Hold
										</div>
										<div
											style={{
												textDecoration: stage >= 5 ? "line-through" : ""
											}}
											onClick={() => {
												if (stage >= 5) return
												setData({ ...data, stage: 5 })
											}}
										>
											<input type="radio" checked={data.stage === 5} />
											Cancel
										</div>
									</div>

									<div className="row">
										<button type="submit" className="submit">
											Save
										</button>
									</div>
								</div>
							</form>
						</div>
						<button onClick={onClose} className="closeButton">
							x
						</button>
					</div>
				</div>
			</div>
			{waiting ? (
				<div className="overlay" style={{ zIndex: "99999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
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
					</div>
				</div>
			) : (
				""
			)}
			{deliveryPopup ? (
				<DiliveryPopup
					onSave={() => setDeliveryPopup(false)}
					postOrderData={onSubmit}
					orders={orders}
					counters={counters}
					items={items}
					users={users}
				/>
			) : (
				""
			)}
			{selectedWarehouseOrder ? (
				<WarehouseUpdatePopup onClose={() => {}} updateChanges={updateWarehouse} popupInfo={selectedWarehouseOrder} />
			) : (
				""
			)}
			{cancelPopup && <CancellationReasons close={() => setCancelPopup(false)} orders={orders} submit={onSubmit} />}
		</>
	)
}

export default ChangeStage

function DiliveryPopup({ onSave, postOrderData, users, counters, items, orders }) {
	const [PaymentModes, setPaymentModes] = useState([])
	const [modes, setModes] = useState([])
	const [error, setError] = useState("")
	const [popup, setPopup] = useState(false)
	const [waiting, setWaiting] = useState(false)
	// const [coinPopup, setCoinPopup] = useState(false);
	const [data, setData] = useState({})
	const [outstanding, setOutstanding] = useState({})
	const [count, setCount] = useState(0)
	const [order, setOrder] = useState({})
	const [editedOrders, setEditedOrders] = useState([])
	const [diliveredUser, setDiliveredUser] = useState("")
	const time2 = new Date()
	time2.setHours(12)
	useEffect(() => {
		setOrder(orders[0])
	}, [])
	let reminder = useMemo(() => {
		return new Date(
			time2.setDate(time2.getDate() + (counters.find(a => a.counter_uuid === order.counter_uuid)?.payment_reminder_days || 0))
		).getTime()
	}, [counters, order.counter_uuid])
	let type = useMemo(() => {
		return counters.find(a => a.counter_uuid === order.counter_uuid)?.outstanding_type || 0
	}, [counters, order.counter_uuid])
	const GetPaymentModes = async controller => {
		const response = await axios({
			method: "get",
			url: "/paymentModes/GetPaymentModesList",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setPaymentModes(response.data.result)
	}
	useEffect(() => {
		let time = new Date()
		const controller = new AbortController()
		setOutstanding({
			order_uuid: order?.order_uuid,
			amount: "",
			user_uuid: localStorage.getItem("user_uuid"),
			time: time.getTime(),
			invoice_number: order.invoice_number,
			trip_uuid: order.trip_uuid,
			counter_uuid: order.counter_uuid,
			reminder,
			type
		})
		GetPaymentModes(controller)
		return () => {
			controller.abort()
		}
	}, [counters.payment_reminder_days, order, reminder, type])
	useEffect(() => {
		if (PaymentModes?.length)
			setModes(
				PaymentModes.map(a => ({
					...a,
					amt: "",
					coin: "",
					status:
						a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002" || a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002"
							? "0"
							: 1
				}))
			)
	}, [PaymentModes])
	const updateBillingAmount = async selectedOrder => {
		console.log(selectedOrder)
		let billingData = await Billing({
			order_uuid: selectedOrder?.order_uuid,
			invoice_number: `${selectedOrder?.order_type}${selectedOrder?.invoice_number}`,
			replacement: selectedOrder.replacement,
			shortage: selectedOrder.shortage,
			adjustment: selectedOrder.adjustment,
			counter: counters.find(a => a.counter_uuid === selectedOrder.counter_uuid),
			////add_discounts: true,
			items: selectedOrder.item_details.map(a => {
				let itemData = items.find(b => a.item_uuid === b.item_uuid)
				return {
					...itemData,
					...a
				}
			})
		})
		setOrder(prev => ({
			...prev,
			...selectedOrder,
			...billingData,
			item_details: billingData.items
		}))
	}

	const submitHandler = async () => {
		if (waiting) {
			return
		}
		setWaiting(true)
		setError("")
		// if (outstanding.amount && !outstanding.remarks) {
		// 	setError("Remarks is mandatory")
		// 	setWaiting(false)
		// 	return
		// }
		if (modes.find(a => a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002" && a.amt && !a.remarks)) {
			setError("Cheque number is mandatory")
			setWaiting(false)
			return
		}

		let modeTotal = modes.map(a => +a.amt || 0)?.reduce((a, b) => a + b)

		if (+order?.order_grandtotal !== +(+modeTotal + (+outstanding?.amount || 0))) {
			setError("Invoice Amount and Payment mismatch")
			setWaiting(false)
			return
		}
		// let obj = modes.find((a) => a.mode_title === "Cash");
		// if (obj?.amt && obj?.coin === "") {
		//   // setCoinPopup(true);
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
			modes: modes?.map(a => (a.mode_title === "Cash" ? { ...a, coin: 0 } : a))
		}
		let response
		if (modeTotal) {
			response = await axios({
				method: "post",
				url: "/receipts/postReceipt",
				data: obj,
				headers: {
					"Content-Type": "application/json"
				}
			})
		}
		if (outstanding?.amount)
			response = await axios({
				method: "post",
				url: "/Outstanding/postOutstanding",
				data: outstanding,
				headers: {
					"Content-Type": "application/json"
				}
			})
		if (response.data.success) {
			if (count + 1 === orders?.length) {
				postOrderData({ selectedData: [...editedOrders, order], diliveredUser })
				onSave()
			} else {
				setEditedOrders(prev => [...prev, order])
				setOrder(orders[count + 1])
				setCount(prev => prev + 1)
				setData({})
				// setCoinPopup(false);
			}
		}
		setWaiting(false)
	}
	useEffect(() => {
		updateBillingAmount({
			...order,
			replacement: data?.actual || 0,
			shortage: data?.shortage || 0,
			adjustment: data?.adjustment || 0,
			adjustment_remarks: data?.adjustment_remarks || ""
		})
	}, [data])
	const getTripData = async trip_uuid => {
		const response = await axios({
			method: "post",
			url: "/trips/GetTripData",
			data: { params: ["users"], trips: [trip_uuid].filter(a => a) },
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			console.log("dilivereduser", response.data.result[0]?.users[0])
			if (response.data.result[0]?.users[0]) setDiliveredUser(response.data.result[0]?.users[0])
		}
	}
	useEffect(() => {
		if (order.trip_uuid) getTripData(order.trip_uuid)
	}, [order.trip_uuid])
	return (
		<>
			<div className="overlay">
				<div className="modal" style={{ height: "fit-content", width: "400px" }}>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h3>Payments</h3>
						<h3>Rs. {order?.order_grandtotal || 0}</h3>
					</div>
					<div className="flex" style={{ justifyContent: "space-between" }}>
						<h4>{order?.counter_title || ""}</h4>
						<h4>Invoice No.{order?.invoice_number || 0}</h4>
					</div>

					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "10px",
							width: "100%"
						}}
					>
						<div style={{ overflowY: "scroll" }}>
							<form className="form">
								<div className="formGroup">
									{PaymentModes.map(item => (
										<div className="row" style={{ flexDirection: "row", alignItems: "center" }} key={item.mode_uuid}>
											<div style={{ width: "50px" }}>{item.mode_title}</div>
											<label className="selectLabel flex" style={{ width: "80px" }}>
												<input
													type="number"
													name="route_title"
													className="numberInput"
													value={modes.find(a => a.mode_uuid === item.mode_uuid)?.amt}
													disabled={order?.order_type === "E" && item?.mode_title !== "Cash"}
													onContextMenu={e => {
														e.preventDefault()
														e.stopPropagation()
														setModes(prev =>
															prev?.map(a =>
																a.mode_uuid === item.mode_uuid
																	? {
																			...a,
																			amt: order.order_grandtotal || 0
																	  }
																	: a
															)
														)
													}}
													style={{ width: "80px" }}
													onChange={e =>
														setModes(prev =>
															prev.map(a =>
																a.mode_uuid === item.mode_uuid
																	? {
																			...a,
																			amt: e.target.value
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
															fontSize: "12px"
														}}
														onChange={e =>
															setModes(prev =>
																prev?.map(a => (a.mode_uuid === item.mode_uuid ? { ...a, remarks: e.target.value } : a))
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
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<div style={{ width: "50px" }}>UnPaid</div>
										<label className="selectLabel flex" style={{ width: "80px" }}>
											<input
												type="number"
												name="route_title"
												className="numberInput"
												value={outstanding?.amount}
												onContextMenu={e => {
													e.preventDefault()
													e.stopPropagation()
													setOutstanding(prev => ({
														...prev,
														amount: order.order_grandtotal || 0
													}))
												}}
												style={{ width: "80px" }}
												onChange={e =>
													setOutstanding(prev => ({
														...prev,
														amount: e.target.value
													}))
												}
												// disabled={order.credit_allowed !== "Y"}
												disabled={order?.order_type === "E"}
												maxLength={42}
												onWheel={e => e.preventDefault()}
											/>
											{/* {popupInfo.conversion || 0} */}
										</label>

										{outstanding?.amount ? (
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
														fontSize: "12px"
													}}
													onChange={e =>
														setOutstanding(prev => ({
															...prev,
															remarks: e.target.value
														}))
													}
													maxLength={42}
													onWheel={e => e.preventDefault()}
												/>
												{/* {popupInfo.conversion || 0} */}
											</label>
										) : (
											""
										)}
									</div>
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<button
											type="button"
											className="submit"
											style={{ color: "#fff", backgroundColor: "#7990dd" }}
											onClick={() => setPopup(true)}
										>
											Deductions
										</button>
									</div>
									<div className="row" style={{ flexDirection: "row", alignItems: "center" }}>
										<div style={{ width: "100px" }}>Delivered By</div>
										<label className="selectLabel flex" style={{ width: "120px" }}>
											<select
												className="numberInput"
												style={{
													width: "100%",
													backgroundColor: "light",
													fontSize: "12px"
												}}
												value={diliveredUser}
												onChange={e => setDiliveredUser(e.target.value)}
											>
												<option value="">None</option>
												{users
													.filter(a => a.status)
													.map(a => (
														<option value={a.user_uuid}>{a.user_title}</option>
													))}
											</select>
											{/* {popupInfo.conversion || 0} */}
										</label>
									</div>
									<i style={{ color: "red" }}>{error}</i>
								</div>

								<div className="flex" style={{ justifyContent: "space-between" }}>
									<button type="button" style={{ backgroundColor: "red" }} className="submit" onClick={onSave}>
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
				<div className="overlay" style={{ zIndex: "99999999999999999" }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
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
					data={data}
				/>
			) : (
				""
			)}
			{/* {coinPopup ? (
        <div className="overlay">
          <div
            className="modal"
            style={{ height: "fit-content", width: "max-content" }}
          >
            <h3>Cash Coin</h3>
            <div
              className="content"
              style={{
                height: "fit-content",
                padding: "10px",
                width: "fit-content",
              }}
            >
              <div style={{ overflowY: "scroll" }}>
                <form className="form">
                  <div className="formGroup">
                    <div
                      className="row"
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <div style={{ width: "50px" }}>Cash</div>

                      <label
                        className="selectLabel flex"
                        style={{ width: "80px" }}
                      >
                        <input
                          type="number"
                          name="route_title"
                          className="numberInput"
                          placeholder="Coins"
                          value={
                            modes.find(
                              (a) =>
                                a.mode_uuid ===
                                "c67b54ba-d2b6-11ec-9d64-0242ac120002"
                            )?.coin
                          }
                          style={{ width: "70px" }}
                          onChange={(e) =>
                            setModes((prev) =>
                              prev.map((a) =>
                                a.mode_uuid ===
                                "c67b54ba-d2b6-11ec-9d64-0242ac120002"
                                  ? {
                                      ...a,
                                      coin: e.target.value,
                                    }
                                  : a
                              )
                            )
                          }
                          maxLength={42}
                          onWheel={(e) => e.preventDefault()}
                        />
                      </label>
                    </div>
                  </div>

                  <div
                    className="flex"
                    style={{ justifyContent: "space-between" }}
                  >
                    <button
                      type="button"
                      className="submit"
                      onClick={() => submitHandler()}
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )} */}
		</>
	)
}

function WarehouseUpdatePopup({ popupInfo, updateChanges, onClose }) {
	const [data, setdata] = useState("")

	const [warehouse, setWarehouse] = useState([])
	const getItemsData = async controller => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setWarehouse(response.data.result)
	}
	useEffect(() => {
		const controller = new AbortController()
		setdata(popupInfo.warehouse_uuid)
		getItemsData(controller)
		return () => {
			controller.abort()
		}
	}, [popupInfo])
	const submitHandler = async e => {
		e.preventDefault()
		console.log(data, popupInfo)
		updateChanges(data, popupInfo.orderData)
		onClose()
	}

	return (
		<div className="overlay" style={{ zIndex: 99999999999 }}>
			<div className="modal" style={{ height: "fit-content", width: "fit-content", padding: 50 }}>
				<div
					className="content"
					// style={{ flexDirection: "row", flexWrap: "wrap", gap: "5" }}
					style={{
						height: "fit-content",
						padding: "20p0",
						marginBottom: "10px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>Update Warehouse</h1>
							</div>
							<div className="row">
								<h2>Order:{popupInfo.orderData.invoice_number}</h2>
							</div>

							<div className="formGroup">
								<div className="row">
									<label className="selectLabel">
										Warehouse
										<div className="inputGroup" style={{ width: "200px" }}>
											<Select
												options={[
													{ value: 0, label: "None" },
													...warehouse.map(a => ({
														value: a.warehouse_uuid,
														label: a.warehouse_title
													}))
												]}
												onChange={doc => setdata(doc.value)}
												value={
													data
														? {
																value: data,
																label: warehouse?.find(j => j.warehouse_uuid === data)?.warehouse_title
														  }
														: { value: 0, label: "None" }
												}
												autoFocus={!data}
												openMenuOnFocus={true}
												menuPosition="fixed"
												menuPlacement="auto"
												placeholder="Select"
											/>
										</div>
									</label>
								</div>
							</div>

							<button type="submit" className="submit">
								Save changes
							</button>
						</form>
					</div>
					<button type="button" onClick={() => onClose()} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}

function CancellationReasons({ close, orders, submit }) {
	const [reasons, setReasons] = useState({})

	return (
		<div className="overlay" style={{ zIndex: 9999999999 }}>
			<form
				className="modal"
				style={{
					height: "fit-content",
					width: "max-content",
					paddingTop: "50px"
				}}
				onSubmit={e => {
					e.preventDefault()
					submit({ reasons })
				}}
			>
				<h3>Selected orders will be cancelled</h3>
				<h4 style={{ marginTop: "10px", textAlign: "left" }}>Cancellation Reason{orders?.[1] ? "s" : ""} -</h4>

				<div id="cancellation-reasons-wrapper">
					{orders?.map(i => (
						<div key={i?.order_uuid}>
							<label>
								{i?.counter_title} - <b>{i?.invoice_number}</b>
							</label>
							<textarea
								type="text"
								className="cancellation-reason"
								value={reasons[i?.order_uuid]}
								onChange={e => setReasons(_i => ({ ..._i, [i?.order_uuid]: e.target.value }))}
								required
							/>
						</div>
					))}
				</div>

				<button type="submit" className="submit">
					Confirm
				</button>
				<button onClick={close} className="closeButton">
					x
				</button>
			</form>
		</div>
	)
}
