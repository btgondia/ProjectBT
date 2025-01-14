import React, { useState, useEffect, useMemo } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
import { CopyAll, DeleteOutline } from "@mui/icons-material"
import axios from "axios"
const OrderForms = () => {
	const [itemsData, setItemsData] = useState([])

	const [companies, setCompanies] = useState([])
	const [popupForm, setPopupForm] = useState(false)
	const [counterPopup, setCounterPopup] = useState(false)
	const [deletePopup, setDeletePopup] = useState(false)
	const [filterTitle, setFilterTitle] = useState("")

	const getItemsData = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/orderForm/GetFormList",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setItemsData(response.data.result)
	}
	useEffect(() => {
		const controller = new AbortController()
		getItemsData(controller)
		return () => {
			controller.abort()
		}
	}, [popupForm])
	const filterItemsData = useMemo(
		() =>
			itemsData.filter(
				a => !filterTitle || (a.form_title || "").toLocaleLowerCase().includes(filterTitle.toLocaleLowerCase())
			) || [],
		[filterTitle, itemsData]
	)

	const getCompanies = async (controller = new AbortController()) => {
		const cachedData = localStorage.getItem('companiesData');
	  
		if (cachedData) {
		  setCompanies(JSON.parse(cachedData));
		} else {
		  try {
			const response = await axios({
			  method: "get",
			  url: "/companies/getCompanies",
			  signal: controller.signal,
			  headers: {
				"Content-Type": "application/json",
			  },
			});
	  
			if (response.data.success) {
			  localStorage.setItem('companiesData', JSON.stringify(response.data.result));
			  setCompanies(response.data.result);
			}
		  } catch (error) {
			
		  }
		}
	  };
	  
	useEffect(() => {
		const controller = new AbortController()
		getCompanies(controller)

		return () => {
			controller.abort(controller)
		}
	}, [])
	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Order Forms</h2>
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
							type="text"
							onChange={e => setFilterTitle(e.target.value)}
							value={filterTitle}
							placeholder="Search Form Title..."
							className="searchInput"
						/>

						<div>Total Form: {filterItemsData?.length}</div>

						<button className="theme-btn" onClick={() => setPopupForm(true)}>
							Add
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={filterItemsData}
						companies={companies}
						setPopupForm={setPopupForm}
						setDeletePopup={setDeletePopup}
						setCounterPopup={setCounterPopup}
					/>
				</div>
			</div>
			{popupForm ? (
				<NewUserForm
					onSave={() => setPopupForm(false)}
					setItemsData={setItemsData}
					companies={companies}
					popupInfo={popupForm}
					items={itemsData}
				/>
			) : (
				""
			)}
			{counterPopup ? <CounterTable onSave={() => setCounterPopup(false)} form_uuid={counterPopup} /> : ""}
			{deletePopup ? (
				<DeleteItemPopup
					onSave={() => setDeletePopup(false)}
					setItemsData={setItemsData}
					popupInfo={deletePopup}
				/>
			) : (
				""
			)}
		</>
	)
}

export default OrderForms
function Table({ itemsDetails, setPopupForm, setDeletePopup, setCounterPopup }) {
	const [items, setItems] = useState("sort_order")
	const [order, setOrder] = useState("")
	const [copied, setCopied] = useState("")

	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>

					<th colSpan={3}>
						<div className="t-head-element">
							<span>Form Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("form_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("form_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>

					<th colSpan={3}></th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					.map(a => ({ ...a, item_discount: +a.item_discount || 0 }))
					.sort((a, b) =>
						order === "asc"
							? typeof a[items] === "string"
								? a[items]?.localeCompare(b[items])
								: a[items] - b[items]
							: typeof a[items] === "string"
							? b[items]?.localeCompare(a[items])
							: b[items] - a[items]
					)
					?.map((item, i) => (
						<tr
							key={Math.random()}
							style={{ height: "30px" }}
							onClick={() => setPopupForm({ type: "edit", data: item })}>
							<td>{i + 1}</td>

							<td colSpan={3}>{item.form_title}</td>

							<td
								colSpan={1}
								onClick={e => {
									e.stopPropagation()

									setDeletePopup(item)
								}}>
								<DeleteOutline />
							</td>
							<td
								colSpan={1}
								onClick={e => {
									e.stopPropagation()
									navigator.clipboard.writeText("form-" + item.form_short_link)
									setCopied(item.form_short_link)
									setTimeout(() => setCopied(""), 3000)
								}}>
								{copied === item.form_short_link ? (
									<div
										style={{
											// position: "absolute",
											top: "-15px",
											right: "10px",
											fontSize: "10px",
											backgroundColor: "#000",
											color: "#fff",
											padding: "3px",
											borderRadius: "10px",
											textAlign: "center",
										}}>
										Copied!
									</div>
								) : (
									<CopyAll />
								)}
							</td>
							<td>
								<button
									className="theme-btn"
									onClick={e => {
										e.stopPropagation()
										setCounterPopup(item.form_uuid)
									}}>
									Counters
								</button>
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
function NewUserForm({ onSave, popupInfo, setItemsData, companies }) {
	const [data, setdata] = useState({ items: [] })
	const [filterItemTitle, setFilterItemTitle] = useState("")
	const [filterCategoryTitle, setFilterCategoryTitle] = useState("")
	const [filterCompanyTitle, setFilterCompanyTitle] = useState("")
	const [Items, setItems] = useState([])
	const [categoryData, setCategoryData] = useState([])
	const [errMassage, setErrorMassage] = useState("")
	
	useEffect(() => {
		if (popupInfo?.type === "edit") setdata(popupInfo.data)
	}, [popupInfo.data, popupInfo?.type])
	const getCounter = async () => {
		const response = await axios({
			method: "post",
			url: "/items/GetItemData",
			data: ["item_uuid", "item_title", "category_uuid", "comapny_uuid"],
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setItems(response.data.result)
	}
	const getRoutesData = async () => {
		const response = await axios({
			method: "get",
			url: "/itemCategories/GetItemCategoryList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setCategoryData(response.data.result)
	}
	useEffect(() => {
		getCounter()
		getRoutesData()
	}, [])
	const submitHandler = async e => {
		e.preventDefault()

		if (!data.form_title) {
			setErrorMassage("Please insert Item Title")
			return
		}

		if (popupInfo?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/orderForm/putForm",
				data: [data],
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.result[0].success) {
				onSave()
			}
		} else {
			const response = await axios({
				method: "post",
				url: "/orderForm/postForm",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				onSave()
			}
		}
	}

	const filteredItems = useMemo(
		() =>
			Items.filter(
				a =>
					!filterItemTitle ||
					a.item_title?.toLocaleLowerCase()?.includes(filterItemTitle?.toLocaleLowerCase())
			),
		[Items, filterItemTitle]
	)
	const filterCategory = useMemo(
		() =>
			categoryData
				.filter(
					a =>
						(!filterCategoryTitle ||
							a.category_title
								?.toLocaleLowerCase()
								?.includes(filterCategoryTitle?.toLocaleLowerCase())) &&
						a.category_uuid &&
						filteredItems?.filter(b => a.category_uuid === b.category_uuid).length
				)

				.sort((a, b) => a?.category_title?.localeCompare(b?.category_title)),
		[filterCategoryTitle, filteredItems, categoryData]
	)
	const filterCompany = useMemo(
		() =>
			companies
				.filter(
					a =>
						(!filterCompanyTitle ||
							a.company_title?.toLocaleLowerCase()?.includes(filterCompanyTitle?.toLocaleLowerCase())) &&
						a.company_uuid &&
						filterCategory?.filter(b => b?.company_uuid === a.company_uuid).length
				)

				.sort((a, b) => a?.company_title?.localeCompare(b?.company_title)),
		[companies, filterCategory, filterCompanyTitle]
	)
	
	return (
		<div className="overlay" style={{ zIndex: 9999999 }}>
			<div
				className="modal"
				style={{
					height: "max-content",
					width: "fit-content",
					maxHeight: "90vh",
				}}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Form</h1>
							</div>

							<div className="formGroup">
								<div className="row">
									<label className="selectLabel">
										Form Title
										<input
											type="text"
											name="route_title"
											className="numberInput"
											value={data?.form_title}
											onChange={e =>
												setdata({
													...data,
													form_title: e.target.value,
												})
											}
											maxLength={60}
										/>
									</label>
								</div>

								<div
									className="noSpaceForm"
									style={{
										padding: "0px 12px",
										height: "fit-content",
										maxHeight: "350px",
									}}>
									<h1>Items</h1>

									<div className="flex" style={{ justifyContent: "space-between" }}>
										<input
											type="text"
											onChange={e => setFilterItemTitle(e.target.value)}
											value={filterItemTitle}
											placeholder="Search Item..."
											className="searchInput"
										/>
										<input
											type="text"
											onChange={e => setFilterCategoryTitle(e.target.value)}
											value={filterCategoryTitle}
											placeholder="Search Category..."
											className="searchInput"
										/>
										<input
											type="text"
											onChange={e => setFilterCompanyTitle(e.target.value)}
											value={filterCompanyTitle}
											placeholder="Search Company..."
											className="searchInput"
										/>
									</div>
									<div
										style={{
											overflowY: "scroll",
											height: "45vh",
										}}>
										<table
											className="user-table"
											style={{
												maxWidth: "600px",
												height: "fit-content",
												overflowX: "scroll",
											}}>
											<thead>
												<tr>
													<th>S.N</th>
													<th colSpan={2}>Item Title</th>
												</tr>
											</thead>
											<tbody className="tbody">
												{filterCompany.map(company => (
													<>
														<tr style={{ pageBreakAfter: "auto" }}>
															<td colSpan={3} className="flex">
																<span
																	style={{
																		color: "var(--main)",
																		fontWeight: "bolder",
																		fontSize: "30px",
																	}}>
																	{company.company_title}
																</span>
																<span
																	onClick={e => {
																		e.stopPropagation()

																		setdata(prev => {
																			let counter_form_uuid =
																				filterCategory?.filter(
																					a =>
																						filteredItems?.filter(
																							b =>
																								a.category_uuid ===
																									b.category_uuid &&
																								data?.items?.find(
																									d =>
																										d ===
																										b.item_uuid
																								)
																						)?.length ===
																						filteredItems?.filter(
																							b =>
																								a.category_uuid ===
																								b.category_uuid
																						)?.length
																				)?.length ===
																				filterCategory?.filter(
																					b =>
																						company.company_uuid ===
																						b.company_uuid
																				)?.length
																					? true
																					: false
																			return {
																				...prev,
																				items: counter_form_uuid
																					? prev?.items?.filter(
																							b =>
																								!filteredItems?.find(
																									c =>
																										c.item_uuid ===
																											b &&
																										filterCategory.find(
																											d =>
																												d.category_uuid ===
																													c.category_uuid &&
																												d.company_uuid ===
																													company.company_uuid
																										)
																								)
																					  )
																					: [
																							...(prev?.items?.filter(
																								b =>
																									!filteredItems?.find(
																										c =>
																											c.item_uuid ===
																												b &&
																											filterCategory.find(
																												d =>
																													d.category_uuid ===
																														c.category_uuid &&
																													d.company_uuid ===
																														company.company_uuid
																											)
																									)
																							) || []),
																							...filteredItems
																								?.filter(c =>
																									filterCategory.find(
																										d =>
																											d.category_uuid ===
																												c.category_uuid &&
																											d.company_uuid ===
																												company.company_uuid
																									)
																								)
																								?.map(d => d.item_uuid),
																					  ],
																			}
																		})
																	}}
																	style={{ marginLeft: "10px" }}>
																	<input
																		type="checkbox"
																		checked={
																			filterCategory?.filter(
																				a =>
																					filteredItems?.filter(
																						b =>
																							a.category_uuid ===
																								b.category_uuid &&
																							data?.items?.find(
																								d => d === b.item_uuid
																							)
																					)?.length ===
																					filteredItems?.filter(
																						b =>
																							a.category_uuid ===
																							b.category_uuid
																					)?.length
																			)?.length ===
																			filterCategory?.filter(
																				b =>
																					company.company_uuid ===
																					b.company_uuid
																			)?.length
																		}
																		style={{ transform: "scale(1.3)" }}
																	/>
																</span>
															</td>
														</tr>
														{filterCategory
															.filter(a => a.company_uuid === company.company_uuid)
															.map(a => (
																<>
																	<tr
																		style={{
																			pageBreakAfter: "auto",
																			width: "100%",
																		}}>
																		<td colSpan={3}>
																			{a.category_title}
																			<span
																				onClick={e => {
																					e.stopPropagation()

																					setdata(prev => {
																						let counter_form_uuid =
																							filteredItems?.filter(
																								b =>
																									a.category_uuid ===
																										b.category_uuid &&
																									data?.items?.find(
																										d =>
																											d ===
																											b.item_uuid
																									)
																							)?.length ===
																							filteredItems?.filter(
																								b =>
																									a.category_uuid ===
																									b.category_uuid
																							)?.length
																								? true
																								: false
																						return {
																							...prev,
																							items: counter_form_uuid
																								? prev?.items?.filter(
																										b =>
																											!filteredItems?.find(
																												c =>
																													c.item_uuid ===
																														b &&
																													c.category_uuid ===
																														a.category_uuid
																											)
																								  )
																								: [
																										...(prev?.items?.filter(
																											b =>
																												!filteredItems?.find(
																													c =>
																														c.item_uuid ===
																															b &&
																														c.category_uuid ===
																															a.category_uuid
																												)
																										) || []),
																										...filteredItems
																											?.filter(
																												c =>
																													c.category_uuid ===
																													a.category_uuid
																											)
																											?.map(
																												c =>
																													c.item_uuid
																											),
																								  ],
																						}
																					})
																				}}
																				style={{ marginLeft: "10px" }}>
																				<input
																					type="checkbox"
																					checked={
																						filteredItems?.filter(
																							b =>
																								a.category_uuid ===
																									b.category_uuid &&
																								data?.items?.find(
																									d =>
																										d ===
																										b.item_uuid
																								)
																						)?.length ===
																						filteredItems?.filter(
																							b =>
																								a.category_uuid ===
																								b.category_uuid
																						)?.length
																					}
																					style={{ transform: "scale(1.3)" }}
																				/>
																			</span>
																		</td>
																	</tr>
																	{filteredItems
																		?.filter(
																			b => a.category_uuid === b.category_uuid
																		)
																		?.sort((a, b) =>
																			a.item_title?.localeCompare(b.item_title)
																		)
																		?.map((item, i, array) => {
																			return (
																				<tr
																					key={Math.random()}
																					style={{ height: "30px" }}>
																					<td
																						onClick={e => {
																							e.stopPropagation()
																							setdata(prev => {
																								return {
																									...prev,
																									items: prev?.items?.find(
																										b =>
																											b.item_uuid ===
																											item.item_uuid
																									)
																										? prev?.items?.filter(
																												b =>
																													item.item_uuid !==
																													b.item_uuid
																										  )
																										: [
																												...(prev.items ||
																													[]),
																												item.item_uuid,
																										  ],
																								}
																							})
																						}}
																						className="flex"
																						style={{
																							justifyContent:
																								"space-between",
																						}}>
																						<input
																							type="checkbox"
																							checked={data?.items?.find(
																								c =>
																									c === item.item_uuid
																							)}
																							style={{
																								transform: "scale(1.3)",
																							}}
																						/>
																						{i + 1}
																					</td>

																					<td colSpan={2}>
																						{item.item_title || ""}
																					</td>
																				</tr>
																			)
																		})}
																</>
															))}
													</>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
							<i style={{ color: "red" }}>{errMassage === "" ? "" : "Error: " + errMassage}</i>

							<button type="submit" className="submit">
								Save changes
							</button>
						</form>
					</div>

					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
function DeleteItemPopup({ onSave, popupInfo, setItemsData }) {
	const [errMassage, setErrorMassage] = useState("")
	const [loading, setLoading] = useState(false)

	const submitHandler = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await axios({
				method: "delete",
				url: "/orderForm/deleteForm",
				data: { form_uuid: popupInfo.form_uuid },
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				setItemsData(prev => prev.filter(i => i.form_uuid !== popupInfo.form_uuid))
				onSave()
			}
		} catch (err) {
			
			setErrorMassage("Order already exist")
		}
		setLoading(false)
	}

	return (
		<div className="overlay">
			<div className="modal" style={{ width: "fit-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>Delete Items</h1>
							</div>
							<div className="row">
								<h1>{popupInfo.form_title}</h1>
							</div>

							<i style={{ color: "red" }}>{errMassage === "" ? "" : "Error: " + errMassage}</i>
							<div className="flex" style={{ justifyContent: "space-between" }}>
								{loading ? (
									<button
										className="submit"
										id="loading-screen"
										style={{ background: "red", width: "120px" }}>
										<svg viewBox="0 0 100 100">
											<path
												d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50"
												fill="#ffffff"
												stroke="none">
												<animateTransform
													attributeName="transform"
													type="rotate"
													dur="1s"
													repeatCount="indefinite"
													keyTimes="0;1"
													values="0 50 51;360 50 51"></animateTransform>
											</path>
										</svg>
									</button>
								) : (
									<button type="submit" className="submit" style={{ background: "red" }}>
										Confirm
									</button>
								)}
								<button type="button" className="submit" onClick={onSave}>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

function CounterTable({ form_uuid, onSave }) {
	const [counter, setCounter] = useState([])
	const [filterCounterTitle, setFilterCounterTitle] = useState("")
	const [routesData, setRoutesData] = useState([])
	const [filterRouteTitle, setFilterRouteTitle] = useState("")

	const getCounter = async (controller = new AbortController()) => {
		const response = await axios({
			method: "post",
			url: "/counters/GetCounterData",
			signal: controller.signal,
			data: ["counter_uuid", "counter_title", "form_uuid", "route_uuid"],
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setCounter(
				response.data.result.sort((a, b) =>
					(a.form_uuid === b.form_uuid) === form_uuid ? 0 : a.form_uuid === form_uuid ? -1 : 1
				)
			)
		}
	}
	const getRoutesData = async (controller = new AbortController()) => {
		const response = await axios({
			method: "get",
			url: "/routes/GetRouteList",
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setRoutesData(response.data.result)
	}
	useEffect(() => {
		let controller = new AbortController()
		getCounter(controller)
		getRoutesData(controller)
		return () => {
			controller.abort()
		}
	}, [])
	const submitHandler = async () => {
		const response = await axios({
			method: "put",
			url: "/counters/putCounter",
			data: counter.filter(a => a.edit),
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			onSave()
		}
	}
	const filterCounter = useMemo(
		() =>
			counter?.filter(
				a =>
					a.counter_uuid &&
					(!filterCounterTitle ||
						a.counter_title?.toLocaleLowerCase()?.includes(filterCounterTitle?.toLocaleLowerCase()))
			),
		[counter, filterCounterTitle]
	)

	const filterRoute = useMemo(
		() =>
			routesData
				.filter(
					a =>
						(!filterRouteTitle ||
							a.route_title?.toLocaleLowerCase()?.includes(filterRouteTitle?.toLocaleLowerCase())) &&
						a.route_uuid &&
						filterCounter?.filter(b => a.route_uuid === b.route_uuid)?.length
				)

				.sort((a, b) => a?.route_title?.localeCompare(b?.route_title)),
		[filterRouteTitle, filterCounter, routesData]
	)

	return (
		<div className="overlay" style={{ zIndex: 9999999 }}>
			<div
				className="modal"
				style={{
					height: "max-content",
					width: "fit-content",
					maxHeight: "90vh",
				}}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div style={{ overflowY: "scroll" }}>
						<form className="form" onSubmit={submitHandler}>
							<div className="row">
								<h1>Counters</h1>
							</div>
							<div className="formGroup">
								<div className="flex">
									<input
										type="text"
										onChange={e => setFilterCounterTitle(e.target.value)}
										value={filterCounterTitle}
										placeholder="Search Counter Title..."
										className="searchInput"
									/>
									<input
										type="text"
										onChange={e => setFilterRouteTitle(e.target.value)}
										value={filterRouteTitle}
										placeholder="Search route Title..."
										className="searchInput"
									/>
								</div>

								<div className="row">
									<div
										style={{
											overflowY: "scroll",
											height: "45vh",
											minWidth: "600px",
										}}>
										<table
											className="user-table"
											style={{
												maxWidth: "500px",
												height: "fit-content",
												overflowX: "scroll",
											}}>
											<thead>
												<tr>
													<th>S.N</th>
													<th colSpan={2}>Counter Title</th>
												</tr>
											</thead>
											<tbody className="tbody">
												{filterRoute.map(a => (
													<>
														<tr style={{ pageBreakAfter: "auto", width: "100%" }}>
															<td colSpan={3}>
																{a.route_title}
																<span
																	onClick={e => {
																		e.stopPropagation()

																		setCounter(prev => {
																			let counter_form_uuid =
																				filterCounter?.filter(
																					b =>
																						a.route_uuid === b.route_uuid &&
																						form_uuid === b.form_uuid
																				)?.length ===
																				filterCounter?.filter(
																					b => a.route_uuid === b.route_uuid
																				)?.length
																					? ""
																					: form_uuid
																			return prev.map(count =>
																				count.route_uuid === a.route_uuid
																					? {
																							...count,
																							form_uuid:
																								counter_form_uuid,
																							edit: true,
																					  }
																					: count
																			)
																		})
																	}}
																	style={{ marginLeft: "10px" }}>
																	<input
																		type="checkbox"
																		checked={
																			filterCounter?.filter(
																				b =>
																					a.route_uuid === b.route_uuid &&
																					form_uuid === b.form_uuid
																			)?.length ===
																			filterCounter?.filter(
																				b => a.route_uuid === b.route_uuid
																			)?.length
																		}
																		style={{ transform: "scale(1.3)" }}
																	/>
																</span>
															</td>
														</tr>
														{filterCounter
															?.filter(b => a.route_uuid === b.route_uuid)
															?.sort((a, b) =>
																a.counter_title?.localeCompare(b.counter_title)
															)
															?.map((item, i, array) => {
																return (
																	<tr key={Math.random()} style={{ height: "30px" }}>
																		<td
																			onClick={e => {
																				e.stopPropagation()
																				setCounter(prev =>
																					prev.map(a =>
																						a.counter_uuid ===
																						item.counter_uuid
																							? {
																									...a,
																									form_uuid:
																										a.form_uuid ===
																										form_uuid
																											? ""
																											: form_uuid,
																									edit: true,
																							  }
																							: a
																					)
																				)
																			}}
																			className="flex"
																			style={{
																				justifyContent: "space-between",
																			}}>
																			<input
																				type="checkbox"
																				checked={item.form_uuid === form_uuid}
																				style={{ transform: "scale(1.3)" }}
																			/>
																			{i + 1}
																		</td>

																		<td colSpan={2}>{item.counter_title || ""}</td>
																	</tr>
																)
															})}
													</>
												))}
											</tbody>
										</table>
										{/* <table className="table">
                      <thead>
                        <tr>
                          <th className="description" style={{ width: "10%" }}>
                            S.r
                          </th>

                          <th className="description" style={{ width: "25%" }}>
                            Counter
                          </th>

                          <th style={{ width: "25%" }}>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filterCounter.map((item, index) => {
                          return (
                            <tr key={item.counter_uuid}>
                              <td>{index + 1}</td>

                              <td>{item?.counter_title}</td>

                              <td>
                                <button
                                  type="button"
                                  className="noBgActionButton"
                                  style={{
                                    backgroundColor:
                                      item.form_uuid === form_uuid
                                        ? "red"
                                        : "var(--mainColor)",
                                    width: "150px",
                                    fontSize: "large",
                                  }}
                                  onClick={(event) =>
                                    setCounter((prev) =>
                                      prev.map((a) =>
                                        a.counter_uuid === item.counter_uuid
                                          ? {
                                              ...a,
                                              form_uuid:
                                                a.form_uuid === form_uuid
                                                  ? ""
                                                  : form_uuid,
                                              edit: true,
                                            }
                                          : a
                                      )
                                    )
                                  }
                                >
                                  {item.form_uuid === form_uuid
                                    ? "Remove"
                                    : "Add"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table> */}
									</div>
								</div>
							</div>

							<button type="submit" className="submit">
								Save changes
							</button>
						</form>
					</div>

					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
