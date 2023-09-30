import React from "react"

const TransactionsStatement = ({ cash_register, data }) => {
	const getDate = value => new Date(value)?.toLocaleString()
	return (
		<>
			<table style={{ width: "100%", margin: "10px" }}>
				<tr style={{ width: "100%" }}>
					<td
						colSpan={2}
						style={{
							width: "100%",
							fontSize: "xx-large",
							fontWeight: "bolder"
						}}
					>
						Cash Register Details
					</td>
				</tr>
				<tr>
					<td style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}></td>
					<td></td>
				</tr>
				<tr>
					<td style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}>
						Cash Register UUID : {cash_register?.register_uuid}
					</td>
					<td></td>
				</tr>
				<tr>
					<td style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}>
						Cash Register Created At : {getDate(cash_register?.created_at)}
					</td>
					<td></td>
				</tr>
				<tr>
					<td style={{ fontWeight: "600", fontSize: "small", textAlign: "left" }}>
						Statement Printed At : {getDate(Date.now())}
					</td>
					<td></td>
				</tr>
				<tr>
					<td style={{ paddingTop: "10px", fontWeight: "600", fontSize: "small", textAlign: "left" }}>
						<b>Grand Total : {data?.grand_total}</b>
					</td>
				</tr>
			</table>
			<table style={{ margin: "10px", width: "calc(100% - 18px)" }}>
				<tr>
					<td
						style={{
							fontWeight: "600",
							fontSize: "small",
							textAlign: "left"
						}}
					>
						Transactions:
					</td>
				</tr>
				<tr>
					<th style={{ border: "1px solid #000" }}>Created At</th>
					<th style={{ border: "1px solid #000" }}>Amount</th>
					<th style={{ border: "1px solid #000" }}>Invoice Number</th>
				</tr>
				{data?.transactions?.map(i => (
					<tr>
						<td style={{ border: "1px solid #000" }}>{getDate(+i.created_at)}</td>
						<td style={{ border: "1px solid #000", textAlign: "right" }}>Rs.{i.amount}</td>
						<td style={{ border: "1px solid #000", textAlign: "right" }}>{i.invoice_number}</td>
					</tr>
				))}
			</table>
		</>
	)
}

export default TransactionsStatement
