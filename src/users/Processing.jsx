import axios from "axios"
import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { IoArrowBackOutline } from "react-icons/io5"
import { AiOutlineReload } from "react-icons/ai"

const Processing = () => {
	const [tripData, setTripData] = useState([])
	const [loading, setLoading] = useState(false)
	const Navigate = useNavigate()
	const Location = useLocation()
	const getTripData = async () => {
		setLoading(true)
		const response = await axios({
			method: "post",
			data: { user_uuid: localStorage.getItem("user_uuid") },
			url: Location.pathname.includes("checking")
				? "/trips/GetCheckingTripList"
				: Location.pathname.includes("delivery")
				? "/trips/GetDeliveryTripList"
				: "/trips/GetProcessingTripList",

			headers: {
				"Content-Type": "application/json",
			},
		})
		if (response.data.success) {
			setTripData(response.data.result)
			setLoading(false)
		}
	}
	useEffect(() => {
		getTripData()
	}, [])

	return (
		<div className="servicePage">
			<nav className="user_nav nav_styling" style={{ top: "0", maxWidth: "500px" }}>
				<div
					className="user_menubar flex"
					style={{
						width: "100%",
						justifyContent: "space-between",
						paddingRight: "5px",
					}}>
					<IoArrowBackOutline className="user_Back_icon" onClick={() => Navigate("/users")} />

					<h1
						style={{
							width: "80%",
							textAlign: "left",
							marginLeft: "40px",
							textTransform: "capitalize",
						}}>
						{Location?.pathname?.split("/")?.filter(i => i)?.[1]}
					</h1>

					<AiOutlineReload
						className="user_Back_icon"
						onClick={() => {
							getTripData()
						}}
					/>
				</div>
			</nav>

			<div
				className="servicesContainer"
				style={{
					width: "100%",
					padding: "20px",
					height: "90vh",
					gridAutoFlow: "row",
					gridAutoRows: "20%",
					marginTop: "20px",
					backgroundColor: "#f2f2f2",
					overflowY: "scroll",
					paddingBottom: "100px",
				}}>
				{tripData.length ? (
					tripData
						?.filter(a => a.trip_title && a.orderLength)
						?.sort((a, b) => (a.created_at ? a.created_at - b.created_at : -1))
						.map((data, i) => (
							<div
								key={i}
								to={
									"#"
									// pathname + rolesArray.find((a) => +a.type === +data)?.link
								}
								className="linkDecoration"
								onClick={() => {
									sessionStorage.setItem("trip_title", data?.trip_title)
									let link =
										`/users/${
											Location.pathname.includes("checking")
												? "checking"
												: Location.pathname.includes("delivery")
												? "delivery"
												: "processing"
										}/` + data?.trip_uuid

									Navigate(link)
								}}>
								<div className="service">
									<span>{data.trip_title}</span>
								</div>
							</div>
						))
				) : (
					<h1>No Order</h1>
				)}
			</div>
			{loading ? (
				<div className="overlay">
					<div className="flex" style={{ width: "40px", height: "40px" }}>
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
					</div>
				</div>
			) : (
				""
			)}
		</div>
	)
}

export default Processing
