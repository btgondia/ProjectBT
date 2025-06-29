import { IoArrowBackOutline } from "react-icons/io5"
import { useState, useEffect, useMemo, useContext, useRef } from "react"
import { useParams } from "react-router-dom"
import { Link as ScrollLink } from "react-scroll"
import { v4 as uuid } from "uuid"
import axios from "axios"

import noimg from "../assets/noimg.jpg"
import MobileNumberPopup from "../components/MobileNumberPopup"
import context from "../context/context"
import { server } from "../App"
import { Billing } from "../Apis/functions"

const LinkedCounter = () => {
	const [items, setItems] = useState([])
	const [foodLicensePopup, setFoodLicencePopup] = useState(false)
	const [checkNumberPopup, setCheckNumberPopup] = useState(false)
	const [pricePopup, setPricePopup] = useState(false)
	const [number, setNumber] = useState(false)
	const [confirmItemsPopup, setConfirmItemPopup] = useState(false)
	const [enable, setEnable] = useState(false)
	const [userData, setUserData] = useState({})
	const [food_license, setFoodLicence] = useState("")
	const [order, setOrder] = useState([])
	const [isCategoryOpen, setIsCategoryOpen] = useState(false)
	const [clickedId, setClickedId] = useState(false)
	const [cartPage, setCartPage] = useState(false)
	const [orderStatus, setOrderStatus] = useState(0)
	const [imgpopup, setImgPopup] = useState("")
	const wrapperRef = useRef()
	const [counter, setCounter] = useState({})

	const params = useParams()
	const [filterItemTitle, setFilterItemTile] = useState("")
	const [itemsCategory, setItemsCategory] = useState([])
	const [companies, setCompanies] = useState([])
	const [popupForm, setPopupForm] = useState(false)
	const [total, setTotal] = useState(0)
	const [holdPopup, setHoldPopup] = useState(false)
	const [discountPopup, setDiscountPopup] = useState(false)
	const [invoice_number, setInvioceNumber] = useState(false)
	const [loading, setLoading] = useState(false)
	const { setNotification } = useContext(context)

	useEffect(() => {
		if (imgpopup) {
			function handleClickOutside(event) {
				if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
					setImgPopup("")
				}
			}

			document.addEventListener("mousedown", handleClickOutside)
			return () => {
				document.removeEventListener("mousedown", handleClickOutside)
			}
		}
	}, [imgpopup, wrapperRef])

	const callBilling = async () => {
		// let counter = counters.find((a) => order.counter_uuid === a.counter_uuid);
		let time = new Date()
		Billing({
			order_uuid: order?.order_uuid,
			invoice_number: `${order?.order_type}${order?.invoice_number}`,
			counter,
			items: order.items,
			others: {
				stage: 1,
				user_uuid: localStorage.getItem("user_uuid"),
				time: time.getTime(),

				type: "NEW"
			},
			add_discounts: true
		}).then(data => {
			setTotal(data.order_grandtotal)
		})
	}
	useEffect(() => {
		callBilling()
	}, [order?.items])

	const getCounter = async () => {
		setLoading(true)
		try {
			const response = await axios({
				method: "post",
				url: "/counters/GetCounterByLink",
				data: {
					short_link: params.short_link,
					campaign_short_link: params.campaign_short_link?.includes("cam-")
						? params?.campaign_short_link?.replace("cam-", "")
						: "",
					form_short_link: params.campaign_short_link?.includes("form-") ? params?.campaign_short_link?.replace("form-", "") : ""
				},
				headers: {
					"Content-Type": "application/json"
				}
			})
			if (response.data.message) setNotification(response.data)
			setTimeout(() => setNotification(""), 5000)
			
			if (response.data.success) {
				if (!response.data.result.order_status) {
					setNotification({
						message: "इस रूट के आर्डर अभी स्वीकार नहीं किये जा रहे है"
					})
					setTimeout(() => setNotification(""), 5000)
				}
				setOrderStatus(response.data.result.order_status)
				setCounter(response.data.result.counter)
				localStorage.setItem("counter_uuid", response.data.result.counter.counter_uuid)
				setItemsCategory(response.data.result.ItemCategories)
				setItems(response.data.result.items)
				setCompanies(response.data.result.company)
			}
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}
	const getUsers = async () => {
		const response = await axios({
			method: "get",
			url: "/users/GetUser/" + localStorage.getItem("user_uuid"),

			headers: {
				"Content-Type": "application/json"
			}
		})
		
		if (response.data.success) setUserData(response.data.result)
	}

	useEffect(() => {
		getUsers()
	}, [])
	const salesman_suggestion = useMemo(() => {
		let item = userData?.salesman_suggestion?.filter(a => !order?.items?.find(b => b.item_uuid === a)) || []
		return items.filter(a => item.find(b => b === a.item_uuid))
	}, [userData?.salesman_suggestion, items, order?.items])

	const putCounterData = async e => {
		e.preventDefault()
		if (!food_license) return
		const response = await axios({
			method: "put",
			url: "/counters/putCounter",
			data: [
				{
					counter_uuid: params.counter_uuid,
					food_license
				}
			],
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) {
			setFoodLicencePopup(false)
			// setCheckNumberPopup(true);
		}
	}
	const putCounterNumber = async e => {
		e.preventDefault()
		setCartPage(false)
		setOrder({})
		getCounter()
		setInvioceNumber("")
	}

	useEffect(() => {
		getCounter()
	}, [])
	let filterItems = useMemo(
		() =>
			(!cartPage ? items : order.items)
				?.map(a => ({
					...a,
					item_price: counter.item_special_price?.find(b => b.item_uuid === a.item_uuid)?.price || a.item_price,
					b: 0,
					p: 0,
					status: 0
				}))
				.filter(a => !filterItemTitle || a.item_title?.toLocaleLowerCase().includes(filterItemTitle.toLocaleLowerCase())),
		[cartPage, counter.item_special_price, filterItemTitle, items, order.items]
	)
	let filteredCategory = useMemo(
		() => itemsCategory?.filter(b => filterItems.filter(a => a.category_uuid === b.category_uuid)?.length),
		[filterItems, itemsCategory]
	)
	let filteredCompany = useMemo(
		() => companies?.filter(b => filteredCategory.filter(a => a.company_uuid === b.company_uuid)?.length),
		[companies, filteredCategory]
	)

	const postOrder = async (orderData = order) => {
		setLoading(true)
		try {
			let time = new Date()
			let data = await Billing({
				order_uuid: orderData?.order_uuid,
				invoice_number: `${order?.order_type}${order?.invoice_number}`,
				counter,
				items: orderData.items,
				others: {
					stage: 1,
					user_uuid: localStorage.getItem("user_uuid"),
					time: time.getTime(),

					type: "NEW"
				},
				add_discounts: true
			})
			data = {
				...orderData,
				...data,
				order_status: orderData?.order_status || "R",
				order_uuid: uuid(),
				opened_by: 0,
				item_details: data.items.map(a => ({
					...a,
					b: a.b,
					p: a.p,
					unit_price: a.price,
					gst_percentage: a.item_gst,
					css_percentage: a.item_css,
					status: 0,
					price: a.price || a.item_price
				})),
				status: [
					{
						stage: orderData?.others?.stage || 1,
						time: orderData?.others?.time || new Date().getTime(),
						user_uuid: orderData?.others?.user_uuid || orderData?.counter_uuid
					}
				],
				counter_order: 1,
				campaign_short_link: params.campaign_short_link?.includes("cam-") ? params?.campaign_short_link?.replace("cam-", "") : ""
			}
			
			const response = await axios({
				method: "post",
				url: "/orders/postOrder",
				data,
				headers: {
					"Content-Type": "application/json"
				}
			})
			if (response.data.success) {
				setInvioceNumber(response.data.result.invoice_number)
				//   let qty = `${
				//     data?.item_details?.length > 1
				//       ? data?.item_details?.reduce((a, b) => (+a.b || 0) + (+b.b || 0))
				//       : data?.item_details?.length
				//       ? data?.item_details[0]?.b
				//       : 0
				//   }:${
				//     data?.item_details?.length > 1
				//       ? data?.item_details?.reduce((a, b) => (+a.p || 0) + (+b.p || 0))
				//       : data?.item_details?.length
				//       ? data?.item_details[0]?.p
				//       : 0
				//   }`;
				//   postActivity({
				//     activity: "Order End",
				//     range: data?.item_details?.length,
				//     qty,
				//     amt: data.order_grandtotal || 0,
				//   });
				if (response.data.incentives) {
					setCheckNumberPopup(response.data.incentives)
				}
			}
		} catch (error) {
			
		} finally {
			setLoading(false)
		}
	}
	//   const postActivity = async (others = {}) => {
	//     let time = new Date();
	//     let data = {
	//       user_uuid: localStorage.getItem("user_uuid"),
	//       role: "Order",
	//       narration:
	//         counter.counter_title +
	//         (sessionStorage.getItem("route_title")
	//           ? ", " + sessionStorage.getItem("route_title")
	//           : ""),
	//       timestamp: time.getTime(),
	//       ...others,
	//     };
	//     const response = await axios({
	//       method: "post",
	//       url: "/userActivity/postUserActivity",
	//       data,
	//       headers: {
	//         "Content-Type": "application/json",
	//       },
	//     });
	//     if (response.data.success) {
	//      
	//     }
	//   };
	//   useEffect(() => {
	//     if (!orderCreated && order?.items?.length) {
	//       postActivity({ activity: "Order Start" });
	//       setOrderCreated(true);
	//     }
	//   }, [order]);
	return (
		<>
			{number ? <MobileNumberPopup counter={counter} getCounter={getCounter} onSave={() => setNumber(false)} /> : ""}

			<nav
				className="user_nav nav_styling"
				style={cartPage ? { backgroundColor: "#000", maxWidth: "500px" } : { maxWidth: "500px" }}
			>
				{cartPage ? (
					<div className="user_menubar">
						<IoArrowBackOutline className="user_Back_icon" onClick={() => setCartPage(false)} />
					</div>
				) : (
					<div className="user_menubar">
						<input
							style={{ width: "200px" }}
							className="searchInput"
							type="text"
							placeholder="search"
							value={filterItemTitle}
							onChange={e => setFilterItemTile(e.target.value)}
						/>
					</div>
				)}
				<div style={{ width: "100%", textAlign: "center", fontWeight: "900" }}>{counter?.counter_title || ""}</div>
				{/* {cartPage ? (
            <>
              <h1 style={{ width: "100%", textAlign: "center" }}>Cart</h1>
              <button
                className="theme-btn"
                style={{
                  width: "max-content",
                  backgroundColor: "#32bd33",
                }}
                onClick={() => setDiscountPopup("Summary")}
              >
                Discount
              </button>
              <button
                className="theme-btn"
                style={{
                  width: "max-content",
                  backgroundColor: "#32bd33",
                }}
                onClick={() => setHoldPopup("Summary")}
              >
                Free
              </button>
            </>
          ) : (
            ""
          )} */}
				{/* {!cartPage ? (
            <>
              <div className="user_searchbar flex">
                <AiOutlineSearch className="user_search_icon" />
                <input
                  style={{ width: "200px" }}
                  className="searchInput"
                  type="text"
                  placeholder="search"
                  value={filterItemTitle}
                  onChange={(e) => setFilterItemTile(e.target.value)}
                />
                <CloseIcon
                  className="user_cross_icon"
                  onClick={() => setFilterItemTile("")}
                />
              </div>

              <div>
                <select
                  className="searchInput selectInput"
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                >
                  {companies?.map((a) => (
                    <option value={a.company_uuid}>{a.company_title}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            ""
          )} */}
			</nav>
			<div className="home">
				<div className="container" style={{ maxWidth: "500px" }}>
					<div className="menucontainer">
						<div className="menus">
							{filteredCompany.map(comapany => (
								<div
									id={!cartPage ? comapany?.company_uuid : ""}
									key={comapany?.company_uuid}
									name={comapany?.company_uuid}
									className="categoryItemMap"
								>
									<h1
										className="categoryHeadline"
										style={{
											textAlign: "center",
											fontSize: "40px",
											textDecoration: "underline",
											color: "#5BC0F8"
										}}
									>
										{comapany?.company_title}
									</h1>
									{filteredCategory
										?.filter(a => a.company_uuid === comapany.company_uuid)
										?.sort((a, b) => a.sort_order - b.sort_order)
										?.map(category => (
											<div
												id={!cartPage ? category?.category_uuid : ""}
												key={category?.category_uuid}
												name={category?.category_uuid}
												className="categoryItemMap"
											>
												<h2 className="categoryHeadline small">{category?.category_title}</h2>

												{filterItems
													?.filter(
														a =>
															!filterItemTitle || a.item_title?.toLocaleLowerCase().includes(filterItemTitle.toLocaleLowerCase())
													)
													?.sort((a, b) => a.sort_order - b.sort_order)

													.filter(a => a.category_uuid === category.category_uuid)
													?.map(item => {
														return (
															<div
																key={item?.item_uuid}
																className="menu"
																onClick={e => {
																	e.stopPropagation()
																	if (orderStatus)
																		setOrder(prev => ({
																			...prev,
																			items: prev?.items?.filter(a => a.item_uuid === item.item_uuid)?.length
																				? prev?.items?.map(a =>
																						a.item_uuid === item.item_uuid
																							? {
																									...a,
																									b:
																										+(a.b || 0) +
																										parseInt(((a?.p || 0) + (+item?.one_pack || 1)) / +item.conversion),

																									p: ((a?.p || 0) + (+item?.one_pack || 1)) % +item.conversion
																							  }
																							: a
																				  )
																				: prev?.items?.length
																				? [
																						...prev.items,
																						...filterItems
																							?.filter(a => a.item_uuid === item.item_uuid)
																							.map(a => ({
																								...a,
																								b:
																									+(a.b || 0) +
																									parseInt(((a?.p || 0) + (+item?.one_pack || 1)) / +item.conversion),

																								p: ((a?.p || 0) + (+item?.one_pack || 1)) % +item.conversion
																							}))
																				  ]
																				: filterItems
																						?.filter(a => a.item_uuid === item.item_uuid)
																						.map(a => ({
																							...a,
																							b:
																								+(a.b || 0) + parseInt(((a?.p || 0) + (+item?.one_pack || 1)) / +item.conversion),

																							p: ((a?.p || 0) + (+item?.one_pack || 1)) % +item.conversion
																						}))
																		}))
																}}
															>
																<div className="menuItemDetails">
																	<h1 className="item-name">{item?.item_title}</h1>

																	<div
																		className="item-mode flex"
																		style={{
																			justifyContent: "space-between"
																		}}
																	>
																		<h3 className={`item-price`} style={{ cursor: "pointer" }}>
																			{+item?.item_discount ? (
																				<>
																					<span
																						style={{
																							color: "red",
																							textDecoration: "line-through"
																						}}
																					>
																						Price: {item?.item_price}
																					</span>
																					<br />
																					<span
																						style={{
																							color: "red",
																							paddingLeft: "10px",
																							marginLeft: "10px",
																							fontWeight: "500",
																							borderLeft: "2px solid red"
																						}}
																					>
																						{item?.item_discount} % OFF
																					</span>
																				</>
																			) : (
																				<>Price: {item?.item_price}</>
																			)}
																		</h3>
																		<h3 className={`item-price`}>MRP: {item?.mrp || ""}</h3>
																	</div>
																</div>
																<div className="menuleft">
																	{item?.img_status ? (
																		<div
																			className="item-image-container"
																			onClick={e => {
																				e.stopPropagation()
																				setImgPopup(item?.item_uuid + ".png")
																			}}
																		>
																			<img src={`${server}/${item?.item_uuid}thumbnail.png`} alt="Food-Item" />
																		</div>
																	) : (
																		""
																	)}
																	<input
																		value={`${order?.items?.find(a => a.item_uuid === item.item_uuid)?.b || 0} : ${
																			order?.items?.find(a => a.item_uuid === item.item_uuid)?.p || 0
																		}`}
																		disabled={!orderStatus}
																		className="boxPcsInput"
																		style={
																			!orderStatus
																				? {
																						border: "2px solid gray",
																						boxShadow: "0 2px 8px gray"
																				  }
																				: {}
																		}
																		onClick={e => {
																			e.stopPropagation()
																			if (orderStatus) setPopupForm(item)
																		}}
																	/>
																</div>
															</div>
														)
													})}
												<div className="menu">
													<div className="menuItemDetails">
														<h1 className="item-name"></h1>

														<div className="item-mode">
															<h3 className={`item-price`}></h3>
														</div>
													</div>
													<div className="menuleft"></div>
												</div>
											</div>
										))}
									<div className="menu">
										<div className="menuItemDetails">
											<h1 className="item-name"></h1>

											<div className="item-mode">
												<h3 className={`item-price`}></h3>
											</div>
										</div>
										<div className="menuleft"></div>
									</div>
								</div>
							))}
						</div>
						{confirmItemsPopup ? (
							<div
								style={{
									backgroundColor: "rgba(128, 128, 128,0.8)",
									zIndex: 9999999,
									top: "0",
									position: "fixed",
									width: "100vw",
									height: "100vh",
									maxWidth: "500px",
									minHeight: "-webkit-fill-available"
								}}
							>
								<button onClick={() => setConfirmItemPopup(false)} className="closeButton" style={{ top: "20vh", left: "40%" }}>
									x
								</button>
								<div
									className="menus"
									style={{
										position: "fixed",
										boxShadow: "0 -10px 50px #32bd33",
										width: "100vw",
										maxHeight: "70vh",
										bottom: "0px",
										backgroundColor: "#fff",
										overflow: "scroll",
										paddingTop: "10px",
										maxWidth: "500px"
									}}
								>
									{itemsCategory

										?.sort((a, b) => a.sort_order - b.sort_order)
										?.map(category =>
											salesman_suggestion.filter(a => a.category_uuid === category.category_uuid)?.length > 0 ? (
												<div
													id={!cartPage ? category?.category_uuid : ""}
													key={category?.category_uuid}
													name={category?.category_uuid}
													className="categoryItemMap"
												>
													<h1 className="categoryHeadline">{category?.category_title}</h1>

													{salesman_suggestion
														?.filter(
															a =>
																!filterItemTitle ||
																a.item_title?.toLocaleLowerCase().includes(filterItemTitle.toLocaleLowerCase())
														)
														?.sort((a, b) => a.sort_order - b.sort_order)

														.filter(a => a.category_uuid === category.category_uuid)
														?.map(item => {
															return (
																<div
																	key={item?.item_uuid}
																	className="menu"
																	onClick={e => {
																		e.stopPropagation()
																		setOrder(prev => ({
																			...prev,
																			items: prev?.items?.filter(a => a.item_uuid === item.item_uuid)?.length
																				? prev?.items?.map(a =>
																						a.item_uuid === item.item_uuid
																							? {
																									...a,
																									b:
																										+(a.b || 0) +
																										parseInt(((a?.p || 0) + (+item?.one_pack || 1)) / +item.conversion),

																									p: ((a?.p || 0) + (+item?.one_pack || 1)) % +item.conversion
																							  }
																							: a
																				  )
																				: prev?.items?.length
																				? [
																						...prev.items,
																						...filterItems
																							?.filter(a => a.item_uuid === item.item_uuid)
																							.map(a => ({
																								...a,
																								b:
																									+(a.b || 0) +
																									parseInt(((a?.p || 0) + (+item?.one_pack || 1)) / +item.conversion),

																								p: ((a?.p || 0) + (+item?.one_pack || 1)) % +item.conversion
																							}))
																				  ]
																				: filterItems
																						?.filter(a => a.item_uuid === item.item_uuid)
																						.map(a => ({
																							...a,
																							b:
																								+(a.b || 0) + parseInt(((a?.p || 0) + (+item?.one_pack || 1)) / +item.conversion),

																							p: ((a?.p || 0) + (+item?.one_pack || 1)) % +item.conversion
																						}))
																		}))
																	}}
																>
																	<div className="menuItemDetails">
																		<h1 className="item-name">{item?.item_title}</h1>

																		<div
																			className="item-mode flex"
																			style={{
																				justifyContent: "space-between"
																			}}
																		>
																			<h3 className={`item-price`} style={{ cursor: "pointer" }}>
																				{+item?.item_discount ? (
																					<>
																						<span
																							style={{
																								color: "red",
																								textDecoration: "line-through"
																							}}
																						>
																							Price: {item?.item_price}
																						</span>
																						<br />
																						<span
																							style={{
																								color: "red",
																								paddingLeft: "10px",
																								marginLeft: "10px",
																								fontWeight: "500",
																								borderLeft: "2px solid red"
																							}}
																						>
																							{item?.item_discount} % OFF
																						</span>
																					</>
																				) : (
																					<>Price: {item?.item_price}</>
																				)}
																			</h3>
																			<h3 className={`item-price`}>MRP: {item?.mrp || ""}</h3>
																		</div>
																	</div>
																	<div className="menuleft">
																		<input
																			value={`${order?.items?.find(a => a.item_uuid === item.item_uuid)?.b || 0} : ${
																				order?.items?.find(a => a.item_uuid === item.item_uuid)?.p || 0
																			}`}
																			className="boxPcsInput"
																			onClick={e => {
																				e.stopPropagation()
																				setPopupForm(item)
																			}}
																		/>
																	</div>
																</div>
															)
														})}
												</div>
											) : (
												""
											)
										)}
								</div>
							</div>
						) : (
							""
						)}
					</div>
				</div>
			</div>
			<div
				className="allcategoryList"
				style={{
					bottom: itemsCategory?.length > 0 ? "3.5rem" : "1rem"
				}}
			>
				<div className={`menulist`} style={{ maxWidth: "500px" }}>
					<div className={`${isCategoryOpen ? "showCategory" : ""} categoryList`} style={{ overflow: "scroll" }}>
						{filteredCategory
							?.sort((a, b) => a.sort_order - b.sort_order)
							?.map((category, i) => {
								return (
									<ScrollLink
										id={`${i}`}
										onClick={() => {
											var element = document.getElementById(category.category_uuid)

											element.scrollIntoView()
											element.scrollIntoView(false)
											element.scrollIntoView({ block: "start" })
											element.scrollIntoView({
												behavior: "smooth",
												block: "end",
												inline: "nearest"
											})
											setIsCategoryOpen(!isCategoryOpen)
											setClickedId(i?.toString())
										}}
										smooth={true}
										duration={1000}
										to={category?.category_uuid}
										className={`${clickedId === i?.toString() ? "activeMenuList" : ""} categorybtn`}
										key={i}
									>
										<span style={{ width: "50%" }}>{category?.category_title}</span>

										<i className="categoryLength" style={{ color: "var(--main)", fontSize: "15px" }}>
											{companies.find(a => a.company_uuid === category.company_uuid)?.company_title || ""}
										</i>
										<span className="categoryLength">
											{filterItems.filter(a => a.category_uuid === category.category_uuid)?.length || 0}
										</span>
									</ScrollLink>
								)
							})}
					</div>
					{isCategoryOpen && <div id="black-bg" />}
					{!isCategoryOpen ? (
						<button className="showMenuListBtn" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
							Categories
						</button>
					) : (
						<button className="showMenuListBtn" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
							<i className="fas fa-times"></i> Close
						</button>
					)}
				</div>
			</div>

			{popupForm ? (
				<NewUserForm onSave={() => setPopupForm(false)} setOrder={setOrder} popupInfo={popupForm} order={order} />
			) : (
				""
			)}
			{discountPopup ? <DiscountPopup onSave={() => setDiscountPopup(false)} setOrder={setOrder} order={order} /> : ""}
			{loading ? (
				<div className="overlay" style={{ zIndex: 9999999 }}>
					<div className="flex" style={{ width: "40px", height: "40px" }}>
						<svg viewBox="0 0 100 100">
							<path d="M10 50A40 40 0 0 0 90 50A40 44.8 0 0 1 10 50" fill="#ffffff" stroke="none">
								<animateTransform
									attributeName="transform"
									type="rotate"
									dur="1s"
									repeatCount="indefinite"
									keyTimes="0;1"
									values="0 50 51;360 50 51"
								></animateTransform>
							</path>
						</svg>
					</div>
				</div>
			) : (
				""
			)}
			{cartPage ? (
				<>
					<button
						type="button"
						className="cartBtn"
						style={{ position: "absolute" }}
						onClick={async () => {
							//   const db = await openDB(
							//     "BT",
							//     +localStorage.getItem("IDBVersion") || 1
							//   );
							//   let tx = await db
							//     .transaction("autobill", "readwrite")
							//     .objectStore("autobill");
							//   let autobills = await tx.getAll();
							//   let store = await db
							//     .transaction("items", "readwrite")
							//     .objectStore("items");
							//   let dbItems = await store.getAll();
							//   let data = await AutoAdd({
							//     counter,
							//     items: order.items,
							//     dbItems,
							//     autobills: autobills.filter((a) => a.status),
							//   });

							//   setOrder((prev) => ({
							//     ...prev,
							//     ...data,
							//     items: data?.items?.map((a) => ({
							//       ...a,
							//       b: +a.b + parseInt(+a.p / +a.conversion),
							//       p: +a.p % +a.conversion,
							//     })),
							//   }));
							//   setTimeout(async () => {
							//     let time = new Date();
							//     Billing({
							//       counter,
							//       items: data.items,
							//       others: {
							//         stage: 1,
							//         user_uuid: localStorage.getItem("user_uuid"),
							//         time: time.getTime(),

							//         type: "NEW",
							//       },
							//       add_discounts: true,
							//     }).then((data) => {
							//       setOrder((prev) => ({ ...prev, ...data }));
							//       postOrder({ ...order, ...data });
							//       db.close();
							//     });
							// }, 2000);
							postOrder()
						}}
					>
						{total ? "Rs: " + total : ""} Submit
					</button>
				</>
			) : confirmItemsPopup ? (
				<button
					type="button"
					onClick={() => {
						setFilterItemTile("")

						setCartPage(true)
						setConfirmItemPopup(false)
						setEnable(false)
					}}
					className="cartBtn"
					style={{
						padding: "3px",
						opacity: enable ? 1 : 0.5,
						position: "absolute",
						zIndex: 9999
					}}
					disabled={!enable}
				>
					Done
				</button>
			) : order?.items?.length ? (
				<button
					type="button"
					onClick={() => {
						if (salesman_suggestion.length) {
							setConfirmItemPopup(true)
							setTimeout(() => setEnable(true), 5000)
							return
						}
						setFilterItemTile("")

						setCartPage(true)
					}}
					className="cartBtn"
					style={{ padding: "3px", position: "absolute" }}
				>
					Cart
				</button>
			) : (
				""
			)}
			{holdPopup ? (
				<HoldPopup
					onSave={() => setHoldPopup(false)}
					orders={order}
					holdPopup={holdPopup}
					itemsData={filterItems}
					setOrder={setOrder}
				/>
			) : (
				""
			)}
			{pricePopup ? (
				<PricePopup
					onSave={() => setPricePopup(false)}
					orders={order}
					holdPopup={pricePopup}
					itemsData={filterItems}
					setOrder={setOrder}
				/>
			) : (
				""
			)}
			{foodLicensePopup ? (
				<div className="overlay">
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
								<form className="form" onSubmit={putCounterData}>
									<div className="formGroup">
										<div className="row" style={{ flexDirection: "row", alignItems: "flex-start" }}>
											<label className="selectLabel flex" style={{ width: "200px" }}>
												Food License
												<input
													type="text"
													name="route_title"
													className="numberInput"
													value={food_license}
													style={{ width: "200px" }}
													onChange={e => setFoodLicence(e.target.value)}
													maxLength={42}
												/>
											</label>
										</div>
									</div>

									<button type="submit" className="submit">
										Save changes
									</button>
								</form>
							</div>
							<button onClick={() => setFoodLicencePopup(false)} className="closeButton">
								x
							</button>
						</div>
					</div>
				</div>
			) : (
				""
			)}
			{invoice_number ? (
				<div className="overlay">
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
								<h3>Invoice Number</h3>
								<h1
									style={{
										width: "100%",
										textAlign: "center",
										fontSize: "50px",
										color: "var(--main)"
									}}
								>
									{invoice_number}
								</h1>
								{checkNumberPopup ? <h2>Incentive Estimate Rs {checkNumberPopup}</h2> : ""}
								<form className="form" onSubmit={putCounterNumber}>
									<button type="submit" className="submit">
										Great
									</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			) : (
				""
			)}
			{imgpopup ? (
				<div className="overlay" style={{ zIndex: 999999999 }}>
					<div
						className="modal"
						style={{
							height: "fit-content",
							width: "max-content",
							minWidth: "250px",
							backgroundColor: "transparent"
						}}
					>
						<div
							className="content"
							style={{
								height: "fit-content",
								padding: "20px",
								width: "fit-content"
							}}
						>
							<div
								style={{
									overflowY: "scroll",
									width: "100%"
								}}
								ref={wrapperRef}
							>
								<img
									style={{
										width: "90vw",
										height: "90vw",
										objectFit: "contain",
										maxWidth: "400px",
										maxHeight: "400px"
									}}
									src={imgpopup ? server + "/" + imgpopup : noimg}
									onError={({ currentTarget }) => {
										currentTarget.onerror = null // prevents looping
										currentTarget.src = noimg
									}}
									alt=""
								/>
							</div>
							<button onClick={() => setImgPopup(false)} className="closeButton">
								x
							</button>
						</div>
					</div>
				</div>
			) : (
				""
			)}
		</>
	)
}

export default LinkedCounter
function HoldPopup({ onSave, orders, itemsData, holdPopup, setOrder }) {
	const [items, setItems] = useState([])
	useEffect(() => {
		setItems(itemsData.filter(a => a.free_issue === "Y"))
	}, [])
	const postOrderData = async () => {
		let data = orders
		let itemsdata = items.filter(a => a.free)
		let filterItem = data?.items?.filter(a => !itemsdata.filter(b => b.item_uuid === a.item_uuid).length)
		let NonFilterItem = data.items.filter(a => itemsdata.filter(b => b.item_uuid === a.item_uuid).length)
		NonFilterItem = itemsdata.map(a =>
			NonFilterItem.filter(b => b.item_uuid === a.item_uuid).length
				? {
						...NonFilterItem.find(b => b.item_uuid === a.item_uuid),
						free: a.free
				  }
				: { ...a, b: 0, p: 0 }
		)
		let item_details = filterItem.length
			? NonFilterItem.length
				? [...filterItem, ...NonFilterItem]
				: filterItem
			: NonFilterItem.length
			? NonFilterItem
			: []
		setOrder(prev => ({ ...prev, items: item_details }))
		
		onSave()
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
																prev.map(a => (a.item_uuid === item.item_uuid ? { ...a, free: e.target.value } : a))
															)
														}
														onWheel={e => e.preventDefault()}
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
					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
function PricePopup({ onSave, orders, itemsData, holdPopup, setOrder }) {
	const [item, setItem] = useState([])
	useEffect(() => {
		setItem(() => {
			let data = itemsData.find(a => a.item_uuid === holdPopup.item_uuid)
			return {
				...data,
				p_price: data.item_price,
				b_price: Math.floor(data.item_price * data.conversion || 0)
			}
		})
	}, [])
	const postOrderData = async () => {
		let data = orders
		let item_details = data.items.map(a =>
			a.item_uuid === holdPopup.item_uuid
				? {
						...a,
						old_price: a.item_price,
						price_approval: "N",
						item_price: item.p_price
				  }
				: a
		)
		setOrder(prev => ({ ...prev, order_status: "A", items: item_details }))
		
		onSave()
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
										<th colSpan={2}>
											<div className="t-head-element">PCS Price</div>
										</th>
										<th colSpan={2}>
											<div className="t-head-element">BOX Price</div>
										</th>
									</tr>
								</thead>
								<tbody className="tbody">
									<tr
										key={item?.item_uuid || Math.random()}
										style={{
											height: "30px"
										}}
									>
										<td colSpan={2}>
											<input
												type="number"
												name="route_title"
												className="numberInput"
												value={item?.p_price || ""}
												style={{
													width: "100px",
													backgroundColor: "transparent",
													color: "#000"
												}}
												onChange={e =>
													setItem(prev => ({
														...prev,
														p_price: e.target.value,
														b_price: (e.target.value * item.conversion || 0).toFixed(2)
													}))
												}
												onWheel={e => e.preventDefault()}
												maxLength={42}
											/>
										</td>

										<td colSpan={2}>
											<input
												type="number"
												name="route_title"
												className="numberInput"
												value={item?.b_price}
												style={{
													width: "100px",
													backgroundColor: "transparent",
													color: "#000"
												}}
												onChange={e =>
													setItem(prev => ({
														...prev,
														b_price: e.target.value,
														p_price: (e.target.value / item.conversion || 0).toFixed(2)
													}))
												}
												onWheel={e => e.preventDefault()}
												maxLength={42}
											/>
										</td>
									</tr>
								</tbody>
								<thead>
									<tr>
										<th colSpan={4}>
											<div className="t-head-element">Discount</div>
										</th>
									</tr>
								</thead>
								<tbody className="tbody">
									<tr>
										<td colSpan={4}>
											<input
												type="number"
												name="route_title"
												className="numberInput"
												value={item?.discount}
												style={{
													width: "100px",
													backgroundColor: "transparent",
													color: "#000"
												}}
												onChange={e => {
													let item_price = +item.item_price * +item.conversion
													setItem(prev => ({
														...prev,
														b_price: (item_price - (item_price * e.target.value) / 100)?.toFixed(2),
														p_price: (+item.item_price - (+item.item_price * e.target.value) / 100)?.toFixed(2)
													}))
												}}
												onWheel={e => e.preventDefault()}
												maxLength={42}
											/>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

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
					</div>
					<button onClick={onSave} className="closeButton">
						x
					</button>
				</div>
			</div>
		</div>
	)
}
function NewUserForm({ onSave, popupInfo, setOrder, order }) {
	const [data, setdata] = useState({})
	useEffect(() => {
		let data = order.items?.find(a => a.item_uuid === popupInfo.item_uuid)
		setdata({
			b: data?.b || 0,
			p: data?.p || 0
		})
	}, [])
	const submitHandler = async e => {
		e.preventDefault()
		setOrder(prev => ({
			...prev,
			items: (prev?.items?.filter(a => a.item_uuid === popupInfo.item_uuid)?.length
				? prev?.items?.map(a =>
						a.item_uuid === popupInfo.item_uuid
							? {
									...a,
									b: +data.b + parseInt(+data.p / +popupInfo.conversion),
									p: +data.p % +popupInfo.conversion
							  }
							: a
				  )
				: prev?.items?.length
				? [
						...prev?.items,
						{
							...popupInfo,
							b: +data.b + parseInt(+data.p / +popupInfo.conversion),
							p: +data.p % +popupInfo.conversion
						}
				  ]
				: [
						{
							...popupInfo,
							b: +data.b + parseInt(+data.p / +popupInfo.conversion),
							p: +data.p % +popupInfo.conversion
						}
				  ]
			).filter(a => a.b || a.p || a.free)
		}))
		onSave()
	}

	return (
		<div className="overlay">
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
										{popupInfo.conversion || 0}
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
											autoFocus={true}
											maxLength={42}
											onWheel={e => e.preventDefault()}
										/>
									</label>
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
function DiscountPopup({ onSave, setOrder, order }) {
	const [data, setdata] = useState({})
	const [itemsData, setItemsData] = useState([])
	const { counter_uuid } = useParams()
	const submitHandler = async e => {
		e.preventDefault()
		setOrder(prev => ({
			...prev,
			items: prev?.items?.map(a =>
				a.exclude_discount === 0
					? {
							...a,
							charges_discount: [...(a.charges_discount || []), { title: "Bill Discounting", value: data }]
					  }
					: a
			)
		}))
		onSave()
	}
	const DiscountEligablilityChecking = async () => {
		const response = await axios({
			method: "post",
			url: "/counter_scheme/getRangeOrderEligibleDiscounts",
			data: {
				...order,
				counter_uuid,
				user_uuid: localStorage.getItem("user_uuid")
			},
			headers: {
				"Content-Type": "application/json"
			}
		})
		if (response.data.success) setItemsData(response.data.result)
	}
	useEffect(() => {
		DiscountEligablilityChecking()
	}, [])
	return (
		<div className="overlay">
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
										Discount
										<input
											type="number"
											name="route_title"
											className="numberInput"
											value={data}
											style={{ width: "100px" }}
											onChange={e => setdata(e.target.value)}
											autoFocus={true}
											maxLength={42}
											onWheel={e => e.preventDefault()}
										/>
									</label>
								</div>
								{itemsData?.map(item => (
									<div className="row" style={{ flexDirection: "row", alignItems: "flex-start" }}>
										<label className="selectLabel flex" style={{ width: "100px" }}>
											{item.discount_title || ""} is eligible
										</label>
									</div>
								))}
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
