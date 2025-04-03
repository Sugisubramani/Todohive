import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, FormControl } from 'react-bootstrap';
import Datetime from 'react-datetime';
import moment from 'moment';
import { FiX, FiCheck } from 'react-icons/fi';
import "react-datetime/css/react-datetime.css";
import "../../styles/CustomPopupDateTimePicker.css";

const CustomPopupDateTimePicker = ({ selectedDate, onChange, isDateOnly }) => {
  const initialHasTime = isDateOnly 
    ? false 
    : (selectedDate ? /[0-9]{1,2}:[0-9]{2}/.test(selectedDate.toString()) : false);
  const initialDate = selectedDate ? moment(selectedDate) : null;

  const [tempDate, setTempDate] = useState(initialDate);
  const [hasTime, setHasTime] = useState(initialHasTime);
  
  const [dateInputValue, setDateInputValue] = useState(
    initialDate 
      ? (isDateOnly 
           ? initialDate.format("MMMM D, YYYY") 
           : (initialHasTime 
                ? initialDate.format("MMMM D, YYYY h:mm A") 
                : initialDate.format("MMMM D, YYYY")))
      : "Date & Time"
  );
  const [timeInputValue, setTimeInputValue] = useState(
    initialDate ? initialDate.format("h:mm A") : moment().format("h:mm A")
  );
  
  const [dateInputFocused, setDateInputFocused] = useState(false);
  const [timeInputFocused, setTimeInputFocused] = useState(false);
  const [isDateEdited, setIsDateEdited] = useState(false);
  const [isTimeEdited, setIsTimeEdited] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [showTimePopup, setShowTimePopup] = useState(false);
  const popupRef = useRef(null);
  const timePopupRef = useRef(null);
  const hourColumnRef = useRef(null);
  const minuteColumnRef = useRef(null);
  const periodColumnRef = useRef(null);

  const formatDisplay = (date, withTime) => {
    return withTime ? date.format("MMMM D, YYYY h:mm A") : date.format("MMMM D, YYYY");
  };

  useEffect(() => {
    if (tempDate && !dateInputFocused) {
      setDateInputValue(formatDisplay(tempDate, hasTime));
      setIsDateEdited(false);
    } else if (!tempDate) {
      setDateInputValue("Date & Time");
    }
  }, [tempDate, hasTime, dateInputFocused]);

  useEffect(() => {
    if (tempDate && !timeInputFocused) {
      setTimeInputValue(tempDate.format("h:mm A"));
      setIsTimeEdited(false);
    }
  }, [tempDate, timeInputFocused]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showPopup &&
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        (!timePopupRef.current || !timePopupRef.current.contains(event.target))
      ) {
        setShowPopup(false);
      }
      if (showTimePopup && timePopupRef.current && !timePopupRef.current.contains(event.target)) {
        setShowTimePopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopup, showTimePopup]);

  const validDate = (current) => current.isSameOrAfter(moment().startOf("day"));

  const handleDateInputChange = (e) => {
    setDateInputValue(e.target.value);
    setIsDateEdited(true);
  };

  const clearDate = () => {
    setTempDate(null);
    setHasTime(false);
    onChange("");
    setDateInputValue("");
    setTimeInputValue("");
  };

  const commitDateChange = () => {
    if (dateInputValue.trim() === "") {
      clearDate();
      return;
    }
    if (isDateOnly) {
      let m = moment(dateInputValue, ["MMMM D, YYYY", "MMM D, YYYY"], true);
      if (m.isValid()) {
        m = m.startOf("day");
        setTempDate(m);
        setHasTime(false);
        onChange(m.format("YYYY-MM-DD"));
        setIsDateEdited(false);
      } else {
        setDateInputValue(tempDate ? formatDisplay(tempDate, false) : "Date & Time");
      }
      return;
    }
    let m = moment(
      dateInputValue,
      [
        "MMMM D, YYYY h:mm A",
        "MMMM D, YYYY h:mmA",
        "MMM D, YYYY h:mm A",
        "MMM D, YYYY h:mmA"
      ],
      true
    );
    let _hasTime = false;
    if (!m.isValid()) {
      m = moment(
        dateInputValue,
        ["MMMM D, YYYY", "MMM D, YYYY"],
        true
      );
      if (m.isValid()) {
        _hasTime = false;
        m = m.hour(0).minute(0).second(0);
      }
    } else {
      _hasTime = true;
    }
    if (m && m.isValid()) {
      setTempDate(m);
      setHasTime(_hasTime);
      onChange(_hasTime ? m.toISOString() : m.format("YYYY-MM-DD"));
      setIsDateEdited(false);
    } else {
      setDateInputValue(tempDate ? formatDisplay(tempDate, hasTime) : "Date & Time");
    }
  };

  const handleDateInputBlur = () => {
    setDateInputFocused(false);
    commitDateChange();
  };

  const handleDateChange = (date) => {
    if (moment.isMoment(date) && date.isValid() && date.isSameOrAfter(moment(), "day")) {
      if (isDateOnly) {
        const updatedDate = date.clone().startOf("day");
        setTempDate(updatedDate);
        setHasTime(false);
        setDateInputValue(updatedDate.format("MMMM D, YYYY"));
        onChange(updatedDate.format("YYYY-MM-DD"));
      } else {
        const updatedDate = date.clone().hour(0).minute(0).second(0);
        setTempDate(updatedDate);
        setHasTime(false);
        setDateInputValue(updatedDate.format("MMMM D, YYYY"));
        onChange(updatedDate.format("YYYY-MM-DD"));
      }
    }
  };

  const handleTimeInputChange = (e) => {
    setTimeInputValue(e.target.value);
    setIsTimeEdited(true);
  };

  const commitTimeChange = () => {
    if (timeInputValue.trim() === "") {
      if (tempDate) {
        const updatedDate = tempDate.clone().hour(0).minute(0).second(0);
        setTempDate(updatedDate);
        setHasTime(false);
        onChange(updatedDate.format("YYYY-MM-DD"));
      }
      setIsTimeEdited(false);
      return;
    }
    const parsedTime = moment(timeInputValue, "h:mm A", true);
    if (parsedTime.isValid()) {
      const updatedDate = (tempDate || moment()).clone()
        .hour(parsedTime.hour())
        .minute(parsedTime.minute())
        .second(0);
      setTempDate(updatedDate);
      setHasTime(true);
      onChange(updatedDate.toISOString());
      setIsTimeEdited(false);
    } else {
      setTimeInputValue(tempDate ? tempDate.format("h:mm A") : moment().format("h:mm A"));
    }
  };

  const handleTimeInputBlur = () => {
    setTimeInputFocused(false);
    commitTimeChange();
  };

  const now = moment();
  const baseTime = (tempDate && tempDate.isSame(now, "day") && tempDate.isBefore(now))
    ? now
    : (tempDate || now);

  const getCandidateTimeForHour = (newHour) => {
    const currentPeriod = baseTime.hour() >= 12 ? "PM" : "AM";
    const newHour24 = currentPeriod === "AM" ? (newHour % 12) : ((newHour % 12) + 12);
    return moment(baseTime).hour(newHour24);
  };

  const getCandidateTimeForMinute = (newMinute) => moment(baseTime).minute(newMinute);
  const getCandidateTimeForPeriod = (newPeriod) => {
    let currentHour12 = baseTime.hour() % 12;
    if (currentHour12 === 0) currentHour12 = 12;
    const newHour24 = newPeriod === "AM" ? (currentHour12 % 12) : ((currentHour12 % 12) + 12);
    return moment(baseTime).hour(newHour24);
  };

  const isToday = baseTime.isSame(now, "day");

  const handleHourSelect = (selectedHour) => {
    const candidate = getCandidateTimeForHour(selectedHour);
    if (isToday && candidate.isBefore(now)) return; 
    const updatedDate = moment(baseTime)
      .hour(candidate.hour())
      .minute(tempDate ? tempDate.minute() : baseTime.minute())
      .second(0);
    setTempDate(updatedDate);
    setHasTime(true);
    onChange(updatedDate.toISOString());
  };

  const handleMinuteSelect = (selectedMinute) => {
    const candidate = getCandidateTimeForMinute(selectedMinute);
    if (isToday && candidate.isBefore(now)) return;
    const updatedDate = moment(baseTime).minute(selectedMinute).second(0);
    setTempDate(updatedDate);
    setHasTime(true);
    onChange(updatedDate.toISOString());
  };

  const handleAmPmSelect = (selectedPeriod) => {
    const candidate = getCandidateTimeForPeriod(selectedPeriod);
    if (isToday && candidate.isBefore(now)) return;
    const currentMinutes = tempDate ? tempDate.minute() : baseTime.minute();
    const updatedDate = moment(baseTime)
      .hour(candidate.hour())
      .minute(currentMinutes)
      .second(0);
    setTempDate(updatedDate);
    setHasTime(true);
    onChange(updatedDate.toISOString());
  };

  const clearTime = () => {
    if (tempDate) {
      const updatedDate = tempDate.clone().hour(0).minute(0).second(0);
      setTempDate(updatedDate);
      setHasTime(false);
      onChange(updatedDate.format("YYYY-MM-DD"));
    }
    setTimeInputValue("");
  };

  const handleTimeButtonClick = () => {
    if (!tempDate || (isToday && tempDate.isBefore(now))) {
      const newTime = now;
      setTempDate(newTime);
      setTimeInputValue(newTime.format("h:mm A"));
    }
    setShowTimePopup(true);
  };

  const handleSelectToday = () => {
    const today = moment().startOf('day');
    setTempDate(today);
    setHasTime(false);
    setDateInputValue(today.format("MMMM D, YYYY"));
    onChange(today.format("YYYY-MM-DD"));
  };

  const handleSelectTomorrow = () => {
    const tomorrow = moment().add(1, 'day').startOf('day');
    setTempDate(tomorrow);
    setHasTime(false);
    setDateInputValue(tomorrow.format("MMMM D, YYYY"));
    onChange(tomorrow.format("YYYY-MM-DD"));
  };

  const displayValue = tempDate ? formatDisplay(tempDate, hasTime) : "Date & Time";

  const hoursArray = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);
  const periodsArray = useMemo(() => ["AM", "PM"], []);

  const currentHour12 = baseTime.hour() % 12 === 0 ? 12 : baseTime.hour() % 12;
  const currentMinute = baseTime.minute();
  const currentPeriod = baseTime.hour() >= 12 ? 'PM' : 'AM';

  useEffect(() => {
    if (showTimePopup) {
      if (hourColumnRef.current) {
        const index = hoursArray.indexOf(currentHour12);
        hourColumnRef.current.scrollTop = index * 32;
      }
      if (minuteColumnRef.current) {
        minuteColumnRef.current.scrollTop = currentMinute * 32;
      }
      if (periodColumnRef.current) {
        const index = periodsArray.indexOf(currentPeriod);
        periodColumnRef.current.scrollTop = index * 32;
      }
    }
  }, [showTimePopup, currentHour12, currentMinute, currentPeriod, hoursArray, periodsArray]);

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <Button 
        onClick={() => setShowPopup(!showPopup)}
        className="custom-datetime-main-button"
        style={{ display: 'flex', alignItems: 'center', width: '230px' }}
      >
        <span style={{ fontSize: '1rem' }}>{displayValue}</span>
        {tempDate && (
          <FiX 
            onClick={(e) => {
              e.stopPropagation();
              clearDate();
            }}
            style={{ fontSize: '0.9rem', marginLeft: 'auto' }}
            className="custom-cross"
          />
        )}
      </Button>

      {showPopup && (
        <div 
          ref={popupRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '-320px',
            right: '-305px',
            width: '135%',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '1rem',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <div className="date-input-container" style={{ position: 'relative' }}>
            <FormControl
              type="text"
              value={dateInputValue}
              onChange={handleDateInputChange}
              onBlur={handleDateInputBlur}
              onFocus={() => setDateInputFocused(true)}
              placeholder="Edit Date & Time"
              className="custom-datetime-picker-input"
              style={{ border: '1px solid black' }}
            />
            {isDateEdited && (
              <FiCheck 
                onClick={commitDateChange}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.2rem'
                }}
                className="custom-tick"
              />
            )}
          </div>
          <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <span className="quick-select-option" style={{ cursor: 'pointer', color: '#0d6efd' }} onClick={handleSelectToday}>
                Today
              </span>
              <span className="quick-select-option" style={{ cursor: 'pointer', color: '#0d6efd' }} onClick={handleSelectTomorrow}>
                Tomorrow
              </span>
              <span className="quick-select-option" style={{ cursor: 'pointer', color: '#6c757d' }} onClick={clearDate}>
                No Date
              </span>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Datetime
              value={tempDate || moment()}
              onChange={handleDateChange}
              isValidDate={validDate}
              dateFormat="MMMM D, YYYY"
              timeFormat={false}
              closeOnSelect={true}
              input={false}
            />
          </div>
          {!isDateOnly && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <Button
                onClick={handleTimeButtonClick}
                className="custom-datetime-time-button"
              >
                {hasTime ? (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div style={{ textAlign: 'center'}}>
                      {tempDate.format("h:mm A")}
                    </div>
                    <div 
                      onClick={(e) => { 
                        e.stopPropagation();
                        clearTime();
                      }}
                      style={{ 
                        position: 'absolute', 
                        right: '8px', 
                        top: '50%', 
                        transform: 'translateY(-53%)'
                      }}
                      className="custom-cross"
                    >
                      <FiX />
                    </div>
                  </div>
                ) : (
                  "Time"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {showTimePopup && !isDateOnly && (
        <div 
          ref={timePopupRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '-245px',
            right: '-270px',
            width: '100%',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '0.75rem',
            zIndex: 1100,
            maxHeight: '300px'
          }}
        >
          <div style={{ position: 'sticky', top: 0, zIndex: 2, marginBottom: '0.5rem' }}>
            <FormControl
              type="text"
              value={timeInputValue}
              onChange={handleTimeInputChange}
              onBlur={handleTimeInputBlur}
              onFocus={() => setTimeInputFocused(true)}
              placeholder="Enter time (e.g., 2:30 PM)"
              className="time-popup-input"
              style={{ fontSize: '0.9rem', padding: '0.375rem', width: '200px', border: '1px solid black' }}
            />
            {isTimeEdited && (
              <FiCheck 
                onClick={commitTimeChange}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.2rem'
                }}
                className="custom-tick"
              />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div ref={hourColumnRef} style={{ overflowY: 'auto', maxHeight: '200px', width: '30%', borderRight: '1px solid #ccc' }}>
              {hoursArray.map(h => {
                const candidate = getCandidateTimeForHour(h);
                const isDisabled = isToday && candidate.isBefore(now);
                return (
                  <div 
                    key={h}
                    onClick={() => { if (!isDisabled) handleHourSelect(h); }}
                    style={{
                      height: '32px',
                      lineHeight: '32px',
                      textAlign: 'center',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      pointerEvents: isDisabled ? 'none' : 'auto',
                      opacity: isDisabled ? 0.5 : 1,
                      backgroundColor: h === currentHour12 ? "#007bff" : "transparent",
                      color: h === currentHour12 ? "#fff" : "#000",
                      fontSize: '0.9rem'
                    }}
                  >
                    {h}
                  </div>
                );
              })}
            </div>
            <div ref={minuteColumnRef} style={{ overflowY: 'auto', maxHeight: '200px', width: '40%', borderRight: '1px solid #ccc' }}>
              {minutesArray.map(m => {
                const candidate = getCandidateTimeForMinute(m);
                const isDisabled = isToday && candidate.isBefore(now);
                return (
                  <div 
                    key={m}
                    onClick={() => { if (!isDisabled) handleMinuteSelect(m); }}
                    style={{
                      height: '32px',
                      lineHeight: '32px',
                      textAlign: 'center',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      pointerEvents: isDisabled ? 'none' : 'auto',
                      opacity: isDisabled ? 0.5 : 1,
                      backgroundColor: m === currentMinute ? "#007bff" : "transparent",
                      color: m === currentMinute ? "#fff" : "#000",
                      fontSize: '0.9rem'
                    }}
                  >
                    {m < 10 ? `0${m}` : m}
                  </div>
                );
              })}
            </div>
            <div ref={periodColumnRef} style={{ overflowY: 'auto', maxHeight: '200px', width: '30%' }}>
              {periodsArray.map(ap => {
                const candidate = getCandidateTimeForPeriod(ap);
                const isDisabled = isToday && candidate.isBefore(now);
                return (
                  <div 
                    key={ap}
                    onClick={() => { if (!isDisabled) handleAmPmSelect(ap); }}
                    style={{
                      height: '32px',
                      lineHeight: '32px',
                      textAlign: 'center',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      pointerEvents: isDisabled ? 'none' : 'auto',
                      opacity: isDisabled ? 0.5 : 1,
                      backgroundColor: ap === currentPeriod ? "#007bff" : "transparent",
                      color: ap === currentPeriod ? "#fff" : "#000",
                      fontSize: '0.9rem'
                    }}
                  >
                    {ap}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomPopupDateTimePicker;