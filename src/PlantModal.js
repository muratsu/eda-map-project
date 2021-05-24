import React, { useState } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const PlantModal = (props) => {
  const { isOpen, onRequestClose, onSubmit } = props;
  const [value, setValue] = useState(props.name);

  const handleChange = (event) => {
      setValue(event.target.value);
  };

  const saveAndSubmit = () => {
    onSubmit(value);
    setValue("");
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="My dialog"
      className="mymodal"
      overlayClassName="myoverlay"
      closeTimeoutMS={500}
    >
      <div className="modal-content">
        <div className="modal-header">
          <button type="button" onClick={onRequestClose}
            className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
          <h4 className="modal-title">Enter your message</h4>
        </div>
        <div className="modal-body">
          <textarea className="textarea" value={value} onChange={handleChange} placeholder="Write a message here.."/>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={saveAndSubmit}>Save</button>
        </div>
      </div>
    </Modal>
  );
};

export default PlantModal;
