import axios from "axios"
import React, { useEffect, useState } from "react"
import { Billing } from "../Apis/functions"
import { ContentCopy } from "@mui/icons-material"
import { getInitialValues } from "../pages/AddOrder/AddOrder"
import { IoIosClose } from "react-icons/io"

const ImportInvoices = ({ file, onClose }) => {
	const [timer, setTimer] = useState(30)
	const [existingInvoicesState, setExistingInvoicesState] = useState(null)
	const [result, setResult] = useState({
		succeed: [],
		failed: [],
		skipped: [],
		reimported: [],
		count: 0,
		total: 0
	})
	const [flags, setFlags] = useState({
		loading: false,
		posting: false
	})

	const createOrder = async (invoice, data) => {
		let order
		try {
			const billingParams = {
				creating_new: 1,
				new_order: 1,
				counter: data.counters.find(i => i.dms_buyer_id === invoice.dms_buyer_id),
				items: []
			}

			const errors = []

			if (!billingParams.counter)
				errors.push(
					<>
						<b>Counter</b> not found. DMS buyer id: <b>{invoice.dms_buyer_id}</b>, Name:{" "}
						<b>{invoice.dms_buyer_name}</b>
					</>
				)

			for (const i of invoice.items_details) {
				const item = data.items.find(j => j.dms_erp_id === i.dms_erp_id)
				if (!item) {
					errors.push(
						<>
							<b>Item</b> not found. DMS ERP Id: <b>{i.dms_erp_id}</b>, Name: <b>{i.dms_item_name}</b>
						</>
					)
					continue
				}

				billingParams.items.push({
					...item,
					...i,
					b: parseInt(+item?.conversion ? i.p / +item.conversion : 0),
					p: parseInt(+item?.conversion ? i.p % +item.conversion : i.p),
					price: item?.item_price || 0
				})
			}

			if (errors?.length > 0) return { errors, local: true }

			const { items, ...billing_details } = await Billing(billingParams)
			const initValues = getInitialValues()
			order = {
				...invoice,
				...billing_details,
				opened_by: 0,
				priority: 0,
				order_type: "I",
				warehouse_uuid: initValues.warehouse_uuid,
				time_1: Date.now() + initValues.time_1,
				time_2: Date.now() + initValues.time_2,
				item_details: items.map(i => ({
					...i,
					unit_price: i.item_total / (+(+i.conversion * i.b) + i.p + i.free) || i.item_price || i.price,
					gst_percentage: i.item_gst,
					css_percentage: i.item_css,
					status: 0,
					price: i.price || i.item_price || 0
				})),
				status: [
					{
						stage: 1,
						time: Date.now(),
						user_uuid:
							data.users?.length > 0
								? data.users?.find(i => i.dms_erp_id === invoice.dms_erp_user)?.user_uuid ||
								  localStorage.getItem("user_uuid")
								: localStorage.getItem("user_uuid")
					}
				]
			}
		} catch (error) {
			console.error(error)
			return {
				error: "Order billing failed, please try again."
			}
		}

		try {
			const response = await axios({
				method: "post",
				url: "/orders/postOrder",
				data: order,
				headers: {
					"Content-Type": "application/json"
				}
			})

			if (response?.data?.success) return { success: true }
			else return { error: "Order not created, please check the invoice details." }
		} catch (error) {
			console.error(error)
			return {
				error:
					error.response.status === 500 || !error.response?.data?.message
						? "Something broke, please contact support."
						: error.response?.data?.message
			}
		}
	}

	const sleep = ms =>
		new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve()
			}, ms)
		})

	const initiateIntervalImporting = async (json, data) => {
		for (let idx = 0; idx < json.length; idx++) {
			setFlags({ posting: true })

			const invoice = json[idx]
			const result = await createOrder(invoice, data)

			if (result.success)
				setResult(prev => ({
					...prev,
					succeed: prev.succeed.concat([{ dms_invoice_number: invoice.dms_invoice_number }]),
					count: idx + 1
				}))
			else
				setResult(prev => ({
					...prev,
					failed: prev.failed.concat([
						{
							dms_invoice_number: invoice.dms_invoice_number,
							message: result.errors || result.error
						}
					]),
					count: idx + 1
				}))

			if (result?.local) continue

			setFlags({ posting: false })
			for (let j = 30; j > 0; j--) {
				setTimer(j)
				await sleep(1000)
			}
		}

		setFlags({})
	}

	useEffect(() => {
		;(async () => {
			try {
				if (!file) return
				setFlags({ loading: true })

				let json = await new Promise((res, rej) => {
					const reader = new FileReader()

					reader.onload = e => {
						try {
							const json = JSON.parse(e.target.result)
							res(json)
						} catch (error) {
							console.log(e.target.error)
							alert("The file content is not valid JSON.")
							rej()
						}
					}

					reader.onerror = e => {
						console.log(e.target.error)
						alert("Failed to read file, please contact support.")
						rej()
					}

					reader.readAsText(file)
				})

				const payload = {
					dms_counters: [],
					dms_users: [],
					dms_invoice_numbers: [],
					dms_items: []
				}

				for (const invoice of json) {
					payload.dms_counters.push(invoice.dms_buyer_id)
					payload.dms_users.push(invoice.dms_erp_user)
					payload.dms_invoice_numbers.push(invoice.dms_invoice_number)
					payload.dms_items = payload.dms_items.concat(invoice.items_details.map(i => i.dms_erp_id))
				}

				const response = await axios.post("/invoice-import-prerequisite", payload)
				if (!response.data?.existing_invoice_orders?.length) {
					setResult(prev => ({ ...prev, total: json.length }))
					initiateIntervalImporting(json, response.data)
				} else {
					setFlags({ loading: false })
					const callback = ({ skipped, reimported }) => {
						setExistingInvoicesState(null)
						if (skipped?.length > 0) json = json.filter(i => !skipped?.includes(i.dms_invoice_number))
						setResult(prev => ({ ...prev, total: json.length, skipped, reimported }))
						initiateIntervalImporting(json, response.data)
					}

					setExistingInvoicesState({
						list: response.data?.existing_invoice_orders,
						callback
					})
				}
			} catch (error) {
				console.log(error)
				setFlags({})
			}
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [file])

	return (
		<>
			{result.total === 0 && existingInvoicesState === null ? null : flags?.loading ? (
				<div id="spinner-overlay-wrapper" style={{ background: "#00000062", zIndex: 1000 }}>
					<span
						className="loader small"
						style={{
							borderColor: "var(--mainColor)",
							borderBottomColor: "transparent",
							margin: "auto",
							display: "block"
						}}
					/>
				</div>
			) : (
				<div
					id="import-invoices"
					className="overlay"
					style={{ position: "fixed", top: 0, left: 0, zIndex: 9999999 }}
				>
					<div className="modal" style={{ height: "fit-content", width: "75vw", padding: 0 }}>
						<div className="heading relative" style={{ padding: ".75rem 0" }}>
							<span>
								<b>Interval Importing Invoice</b>
							</span>
							{result.total === result.count || existingInvoicesState !== null ? (
								<button id="close-btn" onClick={onClose}>
									<IoIosClose />
								</button>
							) : null}
						</div>
						<div style={{ padding: "0 1.25rem 1.25rem" }}>
							{existingInvoicesState !== null ? (
								<InvoiceSelection
									ordersData={existingInvoicesState?.list}
									onComplete={value => existingInvoicesState?.callback(value)}
								/>
							) : (
								<>
									<div style={{ margin: "16px 0 8px", fontSize: "1rem" }}>
										<span>
											<b>
												Processed {result.count} invoices out of {result.total}
											</b>
										</span>
									</div>
									<div
										style={{
											height: "5px",
											width: "100%",
											background: "#e2e2e2",
											borderRadius: "5px",
											overflow: "hidden"
										}}
									>
										<div
											style={{
												background: "var(--main)",
												height: "100%",
												width: (result.count / result.total) * 100 + "%"
											}}
										/>
									</div>
									<div style={{ margin: "8px 0 18px", fontSize: "1rem" }}>
										{flags?.posting ? (
											<div className="flex" style={{ width: "fit-content", gap: "8px" }}>
												<span
													className="loader"
													style={{
														width: "1rem",
														height: "1rem",
														borderWidth: "3px",
														borderColor: "var(--mainColor)",
														borderBottomColor: "transparent",
														margin: "auto",
														display: "block"
													}}
												/>
												<span>posting...</span>
											</div>
										) : result?.count < result?.total ? (
											<span>
												Next order will be created in{" "}
												<span style={{ background: "#e2e2e2", borderRadius: "0 5px", padding: "0 4px" }}>
													<b>00:{timer.toString().padStart(2, "0")}</b>
												</span>
											</span>
										) : null}
									</div>
									<ResultStatusTabs result={result} />
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	)
}

const InvoiceSelection = ({ ordersData, onComplete }) => {
	const [orders, setOrders] = useState([])
	const [selection, setSelection] = useState([])
	const [skip, setSkip] = useState([])
	const [reImport, setReImport] = useState([])
	const [copied, setCopied] = useState()

	useEffect(() => {
		if (ordersData?.length > 0) setOrders(ordersData)
	}, [ordersData])

	const handleInsertion = type => {
		if (selection.length === orders.length)
			return onComplete({
				skipped: skip?.concat(type === 1 ? selection : []),
				reimported: reImport?.concat(type === 2 ? selection : [])
			})

		setOrders(prev => prev.filter(i => !selection.includes(i.dms_invoice_number)))
		if (type === 1) setSkip(prev => prev.concat(selection))
		else if (type === 2) setReImport(prev => prev.concat(selection))
		setSelection([])
	}

	return (
		<div id="invoice-selection-wrapper">
			<div>
				<div>
					<span id="heading" style={{ display: "block" }}>
						<b>Existing DMS Invoice Numbers ({orders?.length})</b>
					</span>
					<span style={{ display: "block" }}>Selected: {selection.length}</span>
				</div>
				<div className="flex" style={{ gap: "10px" }}>
					<button className="theme-btn" onClick={() => handleInsertion(1)} disabled={!selection?.length}>
						Skip Selected
					</button>
					<button className="theme-btn" onClick={() => handleInsertion(2)} disabled={!selection?.length}>
						Re-Import Selected
					</button>
				</div>
			</div>

			<div id="orders-table">
				<table style={{ width: "100%", textAlign: "left" }}>
					<thead style={{ position: "sticky", top: 0, background: "white", zIndex: 1 }}>
						<tr>
							<th>
								<input
									type="checkbox"
									style={{ marginRight: "5px" }}
									checked={selection.length === orders.length}
									onChange={e =>
										e.target.checked ? setSelection(orders.map(i => i.dms_invoice_number)) : setSelection([])
									}
								/>
							</th>
							<th>DMS invoice number</th>
							<th>Order UUID</th>
						</tr>
					</thead>
					<tbody>
						{orders?.map(i => (
							<tr
								key={i.dms_invoice_number}
								style={{ cursor: "pointer" }}
								onClick={() =>
									setSelection(prev =>
										prev.includes(i.dms_invoice_number)
											? prev.filter(s => s !== i.dms_invoice_number)
											: prev.concat([i.dms_invoice_number])
									)
								}
							>
								<td>
									<input
										type="checkbox"
										checked={selection.includes(i.dms_invoice_number)}
										style={{ pointerEvents: "none" }}
									/>
								</td>
								<td>{i.dms_invoice_number}</td>
								<td>
									<div style={{ position: "relative", display: "inline" }}>
										{copied === i.dms_invoice_number && (
											<div style={{ position: "absolute", top: "100%" }}>
												<div id="talkbubble" style={{ fontSize: "12px", left: "-2px" }}>
													COPIED!
												</div>
											</div>
										)}
										<ContentCopy
											style={{ width: "1.15rem", height: "1.15rem", marginRight: "8px", opacity: ".9" }}
											onClick={e => {
												e.preventDefault()
												e.stopPropagation()
												setCopied(i.dms_invoice_number)
												navigator?.clipboard?.writeText?.(i.order_uuid)
												setTimeout(() => setCopied(""), 3000)
											}}
										/>
										{i.order_uuid}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

const tabs = [
	{ label: "Skipped", keyName: "skipped" },
	{ label: "Re-Imported", keyName: "reimported" },
	{ label: "Failed", keyName: "failed" },
	{ label: "Succeed", keyName: "succeed" }
]

const ResultStatusTabs = ({ result }) => {
	const [tab, setTab] = useState(null)
	return (
		<div id="tabs-container">
			{tabs.map((i, idx) => (
				<button
					key={"result-status:" + i.keyName}
					className={tab === idx ? "selected" : null}
					onClick={() => setTab(idx)}
					disabled={!result?.[i.keyName]?.length}
				>
					<b>{i.label}</b> ({result?.[i.keyName]?.length})
				</button>
			))}

			{tab !== null && (
				<div id="status-results">
					<ol>
						{result?.[tabs[tab].keyName]?.map((i, idx) => (
							<li key={`${tabs[tab].keyName}-${idx}`} style={{ padding: "5px 0" }}>
								{typeof i === "string" ? (
									i
								) : (
									<>
										<div>
											<span>
												<b>{i.dms_invoice_number}</b>
											</span>
										</div>
										{typeof i.message == "string" ? <p>{i.message}</p> : i.message?.map(m => <p>{m}</p>)}
									</>
								)}
							</li>
						))}
					</ol>
				</div>
			)}
		</div>
	)
}

export default ImportInvoices
