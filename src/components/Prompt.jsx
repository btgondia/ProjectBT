import React from "react"

const Prompt = ({ message, heading, actions }) => {
	return (
		<div className="overlay-wrapper">
			<div className="prompt">
				{heading && <h2>{heading}</h2>}
				<p>{message}</p>
				<div className="prompt-actions">
					{actions?.map(i => (
						<button className={i.classname} onClick={i.action}>
							{i.label}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}

export default Prompt
