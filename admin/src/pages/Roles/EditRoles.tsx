import {
  useGetRoleByIdQuery,
  useListAllRolesQuery,
  useUpdateRoleMutation,
} from "@/redux/services/role";
import { useEffect, useMemo, useState } from "react";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { MdOutlineFactCheck } from "react-icons/md";
import useTranslation from "@/locale/useTranslation";
import { ChevronDown, ChevronUp } from "lucide-react";

type ResponseItem = {
  list: string;
  id: number;
  title: string;
};

type GroupedItem = {
  id: number;
  title: string;
  children: Array<{ title: string; id: number }>;
};

function GetRolesAndAccess(response: ResponseItem[]): GroupedItem[] {
  const grouped = response.reduce((acc: Record<string, GroupedItem>, each) => {
    if (!acc[each.list]) {
      acc[each.list] = {
        id: each.id,
        title: each.list,
        children: [],
      };
    }
    acc[each.list].children.push({
      title: each.title,
      id: each.id,
    });
    return acc;
  }, {});

  return Object.values(grouped);
}

export default function EditRoles({
  id,
  setIsOpen,
}: {
  id: number | null;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const translate = useTranslation();

  const { data: roleMenuAction, isSuccess: success } = useListAllRolesQuery("");
  const { data: allowableRoles, isSuccess: allowableRolesSuccess } =
    useGetRoleByIdQuery(id, {
      skip: id === null,
    });
  const [updateRole] = useUpdateRoleMutation();

  const [accessRoles, setAccessRoles] = useState<number[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<Record<number, boolean>>({});

  const data: GroupedItem[] = useMemo(() => {
    if (success && roleMenuAction?.data?.data) {
      return GetRolesAndAccess(roleMenuAction.data.data as ResponseItem[]);
    }
    return [];
  }, [success, roleMenuAction]);

  useEffect(() => {
    if (data.length) {
      setDropdownOpen((prev) => {
        const next = { ...prev };
        let changed = false;
        data.forEach((section) => {
          if (next[section.id] === undefined) {
            next[section.id] = false;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [data]);

  useEffect(() => {
    if (allowableRolesSuccess) {
      const allowedRoles =
        allowableRoles?.data?.role_actions?.map(
          (each: { role_menu_action: { id: number } }) =>
            each.role_menu_action.id,
        ) ?? [];
      setAccessRoles(allowedRoles);
    }
  }, [id, allowableRoles, allowableRolesSuccess]);

  const handleCheckboxChange = (roleId: number) => {
    setAccessRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((each) => each !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSelectAll = (section: GroupedItem) => {
    const sectionIds = section.children.map((child) => child.id);
    const isAllSelected = sectionIds.every((rid) => accessRoles.includes(rid));

    if (isAllSelected) {
      setAccessRoles((prev) => prev.filter((rid) => !sectionIds.includes(rid)));
    } else {
      setAccessRoles((prev) => [...new Set([...prev, ...sectionIds])]);
    }
  };

  const toggleDropdown = (sectionId: number) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const allOpen =
    data.length > 0 && data.every((s) => dropdownOpen[s.id] === true);

  const ExpandAll = () => {
    const next: Record<number, boolean> = {};
    data.forEach((s) => {
      next[s.id] = !allOpen;
    });
    setDropdownOpen(next);
  };

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    const body = {
      title: allowableRoles?.data?.title,
      description: allowableRoles?.data?.title,
      roleType: allowableRoles?.data?.roleType,
      role_actions: accessRoles.map((each) => ({
        roleMenuActionId: each,
      })),
    };
    try {
      const response = await updateRole({ body, id }).unwrap();
      handleResponse({
        res: response,
        onSuccess: handleCloseDrawer,
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <div className="mt-[4rem]">
      <div className="flex mt-[4rem] mb-[1.5rem] justify-between">
        <p className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-primaryColor text-white">
          <MdOutlineFactCheck />
          <p className="font-[500] text-[15px]">{translate("Edit Role")}</p>
        </p>

        <Button
          handleClick={ExpandAll}
          className="border-b border-black mr-8"
          disabled={data.length === 0}
        >
          {allOpen ? "Collapse All" : "Expand All"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 h-[74vh] overflow-y-auto pr-2 ">
        {data.map((section) => (
          <div
            key={section.id}
            className="flex border-[1px] border-[#e5e7eb] p-4 rounded-[4px] "
          >
            <div className="flex-1 flex-col gap-[1rem] ">
              <div
                className="flex items-center gap-[1rem] cursor-pointer justify-between"
                onClick={() => toggleDropdown(section.id)}
              >
                <p className="font-bold text-[1rem]">{section.title}</p>
                <span>
                  {dropdownOpen[section.id] ? <ChevronDown /> : <ChevronUp />}
                </span>
              </div>

              {dropdownOpen[section.id] && (
                <div className="flex items-center gap-[1rem] mb-4">
                  <input
                    className="mt-3"
                    type="checkbox"
                    checked={section.children.every((child) =>
                      accessRoles.includes(child.id),
                    )}
                    onChange={() => handleSelectAll(section)}
                  />
                  <label className="font-bold text-[1rem] mt-3">
                    Select All
                  </label>
                </div>
              )}

              {dropdownOpen[section.id] && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-[1rem] w-full">
                  {section.children.map((item) => (
                    <div
                      key={item.id}
                      className="border py-[0.5rem] px-[20px] rounded-[6px] flex items-center gap-[1rem]"
                    >
                      <input
                        type="checkbox"
                        checked={accessRoles.includes(item.id)}
                        onChange={() => handleCheckboxChange(item.id)}
                      />
                      <p className="font-[400] text-[13px]">{item.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <br />
      <Button className="submit-button" handleClick={handleSubmit}>
        <div className="flex justify-center items-center gap-[0.5rem]">
          Submit
        </div>
      </Button>
    </div>
  );
}
