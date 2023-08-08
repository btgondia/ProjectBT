import React from "react"

const Loader = ({ visible }) => {
	return visible ? (
		<div className="overlay">
			<span className="loader"></span>
		</div>
	) : (
		<></>
	)
}

export default Loader
