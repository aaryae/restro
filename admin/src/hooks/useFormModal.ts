import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type FormModalState = {
  open: boolean;
  /** null = create, number = edit */
  editId: number | null;
};

/**
 * Add/edit modal state for list pages.
 * Syncs `?add=1` / `?edit=:id` so old add/edit routes can redirect here.
 */
export function useFormModal(paramPrefix = "") {
  const addKey = paramPrefix ? `${paramPrefix}add` : "add";
  const editKey = paramPrefix ? `${paramPrefix}edit` : "edit";
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<FormModalState>({
    open: false,
    editId: null,
  });

  const clearParams = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (!next.has(addKey) && !next.has(editKey)) return;
    next.delete(addKey);
    next.delete(editKey);
    setSearchParams(next, { replace: true });
  }, [addKey, editKey, searchParams, setSearchParams]);

  const openAdd = useCallback(() => {
    setState({ open: true, editId: null });
  }, []);

  const openEdit = useCallback((id: number) => {
    setState({ open: true, editId: id });
  }, []);

  const close = useCallback(() => {
    setState({ open: false, editId: null });
    clearParams();
  }, [clearParams]);

  useEffect(() => {
    const edit = searchParams.get(editKey);
    const add = searchParams.get(addKey);
    if (edit) {
      const id = Number(edit);
      if (Number.isFinite(id)) setState({ open: true, editId: id });
    } else if (add === "1") {
      setState({ open: true, editId: null });
    }
  }, [addKey, editKey, searchParams]);

  return {
    open: state.open,
    editId: state.editId,
    isEdit: state.editId != null,
    openAdd,
    openEdit,
    close,
    onOpenChange: (next: boolean) => {
      if (!next) close();
    },
  };
}
