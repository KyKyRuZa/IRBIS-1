import { useState, useCallback } from 'react';

export function useFormState(initialState = {}) {
  const [values, setValues] = useState(initialState);

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setMany = useCallback((updates) => {
    setValues((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialState);
  }, [initialState]);

  const bind = useCallback(
    (name) => ({
      value: values[name],
      onChange: (e) => setValue(name, e.target.value),
    }),
    [values, setValue]
  );

  return { values, setValue, setMany, reset, bind };
}
