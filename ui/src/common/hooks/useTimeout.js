import React, { useEffect } from "react";

export const useTimeout = (callback, ms = 1000) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      callback();
    }, ms);
    return () => clearTimeout(timer);
  });
};
