import DeleteModal from "@/components/DeleteModal";
import PageHeader from "@/components/PageHeader";
import Spinner from "@/components/Spinner";
import ToggleSwitch from "@/components/Switch";
import Table from "@/components/Table";
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

  const handleReload = () => {
    refetch();
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
  ];

  const pagination = {
    page:
      allEmailTemplate?.data?.total === 0 ? 0 : allEmailTemplate?.data?.page,
    limit: allEmailTemplate?.data?.limit,
    total: allEmailTemplate?.data?.total,
    totalPages: allEmailTemplate?.data?.totalPages,
  };

  const handleToggleSwitch = async (
    actionKey: string,
    templateId: id,
    activeTemplate: any,
  ) => {
    const body = { actionKey, templateId };
    const body1 = { actionKey };
    try {
      const response =
        activeTemplate === null
          ? await activateEmail(body).unwrap()
          : await activateEmail(body1).unwrap();
    } catch (error) {
      handleError({ error });
    }
  };

  const tableData =
    success && allEmailTemplate?.data?.data
      ? allEmailTemplate?.data?.data?.map(
          ({ id, templateName, templateKey, activeTemplate }) => [
            activeTemplate === null ? (
              <div className="flex items-center  justify-center gap-[1rem]">
                <div className="h-[1rem] w-[1rem] rounded-full bg-red-500" />
                {templateName}
              </div>
            ) : (
              <div className="flex items-center  justify-center gap-[1rem]">
                <div className="h-[1rem] w-[1rem] rounded-full bg-primaryColor" />
                {templateName}
              </div>
            ),

            templateKey,
            <div key={id} className="flex justify-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={activeTemplate !== null}
                  onChange={(e) =>
                    handleToggleSwitch(templateKey, id, activeTemplate)
                  }
                />
                <div
                  className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 
      rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full 
      peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
      after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full 
      after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                ></div>
              </label>
            </div>,
            <div
              key={id}
              className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
            >
              {accessList.includes("edit") && (
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD]"
                  onClick={() => handleAddEditButton(id)}
                />
              )}
              {accessList.includes("delete") && (
                <DeleteModal
                  open={open}
                  setOpen={setOpen}
                  handleDeleteTrigger={() => handleDeleteTrigger(id)}
                  handleConfirmDelete={handleDelete}
                />
              )}
            </div>,
          ],
        )
      : [];

  if (loading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <>
      <PageHeader
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New Email Template")}
        handleNewButton={() => handleAddEditButton(null)}
        handleReloadButton={handleReload}
        hasSubText
        subText={translate("Add Email Template")}
      />
      {accessList.includes("view") && (
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
      )}
    </>
  );
}
