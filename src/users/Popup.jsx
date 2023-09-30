import React from "react"
import { IoIosCloseCircle } from "react-icons/io"

const Popup = ({ close, Content }) => {
	return (
		<div className="overlay">
			<div className="modal mobile_popup">
				<button className="closeButton icon" onClick={close}>
					<IoIosCloseCircle />
				</button>
				<Content />
			</div>
		</div>
	)
}

export default Popup
