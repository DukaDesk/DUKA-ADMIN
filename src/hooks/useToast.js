import { useState, useCallback } from "react";

let nextId = 0;

export default function useToast() {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((msg, type = "success") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, msg, type }]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
