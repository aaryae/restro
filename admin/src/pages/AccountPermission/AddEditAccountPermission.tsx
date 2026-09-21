import Select from "@/components/Select";
import ToggleSwitch from "@/components/Switch";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import { useGetAllUserQuery } from "@/redux/services/authentication";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { ACCOUNT_PERMISSION_LIST_ROUTE } from "@/routes/routeNames";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark, ShieldCheck, UserRound } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import AccountPermissionSchema from "./schema";

export type AccountPermissionFormInput = z.infer<
  typeof AccountPermissionSchema
>;

type AddEditAccountPermissionProps = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

const AddEditAccountPermission: React.FC<AddEditAccountPermissionProps> = ({
  id: idProp,
  isComponent = false,
  closeModal,
  onSuccess,
} = {}) => {
  const { id: paramId } = useParams();
  const id =
    idProp !== undefined && idProp !== null ? String(idProp) : paramId;
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const finish = () => {
    onSuccess?.();
    closeModal?.();
  };

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountPermissionFormInput>({
    resolver: zodResolver(AccountPermissionSchema),
    defaultValues: {
      userId: "",
      accountId: "",
      canView: false,
      canEdit: false,
      canDelete: false,
    },
  });

  const { data: rowResp, isSuccess: rowOk } = useGetApiQuery(
    { url: `account-permission/${id}` },
    { skip: !isEdit },
  );

  const { data: usersResp } = useGetAllUserQuery({ page: 1, limit: 25 });

  const { data: accountsResp } = useGetApiQuery({
    url: `${ACCOUNT_URL}list?page=1&limit=25`,
  });

  const userOptions = useMemo(() => {
    const raw: any = (usersResp as any)?.data ?? usersResp;
    const items: any[] = raw?.data ?? raw?.items ?? [];
    return [
      ...items.map((u: any) => ({
        value: String(u.id),
        label:
          u.username ||
          `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
          u.email,
      })),
    ];
  }, [usersResp]);

  const accountOptions = useMemo(() => {
    const raw: any = (accountsResp as any)?.data ?? accountsResp;
    const items: any[] = raw?.data ?? raw?.items ?? [];
    return [
      ...items.map((a: any) => ({
        value: String(a.id),
        label: a.name ?? a.code ?? a.id,
      })),
    ];
  }, [accountsResp]);

  const [createPermission] = useCreateApiMutation();
  const [updatePermission] = useUpdateApiMutation();

  useEffect(() => {
    if (!isEdit || !rowOk) return;
    const row: any = (rowResp as any)?.data ?? rowResp;
    const d = row?.data ?? row;
    if (!d) return;
    setValue("userId", String(d.userId ?? d.user?.id ?? ""));
    setValue("accountId", String(d.accountId ?? d.account?.id ?? ""));
    setValue("canView", Boolean(d.canView));
    setValue("canEdit", Boolean(d.canEdit));
    setValue("canDelete", Boolean(d.canDelete));
  }, [isEdit, rowOk, rowResp, setValue]);

  const onSubmit = async (data: AccountPermissionFormInput) => {
    const baseBody = {
      canView: Boolean(data.canView),
      canEdit: Boolean(data.canEdit),
      canDelete: Boolean(data.canDelete),
    };

    const fullBody = {
      ...baseBody,
      userId: Number(data.userId),
      accountId: Number(data.accountId),
    };

    try {
      const response = isEdit
        ? await updatePermission({
            url: `account-permission/${id}`,
            body: baseBody,
          }).unwrap()
        : await createPermission({
            url: `account-permission/`,
            body: fullBody,
          }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          if (isComponent) finish();
          else navigate(ACCOUNT_PERMISSION_LIST_ROUTE);
        },
      });
    } catch (error) {
      handleError({ error });
    }
  };

  const permissionCards: {
    name: "canView" | "canEdit" | "canDelete";
    label: string;
    hint: string;
  }[] = [
    { name: "canView", label: "View", hint: "View account details" },
    { name: "canEdit", label: "Edit", hint: "Modify account details" },
    { name: "canDelete", label: "Delete", hint: "Remove account access" },
  ];

  return (
    <EntityForm
      title={isEdit ? "Edit Account Permission" : "Add Account Permission"}
      sectionTitle="Permission details"
      description="Choose user, account, and access rights."
      icon={ShieldCheck}
      embedded={isComponent}
      maxWidthClass="max-w-3xl"
      columns={2}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => {
        if (isComponent) closeModal?.();
        else navigate(ACCOUNT_PERMISSION_LIST_ROUTE);
      }}
      isSaving={isSubmitting}
      submitLabel={isEdit ? "Update Permission" : "Create Permission"}
    >
      {!isEdit ? (
        <>
          <Controller
            name="userId"
            control={control}
            render={({ field }) => (
              <Select
                required
                {...field}
                options={userOptions}
                label="User"
                leftSection={<FieldIcon icon={UserRound} />}
                error={errors.userId?.message}
              />
            )}
          />
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <Select
                required
                {...field}
                options={accountOptions}
                label="Account"
                leftSection={<FieldIcon icon={Landmark} />}
                error={errors.accountId?.message}
              />
            )}
          />
        </>
      ) : (
        <>
          <div className="flex min-w-0 flex-col">
            <span className="mb-1.5 text-xs font-medium text-[var(--serve-muted)]">
              User
            </span>
            <div className="flex h-10 items-center rounded-[9px] border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 text-sm font-medium text-[var(--serve-fg)]">
              {userOptions.find((u) => u.value === watch("userId"))?.label ||
                "N/A"}
            </div>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="mb-1.5 text-xs font-medium text-[var(--serve-muted)]">
              Account
            </span>
            <div className="flex h-10 items-center rounded-[9px] border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 text-sm font-medium text-[var(--serve-fg)]">
              {accountOptions.find((a) => a.value === watch("accountId"))
                ?.label || "N/A"}
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-3">
        {permissionCards.map((card) => (
          <div
            key={card.name}
            className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--serve-fg)]">
                {card.label}
              </p>
              <p className="text-[11px] text-[var(--serve-muted)]">
                {card.hint}
              </p>
            </div>
            <Controller
              name={card.name}
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  isActive={field.value}
                  onToggle={field.onChange}
                />
              )}
            />
          </div>
        ))}
      </div>
    </EntityForm>
  );
};

export default AddEditAccountPermission;
