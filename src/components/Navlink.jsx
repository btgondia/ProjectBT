import React, { useContext, useState } from "react"
import { Link } from "react-router-dom"
import { ViewGridIcon } from "@heroicons/react/solid"
import context from "../context/context"

const NavLink = ({
	title,
	icon,
	menuList,
	draggable,
	href,

	setCollectionTags,
	setcalculationPopup,
}) => {
	// console.log(title)
	const [menuVisible, setMenuVisible] = useState(false)
	const { setCashRegisterPopup, setIsItemAvilableOpen } = useContext(context)
	return (
		<Link to={{ pathname: href }} className="nav_link_container" onClick={() => {}}>
			<div
				className={`nav-link`}
				draggable={draggable}
				onClick={() => menuList && setMenuVisible(!menuVisible)}
				onMouseLeave={e => setMenuVisible(false)}
				id={`item-category-${title?.toLowerCase()}`}>
				<>
					{icon}
					<p>
						{draggable && (
							<ViewGridIcon
								style={{
									minWidth: "1rem",
									maxWidth: "1rem",
									marginRight: 10,
									cursor: "move",
								}}
							/>
						)}
						<span className={`nav_title`}>
							{title?.slice(0, 31)}
							{title?.length > 32 && "..."}
						</span>
					</p>
				</>
				{/* Submenu popup*/}
				{menuList && (
					<div
						className="menu"
						style={{
							display: menuVisible ? "block" : "none",
							top: title === "Report" ? "-300px" : title === "Setup" ? "-190px" : "-10px",
							width: title === "Report" ? "300px" : "200px",
						}}>
						{menuList
							.filter(a => a)
							.map(menu => (
								<div
									className="item"
									key={Math.random()}
									onClick={() => {
										if (menu.name === "Cash Register") {
											setCashRegisterPopup(true)
										} else if (menu.name === "Trips") {
											setIsItemAvilableOpen(prev => !prev)
										} else if (menu.name === "Calculate Lines") {
											setcalculationPopup(prev => !prev)
										} else if (menu.name === "Collection Tags") {
											setCollectionTags(true)
										}
									}}>
									{<Link to={menu.link}>{menu.name}</Link>}
								</div>
							))}
					</div>
				)}
			</div>
		</Link>
	)
}

export default NavLink
