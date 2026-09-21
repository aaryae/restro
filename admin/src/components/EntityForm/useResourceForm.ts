import { zodResolver } from "@hookform/resolvers/zod";
import { useLayoutEffect } from "react";
import {
  DefaultValues,
  FieldValues,
  Resolver,
  useForm,
} from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { ZodTypeAny } from "zod";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";

type UseResourceFormOptions<T extends FieldValues> = {
  schema: ZodTypeAny;
  resourceUrl: string;
  listRoute: string;
  defaultValues?: DefaultValues<T>;
  /** When set (including null for create), overrides route `:id`. */
  resourceId?: string | number | null;
  /** Called instead of navigating to listRoute after success. */
  onSuccess?: () => void;
  /** Called instead of navigating on cancel. */
  onCancel?: () => void;
};

export function useResourceForm<T extends FieldValues>({
  schema,
  resourceUrl,
  listRoute,
  defaultValues,
  resourceId,
  onSuccess,
  onCancel: onCancelProp,
}: UseResourceFormOptions<T>) {
  const params = useParams();
  const navigate = useNavigate();
  const id =
    resourceId !== undefined
      ? resourceId != null && resourceId !== ""
        ? String(resourceId)
        : undefined
      : params.id;
  const isEditMode = Boolean(id);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues,
  });

  const [createResource, { isLoading: creating }] = useCreateApiMutation();
  const [updateResource, { isLoading: updating }] = useUpdateApiMutation();

  const { data, isLoading: loadingRecord } = useGetApiQuery(
    { url: `${resourceUrl}${id}` },
    { skip: !isEditMode },
  );

  useLayoutEffect(() => {
    if (isEditMode && data?.data) {
      reset(data.data as T);
    }
  }, [data, isEditMode, reset]);

  const finish = () => {
    if (onSuccess) onSuccess();
    else navigate(listRoute);
  };

  const onCancel = () => {
    if (onCancelProp) onCancelProp();
    else navigate(listRoute);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = isEditMode
        ? await updateResource({
            url: `${resourceUrl}${id}`,
            body: values,
          }).unwrap()
        : await createResource({
            url: resourceUrl,
            body: values,
          }).unwrap();

      handleResponse({ res: response, onSuccess: finish });
    } catch (error) {
      handleError({ error, setError });
    }
  });

  return {
    register,
    control,
    errors,
    isEditMode,
    isSaving: isSubmitting || creating || updating,
    isLoading: isEditMode && loadingRecord && !data,
    onSubmit,
    onCancel,
    resourceId: id,
  };
}
