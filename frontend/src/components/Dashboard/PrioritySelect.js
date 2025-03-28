import React from 'react';
import Select from 'react-select';

const priorityOptions = [
  { value: '', label: 'None', color: "#212529" },
  { value: 'High', label: 'High', color: "red" },
  { value: 'Medium', label: 'Medium', color: "orange" },
  { value: 'Low', label: 'Low', color: "green" },
];

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    height: '37.6px',
    minHeight: '37.6px',
    padding: '0 12px',
    border: '1px solid #ced4da',
    borderRadius: '0.34rem',
    fontSize: '1rem',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,0.25)' : 'none',
    "&:hover": {
      borderColor: "#80bdff",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '6px 12px',
    height: '37.6px',
    display: 'flex',
    alignItems: 'center', 
  }),
  singleValue: (provided, state) => ({
    ...provided,
    color: state.data?.color || '#212529',
    fontWeight: '400',
    fontSize: '1rem',
    lineHeight: '24px', 
    fontFamily: 'inherit',
    margin: 0,
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: '37.6px',
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '1rem',
    color: state.data?.color || '#212529',
    backgroundColor: state.isFocused ? '#f8f9fa' : '#fff',
    fontFamily: 'inherit',
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: '1rem',
    color: '#212529',
    fontFamily: 'inherit',
  }),
};


const PrioritySelect = ({ value, onChange }) => {
  const selectedOption =
    priorityOptions.find(option => option.value === value) || priorityOptions[0];

  return (
    <Select
      classNamePrefix="form-select"
      options={priorityOptions}
      value={selectedOption}
      onChange={(option) => onChange(option.value)}
      styles={customSelectStyles}
      isSearchable={false}
    />
  );
};

export default PrioritySelect;