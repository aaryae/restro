import { useParams } from "react-router-dom";
import {
  useGetRoleQuery,
  useListAccessModuleByIdQuery,
} from "@/redux/services/role";

export default function EditAccess() {
  const { id } = useParams();
  const { data: accessModule, isSuccess: success } =
    useListAccessModuleByIdQuery(id);

  const { data: allRoles, isSuccess: roleSuccess } = useGetRoleQuery({
    page: 1,
    limit: 25,
  });

  const allRole =
    roleSuccess && allRoles?.data?.data
      ? allRoles?.data?.data.map((each) => ({ id: each.id, title: each.title }))
      : [];

  const tableHeader: string[] =
    success && accessModule?.data?.role_menu_actions
      ? accessModule?.data?.role_menu_actions.map(
          (each: { key: string }) => each.key,
        )
      : [];
  return (
    <div className="">
      <table className=" w-full">
        <tr className=" w-full">
          <th>CLASS</th>
          <div className="flex  justify-between w-full">
            {tableHeader.map((item) => (
              <th scope="col" key={`header-${item}`} className="capitalize">
                {item}
              </th>
            ))}
          </div>
        </tr>
        {allRole.map((each) => (
          <tr key={each.title} className=" mt-[1rem]">
            <th scope="row">{each.title}</th>
            <div className="flex  justify-between w-full mt-[1rem]">
              {tableHeader.map((item) => (
                <td key={item} className="text-center">
                  <input type="checkbox" name={item} />
                </td>
              ))}
            </div>
          </tr>
        ))}
      </table>
    </div>
  );
}
