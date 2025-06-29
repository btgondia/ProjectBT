import React from "react"

const Loader = ({ visible }) => {
	return visible ? (
		<div className="overlay">
			<span className="loader" />
		</div>
	) : (
		<></>
	)
}

export default Loader
