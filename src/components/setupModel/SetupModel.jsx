import  "./style.css";

export default function SetupModal({ children, onClose }) {
  return (
    <div className="overlay">
      <div className="modal">
        <div className="content">
          {children} 
          <button onClick={onClose} className="closeButton">
            x
          </button>
        </div>
      </div>
    </div>
  );
}
