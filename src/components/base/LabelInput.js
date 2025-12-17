import React from 'react';

const LabelInput = ({ label, value, onChange }) => {
    return (
        <div className='label-input'>
            <label>{label}</label>
            <input type='text' value={value} onChange={onChange} />
        </div>
    );
};

export default LabelInput;