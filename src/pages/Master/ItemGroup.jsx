import React, { useState, useEffect, useMemo } from "react"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"
import SetupModal from "../../components/setupModel/SetupModel"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid"
import axios from "axios"
import { DeleteOutline } from "@mui/icons-material"
const ItemGroup = () => {
	const [itemGroup, setItemGroup] = useState([])
	const [itemGroupTitle, setItemGroupTitle] = useState("")
	const [popupForm, setPopupForm] = useState(false)
	const [deletePopup, setDeletePopup] = useState(false)
	const [addItems, setAddItems] = useState(false)
	const getCounterGroup = async () => {
		const response = await axios({
			method: "get",
			url: "/itemGroup/GetItemGroupList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) setItemGroup(response.data.result)
	}

	useEffect(() => {
		getCounterGroup()
	}, [popupForm])

	return (
		<>
			<Sidebar />
			<Header />
			<div className="item-sales-container orders-report-container">
				<div id="heading">
					<h2>Item Group</h2>
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
							onChange={e => setItemGroupTitle(e.target.value)}
							value={itemGroupTitle}
							placeholder="Search Item Group Title..."
							className="searchInput"
						/>

						<div>
							Total Items:{" "}
							{
								itemGroup
									.filter(a => a.item_group_title)
									.filter(
										a =>
											!itemGroupTitle ||
											a.item_group_title
												?.toLocaleLowerCase()
												?.includes(itemGroupTitle.toLocaleLowerCase())
									).length
							}
						</div>
						<button className="theme-btn" onClick={() => setPopupForm(true)}>
							Add
						</button>
					</div>
				</div>
				<div className="table-container-user item-sales-container">
					<Table
						itemsDetails={itemGroup
							.filter(a => a.item_group_title)
							.filter(
								a =>
									!itemGroupTitle ||
									a.item_group_title
										?.toLocaleLowerCase()
										?.includes(itemGroupTitle.toLocaleLowerCase())
							)}
						setPopupForm={setPopupForm}
						setAddItems={setAddItems}
						setDeletePopup={setDeletePopup}
					/>
				</div>
			</div>
			{popupForm ? (
				<NewUserForm onSave={() => setPopupForm(false)} popupInfo={popupForm} setRoutesData={setItemGroup} />
			) : (
				""
			)}
			{addItems ? (
				<SetupModal onClose={() => setAddItems(false)}>
					<ItemsForm
						ItemGroup={addItems}
						// itemGroupings={itemGroupings}
						// setItemGroupings={setItemGroupings}
						// itemGroupingIndex={itemsModalIndex}
						setItemsModalIndex={setAddItems}
					/>
				</SetupModal>
			) : (
				""
			)}
			{deletePopup ? (
				<DeleteCounterPopup
					onSave={() => setDeletePopup(false)}
					getCounterGroup={getCounterGroup}
					popupInfo={deletePopup}
				/>
			) : (
				""
			)}
		</>
	)
}

export default ItemGroup
function Table({ itemsDetails, setPopupForm, setAddItems, setDeletePopup }) {
	const [items, setItems] = useState("item_group_title")
	const [order, setOrder] = useState("asc")
	return (
		<table className="user-table" style={{ maxWidth: "100vw", height: "fit-content", overflowX: "scroll" }}>
			<thead>
				<tr>
					<th>S.N</th>
					<th colSpan={2}>
						<div className="t-head-element">
							<span>Item Group Title</span>
							<div className="sort-buttons-container">
								<button
									onClick={() => {
										setItems("item_group_title")
										setOrder("asc")
									}}>
									<ChevronUpIcon className="sort-up sort-button" />
								</button>
								<button
									onClick={() => {
										setItems("item_group_title")
										setOrder("desc")
									}}>
									<ChevronDownIcon className="sort-down sort-button" />
								</button>
							</div>
						</div>
					</th>
					<th colSpan={2}></th>
				</tr>
			</thead>
			<tbody className="tbody">
				{itemsDetails
					.filter(a => a.item_group_title)
					.sort((a, b) =>
						order === "asc"
							? typeof a[items] === "string"
								? a[items].localeCompare(b[items])
								: a[items] - b[items]
							: typeof a[items] === "string"
							? b[items].localeCompare(a[items])
							: b[items] - a[items]
					)
					?.map((item, i) => (
						<tr
							key={Math.random()}
							style={{ height: "30px" }}
							onClick={e => {
								e.stopPropagation()
								setPopupForm({ type: "edit", data: item })
							}}>
							<td>{i + 1}</td>
							<td colSpan={2}>{item.item_group_title}</td>
							<td>
								<button
									type="button"
									onClick={e => {
										e.stopPropagation()
										setAddItems(item)
									}}
									className="fieldEditButton">
									Action
								</button>
							</td>
							<td
								colSpan={1}
								onClick={e => {
									e.stopPropagation()

									setDeletePopup(item)
								}}>
								<DeleteOutline />
							</td>
						</tr>
					))}
			</tbody>
		</table>
	)
}
function NewUserForm({ onSave, popupInfo, setRoutesData }) {
	const [data, setdata] = useState({})
	const [errMassage, setErrorMassage] = useState("")
	useEffect(
		popupInfo.type === "edit"
			? () => {
					setdata(popupInfo.data)
			  }
			: () => {},
		[]
	)
	const submitHandler = async e => {
		e.preventDefault()
		if (!data.item_group_title) {
			setErrorMassage("Please insert Group Title")
			return
		}
		if (popupInfo?.type === "edit") {
			const response = await axios({
				method: "put",
				url: "/itemGroup/putItemGroup",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				setRoutesData(prev => prev?.map(i => (i.user_uuid === data.user_uuid ? data : i)))
				onSave()
			}
		} else {
			const response = await axios({
				method: "post",
				url: "/itemGroup/postItemGroup",
				data,
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				setRoutesData(prev => [...prev, data])
				onSave()
			}
		}
	}

	return (
		<div className="overlay">
			<div className="modal" style={{ height: "fit-content", width: "max-content" }}>
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
								<h1>{popupInfo.type === "edit" ? "Edit" : "Add"} Item Group</h1>
							</div>

							<div className="formGroup">
								<div className="row">
									<label className="selectLabel">
										Item Group Title
										<input
											type="text"
											name="category_title"
											className="numberInput"
											value={data?.item_group_title}
											onChange={e =>
												setdata({
													...data,
													item_group_title: e.target.value,
												})
											}
											maxLength={42}
										/>
									</label>
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

function ItemsForm({ ItemGroup, itemGroupingIndex, setItemsModalIndex }) {
	const [filterItemTitle, setFilterItemTitle] = useState("")
	const [filterCategoryTitle, setFilterCategoryTitle] = useState("")
	const [Items, setItems] = useState([])
	const [categoryData, setCategoryData] = useState([])

	const getCounter = async () => {
		const response = await axios({
			method: "post",
			url: "/items/GetItemData",
			data: ["item_uuid", "item_title", "category_uuid", "item_group_uuid"],
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

	const submitHandler = async () => {
		const response = await axios({
			method: "put",
			url: "/items/putItem",
			data: Items.filter(a => a.edit),
			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setItemsModalIndex(null)
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

	return (
		<div
			className="noSpaceForm"
			style={{
				padding: "0px 12px",
				height: "fit-content",
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
			</div>
			<div
				style={{
					overflowY: "scroll",
					height: "45vh",
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
							<th colSpan={2}>Item Title</th>
						</tr>
					</thead>
					<tbody className="tbody">
						{filterCategory.map(a => (
							<>
								<tr style={{ pageBreakAfter: "auto", width: "100%" }}>
									<td colSpan={3}>
										{a.category_title}
										<span
											onClick={e => {
												e.stopPropagation()

												setItems(prev => {
													let counter_form_uuid =
														filteredItems?.filter(
															b =>
																a.category_uuid === b.category_uuid &&
																b.item_group_uuid.find(
																	d => d === ItemGroup.item_group_uuid
																)
														)?.length ===
														filteredItems?.filter(b => a.category_uuid === b.category_uuid)
															?.length
															? true
															: false
													return prev.map(count =>
														count.category_uuid === a.category_uuid
															? {
																	...count,
																	item_group_uuid: counter_form_uuid
																		? count?.item_group_uuid?.filter(
																				d => d !== ItemGroup.item_group_uuid
																		  )
																		: [
																				...(count.item_group_uuid || []),
																				ItemGroup.item_group_uuid,
																		  ],
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
													filteredItems?.filter(
														b =>
															a.category_uuid === b.category_uuid &&
															b.item_group_uuid.find(d => d === ItemGroup.item_group_uuid)
													)?.length ===
													filteredItems?.filter(b => a.category_uuid === b.category_uuid)
														?.length
												}
												style={{ transform: "scale(1.3)" }}
											/>
										</span>
									</td>
								</tr>
								{filteredItems
									?.filter(b => a.category_uuid === b.category_uuid)
									?.sort((a, b) => a.item_title?.localeCompare(b.item_title))
									?.map((item, i, array) => {
										return (
											<tr key={Math.random()} style={{ height: "30px" }}>
												<td
													onClick={e => {
														e.stopPropagation()
														setItems(prev =>
															prev.map(a =>
																a.item_uuid === item.item_uuid
																	? {
																			...a,
																			item_group_uuid: a.item_group_uuid.find(
																				d => d === ItemGroup.item_group_uuid
																			)
																				? a.item_group_uuid.filter(
																						d =>
																							d !==
																							ItemGroup.item_group_uuid
																				  )
																				: [
																						...(a.item_group_uuid || []),
																						ItemGroup.item_group_uuid,
																				  ],
																			edit: true,
																	  }
																	: a
															)
														)
													}}
													className="flex"
													style={{ justifyContent: "space-between" }}>
													<input
														type="checkbox"
														checked={item.item_group_uuid.find(
															d => d === ItemGroup.item_group_uuid
														)}
														style={{ transform: "scale(1.3)" }}
													/>
													{i + 1}
												</td>

												<td colSpan={2}>{item.item_title || ""}</td>
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
            <th className="description" style={{ width: "25%" }}>
              Counter
            </th>
            <th className="description" style={{ width: "25%" }}>
              Route
            </th>

            <th style={{ width: "25%" }}>Action</th>
          </tr>
        </thead>

        <tbody>
          {filterItemData
            ?.filter((a) => a.item_uuid)

            .map((item, index) => {
              return (
                <tr key={item.item_uuid}>
                  <td>{item.item_title}</td>
                  <td>{item?.category_title}</td>
                  <td>
                    <button
                      type="button"
                      className="noBgActionButton"
                      style={{
                        backgroundColor: includesItem?.filter(
                          (a) =>
                            a?.item_uuid === item?.item_uuid &&
                            a.item_group_uuid.filter(
                              (a) => a === itemGroup.item_group_uuid
                            ).length
                        )?.length
                          ? "red"
                          : "var(--mainColor)",
                        width: "150px",
                        fontSize: "large",
                      }}
                      onClick={(event) =>
                        onItemIncludeToggle(
                          item.item_uuid,
                          includesItem?.filter(
                            (a) =>
                              a?.item_uuid === item?.item_uuid &&
                              a.item_group_uuid.filter(
                                (a) => a === itemGroup.item_group_uuid
                              ).length
                          )?.length
                            ? "remove"
                            : "add"
                        )
                      }
                    >
                      {includesItem?.filter(
                        (a) =>
                          a?.item_uuid === item?.item_uuid &&
                          a.item_group_uuid.filter(
                            (a) => a === itemGroup.item_group_uuid
                          ).length
                      )?.length
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
			<div>
				<button type="button" className="fieldEditButton" onClick={submitHandler}>
					Done
				</button>
			</div>
		</div>
	)
}
function ItemsTable({
	items,
	itemGroup,
	includesArray,
	onItemIncludeToggle,
	filterCategory,
	filterCompany,
	company,
	Category,
}) {
	const [filterItemData, setFilterItemData] = useState([])
	useEffect(() => {
		setFilterItemData(
			items.sort((a, b) => {
				let aLength = includesArray?.filter(
					c =>
						c?.item_uuid === a?.item_uuid &&
						c.item_group_uuid.filter(d => d === itemGroup.item_group_uuid).length
				)?.length

				let bLength = includesArray?.filter(
					c =>
						c?.item_uuid === b?.item_uuid &&
						c.item_group_uuid.filter(d => d === itemGroup.item_group_uuid).length
				)?.length
				
				if (aLength && bLength) {
					return a.item_title.localeCompare(b.item_title)
				} else if (aLength) {
					return -1
				} else if (bLength) {
					return 1
				} else {
					return a.item_title.localeCompare(b.item_title)
				}
			})
		)
	}, [
		items,
		filterCategory,
		filterCompany,
		company,
		Category,
		includesArray,
		itemGroup.item_group_uuid,
		itemGroup.item_group_uuid,
	])
	return (
		<div
			style={{
				overflowY: "scroll",
				height: "45vh",
			}}>
			<table className="table">
				<thead>
					<tr>
						<th className="description" style={{ width: "10%" }}>
							S.r
						</th>
						<th className="description" style={{ width: "25%" }}>
							Item
						</th>
						<th className="description" style={{ width: "25%" }}>
							Company
						</th>
						<th className="description" style={{ width: "25%" }}>
							Category
						</th>

						<th style={{ width: "25%" }}>Action</th>
					</tr>
				</thead>

				<tbody>
					{filterItemData
						?.filter(a => a.item_uuid)
						.map((item, index) => {
							return (
								<tr key={item.item_uuid}>
									<td>{index + 1}</td>
									<td>{item.item_title}</td>
									<td>{item?.company_title}</td>
									<td>{item?.category_title}</td>

									<td>
										<button
											type="button"
											className="noBgActionButton"
											style={{
												backgroundColor: includesArray?.filter(
													a =>
														a?.item_uuid === item?.item_uuid &&
														a.item_group_uuid.filter(a => a === itemGroup.item_group_uuid)
															.length
												)?.length
													? "red"
													: "var(--mainColor)",
												width: "150px",
												fontSize: "large",
											}}
											onClick={event =>
												onItemIncludeToggle(
													item.item_uuid,
													includesArray?.filter(
														a =>
															a?.item_uuid === item?.item_uuid &&
															a.item_group_uuid.filter(
																a => a === itemGroup.item_group_uuid
															).length
													)?.length
														? "remove"
														: "add"
												)
											}>
											{includesArray?.filter(
												a =>
													a?.item_uuid === item?.item_uuid &&
													a.item_group_uuid.filter(a => a === itemGroup.item_group_uuid)
														.length
											)?.length
												? "Remove"
												: "Add"}
										</button>
									</td>
								</tr>
							)
						})}
				</tbody>
			</table>
		</div>
	)
}
function DeleteCounterPopup({ onSave, popupInfo, getCounterGroup }) {
	const [errMassage, setErrorMassage] = useState("")
	const [loading, setLoading] = useState(false)

	const submitHandler = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await axios({
				method: "delete",
				url: "/itemGroup/deleteItemGroup",
				data: { item_group_uuid: popupInfo.item_group_uuid },
				headers: {
					"Content-Type": "application/json",
				},
			})
			if (response.data.success) {
				getCounterGroup()
				onSave()
			}
		} catch (err) {
			
			// setErrorMassage("Order already exist");
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
								<h1>Delete Item Group</h1>
							</div>
							<div className="row">
								<h1>{popupInfo.item_group_title}</h1>
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
