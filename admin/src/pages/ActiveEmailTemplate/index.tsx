import {
  useActiveEmailTemplateMutation,
  useListActiveEmailTemplateMutation,
} from "@/redux/services/emailTemplate";
import { handleError } from "@/utils/responseHandler";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ActiveEmailTemplate() {
  const [activeEmailTemplate, { data: activeEmailData }] =
    useListActiveEmailTemplateMutation();

  const [currentTemplateKey, setCurrentTemplateKey] = useState<string | null>(
    null,
  );

  const [activateEmail] = useActiveEmailTemplateMutation();

  const handleClick = async (value: string) => {
    setCurrentTemplateKey(() => value);
    try {
      await activeEmailTemplate(value).unwrap();
    } catch (error) {
      handleError({ error });
    }
  };

  const handleActivateTemplate = async (id, templateKey) => {
    const body = { templateId: id, actionKey: templateKey };
    try {
      const response = await activateEmail(body).unwrap();
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <div className="flex flex-col gap-[1rem] w-1/2">
      {ActiveTemplateOptions.map((each) => (
        <div key={each.value}>
          <div
            className="bg-gray-500 text-white flex justify-between items-center py-[0.5rem] px-[1rem] cursor-pointer"
            onClick={() => handleClick(each.value)}
          >
            {each.label} <ChevronDown size="20" />
          </div>
          {each.value === currentTemplateKey ? (
            <div>
              {activeEmailData?.data?.data.map((each) => (
                <div
                  className="flex "
                  onClick={() =>
                    handleActivateTemplate(each.id, each.templateKey)
                  }
                >
                  <div>{each.id}</div>
                  <div>{each.templateName}</div>
                </div>
              ))}
            </div>
          ) : (
            <></>
          )}
        </div>
      ))}
    </div>
  );
}

const ActiveTemplateOptions = [
  { label: "Approved", value: "Approved" },
  {
    label: "Rejected",
    value: "Rejected",
  },
  {
    label: "Approval Request",
    value: "Approval_request",
  },
];
