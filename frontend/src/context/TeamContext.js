// src/context/TeamContext.js
import React, { createContext, useState } from 'react';

export const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  return (
    <TeamContext.Provider value={{ selectedTeam, setSelectedTeam }}>
      {children}
    </TeamContext.Provider>
  );
};
