import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { IoArrowBackOutline } from "react-icons/io5"
import { AiOutlineReload } from "react-icons/ai"
import CloseIcon from "@mui/icons-material/Close"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import axios from "axios"
import { AiOutlineSearch } from "react-icons/ai"

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import { openDB } from "idb"

const StockTransfer = () => {
	const Navigate = useNavigate()
	const [itemsData, setItemsData] = useState([])
	const [warehouse, setWarehouse] = useState([])
	const [holdPopup, setHoldPopup] = useState(false)
	const [items, setItems] = useState([])
	const [itemCategories, setItemsCategory] = useState([])
	const getIndexedDbData = async () => {
		const db = await openDB("BT", +localStorage.getItem("IDBVersion") || 1)
		let tx = db.transaction("items", "readwrite").objectStore("items")
		let item = await tx.getAll()
		setItems(item)
		let store = db.transaction("item_category", "readwrite").objectStore("item_category")
		let route = await store.getAll()
		setItemsCategory(route)
		db.close()
	}
	const GetWarehouseList = async () => {
		const response = await axios({
			method: "get",
			url: "/warehouse/GetWarehouseList",

			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setWarehouse(response.data.result)
	}
	const getItemsData = async () => {
		const response = await axios({
			method: "get",
			url: "/vouchers/GetPendingVoucharsList",
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setItemsData(response.data.result)
		else setItemsData([])
	}
	const filterItems = useMemo(
		() =>
			itemsData.map(a => {
				let itemsDetails = a.item_details
				let qty =
					itemsDetails.length > 1
						? itemsDetails.reduce((c, d) => ({
								b: +c.b + +d.b,
								p: +c.p + +d.p
						  }))
						: itemsDetails.length
						? itemsDetails[0]
						: { b: 0, p: 0 }
				return {
					...a,
					type: a.type === "ST" ? "Stock Transfer" : "Adjustment",
					qty,

					from_warehouse_title:
						+a.from_warehouse === 0
							? "None"
							: warehouse.find(b => b.warehouse_uuid === a.from_warehouse)?.warehouse_title || "-",
					to_warehouse_title:
						+a.to_warehouse === 0
							? "None"
							: warehouse.find(b => b.warehouse_uuid === a.to_warehouse)?.warehouse_title || "-"
				}
			}),
		[itemsData, warehouse]
	)

	useEffect(() => {
		getIndexedDbData()
		getItemsData()
		GetWarehouseList()
	}, [])

	return (
		<>
			<div className="servicePage">
				<nav className="user_nav nav_styling" style={{ top: "0" }}>
					<div
						className="user_menubar flex"
						style={{
							width: "100%",
							justifyContent: "space-between",
							paddingRight: "5px"
						}}
					>
						<IoArrowBackOutline className="user_Back_icon" onClick={() => Navigate("/users")} />

						<h1 style={{ width: "80%", textAlign: "left", marginLeft: "40px" }}>Stock Transfer</h1>

						<AiOutlineReload
							className="user_Back_icon"
							onClick={() => {
								// getTripData();
							}}
						/>
					</div>
				</nav>

				<div
					className="table-container-user item-sales-container"
					style={{
						width: "100vw",
						overflow: "scroll",
						left: "0",
						top: "0",
						display: "flex",
						minHeight: "85vh"
					}}
				>
					<table
						className="user-table"
						style={{
							width: "max-content",
							height: "fit-content"
						}}
					>
						<thead>
							<tr>
								<th>S.N</th>

								<th colSpan={2}>
									<div className="t-head-element">Voucher Number</div>
								</th>
								<th colSpan={2}>
									<div className="t-head-element">Created At</div>
								</th>
								<th>
									<div className="t-head-element">From Warehouse</div>
								</th>
								<th>
									<div className="t-head-element">To Warehouse</div>
								</th>
								<th>
									<div className="t-head-element">Quantity</div>
								</th>
							</tr>
						</thead>
						<tbody className="tbody">
							{filterItems
								?.sort((a, b) => a.created_at - b.created_at)
								?.map((item, i) => (
									<tr
										onClick={e => {
											e.stopPropagation()
											setHoldPopup(item)
										}}
										key={item.vocher_number}
										style={{
											height: "30px",
											backgroundColor: "#fff"
										}}
									>
										<td>{i + 1}</td>
										<td colSpan={2}>{item.vocher_number}</td>
										<td colSpan={2}>{item?.created_at ? new Date(+item?.created_at).toLocaleDateString() : ""}</td>
										<td>{item.from_warehouse_title}</td>
										<td>{item.to_warehouse_title}</td>
										<td>
											{item.qty.b || 0}:{item.qty.p || 0}
										</td>
									</tr>
								))}
							<tr>
								<td style={{ height: "80px" }}></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
			{holdPopup ? (
				<HoldPopup
					onSave={() => {
						setHoldPopup(false)
						getItemsData()
					}}
					itemsData={items}
					orders={holdPopup}
					categories={itemCategories}
				/>
			) : (
				""
			)}
		</>
	)
}
function HoldPopup({ onSave, orders, itemsData, categories }) {
	const [items, setItems] = useState([])

	const [confirmPopup, setConfirmPopup] = useState(false)
	const [disabled, setDisabled] = useState(false)
	const audiosRef = useRef()
	const [popup, setPopup] = useState(false)

	const [filterItemTitle, setFilterItemTile] = useState("")

	useEffect(() => {
		let data = orders.item_details?.map((a, index) => {
			let itemDetails = itemsData?.find(b => b.item_uuid === a.item_uuid)
			return {
				...a,
				index,
				category_uuid: itemDetails?.category_uuid,
				item_title: itemDetails?.item_title,
				pronounce: itemDetails?.pronounce,
				mrp: itemDetails?.mrp,
				conversion: itemDetails?.conversion
			}
		})

		setItems(data)
	}, [categories, itemsData, orders.item_details])

	const postOrderData = async () => {
		const response = await axios({
			method: "put",
			url: "/vouchers/PutVoucher",
			data: {
				voucher_uuid: orders?.voucher_uuid,
				item_details: items.filter(a => +a.status !== 3)
			},
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) onSave()
	}

	
	return (
		<>
			<div className="overlay">
				<div
					className="modal"
					style={{
						height: "fit-content",
						width: "max-content",
						minWidth: "206px",
						padding: "10px",
						paddingTop: "40px"
					}}
				>
					<h1>Summary</h1>
					<div className="user_searchbar flex" style={{ width: "100%" }}>
						<AiOutlineSearch className="user_search_icon" />
						<input
							style={{ width: "100%" }}
							className="searchInput"
							type="text"
							placeholder="search"
							value={filterItemTitle}
							onChange={e => setFilterItemTile(e.target.value)}
							id="checking_summary_search"
						/>
						<CloseIcon
							className="user_cross_icon"
							onClick={() => {
								setFilterItemTile("")
								document.getElementById("checking_summary_search").focus()
							}}
						/>
					</div>
					<div
						className="content"
						style={{
							height: "fit-content",
							padding: "20px 0",
							width: "100%"
						}}
					>
						<div style={{ overflowY: "scroll", width: "100%" }}>
							{items.length ? (
								<div className="flex" style={{ flexDirection: "column", width: "max-content" }}>
									<table
										className="user-table"
										style={{
											width: "max-content",
											height: "fit-content"
										}}
									>
										<thead>
											<tr>
												<th></th>
												<th colSpan={3}>
													<div className="t-head-element">Item</div>
												</th>
												<th colSpan={2}>
													<div className="t-head-element">MRP</div>
												</th>
												<th colSpan={2}>
													<div className="t-head-element">Qty</div>
												</th>
												<th>
													<div className="t-head-element"></div>
												</th>
											</tr>
										</thead>
										<tbody className="tbody">
											{categories
												.filter(
													a =>
														items
															?.filter(
																b =>
																	a.category_uuid ===
																	itemsData?.find(c => b.item_uuid === c.item_uuid)?.category_uuid
															)
															?.filter(
																a =>
																	!filterItemTitle ||
																	a.item_title.toLocaleLowerCase().includes(filterItemTitle.toLocaleLowerCase())
															).length
												)

												.map(a => (
													<>
														<tr key={a.category_uuid}>
															<td colSpan={8}>{a.category_title}</td>
														</tr>
														{items
															?.filter(
																b =>
																	a.category_uuid ===
																		itemsData?.find(c => b.item_uuid === c.item_uuid)?.category_uuid &&
																	(!filterItemTitle ||
																		b.item_title.toLocaleLowerCase().includes(filterItemTitle.toLocaleLowerCase()))
															)
															.sort((a, b) => a?.item_title?.localeCompare(b?.item_title))
															.map((item, i) => (
																<tr
																	key={item?.item_uuid || Math.random()}
																	style={{
																		height: "30px",
																		fontSize: "12px",
																		color:
																			+item.status === 1
																				? "#fff"
																				: +item.status === 2
																				? "#000"
																				: +item.status === 3
																				? "#fff"
																				: "#000",
																		backgroundColor:
																			+item.status === 1
																				? "green"
																				: +item.status === 2
																				? "yellow"
																				: +item.status === 3
																				? "red"
																				: "#fff"
																	}}
																>
																	<td
																		style={{ padding: "5px" }}
																		onClick={e => {
																			e.stopPropagation()
																			setItems(prev =>
																				prev.map(a =>
																					a.item_uuid === item.item_uuid
																						? {
																								...a,
																								status: a.status !== 1 ? 1 : 0,
																								edit: true
																						  }
																						: a
																				)
																			)
																		}}
																	>
																		{+item.status !== 1 ? (
																			<CheckCircleOutlineIcon style={{ width: "15px" }} />
																		) : (
																			""
																		)}
																	</td>

																	<td colSpan={3}>{item.item_title}</td>
																	<td colSpan={2}>{item.mrp}</td>

																	<td
																		colSpan={2}
																		onClick={e => {
																			e.stopPropagation()
																			setPopup({
																				...item,
																				conversion:
																					+itemsData?.find(a => a?.item_uuid === item?.item_uuid)?.conversion || 1
																			})
																		}}
																	>
																		{item?.b || 0} : {(item?.p || 0) + (item?.free || 0)}
																	</td>
																	<td
																		style={{ width: "50px", padding: "0 2px" }}
																		onClick={() => {
																			setItems(prev =>
																				prev.map(a => (a.item_uuid === item.item_uuid ? { ...a, status: 3 } : a))
																			)
																		}}
																	>
																		<DeleteOutlineIcon />
																	</td>
																</tr>
															))}
													</>
												))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="flex" style={{ flexDirection: "column", width: "100%" }}>
									<i>No Data Present</i>
								</div>
							)}

							<div className="flex" style={{ justifyContent: "space-between" }}>
								<button
									type="button"
									className="submit"
									style={{ backgroundColor: "red" }}
									onClick={() => {
										setConfirmPopup(true)
										setDisabled(3)
										let ivlId = setInterval(() => setDisabled(i => i - 1), 1000)
										setTimeout(() => {
											clearInterval(ivlId)
											setDisabled(false)
										}, 3000)
									}}
								>
									Discard
								</button>

								<button type="button" className="submit" onClick={postOrderData}>
									Save
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* {popupForm ? (
          <CheckingItemInput
            onSave={() => setPopupForm(false)}
            setOrder={setItems}
            popupInfo={popupForm}
            setTempQuantity={setTempQuantity}
            items={items}
          />
        ) : (
          ""
        )} */}
			{confirmPopup ? (
				<div className="overlay" style={{ zIndex: "9999999999999" }}>
					<div
						className="modal"
						style={{
							height: "fit-content",
							width: "max-content",
							padding: "30px"
						}}
					>
						<h2 style={{ textAlign: "center" }}>Are you sure?</h2>
						<h2 style={{ textAlign: "center" }}>Changes will be discarded</h2>
						<div
							className="content"
							style={{
								height: "fit-content",
								padding: "20px"
							}}
						>
							<div style={{ overflowY: "scroll", width: "100%" }}>
								<form className="form">
									<div className="flex" style={{ justifyContent: "space-between", width: "100%" }}>
										<button
											type="submit"
											style={{
												minWidth: "128px",
												opacity: disabled ? "0.2" : "1",
												backgroundColor: "red"
											}}
											className="submit"
											onClick={() => {
												audiosRef.current?.[0] && audiosRef.current?.forEach(audio => audio.pause())
												audiosRef.current = null
												navigator.mediaSession.playbackState = "none"
												clearInterval(+sessionStorage.getItem("intervalId"))
												console.clear()
												onSave()
											}}
											disabled={disabled}
										>
											{disabled || "Continue"}
										</button>
										<button type="submit" className="submit" onClick={() => setConfirmPopup(false)}>
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
			{popup ? <QuantityChanged selectedItem={popup} setItems={setItems} close={() => setPopup("")} /> : ""}
		</>
	)
}

function QuantityChanged({ selectedItem, setItems, close }) {
	const [data, setdata] = useState({})

	useEffect(() => {
		setdata(selectedItem)
	}, [selectedItem])

	const submitHandler = async e => {
		e.preventDefault()
		setItems(prev =>
			prev.map(a =>
				a.item_uuid === selectedItem?.item_uuid
					? {
							...a,
							b: Math.floor((+data.b || 0) + (+data.p || 0) / selectedItem?.conversion) || 0,
							p: (+data.p || 0) % selectedItem?.conversion
					  }
					: a
			)
		)
		close()
	}

	return (
		<div className="overlay" style={{ zIndex: 999999999999 }}>
			<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content"
					}}
				>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="formGroup">
								<div className="row" style={{ flexDirection: "row", alignItems: "flex-start" }}>
									<label className="selectLabel flex" style={{ width: "100px" }}>
										Box
										<input
											type="number"
											name="route_title"
											className="numberInput"
											value={data?.b}
											style={{ width: "100px" }}
											onChange={e =>
												setdata({
													...data,
													b: e.target.value
												})
											}
											maxLength={42}
											onWheel={e => e.preventDefault()}
										/>
										{data.conversion || 0}
									</label>
									<label className="selectLabel flex" style={{ width: "100px" }}>
										Pcs
										<input
											type="number"
											name="route_title"
											className="numberInput"
											value={data?.p}
											style={{ width: "100px" }}
											onChange={e =>
												setdata({
													...data,
													p: e.target.value
												})
											}
											maxLength={42}
											onWheel={e => e.preventDefault()}
											autoFocus={true}
										/>
									</label>
								</div>
							</div>

							<button type="submit" className="submit">
								Save changes
							</button>
						</form>
					</div>
					<button onClick={close} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
export default StockTransfer
