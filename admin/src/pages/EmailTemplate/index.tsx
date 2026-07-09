import DeleteModal from "@/components/DeleteModal";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Spinner from "@/components/Spinner";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import usePagination from "@/hooks/usePagination";
import useTranslation from "@/locale/useTranslation";
import {
  useActiveEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
  useListAllEmailTemplateQuery,
} from "@/redux/services/emailTemplate";
import { EMAIL_TEMPLATE_ADD_ROUTE } from "@/routes/routeNames";
import { checkAccess } from "@/utils/accessHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function EmailTemplate() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Email Template");

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const [deletedId, setDeleteId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const {
    data: allEmailTemplate,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useListAllEmailTemplateQuery(query);
  const [activateEmail] = useActiveEmailTemplateMutation();
  const [deleteEmailTemplate] = useDeleteEmailTemplateMutation();

  const handleAddEditButton = (id: number | null) => {
    if (id === null) {
      navigate(`${EMAIL_TEMPLATE_ADD_ROUTE}add`);
    } else {
      navigate(`${EMAIL_TEMPLATE_ADD_ROUTE}${id}`);
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteEmailTemplate(deletedId).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const tableHeaders = [
    "Name",
    "Key",
    "Status",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const pagination = {
    page:
      allEmailTemplate?.data?.total === 0 ? 0 : allEmailTemplate?.data?.page,
    limit: allEmailTemplate?.data?.limit,
    total: allEmailTemplate?.data?.total,
    totalPages: allEmailTemplate?.data?.totalPages,
  };

  const handleToggleSwitch = async (
    actionKey: string,
    templateId: number,
    activeTemplate: any,
  ) => {
    const body = { actionKey, templateId };
    const body1 = { actionKey };
    try {
      await (activeTemplate === null
        ? activateEmail(body).unwrap()
        : activateEmail(body1).unwrap());
      refetch();
    } catch (error) {
      handleError({ error });
    }
  };

  const tableData =
    success && allEmailTemplate?.data?.data
      ? allEmailTemplate?.data?.data?.map(
          ({ id, templateName, templateKey, activeTemplate }) => [
            <div className="flex items-center justify-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  activeTemplate === null ? "bg-rose-400" : "bg-primaryColor"
                }`}
              />
              <span className="text-sm font-medium text-slate-800">
                {templateName}
              </span>
            </div>,
            templateKey,
            <div key={`toggle-${id}`} className="flex justify-center">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={activeTemplate !== null}
                  onChange={() =>
                    handleToggleSwitch(templateKey, id, activeTemplate)
                  }
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:bg-primaryColor peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>,
            <TableRowActions>
              {accessList.includes("edit") && (
                <button
                  type="button"
                  onClick={() => handleAddEditButton(id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                  title="Edit template"
                >
                  <MdEditSquare size={16} />
                </button>
              )}
              {accessList.includes("delete") && (
                <DeleteModal
                  compact
                  open={open}
                  setOpen={setOpen}
                  handleDeleteTrigger={() => handleDeleteTrigger(id)}
                  handleConfirmDelete={handleDelete}
                />
              )}
            </TableRowActions>,
          ],
        )
      : [];

  if (loading) {
    return <Spinner className="flex h-full items-center justify-center" />;
  }

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        showSearch={false}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add Template")}
        handleNewButton={() => handleAddEditButton(null)}
        handleReloadButton={() => refetch()}
        subText="Manage email templates and activate the ones sent to customers."
      />

      {accessList.includes("view") ? (
        <Table
          isSN
          headers={tableHeaders}
          data={tableData}
          pagination={pagination}
          handlePagination={(pagination) => {
            handlePagination(pagination);
            refetch();
          }}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view email templates.
        </div>
      )}
    </div>
  );
}
