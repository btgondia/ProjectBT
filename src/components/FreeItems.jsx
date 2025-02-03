import React, { useEffect, useState } from "react"

const FreeItems = ({ close, updateOrder, orders, itemsData }) => {
	const [items, setItems] = useState([])
	useEffect(() => {
		setItems(
			itemsData
				.filter(a => a.free_issue === "Y" && a.status)
				.map(a => {
					let itemData = orders?.item_details?.find(b => b.item_uuid === a.item_uuid)
					if (itemData) {
						return { ...a, ...itemData }
					} else {
						return a
					}
				})
		)
	}, [itemsData, orders?.item_details])

	const postOrderData = async () => {
		const freeItems = items.filter(a => a.free)
		const item_details = []

		for (const orderItem of orders?.item_details) {
			const freeItem = freeItems.find(b => b.item_uuid === orderItem.item_uuid)
			item_details.push(freeItem ? { ...orderItem, free: freeItem.free } : orderItem)
		}

		const newFreeItems = freeItems
			.filter(i => !orders?.item_details?.some(o => o.item_uuid === i.item_uuid))
			.map(i => ({
				b: 0,
				p: 0,
				free: i.free,
				uuid: i.item_uuid,
				default: true
			}))

		updateOrder({ item_details, newFreeItems })
	}

	return (
		<div className="overlay" style={{ zIndex: 999999999 }}>
			<div
				className="modal"
				style={{
					height: "fit-content",
					width: "max-content",
					minWidth: "250px"
				}}
			>
				<h1>Free Items</h1>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll", width: "100%" }}>
						{items.length ? (
							<div className="flex" style={{ flexDirection: "column", width: "100%" }}>
								<table
									className="user-table"
									style={{
										width: "100%",
										height: "fit-content"
									}}
								>
									<thead>
										<tr>
											<th colSpan={3}>
												<div className="t-head-element">Item</div>
											</th>
											<th colSpan={2}>
												<div className="t-head-element">Qty</div>
											</th>
										</tr>
									</thead>
									<tbody className="tbody">
										{items?.map((item, i) => (
											<tr
												key={item?.item_uuid || Math.random()}
												style={{
													height: "30px"
												}}
											>
												<td colSpan={3}>{item.item_title}</td>
												<td colSpan={2}>
													<input
														type="number"
														onWheel={e => e.target.blur()}
														name="route_title"
														className="numberInput"
														value={item?.free || ""}
														style={{
															width: "100px",
															backgroundColor: "transparent",
															color: "#000"
														}}
														onChange={e =>
															setItems(prev =>
																prev.map(a =>
																	a.item_uuid === item.item_uuid
																		? { ...a, free: e.target.value }
																		: a
																)
															)
														}
														maxLength={42}
													/>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="flex" style={{ flexDirection: "column", width: "100%" }}>
								<i>No Data Present</i>
							</div>
						)}

						{items.filter(a => a.free).length ? (
							<div className="flex" style={{ justifyContent: "space-between" }}>
								{/* <button
                      type="button"
                      style={{ backgroundColor: "red" }}
                      className="submit"
                      onClick={onSave}
                    >
                      Cancel
                    </button> */}
								<button type="button" className="submit" onClick={postOrderData}>
									Save
								</button>
							</div>
						) : (
							""
						)}
					</div>
					<button onClick={close} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}

export default FreeItems
