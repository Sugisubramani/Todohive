// File: src/components/CustomReactDatetimePicker.js
import React, { useState, useEffect } from 'react';
import Datetime from 'react-datetime';
import moment from 'moment';
import "react-datetime/css/react-datetime.css";

const CustomReactDatetimePicker = ({ selectedDate, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  // Update the displayed input when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      // Check if the selectedDate is already a date-only string (e.g. "2025-03-18")
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyRegex.test(selectedDate)) {
        setInputValue(moment(selectedDate, "YYYY-MM-DD").format("MMMM D, YYYY"));
      } else {
        setInputValue(moment(selectedDate).format("MMMM D, YYYY h:mm A"));
      }
    } else {
      setInputValue('');
    }
  }, [selectedDate]);

  const handleChange = (date) => {
    // If the user is typing manually, simply update the input value.
    if (typeof date === 'string') {
      setInputValue(date);
    } else if (moment.isMoment(date) && date.isValid()) {
      // If the user selects a date via the calendar, check the time.
      if (date.hour() === 0 && date.minute() === 0 && date.second() === 0) {
        // Treat as date-only.
        const display = date.format("MMMM D, YYYY");
        setInputValue(display);
        onChange(date.format("YYYY-MM-DD"));
      } else {
        // Date & time provided.
        const display = date.format("MMMM D, YYYY h:mm A");
        setInputValue(display);
        onChange(date.toISOString());
      }
    }
  };

  const handleBlur = () => {
    // On blur, try parsing the input in both formats.
    let m = moment(inputValue, "MMMM D, YYYY h:mm A", true);
    if (!m.isValid()) {
      m = moment(inputValue, "MMMM D, YYYY", true);
    }
    if (m.isValid()) {
      if (m.hour() === 0 && m.minute() === 0 && m.second() === 0) {
        const display = m.format("MMMM D, YYYY");
        setInputValue(display);
        onChange(m.format("YYYY-MM-DD"));
      } else {
        const display = m.format("MMMM D, YYYY h:mm A");
        setInputValue(display);
        onChange(m.toISOString());
      }
    }
  };

  const valid = (current) => current.isAfter(moment().subtract(1, 'day'));

  return (
    <div className="custom-datetime-picker">
      <Datetime
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        isValidDate={valid}
        dateFormat="MMMM D, YYYY"
        timeFormat="h:mm A"
        closeOnSelect={false}
        inputProps={{
          className: "form-control",
          placeholder: "Date & Time"
        }}
      />
    </div>
  );
};

export default CustomReactDatetimePicker;
