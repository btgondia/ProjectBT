import axios from "axios"
import React, { useState, useEffect, useMemo, useRef } from "react"
import Header from "../../components/Header"
import { OrderDetails } from "../../components/OrderDetails"
import Sidebar from "../../components/Sidebar"
import * as XLSX from "xlsx"
import * as FileSaver from "file-saver"
const fileExtension = ".xlsx"
const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"

const PendingReciptsEntry = () => {
	const [orders, setOrders] = useState([])
	const [itemsData, setItemsData] = useState([])
	const [page, setPage] = useState(1); // Added pagination state
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const observer = useRef();
	const [popupOrder, setPopupOrder] = useState(false)
	const [allDoneConfimation, setAllDoneConfimation] = useState(false)
	const [doneDisabled, setDoneDisabled] = useState(false)
	const [users, setUsers] = useState([])

	const [counters, setCounters] = useState([])
	const [selectedOrders, setSelectedOrders] = useState([])
	useEffect(() => {
		if (allDoneConfimation) {
			setDoneDisabled(true)
			setTimeout(() => setDoneDisabled(false), 5000)
		}
	}, [allDoneConfimation])
	const getUsers = async () => {
		const response = await axios({
			method: "get",
			url: "/users/GetUserList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("users", response)
		if (response.data.success) setUsers(response.data.result)
	}

	useEffect(() => {
		getUsers()
	}, [])
	const getOrders = async (page = 1) => {
		setLoading(true);
		const response = await axios.get(`/receipts/getPendingEntry?page=${page}&limit=300`);
		if (response.data.success) {
		  setOrders((prevOrders) => [...prevOrders, ...response.data.result]);
		  if (response.data.result.length < 300) {
			setHasMore(false); // No more data if less than limit is returned
		  }
		}
		setLoading(false);
	  };
	const orderList = useMemo(
		() =>
			orders.map(a => ({
				...a,
				...counters.find(b => b.counter_uuid === a.counter_uuid),
				user_title: users.find(b => a.user_uuid === b.user_uuid)?.user_title,
				status: a.status,
			})),
		[counters, orders, users]
	)
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
		getCounter()
	}, [])
	useEffect(() => {
		getOrders(page);
	  }, [page]);
	const putOrder = async receipt_number => {
		const response = await axios({
			method: "put",
			url: "/receipts/putCompleteOrder",
			data: { entry: 1, receipt_number },
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setOrders(prev => prev.filter(a => a.receipt_number !== receipt_number))
			return
		}
	}
	const downloadHandler = async () => {
		let sheetData = []
		// console.log(sheetData)
		for (let order of selectedOrders?.sort((a, b) => +a.receipt_number - +b.receipt_number)) {
			sheetData.push({
				Amount: order.modes.map(a => +a.amt).reduce((a, b) => a + b) || "0",
				Type: "Recipt",
				"Party Code": order?.counter_code,
				Date: "dd/mm/yy"
					.replace("mm", ("00" + (new Date(order.time)?.getMonth() + 1).toString()).slice(-2))
					.replace("yy", ("0000" + new Date(order.time)?.getFullYear().toString()).slice(-4))
					.replace("dd", ("00" + new Date(order.time)?.getDate().toString()).slice(-2)),
				Cash: order.modes.find(a => a.mode_uuid === "c67b54ba-d2b6-11ec-9d64-0242ac120002")?.amt || 0,
				Cheque: order.modes.find(a => a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002")?.amt || 0,
				UPI: order.modes.find(a => a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002")?.amt || 0,
				"REM 1": order.invoice_number,
				"REM 2": order.user_title,
				"Voucher No.": order.receipt_number,
			})
		}

		const ws = XLSX.utils.json_to_sheet(sheetData)
		const wb = { Sheets: { data: ws }, SheetNames: ["data"] }
		const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
		const data = new Blob([excelBuffer], { type: fileType })
		FileSaver.saveAs(data, "Recipts" + fileExtension)
		// setSelectedOrders([]);
	}
	const lastOrderElementRef = useRef();
	useEffect(() => {
		if (observer.current) observer.current.disconnect();
	
		observer.current = new IntersectionObserver((entries) => {
		  if (entries[0].isIntersecting && hasMore && !loading) {
			setPage((prevPage) => prevPage + 1);
		  }
		});
	
		if (lastOrderElementRef.current) {
		  observer.current.observe(lastOrderElementRef.current);
		}
	
		return () => {
		  if (observer.current) observer.current.disconnect();
		};
	  }, [hasMore, loading]);
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading" className="flex">
					<h2 style={{ width: "70%" }}>Pending Recipt Entry</h2>
					<button
						type="button"
						className="submit flex"
						style={{
							margin: "0",
							padding: "1px 10px",
							fontSize: "15px",
							height: "30px",
						}}
						onClick={() => setSelectedOrders(prev => (prev.length === orders.length ? [] : orderList))}>
						<input
							type="checkbox"
							checked={orders.length === selectedOrders.length}
							style={{ marginRight: "5px" }}
						/>
						Select All
					</button>
				</div>

				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={orderList}
						setPopupOrder={setPopupOrder}
						putOrder={putOrder}
						selectedOrders={selectedOrders}
						setSelectedOrders={setSelectedOrders}
						getOrders={getOrders}
					/>
				</div>
				{selectedOrders.length ? (
					<div className="flex" style={{ justifyContent: "start" }}>
						<button
							className="theme-btn"
							onClick={() => {
								setAllDoneConfimation(true)
							}}
							style={{ margin: "20px" }}>
							All Done
						</button>
						<button
							className="theme-btn"
							onClick={e => {
								e.stopPropagation()
								let countersCodes = selectedOrders
									.filter(a => !a.counter_code)
									.filter(
										(value, index, self) =>
											index === self.findIndex(t => t.counter_uuid === value.counter_uuid)
									)

								downloadHandler()
							}}
							style={{ margin: "20px" }}>
							Excel
						</button>
					</div>
				) : (
					""
				)}
			</div>
			{popupOrder ? (
				<OrderDetails
					onSave={() => {
						setPopupOrder(null)
					
					}}
					setOrders={setOrders}
					order_uuid={popupOrder.order_uuid}
					orderStatus="edit"
				/>
			) : (
				""
			)}

			{allDoneConfimation ? (
				<div className="overlay">
					<div className="modal" style={{ height: "max-content", width: "350px" }}>
						<div
							className="content"
							style={{
								height: "fit-content",
								padding: "20px",
								width: "100%",
							}}>
							<div style={{ overflowY: "scroll" }}>
								<form
									className="form"
									onSubmit={async e => {
										e.preventDefault()
										for (let a of selectedOrders) {
											await putOrder(a.receipt_number)
										}
										setAllDoneConfimation(false)
									}}>
									<div className="row">
										<h1>Confirm Done</h1>
									</div>
									<div className="flex" style={{ justifyContent: "space-between", width: "100%" }}>
										<button
											type="submit"
											disabled={doneDisabled}
											className="submit"
											style={doneDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
											Confirm
										</button>
										<button
											onClick={() => setAllDoneConfimation(false)}
											type="button"
											className="submit">
											Cancel
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			) : (
				""
			)}
		</>
	)
}

function Table({ itemsDetails, setPopupOrder, putOrder, selectedOrders, setSelectedOrders, getOrders }) {
	console.log(selectedOrders)
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>Amount</th>
					<th colSpan={2}>Type</th>
					<th colSpan={2}>Party Code</th>
					<th colSpan={2}>Date</th>
					<th colSpan={2}>Cash</th>
					<th colSpan={2}>Cheque</th>
					<th colSpan={2}>UPI</th>
					<th colSpan={2}>REM 1</th>
					<th colSpan={2}>REM 2</th>
					<th colSpan={2}>Voucher No.</th>
					<th colSpan={2}>Action</th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					?.sort((a, b) => +a.receipt_number - +b.receipt_number)
					?.map((item, i, array) => (
						<tr key={Math.random()} style={{ height: "30px" }}>
							<td
								onClick={e => {
									e.stopPropagation()
									setSelectedOrders(prev =>
										prev.filter(a => a.receipt_number === item.receipt_number).length
											? prev.filter(a => a.receipt_number !== item.receipt_number)
											: [...(prev || []), item]
									)
								}}
								className="flex"
								style={{ justifyContent: "space-between" }}>
								<input
									type="checkbox"
									checked={selectedOrders.find(a => a.receipt_number === item.receipt_number)}
									style={{ transform: "scale(1.3)" }}
								/>
								{i + 1}
							</td>

							<td colSpan={2}>{item.modes.map(a => +a.amt).reduce((a, b) => a + b) || "0"}</td>
							<td colSpan={2}>Recipt</td>
							<td colSpan={2}>{item.counter_code || ""}</td>
							<td colSpan={2}>
								{"dd/mm/yy"
									.replace("mm", ("00" + (new Date(item.time)?.getMonth() + 1).toString()).slice(-2))
									.replace("yy", ("0000" + new Date(item.time)?.getFullYear().toString()).slice(-4))
									.replace("dd", ("00" + new Date(item.time)?.getDate().toString()).slice(-2))}
							</td>
							<td colSpan={2}>
								{item.modes.find(a => a.mode_uuid === "c67b54ba-d2b6-11ec-9d64-0242ac120002")?.amt || 0}
							</td>
							<td colSpan={2}>
								{item.modes.find(a => a.mode_uuid === "c67b5794-d2b6-11ec-9d64-0242ac120002")?.amt || 0}
							</td>
							<td colSpan={2}>
								{item.modes.find(a => a.mode_uuid === "c67b5988-d2b6-11ec-9d64-0242ac120002")?.amt || 0}
							</td>
							<td colSpan={2}>N{item.invoice_number || ""}</td>
							<td colSpan={2}>{item.user_title || ""}</td>
							<td colSpan={2}>{item.receipt_number || ""}</td>
							<td colSpan={2}>
								<button
									className="theme-btn"
									onClick={async e => {
										e.stopPropagation()
										await putOrder(item.receipt_number)
									}}>
									Done
								</button>
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}

export default PendingReciptsEntry
