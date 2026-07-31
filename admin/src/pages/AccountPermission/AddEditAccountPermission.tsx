import PageTitle from "@/components/PageTitle";
import Select from "@/components/Select";
import ToggleSwitch from "@/components/Switch";
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
import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import AccountPermissionSchema from "./schema";

export type AccountPermissionFormInput = z.infer<
  typeof AccountPermissionSchema
>;

const AddEditAccountPermission: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

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

  // Fetch existing row if edit
  const { data: rowResp, isSuccess: rowOk } = useGetApiQuery(
    { url: `account-permission/${id}` },
    { skip: !isEdit },
  );

  // Fetch users (for select)
  const { data: usersResp } = useGetAllUserQuery({ page: 1, limit: 25 });

  // Fetch accounts (for select)
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
    const d = row?.data ?? row; // support both shapes
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
            body: baseBody, //only edit canView, canEdit, canDelete
          }).unwrap()
        : await createPermission({
            url: `account-permission/`,
            body: fullBody, // Send all fields for create
          }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => navigate(ACCOUNT_PERMISSION_LIST_ROUTE),
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <div className="p-6">
      <PageTitle
        title={isEdit ? "Edit Account Permission" : "Add Account Permission"}
        isBack
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 flex w-full flex-col space-y-6"
      >
        <div className="flex w-full flex-col rounded-[6px] border border-[#ebe9f1] bg-white p-8">
          {!isEdit ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="userId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      required
                      {...field}
                      options={userOptions}
                      label="User"
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
                      error={errors.accountId?.message}
          />
                  )}
                />
              </div>
            ) : (
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <label className="block text-[15px] font-medium text-gray-700 ">
                        User
                      </label>
                    </div>
                    <div className="text-[13px] font-semibold text-gray-900 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      {userOptions.find((u) => u.value === watch("userId"))
                        ?.label || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <label className="block text-[15px] font-medium text-gray-700">
                        Account
                      </label>
                    </div>
                    <div className="text-[13px] font-semibold text-gray-900 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      {accountOptions.find(
                        (a) => a.value === watch("accountId"),
                      )?.label || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow transition-shadow">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    View
                  </label>
                  <p className="text-xs text-gray-500">View account details</p>
                </div>
                <Controller
                  name="canView"
                  control={control}
                  render={({ field }) => (
                    <ToggleSwitch
                      isActive={field.value}
                      onToggle={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow transition-shadow">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Edit
                  </label>
                  <p className="text-xs text-gray-500">
                    Modify account details
                  </p>
                </div>
                <Controller
                  name="canEdit"
                  control={control}
                  render={({ field }) => (
                    <ToggleSwitch
                      isActive={field.value}
                      onToggle={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow transition-shadow">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delete
                  </label>
                  <p className="text-xs text-gray-500">Remove account access</p>
                </div>
                <Controller
                  name="canDelete"
                  control={control}
                  render={({ field }) => (
                    <ToggleSwitch
                      isActive={field.value}
                      onToggle={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

          <div className="mt-6 flex w-full items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              className="rounded border px-4 py-2"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {isEdit ? "Update Permission" : "Create Permission"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddEditAccountPermission;
