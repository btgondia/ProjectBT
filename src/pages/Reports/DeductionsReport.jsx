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

const DeductionsReport = () => {
	const [data, setData] = useState()
	const [dateValues, setDateValues] = useState({ from_date: today, to_date: today })

	const search = async () => {
		const query = `?from_date=${dateValues?.from_date}&to_date=${dateValues?.to_date}`
		const response = await axios("orders/deductions-report" + query)
		if (response.status === 200) {
			const total_values = {}
			for (const doc of response.data) {
				total_values.adjustment = (total_values?.adjustment || 0) + (doc?.adjustment || 0)
				total_values.shortage = (total_values?.shortage || 0) + (doc?.shorindtage || 0)
				total_values.replacement = (total_values?.replacement || 0) + (doc?.replacement || 0)
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
					<h2>Deductions Report</h2>
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

function Table({ data, total }) {
	const columns = ["Counter Title", "Invoice Number", "Replacement", "Shortage", "Adjustment"]?.map(i => ({
		label: i,
		key: i?.toLowerCase()?.replace(/ /g, "_")
	}))
	const [sortingState, setSortingState] = useState({})

	const sortData = content => {
		const target = sortingState?.sort_target
		const method = sortingState?.[sortingState?.sort_target]
		const targetType = target === columns?.[0]?.key ? "string" : "number"
		return targetType === "string"
			? content?.sort((a, b) => (method > 0 ? a : b)?.[target]?.localeCompare((method > 0 ? b : a)?.[target]))
			: content?.sort((a, b) => ((a?.[target] || 0) - (b?.[target] || 0)) * method)
	}

	function formatIndianCurrency(number) {
		const indianNumberFormat = new Intl.NumberFormat("en-IN")
		return indianNumberFormat.format(number)
	}

	return (
		<table className="user-table performance-summary-table">
			<thead>
				<tr>
					{columns?.map((i, idx) => (
						<th
							key={i?.key + idx}
							colSpan={idx === 0 ? 2 : 1}
							onClick={() =>
								setSortingState(prev => ({
									...prev,
									[i?.key]: (prev[i?.key] || 1) * -1,
									sort_target: i?.key
								}))
							}
						>
							<div>
								<span>{i?.label}</span>
								{sortingState?.[i?.key] === 1 ? (
									<TiArrowSortedDown />
								) : sortingState?.[i?.key] === -1 ? (
									<TiArrowSortedUp />
								) : (
									<TiArrowUnsorted />
								)}
							</div>
						</th>
					))}
				</tr>
			</thead>
			<tbody className="tbody">
				{sortData(data)?.map(doc => (
					<tr key={doc?.order_uuid} style={{ height: "30px" }}>
						{columns?.map((i, idx) =>
							idx < 2 ? (
								<td key={doc?.order_uuid + i?.key} colSpan={idx === 0 ? 2 : 1}>
									{doc?.[i?.key] || <small style={{ opacity: ".45", fontWeight: "600" }}>N/A</small>}
								</td>
							) : (
								<td key={doc?.order_uuid + i?.key}>
									<b>₹{formatIndianCurrency(doc?.[i?.key] || 0)}</b>
								</td>
							)
						)}
					</tr>
				))}
				<tr
					style={{
						height: "30px",
						position: "sticky",
						bottom: 0,
						background: "#ffffff",
						width: "calc(100vw - 100px)"
					}}
				>
					<td colSpan={3}>
						<b>TOTAL: </b>
					</td>
					{columns?.slice(2)?.map(i => (
						<td key={i?.key + "-TOTAL"}>
							<b>₹{formatIndianCurrency(total?.[i?.key] || 0)}</b>
						</td>
					))}
				</tr>
			</tbody>
		</table>
	)
}

export default DeductionsReport
