import axios from "axios"
import React, { useState } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import { TiArrowSortedUp, TiArrowSortedDown, TiArrowUnsorted } from "react-icons/ti"
const today = new Date().getTime()

const formatDate = _date => {
	const date = new Date(_date)
	return [
		date?.getFullYear().toString().padStart(4, "0"),
		(date?.getMonth() + 1).toString().padStart(2, "0"),
		date?.getDate().toString().padStart(2, "0")
	].join("-")
}

const PerformanceSummary = () => {
	const [data, setData] = useState()
	const [dateValues, setDateValues] = useState({ from_date: today, to_date: today })

	const search = async () => {
		const query = `?from_date=${dateValues?.from_date}&to_date=${dateValues?.to_date}`
		const response = await axios("users/performance-summary" + query)
		if (response.status === 200) {
			const total_values = {}
			for (const user_orders of Object.values(response.data)) {
				for (const order_stage in user_orders) {
					total_values[order_stage] = {
						count: (total_values[order_stage]?.count || 0) + user_orders[order_stage].count,
						amount: (total_values[order_stage]?.amount || 0) + user_orders[order_stage].amount
					}
				}
			}

			setData({
				table_data: response.data,
				total_values
			})
		}
	}

	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Performance Summary</h2>
				</div>
				<div id="item-sales-top">
					<div
						id="date-input-container"
						style={{
							overflow: "visible",
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-start",
							width: "100%",
							gap: "20px"
						}}
					>
						<input
							type="date"
							onChange={e => setDateValues(prev => ({ ...prev, from_date: e.target.valueAsNumber }))}
							max={formatDate(today)}
							value={formatDate(dateValues.from_date)}
							className="searchInput"
							style={{ width: "250px" }}
						/>
						<input
							type="date"
							onChange={e => setDateValues(prev => ({ ...prev, to_date: e.target.valueAsNumber }))}
							max={formatDate(today)}
							value={formatDate(dateValues.to_date)}
							className="searchInput"
							style={{ width: "250px" }}
						/>
						<button style={{ width: "100px", justifyContent: "center" }} className="theme-btn" onClick={search}>
							Search
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table data={data?.table_data} total={data?.total_values} />
				</div>
			</div>
		</>
	)
}

function Table({ data = {}, total }) {
	const columns = ["Placed", "Processed", "Checked", "Delivered", "Completed"]
	const [sortingState, setSortingState] = useState({})

	const sortData = keys => {
		const sortTarget = sortingState?.sort_target?.toLowerCase()
		const sortMethod = sortingState[sortingState?.sort_target]
		const sortedData = keys?.sort(
			(a, b) =>
				(sortTarget === "user"
					? data[a]?.user_title?.localeCompare(data[b]?.user_title)
					: (data[a]?.[sortTarget]?.amount || 0) - (data[b]?.[sortTarget]?.amount || 0)) * sortMethod
		)
		return sortedData
	}

	function formatIndianCurrency(number) {
		const indianNumberFormat = new Intl.NumberFormat("en-IN")
		return indianNumberFormat.format(number)
	}

	return (
		<table className="user-table performance-summary-table">
			<thead>
				<tr>
					{["User"].concat(columns)?.map(i => (
						<th
							colSpan={i === "User" ? 2 : 1}
							onClick={() => setSortingState(prev => ({ ...prev, [i]: (prev[i] || 1) * -1, sort_target: i }))}
						>
							<div>
								<span>{i}</span>
								{sortingState?.[i] === 1 ? (
									<TiArrowSortedUp />
								) : sortingState?.[i] === -1 ? (
									<TiArrowSortedDown />
								) : (
									<TiArrowUnsorted />
								)}
							</div>
						</th>
					))}
				</tr>
			</thead>
			<tbody className="tbody">
				{sortData(Object.keys(data))?.map(key => (
					<tr key={key} style={{ height: "30px" }}>
						<td colSpan={2}>{data[key]?.user_title}</td>
						{columns?.map(i => (
							<td>
								<div>
									<span>
										<b>₹{formatIndianCurrency(data[key]?.[i?.toLowerCase()]?.amount || 0)}</b>
									</span>
									<span>{data[key]?.[i?.toLowerCase()]?.count || 0}</span>
								</div>
							</td>
						))}
					</tr>
				))}
				<tr
					style={{
						height: "30px",
						position: "sticky",
						bottom: 0,
						background: "#ffffff",
						boxShadow: "0px 0px 25px -15px black"
					}}
				>
					<td colSpan={2}>
						<b>TOTAL: </b>
					</td>
					{columns?.map(i => (
						<td>
							<div>
								<span>
									<b>₹{formatIndianCurrency(total?.[i?.toLowerCase()]?.amount || 0)}</b>
								</span>
								<span>{total?.[i?.toLowerCase()]?.count || 0}</span>
							</div>
						</td>
					))}
				</tr>
			</tbody>
		</table>
	)
}

export default PerformanceSummary
