import React from "react"

const Prompt = ({ message, heading, actions, classes, loading }) => {
	return (
		<div className="overlay-wrapper">
			<div className={"prompt " + (classes?.wrapper || "")}>
				{heading && <h2>{heading}</h2>}
				<p>{message}</p>
				<div className="prompt-actions">
					{actions?.map(i => (
						<button disabled={i.loading || i.disabled} className={i.classname} style={i.style} onClick={i.action}>
							{i.loading ? (
								<span
									className="loader small"
									style={{
										borderColor: "white",
										borderBottomColor: "transparent",
										width: "16px",
										height: "16px",
										borderWidth: "2.5px"
									}}
								/>
							) : null}
							<span>{i.label}</span>
						</button>
					))}
				</div>
				{loading && (
					<div id="spinner-wrapper" className={classes?.wrapper}>
						<span
							className="loader small"
							style={{
								borderColor: "var(--mainColor)",
								borderBottomColor: "transparent"
							}}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default Prompt
