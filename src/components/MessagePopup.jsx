import React from "react"

const MessagePopup = ({ onClose, message, message2, onSave, button1, button2, button = {} }) => {
	return (
		<div className="overlay" style={{ position: "fixed", top: 0, left: 0, zIndex: 9999999999 }}>
			<div className="modal" style={{ height: "fit-content", width: "fit-content" }}>
				<div
					className="content"
					style={{
						height: "fit-content",
						padding: "20px",
						width: "fit-content",
					}}>
					<div style={{ overflowY: "scroll" }}>
						<form
							className="form"
							onSubmit={e => {
								e.preventDefault()
								onClose()
							}}>
							<div className="formGroup">
								<div className="row" style={{ flexDirection: "column", alignItems: "start" }}>
									<h1 style={{ textAlign: "center" }}>{message}</h1>
									{message2 ? <h3 style={{ textAlign: "center" }}>{message2}</h3> : ""}
								</div>

								<div className="row message-popup-actions">
									{button2 ? (
										<button className="simple_Logout_button" type="button" onClick={onSave}>
											{button2}
										</button>
									) : (
										""
									)}
									<button className="simple_Logout_button" type="submit">
										{button1}
									</button>

									{button?.visible && (
										<button className="simple_Logout_button" type="button" onClick={button?.action}>
											{button?.label}
										</button>
									)}
								</div>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default MessagePopup
