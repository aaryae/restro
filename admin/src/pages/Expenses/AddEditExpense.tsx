import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import {
  ACCOUNT_URL,
  EXPENSE_CATEGORY_URL,
  EXPENSE_URL,
} from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildQueryString } from "@/utils/generalHelper";
import { EXPENSE_LIST_ROUTE } from "@/routes/routeNames";
import Select from "@/components/Select";
import CustomDialog from "@/components/Dialog";
import AddEditSupplier from "@/pages/SuppliersModule/AddEditSupplier";
import AddEditExpenseCategory from "@/pages/ExpenseCategory/AddEditExpenseCategory";
import { ExpenseSchema } from "./schema";
import {
  EntityForm,
  FieldHeader,
  FieldIcon,
} from "@/components/EntityForm";
import {
  Banknote,
  CreditCard,
  FolderTree,
  Plus,
  Search,
  Truck,
  Wallet,
} from "lucide-react";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";

export type ExpenseFormInput = z.infer<typeof ExpenseSchema>;

type AddEditExpenseProps = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

const fieldControlClass =
  "h-10 w-full rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 text-sm text-[var(--serve-fg)] outline-none transition placeholder:text-[var(--serve-muted)] focus:border-[color-mix(in_srgb,var(--serve-accent)_40%,var(--serve-border))] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--serve-accent)_15%,transparent)]";

const AddEditExpense: React.FC<AddEditExpenseProps> = ({
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
  const [expenseCategoryOptions, setExpenseCategoryOptions] = useState<any[]>(
    [],
  );
  const [paymentSourceOptions, setPaymentSourceOptions] = useState<any[]>([]);
  const [expenseCategoryDialogOpen, setExpenseCategoryDialogOpen] =
    useState(false);
  const [viewSuppliersDialogOpen, setViewSuppliersDialogOpen] = useState(false);
  const [addSupplierDialogOpen, setAddSupplierDialogOpen] = useState(false);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      paymentMethod: undefined,
      categoryId: "",
      accountId: "",
      amount: undefined as unknown as number,
      remarks: "",
      supplierId: "",
    },
  });

  const { data: expenseData } = useGetApiQuery(
    { url: `${EXPENSE_URL}${id}` },
    { skip: !isEdit },
  );
  const { data: expenseCategoryData, isSuccess: expenseCategoryFetched, refetch: refetchCategories } =
    useGetApiQuery({ url: `${EXPENSE_CATEGORY_URL}list` });
  const {
    data: expensePaymentSourceData,
    isSuccess: expensePaymentSourceFetched,
  } = useGetApiQuery({ url: `${ACCOUNT_URL}list` });

  const supplierUrl = buildQueryString("supplier/list", {
    page: 1,
    limit: 25,
    ...(supplierSearchTerm.trim().length > 0 && !showAllSuppliers
      ? { search: { name: supplierSearchTerm } }
      : {}),
  });
  const {
    data: suppliersResp,
    isSuccess: suppliersOk,
    refetch: refetchSuppliers,
  } = useGetApiQuery(
    { url: supplierUrl },
    {
      skip:
        !viewSuppliersDialogOpen &&
        !showAllSuppliers &&
        supplierSearchTerm.trim().length < 2,
    },
  );

  const suppliers = useMemo(() => {
    if (!suppliersOk && !showAllSuppliers) return [];
    const raw: any = (suppliersResp as any)?.data ?? (suppliersResp as any);
    let data: any[] = [];
    if (Array.isArray(raw)) data = raw;
    else if (Array.isArray(raw?.data)) data = raw.data;
    else if (Array.isArray(raw?.data?.data)) data = raw.data.data;

    if (supplierSearchTerm.trim().length > 0 && !showAllSuppliers) {
      const term = supplierSearchTerm.toLowerCase();
      return data.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(term) ||
          s.contact_number?.includes(term) ||
          s.contactNumber?.includes(term) ||
          s.email?.toLowerCase().includes(term),
      );
    }
    return data;
  }, [suppliersOk, suppliersResp, supplierSearchTerm, showAllSuppliers]);

  const [createExpense] = useCreateApiMutation();
  const [updateExpense] = useUpdateApiMutation();

  useEffect(() => {
    if (!isEdit || !id || !expenseData?.data) return;
    const row = expenseData?.data as any;
    reset({
      categoryId: row?.categoryId ? String(row.categoryId) : "",
      paymentMethod: row?.paymentMethod,
      accountId: String(row.accountId),
      amount: Number(row?.amount) || (undefined as unknown as number),
      remarks: row?.remarks || "",
      supplierId: row?.supplierId ? String(row.supplierId) : "",
    });
    if (row?.supplierId) {
      setSelectedSupplier({
        value: String(row.supplierId),
        label: row.supplier?.name || "",
      });
      setSupplierSearchTerm(row.supplier?.name || "");
    }
  }, [isEdit, id, expenseData, reset]);

  useEffect(() => {
    if (!expenseCategoryFetched) return;
    setExpenseCategoryOptions(
      expenseCategoryData?.data?.data?.map((item: any) => ({
        value: String(item.id),
        label: item.name,
      })),
    );
  }, [expenseCategoryData, expenseCategoryFetched]);

  useEffect(() => {
    if (!expensePaymentSourceFetched) return;
    setPaymentSourceOptions(
      expensePaymentSourceData?.data?.data?.map((item: any) => ({
        value: String(item.id),
        label: item.name,
      })),
    );
  }, [expensePaymentSourceData, expensePaymentSourceFetched]);

  const onSubmit = async (data: ExpenseFormInput) => {
    const body = {
      id: isEdit ? Number(id) : undefined,
      cash_or_credit: "cash",
      paymentMethod: data.paymentMethod,
      amount: Number(data.amount),
      accountId: Number(data.accountId),
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      supplierId: data.supplierId ? Number(data.supplierId) : null,
      remarks: data.remarks ?? null,
    } as any;

    try {
      const response = isEdit
        ? await updateExpense({
            url: `${EXPENSE_URL}${id}`,
            body,
          }).unwrap()
        : await createExpense({ url: EXPENSE_URL, body }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          if (isComponent) finish();
          else navigate(EXPENSE_LIST_ROUTE);
        },
      });
    } catch (error) {
      handleError({ error });
    }
  };

  const handleReset = () => {
    reset({
      paymentMethod: undefined,
      categoryId: "",
      accountId: "",
      amount: undefined as unknown as number,
      remarks: "",
      supplierId: "",
    });
    setSelectedSupplier(null);
    setSupplierSearchTerm("");
  };

  return (
    <EntityForm
      title={isEdit ? "Edit Expense" : "Add Expense"}
      sectionTitle="Expense details"
      description="Category, payment, amount, and optional supplier."
      icon={Wallet}
      embedded={isComponent}
      maxWidthClass="max-w-5xl"
      columns={2}
      onSubmit={(e) => {
        if (expenseCategoryDialogOpen || addSupplierDialogOpen) {
          e.preventDefault();
          return;
        }
        void handleSubmit(onSubmit)(e);
      }}
      onCancel={() => {
        if (isComponent) closeModal?.();
        else navigate(EXPENSE_LIST_ROUTE);
      }}
      isSaving={isSubmitting}
      submitLabel={isEdit ? "Update Expense" : "Create Expense"}
      footerExtra={
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--serve-border)] bg-[var(--serve-surface)] px-4 text-sm font-semibold text-[var(--serve-fg)] transition hover:border-[var(--serve-muted)]"
          onClick={handleReset}
        >
          Reset
        </button>
      }
    >
      <Controller
        name="categoryId"
        control={control}
        render={({ field }) => (
          <div className="flex min-w-0 flex-col">
            <FieldHeader
              label="Category"
              required
              actions={
                <CustomDialog
                  buttonTitle={
                    <button
                      type="button"
                      className="inline-flex h-7 items-center gap-1 rounded-md bg-[var(--primary-color)] px-2 text-[11px] font-medium text-[var(--primary-fg)] transition hover:opacity-90"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      Add
                    </button>
                  }
                  dialogOpen={expenseCategoryDialogOpen}
                  setDialogOpen={setExpenseCategoryDialogOpen}
                  title="Add Expense Category"
                  nested
                  contentClassName="max-h-[90vh] w-[min(95vw,37.5rem)] overflow-auto p-4"
                >
                  <AddEditExpenseCategory
                    isComponent={true}
                    closeModal={() => setExpenseCategoryDialogOpen(false)}
                    onSuccess={() => {
                      void refetchCategories();
                    }}
                  />
                </CustomDialog>
              }
            />
            <Select
              required
              {...field}
              options={expenseCategoryOptions}
              leftSection={<FieldIcon icon={FolderTree} />}
              error={errors.categoryId?.message}
              triggerClassName="h-10"
            />
          </div>
        )}
      />

      <Controller
        name="paymentMethod"
        control={control}
        render={({ field }) => (
          <div className="flex min-w-0 flex-col">
            <FieldHeader label="Payment Method" required />
            <Select
              required
              {...field}
              value={field.value ?? ""}
              options={[
                { value: "cash", label: "Cash" },
                { value: "card", label: "Card" },
                { value: "online", label: "Online" },
              ]}
              leftSection={<FieldIcon icon={CreditCard} />}
              error={errors.paymentMethod?.message}
              triggerClassName="h-10"
            />
          </div>
        )}
      />

      <div className={isEdit ? "hidden" : undefined}>
        <Controller
          name="accountId"
          control={control}
          render={({ field }) => (
            <div className="flex min-w-0 flex-col">
              <FieldHeader label="Payment Source" required />
              <Select
                required
                {...field}
                options={paymentSourceOptions}
                leftSection={<FieldIcon icon={Banknote} />}
                error={errors.accountId?.message}
                triggerClassName="h-10"
              />
            </div>
          )}
        />
      </div>

      <Input
        label="Amount"
        type="number"
        placeholder="0"
        leftSection={<FieldIcon icon={Banknote} />}
        {...register("amount")}
        error={errors.amount?.message}
        isRequired
      />

      <div className="flex min-w-0 flex-col md:col-span-2">
        <FieldHeader
          label="Supplier"
          actions={
            <>
              <CustomDialog
                buttonTitle={
                  <button
                    type="button"
                    className="inline-flex h-7 items-center gap-1 rounded-md bg-[var(--primary-color)] px-2 text-[11px] font-medium text-[var(--primary-fg)] transition hover:opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddSupplierDialogOpen(true);
                    }}
                  >
                    <Plus size={12} strokeWidth={2.5} />
                    Add
                  </button>
                }
                dialogOpen={addSupplierDialogOpen}
                setDialogOpen={setAddSupplierDialogOpen}
                title="Add New Supplier"
                nested
                contentClassName="max-h-[90vh] w-[min(95vw,40rem)] overflow-y-auto p-4 sm:p-5"
              >
                <AddEditSupplier
                  isComponent={true}
                  closeModal={() => {
                    setAddSupplierDialogOpen(false);
                    refetchSuppliers();
                  }}
                />
              </CustomDialog>
              <button
                type="button"
                onClick={() => {
                  setShowAllSuppliers(true);
                  setSupplierSearchTerm("");
                  setViewSuppliersDialogOpen(true);
                  refetchSuppliers();
                }}
                className="inline-flex h-7 items-center rounded-md border border-[var(--serve-border)] bg-[var(--serve-surface)] px-2 text-[11px] font-medium text-[var(--serve-fg)] transition hover:bg-[var(--serve-surface-2)]"
              >
                View All
              </button>
            </>
          }
        />

        <div className="relative">
          <Truck
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[var(--serve-muted)]"
          />
          <input
            placeholder="Search supplier"
            className={`${fieldControlClass} pl-9`}
            value={selectedSupplier?.label || supplierSearchTerm}
            onChange={(e) => {
              setSelectedSupplier(null);
              setSupplierSearchTerm(e.target.value);
              setValue("supplierId", "", { shouldValidate: true });
              setIsSupplierDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const first = suppliers?.[0];
                if (first) {
                  setSelectedSupplier({
                    value: String(first.id),
                    label: first.name,
                  });
                  setValue("supplierId", String(first.id), {
                    shouldValidate: true,
                  });
                  setSupplierSearchTerm(first.name);
                  setIsSupplierDropdownOpen(false);
                }
              }
            }}
            onFocus={() => setIsSupplierDropdownOpen(true)}
            onBlur={() =>
              setTimeout(() => setIsSupplierDropdownOpen(false), 150)
            }
          />
          {isSupplierDropdownOpen &&
            supplierSearchTerm.trim().length >= 2 && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] shadow-lg">
                {!suppliersOk ? (
                  <div className="px-3 py-2.5 text-sm text-[var(--serve-muted)]">
                    Type at least 2 characters to search…
                  </div>
                ) : suppliers.length === 0 ? (
                  <div className="px-3 py-2.5 text-sm text-[var(--serve-muted)]">
                    No suppliers found
                  </div>
                ) : (
                  suppliers.map((supplier: any) => (
                    <button
                      key={supplier.id}
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-[var(--serve-surface-2)]"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedSupplier({
                          value: String(supplier.id),
                          label: supplier.name,
                        });
                        setValue("supplierId", String(supplier.id), {
                          shouldValidate: true,
                        });
                        setSupplierSearchTerm(supplier.name);
                        setIsSupplierDropdownOpen(false);
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[var(--serve-fg)]">
                          {supplier.name}
                        </div>
                        <div className="truncate text-xs text-[var(--serve-muted)]">
                          {[
                            supplier.contact_number ||
                              supplier.contactNumber ||
                              supplier.phone,
                            supplier.email,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
        </div>

        <CustomDialog
          buttonTitle={null}
          dialogOpen={viewSuppliersDialogOpen}
          setDialogOpen={setViewSuppliersDialogOpen}
          title="All Suppliers"
          nested
          contentClassName="max-h-[80vh] w-full max-w-4xl overflow-auto p-4"
        >
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search suppliers..."
                className={fieldControlClass}
                value={supplierSearchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setSupplierSearchTerm(val);
                  setShowAllSuppliers(val.trim().length === 0);
                }}
              />
              <button
                type="button"
                onClick={() => refetchSuppliers()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--serve-muted)] hover:text-[var(--serve-fg)]"
                title="Search"
              >
                <Search size={16} />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--serve-border)]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--serve-border)]">
                  <thead className="bg-[var(--serve-surface-2)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--serve-muted)]">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--serve-muted)]">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--serve-muted)]">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--serve-muted)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--serve-border)] bg-[var(--serve-surface)]">
                    {suppliers?.map((supplier: any) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-[var(--serve-surface-2)]"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--serve-fg)]">
                          {supplier.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--serve-muted)]">
                          {supplier.contact_number ||
                            supplier.contactNumber ||
                            "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--serve-muted)]">
                          {supplier.email || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplier({
                                value: String(supplier.id),
                                label: supplier.name,
                              });
                              setValue("supplierId", String(supplier.id));
                              setSupplierSearchTerm(supplier.name);
                              setViewSuppliersDialogOpen(false);
                            }}
                            className="text-[var(--primary-ink)] hover:opacity-80"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!suppliers || suppliers.length === 0) && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-sm text-[var(--serve-muted)]"
                        >
                          No suppliers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CustomDialog>
      </div>

      <TextArea
        label="Remarks"
        placeholder="Additional remarks"
        className="md:col-span-2"
        rows={3}
        {...register("remarks")}
        error={errors.remarks?.message}
        isRequired
      />
    </EntityForm>
  );
};

export default AddEditExpense;
