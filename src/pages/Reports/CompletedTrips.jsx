import axios from "axios"
import React, { useEffect, useState, useRef, useCallback } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import TripPage from "../../components/TripPage"
import { useReactToPrint } from "react-to-print"
import PopupTripOrderTable from "../../components/PopupTripOrderTable"
let date = new Date()
const CompletedTrips = () => {
	const [searchData, setSearchData] = useState({
		startDate: "",
		endDate: "",
		user_uuid: "",
	})
	const [users, setUsers] = useState([])
	const [items, setItems] = useState([])
	const [detailsPopup, setDetailsPopup] = useState(false)
	const componentRef = useRef(null)
	const [statementTrip, setStatementTrip] = useState()
	const reactToPrintContent = useCallback(() => {
		return componentRef.current
	}, [statementTrip])

	const handlePrint = useReactToPrint({
		content: reactToPrintContent,
		documentTitle: "Statement",
		removeAfterPrint: true,
	})
	const getTripData = async trip_uuid => {
		const response = await axios({
			method: "get",
			url: "/trips/GetTripSummaryDetails/" + trip_uuid,
			headers: {
				"Content-Type": "application/json",
			},
		})
		console.log("users", response)
		if (response.data.success) setStatementTrip(response.data.result)
	}
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
	function formatAMPM(date) {
		var hours = date.getHours()
		var minutes = date.getMinutes()
		var ampm = hours >= 12 ? "pm" : "am"
		hours = hours % 12
		hours = hours ? hours : 12 // the hour '0' should be '12'
		minutes = minutes < 10 ? "0" + minutes : minutes
		var strTime = date.toDateString() + " - " + hours + ":" + minutes + " " + ampm
		return strTime
	}
	console.log(searchData)
	const getActivityData = async () => {
		let startDate = new Date(searchData.startDate + " 00:00:00 AM")
		startDate = startDate.getTime()
		let endDate = new Date(searchData.endDate + " 00:00:00 AM")
		endDate = endDate.getTime()

		const response = await axios({
			method: "post",
			url: "/trips/GetCompletedTripList",
			data: { user_uuid: searchData.user_uuid, startDate, endDate },
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
		setSearchData(prev => ({
			...prev,
			startDate: curTime,
			endDate: curTime,
		}))
		getUsers()
	}, [])

	console.log(searchData)
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Completed Trips </h2>
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
							max={"yy-mm-dd"
								.replace("mm", ("00" + (date?.getMonth() + 1).toString()).slice(-2))
								.replace("yy", ("0000" + date?.getFullYear().toString()).slice(-4))
								.replace("dd", ("00" + date?.getDate().toString()).slice(-2))}
							value={searchData.startDate}
							placeholder="Search Counter Title..."
							className="searchInput"
						/>
						<input
							type="date"
							onChange={e => setSearchData(prev => ({ ...prev, endDate: e.target.value }))}
							max={"yy-mm-dd"
								.replace("mm", ("00" + (date?.getMonth() + 1).toString()).slice(-2))
								.replace("yy", ("0000" + date?.getFullYear().toString()).slice(-4))
								.replace("dd", ("00" + date?.getDate().toString()).slice(-2))}
							value={searchData.endDate}
							placeholder="Search Route Title..."
							className="searchInput"
						/>
						<select
							className="searchInput"
							onChange={e =>
								setSearchData(prev => ({
									...prev,
									user_uuid: e.target.value,
								}))
							}
							value={searchData.user_uuid}>
							<option value="">All</option>
							{users
								.filter(a => a.user_uuid)
								.map(a => (
									<option value={a.user_uuid}>{a.user_title}</option>
								))}
						</select>

						<button className="theme-btn" onClick={() => getActivityData()}>
							Search
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={items}
						handlePrint={handlePrint}
						getTripData={getTripData}
						setDetailsPopup={setDetailsPopup}
					/>
				</div>
			</div>
			<div style={{ position: "fixed", top: -100, left: -180, zIndex: "-1000" }}>
				<div
					ref={componentRef}
					style={{
						width: "21cm",
						height: "29.7cm",
						// margin: "30mm 45mm 30mm 45mm",
						textAlign: "center",

						// padding: "100px",
					}}>
					<TripPage
						ref={componentRef}
						trip_title={statementTrip?.trip_title || ""}
						users={statementTrip?.users.map(a => users.find(b => b.user_uuid === a)) || []}
						trip_uuid={statementTrip?.trip_uuid || ""}
						created_at={formatAMPM(new Date(statementTrip?.created_at || ""))}
						amt={statementTrip?.amt || 0}
						coin={statementTrip?.coin || 0}
						cash={statementTrip?.cash || 0}
						formatAMPM={formatAMPM}
						cheque={statementTrip?.cheque}
						replacement={statementTrip?.replacement}
						sales_return={statementTrip?.sales_return}
						unpaid_invoice={statementTrip?.unpaid_invoice}
					/>
				</div>
			</div>
			{detailsPopup ? <PopupTripOrderTable trip_uuid={detailsPopup} onSave={() => setDetailsPopup("")} /> : ""}
		</>
	)
}

export default CompletedTrips

function Table({ itemsDetails, getTripData, handlePrint, setDetailsPopup }) {
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
					<th colSpan={2}>Created At</th>
					<th colSpan={3}>Trip Title</th>
					<th colSpan={2}>Users</th>
					<th colSpan={2}>Orders</th>
					<th colSpan={4}>Actions</th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					?.sort((a, b) => a.created_at - b.created_at)
					?.map((item, i, array) => (
						<tr key={Math.random()} style={{ height: "30px" }}>
							<td>{i + 1}</td>
							<td colSpan={2}>
								{new Date(item.created_at).toDateString()} - {formatAMPM(new Date(item.created_at))}
							</td>
							<td colSpan={3}>{item.trip_title || ""}</td>
							<td colSpan={2}>
								{item.users.length
									? item.users.map((b, index) => (index !== 0 ? ", " + b.user_title : b.user_title))
									: ""}
							</td>
							<td colSpan={2}>{item.orderLength || ""}</td>
							<td className="ph3 bb b--black-20 tc bg-white" style={{ textAlign: "center" }} colSpan={2}>
								<button
									className="theme-btn"
									style={{
										display: "inline",
										cursor: "pointer",
									}}
									type="button"
									onClick={async e => {
										e.stopPropagation()
										await getTripData(item.trip_uuid)
										setTimeout(handlePrint, 2000)
									}}>
									Statement
								</button>
							</td>
							<td className="ph3 bb b--black-20 tc bg-white" style={{ textAlign: "center" }} colSpan={2}>
								<button
									className="theme-btn"
									style={{
										display: "inline",
										cursor: "pointer",
									}}
									type="button"
									onClick={async e => {
										e.stopPropagation()
										setDetailsPopup(item.trip_uuid)
									}}>
									Details
								</button>
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
